<?php

declare(strict_types=1);

// build:ftp sets this in the generated handler only; guest emails are unaffected.
const EXCLUDED_ADMIN_RECIPIENTS = [];

$emailConfigPath = __DIR__ . '/email-config.php';
$emailConfig = is_file($emailConfigPath) ? require $emailConfigPath : [];

$emailPattern = '/^[^\s@]+@[^\s@]+\.[^\s@]+$/';

function jsonResponse(int $statusCode, array $payload, array $extraHeaders = []): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');

    foreach ($extraHeaders as $name => $value) {
        header($name . ': ' . $value);
    }

    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function getEnvValue(string $name, ?string $default = null): ?string
{
    global $emailConfig;

    $value = getenv($name);
    if ($value !== false && $value !== '') {
        return $value;
    }

    if (isset($_ENV[$name]) && $_ENV[$name] !== '') {
        return (string) $_ENV[$name];
    }

    if (isset($emailConfig[$name]) && $emailConfig[$name] !== '') {
        return (string) $emailConfig[$name];
    }

    return $default;
}

function getRequestHeadersMap(): array
{
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        if (is_array($headers)) {
            $normalized = [];
            foreach ($headers as $key => $value) {
                $normalized[strtolower((string) $key)] = is_array($value) ? (string) reset($value) : (string) $value;
            }
            return $normalized;
        }
    }

    $headers = [];
    foreach ($_SERVER as $key => $value) {
        if (strncmp($key, 'HTTP_', 5) !== 0) {
            continue;
        }

        $headerName = strtolower(str_replace('_', '-', substr($key, 5)));
        $headers[$headerName] = (string) $value;
    }

    return $headers;
}

function getHeaderValue(array $headers, string $name): ?string
{
    $key = strtolower($name);
    return $headers[$key] ?? null;
}

function decodeHeaderValue(?string $value): string
{
    if (!$value) {
        return 'Not available';
    }

    $decoded = rawurldecode($value);
    return $decoded !== '' ? $decoded : $value;
}

function escapeHtmlValue(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function renderRow(string $label, string $value, bool $highlighted = false): string
{
    $fontWeight = $highlighted ? '700' : '500';

    return '
    <tr>
      <td width="38%" valign="top" style="padding:13px 16px;border-bottom:1px solid #e8dfcc;color:#756b5c;font-size:12px;line-height:18px;text-transform:uppercase;letter-spacing:.4px;">' . $label . '</td>
      <td valign="top" style="padding:13px 16px;border-bottom:1px solid #e8dfcc;color:#08211f;font-size:14px;line-height:20px;font-weight:' . $fontWeight . ';">' . $value . '</td>
    </tr>';
}

function readSmtpResponse($socket, array $expectedCodes): array
{
    $response = '';
    while (($line = fgets($socket, 2048)) !== false) {
        $response .= $line;
        if (strlen($line) >= 4 && $line[3] === ' ') {
            break;
        }
    }
    $code = (int) substr($response, 0, 3);
    return ['ok' => in_array($code, $expectedCodes, true), 'response' => trim($response)];
}

function sendSmtpCommand($socket, string $command, array $expectedCodes): array
{
    if (fwrite($socket, $command . "\r\n") === false) {
        return ['ok' => false, 'response' => 'Failed to write to SMTP connection'];
    }
    return readSmtpResponse($socket, $expectedCodes);
}

function encodeEmailHeader(string $value): string
{
    return '=?UTF-8?B?' . base64_encode($value) . '?=';
}

function normalizeEmailBody(string $value): string
{
    return preg_replace("/\r\n|\r|\n/", "\r\n", $value) ?? $value;
}

function sendSmtpEmail(array $smtpConfig, array $recipients, string $subject, string $textMessage, string $htmlMessage, ?string $replyTo = null): array
{
    $host = $smtpConfig['host'];
    $connectionHost = $smtpConfig['encryption'] === 'ssl' ? 'ssl://' . $host : $host;
    $context = stream_context_create(['ssl' => [
        'verify_peer' => true,
        'verify_peer_name' => true,
        'peer_name' => $host,
    ]]);
    $socket = @stream_socket_client(
        $connectionHost . ':' . $smtpConfig['port'],
        $errorCode,
        $errorMessage,
        20,
        STREAM_CLIENT_CONNECT,
        $context
    );

    if (!is_resource($socket)) {
        return ['ok' => false, 'message' => 'SMTP connection failed: ' . $errorCode . ' ' . $errorMessage];
    }

    stream_set_timeout($socket, 20);
    $response = readSmtpResponse($socket, [220]);
    if (!$response['ok']) {
        fclose($socket);
        return ['ok' => false, 'message' => $response['response']];
    }

    $hostname = preg_replace('/[^a-z0-9.-]/i', '', $_SERVER['SERVER_NAME'] ?? 'fursadolomiti.com');
    $response = sendSmtpCommand($socket, 'EHLO ' . $hostname, [250]);
    if (!$response['ok']) {
        fclose($socket);
        return ['ok' => false, 'message' => $response['response']];
    }

    if ($smtpConfig['encryption'] === 'tls') {
        $response = sendSmtpCommand($socket, 'STARTTLS', [220]);
        if (!$response['ok'] || stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT) !== true) {
            fclose($socket);
            return ['ok' => false, 'message' => 'SMTP STARTTLS failed'];
        }
        $response = sendSmtpCommand($socket, 'EHLO ' . $hostname, [250]);
        if (!$response['ok']) {
            fclose($socket);
            return ['ok' => false, 'message' => $response['response']];
        }
    }

    foreach ([
        ['AUTH LOGIN', [334]],
        [base64_encode($smtpConfig['username']), [334]],
        [base64_encode($smtpConfig['password']), [235]],
        ['MAIL FROM:<' . $smtpConfig['fromEmail'] . '>', [250]],
    ] as [$command, $expectedCodes]) {
        $response = sendSmtpCommand($socket, $command, $expectedCodes);
        if (!$response['ok']) {
            fclose($socket);
            return ['ok' => false, 'message' => $response['response']];
        }
    }

    foreach ($recipients as $recipient) {
        $response = sendSmtpCommand($socket, 'RCPT TO:<' . $recipient . '>', [250, 251]);
        if (!$response['ok']) {
            fclose($socket);
            return ['ok' => false, 'message' => $response['response']];
        }
    }

    $response = sendSmtpCommand($socket, 'DATA', [354]);
    if (!$response['ok']) {
        fclose($socket);
        return ['ok' => false, 'message' => $response['response']];
    }

    $boundary = '=_FursaDolomiti_' . bin2hex(random_bytes(12));
    $headers = [
        'Date: ' . date(DATE_RFC2822),
        'From: FursaDolomiti <' . $smtpConfig['fromEmail'] . '>',
        'To: ' . implode(', ', $recipients),
        'Subject: ' . encodeEmailHeader($subject),
        'Message-ID: <' . bin2hex(random_bytes(12)) . '@fursadolomiti.com>',
        'MIME-Version: 1.0',
        'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
    ];
    if ($replyTo !== null) {
        $headers[] = 'Reply-To: ' . $replyTo;
    }

    $body = implode("\r\n", $headers) . "\r\n\r\n" .
        '--' . $boundary . "\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" .
        chunk_split(base64_encode(normalizeEmailBody($textMessage)), 76, "\r\n") . "\r\n" .
        '--' . $boundary . "\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" .
        chunk_split(base64_encode(normalizeEmailBody($htmlMessage)), 76, "\r\n") . "\r\n" .
        '--' . $boundary . "--\r\n";
    $body = preg_replace('/^\./m', '..', $body) ?? $body;

    if (fwrite($socket, $body . ".\r\n") === false) {
        fclose($socket);
        return ['ok' => false, 'message' => 'Failed to write SMTP message'];
    }

    $response = readSmtpResponse($socket, [250]);
    sendSmtpCommand($socket, 'QUIT', [221]);
    fclose($socket);
    return ['ok' => $response['ok'], 'message' => $response['response']];
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    jsonResponse(405, ['error' => 'Method not allowed'], ['Allow' => 'POST']);
}

$rawBody = file_get_contents('php://input');
$requestBody = json_decode($rawBody ?: '{}', true);

if (!is_array($requestBody)) {
    jsonResponse(400, ['error' => 'Invalid JSON body']);
}

$smtpHost = getEnvValue('SMTP_HOST');
$smtpPort = (int) (getEnvValue('SMTP_PORT', '465') ?? '465');
$smtpEncryption = strtolower(getEnvValue('SMTP_ENCRYPTION', 'ssl') ?? 'ssl');
$smtpUsername = getEnvValue('SMTP_USERNAME');
$smtpPassword = getEnvValue('SMTP_PASSWORD');
$smtpFromEmail = getEnvValue('SMTP_FROM_EMAIL', $smtpUsername);
$recipientsValue = getEnvValue('EMAIL_RECIPIENTS', 'sundevildi@gmail.com') ?? 'sundevildi@gmail.com';
$recipients = array_values(array_unique(array_filter(array_map(
    static fn (string $recipient): string => strtolower(trim($recipient)),
    array_merge(explode(',', $recipientsValue), ['booking@fursadolomiti.com', 'sundevildi@gmail.com'])
))));
$recipients = array_values(array_diff($recipients, EXCLUDED_ADMIN_RECIPIENTS));

$normalizedEventType = trim((string) ($requestBody['eventType'] ?? ''));
$normalizedWidgetProvider = trim((string) ($requestBody['widgetProvider'] ?? ''));
$normalizedWidgetAction = trim((string) ($requestBody['widgetAction'] ?? ''));
$normalizedWidgetSelection = is_array($requestBody['widgetSelection'] ?? null) ? $requestBody['widgetSelection'] : [];
$normalizedRedirectUrl = trim((string) ($requestBody['redirectUrl'] ?? ''));
$normalizedFirstName = trim((string) ($requestBody['firstName'] ?? ''));
$normalizedLastName = trim((string) ($requestBody['lastName'] ?? ''));
$normalizedEmail = trim((string) ($requestBody['email'] ?? ''));
$normalizedHotelId = trim((string) ($requestBody['hotelId'] ?? ''));
$normalizedHotel = trim((string) ($requestBody['hotel'] ?? ''));
$normalizedPromoCode = trim((string) ($requestBody['promoCode'] ?? ''));
$emailImages = [
    'chalet-zenit' => 'https://fursadolomiti.com/chalet-zenit/chalet-zenit1.png',
    'villa-carolina' => 'https://fursadolomiti.com/villa-carolina/villa-carolina1.jpg',
];
$normalizedHotelImage = $emailImages[$normalizedHotelId] ?? trim((string) ($requestBody['hotelImage'] ?? ''));
$normalizedLocale = trim((string) ($requestBody['locale'] ?? '')) ?: 'Not available';
$normalizedLocalDateTime = trim((string) ($requestBody['localDateTime'] ?? '')) ?: 'Not available';
$normalizedTimezone = trim((string) ($requestBody['timezone'] ?? '')) ?: 'Not available';
$normalizedSubmittedAt = trim((string) ($requestBody['submittedAt'] ?? '')) ?: gmdate('c');

if (!$smtpHost || !$smtpUsername || !$smtpPassword || !$smtpFromEmail || $smtpPort < 1 ||
    !in_array($smtpEncryption, ['ssl', 'tls', 'none'], true) ||
    preg_match($emailPattern, $smtpFromEmail) !== 1 || count($recipients) === 0 ||
    count(array_filter($recipients, static fn (string $recipient): bool => preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $recipient) !== 1)) > 0
) {
    jsonResponse(500, ['error' => 'Email service is not configured']);
}

$smtpConfig = [
    'host' => $smtpHost,
    'port' => $smtpPort,
    'encryption' => $smtpEncryption,
    'username' => $smtpUsername,
    'password' => $smtpPassword,
    'fromEmail' => $smtpFromEmail,
];

$isWidgetTrackingEvent = $normalizedEventType === 'widget_redirect';
$hotelRecipients = [
    'chalet-zenit' => 'info@chaletzenit.it',
    'chalet-invictus' => 'info@chaletinvictus.it',
    'villa-carolina' => 'info@villa-carolina.com',
];
$bookingMode = trim((string) ($requestBody['bookingMode'] ?? ''));
$hotelRecipient = !$isWidgetTrackingEvent && !in_array($bookingMode, ['widget', 'redirect'], true) ? ($hotelRecipients[$normalizedHotelId] ?? null) : null;
$preferredDates = trim((string) ($requestBody['preferredDates'] ?? ''));
$guests = filter_var($requestBody['guests'] ?? null, FILTER_VALIDATE_INT);
$isBookingRequest = !$isWidgetTrackingEvent && (in_array($bookingMode, ['request', 'redirect'], true) || (bool) $hotelRecipient);
if ($isBookingRequest) {
    if ($preferredDates === '' || strlen($preferredDates) > 8000 || $guests === false || $guests < 1 || $guests > 100) {
        jsonResponse(400, ['error' => 'Preferred dates and guest count are required']);
    }
}


if ($isWidgetTrackingEvent) {
    if ($normalizedHotelId === '' || $normalizedHotel === '' || $normalizedWidgetProvider === '') {
        jsonResponse(400, ['error' => 'Tracking payload is incomplete']);
    }
} else {
    if (
        $normalizedFirstName === '' ||
        $normalizedLastName === '' ||
        $normalizedEmail === '' ||
        $normalizedHotelId === '' ||
        $normalizedHotel === ''
    ) {
        jsonResponse(400, ['error' => 'All fields are required']);
    }

    if (preg_match($emailPattern, $normalizedEmail) !== 1) {
        jsonResponse(400, ['error' => 'Invalid email']);
    }
}

$headers = getRequestHeadersMap();
$emailLocale = strtolower(explode('-', $normalizedLocale)[0]);
$adminCopies = [
    'ru' => [
        'title' => 'Новая заявка на бронирование',
        'tracking' => 'Пользователь ушел в бронирование',
        'hotel' => 'Отель',
        'provider' => 'Провайдер',
        'action' => 'Действие',
        'date' => 'Дата заявки',
        'url' => 'URL перехода',
        'selectionTitle' => 'Что выбрал пользователь',
        'selection' => 'Выбор',
        'locale' => 'Язык сайта',
        'timezone' => 'Часовой пояс пользователя',
        'utc' => 'Время UTC',
        'country' => 'Страна',
        'city' => 'Город',
        'interest' => 'заинтересован(а) в',
        'promo' => 'Промокод',
        'main' => 'Главная информация',
        'firstName' => 'Имя',
        'lastName' => 'Фамилия',
        'fullName' => 'Имя и фамилия',
        'reply' => 'Ответить клиенту',
        'context' => 'Контекст заявки',
        'location' => 'Примерное местоположение',
        'region' => 'Регион',
        'locationTimezone' => 'Часовой пояс локации',
        'notice' => 'Служебное уведомление',
        'dates' => 'Желаемые даты и пожелания',
        'guests' => 'Количество гостей',
        'unknown' => 'Нет данных',
        'bookingMethod' => 'Способ бронирования',
        'emailRequest' => 'Заявка по email',
        'widgetBooking' => 'Бронирование через виджет',
        'linkBooking' => 'Переход по ссылке',
        'hotelEmail' => 'Email отеля',
        'missingHotelEmail' => 'Email отеля не предоставлен. Заявка отправляется только администрации.',
        'geoNote' => 'Местоположение определяется приблизительно по данным инфраструктуры и может отличаться от фактического.'
    ],
    'en' => [
        'title' => 'New booking request',
        'tracking' => 'User proceeded to booking',
        'hotel' => 'Hotel',
        'provider' => 'Provider',
        'action' => 'Action',
        'date' => 'Request date',
        'url' => 'Redirect URL',
        'selectionTitle' => 'User selection',
        'selection' => 'Selection',
        'locale' => 'Website language',
        'timezone' => 'User timezone',
        'utc' => 'Submitted at (UTC)',
        'country' => 'Country',
        'city' => 'City',
        'interest' => 'is interested in',
        'promo' => 'Promo code',
        'main' => 'Main information',
        'firstName' => 'First name',
        'lastName' => 'Last name',
        'fullName' => 'Full name',
        'reply' => 'Reply to guest',
        'context' => 'Request context',
        'location' => 'Approximate location',
        'region' => 'Region',
        'locationTimezone' => 'Location timezone',
        'notice' => 'Service notification',
        'dates' => 'Preferred dates and requests',
        'guests' => 'Number of guests',
        'unknown' => 'Not available',
        'bookingMethod' => 'Booking method',
        'emailRequest' => 'Email request',
        'widgetBooking' => 'Booking through a widget',
        'linkBooking' => 'Redirect to booking website',
        'hotelEmail' => 'Hotel email',
        'missingHotelEmail' => 'No hotel email provided. The request is sent to the administrators only.',
        'geoNote' => 'Location is estimated from infrastructure data and may differ from the actual location.'
    ],
    'it' => [
        'title' => 'Nuova richiesta di prenotazione',
        'tracking' => 'L’utente è passato alla prenotazione',
        'hotel' => 'Hotel',
        'provider' => 'Fornitore',
        'action' => 'Azione',
        'date' => 'Data della richiesta',
        'url' => 'URL di destinazione',
        'selectionTitle' => 'Selezione dell’utente',
        'selection' => 'Selezione',
        'locale' => 'Lingua del sito',
        'timezone' => 'Fuso orario dell’utente',
        'utc' => 'Invio (UTC)',
        'country' => 'Paese',
        'city' => 'Città',
        'interest' => 'è interessato/a a',
        'promo' => 'Codice promozionale',
        'main' => 'Informazioni principali',
        'firstName' => 'Nome',
        'lastName' => 'Cognome',
        'fullName' => 'Nome e cognome',
        'reply' => 'Rispondi al cliente',
        'context' => 'Contesto della richiesta',
        'location' => 'Posizione approssimativa',
        'region' => 'Regione',
        'locationTimezone' => 'Fuso orario della posizione',
        'notice' => 'Notifica di servizio',
        'dates' => 'Date desiderate e richieste',
        'guests' => 'Numero di ospiti',
        'unknown' => 'Non disponibile',
        'bookingMethod' => 'Modalità di prenotazione',
        'emailRequest' => 'Richiesta via email',
        'widgetBooking' => 'Prenotazione tramite widget',
        'linkBooking' => 'Reindirizzamento al sito di prenotazione',
        'hotelEmail' => 'Email della struttura',
        'missingHotelEmail' => 'Email della struttura non fornita. La richiesta viene inviata solo agli amministratori.',
        'geoNote' => 'La posizione è stimata dai dati dell’infrastruttura e può differire da quella effettiva.'
    ]
];
$adminCopy = $adminCopies[$emailLocale] ?? $adminCopies['en'];
$roleSubjects = ['ru' => ['admin' => 'Администратору · Новая заявка',
'guest' => 'Гостю · Спасибо за вашу заявку',
'hotel' => 'Отелю · Запрос на бронирование'],
'en' => ['admin' => 'For the administrator · New request',
'guest' => 'For our guest · Thank you for your request',
'hotel' => 'For the hotel · Booking request'],
'it' => ['admin' => 'All’amministratore · Nuova richiesta',
'guest' => 'Al nostro ospite · Grazie per la vostra richiesta',
'hotel' => 'All’hotel · Richiesta di prenotazione']];
$roleSubject = $roleSubjects[$emailLocale] ?? $roleSubjects['en'];
$fullName = $normalizedFirstName . ' ' . $normalizedLastName;
$country = getHeaderValue($headers, 'x-vercel-ip-country')
    ?? getHeaderValue($headers, 'cf-ipcountry')
    ?? $adminCopy['unknown'];
$region = getHeaderValue($headers, 'x-vercel-ip-country-region')
    ?? getHeaderValue($headers, 'x-country-region')
    ?? $adminCopy['unknown'];
$city = decodeHeaderValue(
    getHeaderValue($headers, 'x-vercel-ip-city')
    ?? getHeaderValue($headers, 'x-appengine-city')
    ?? getHeaderValue($headers, 'x-city')
);
$locationTimezone = getHeaderValue($headers, 'x-vercel-ip-timezone')
    ?? getHeaderValue($headers, 'x-timezone')
    ?? $adminCopy['unknown'];
$subjectDate = substr($normalizedSubmittedAt, 0, 10);
$subject = 'FursaDolomiti — ' . $adminCopy['title'] . ' — ' . $normalizedHotel . ' — ' . $fullName . ' — ' . $subjectDate;

$safe = [
    'fullName' => escapeHtmlValue($fullName),
    'firstName' => escapeHtmlValue($normalizedFirstName),
    'lastName' => escapeHtmlValue($normalizedLastName),
    'email' => escapeHtmlValue($normalizedEmail),
    'hotel' => escapeHtmlValue($normalizedHotel),
    'promoCode' => escapeHtmlValue($normalizedPromoCode),
    'hotelImage' => escapeHtmlValue($normalizedHotelImage),
    'locale' => escapeHtmlValue($normalizedLocale),
    'localDateTime' => escapeHtmlValue($normalizedLocalDateTime),
    'timezone' => escapeHtmlValue($normalizedTimezone),
    'submittedAt' => escapeHtmlValue($normalizedSubmittedAt),
    'country' => escapeHtmlValue($country),
    'region' => escapeHtmlValue($region),
    'city' => escapeHtmlValue($city),
    'locationTimezone' => escapeHtmlValue($locationTimezone),
];
$widgetSelectionText = [];
foreach ($normalizedWidgetSelection as $entry) {
    if (!is_array($entry)) {
        continue;
    }

    $label = trim((string) ($entry['label'] ?? ''));
    $value = trim((string) ($entry['value'] ?? ''));

    if ($label !== '' && $value !== '') {
        $widgetSelectionText[] = $label . ': ' . $value;
    }
}
$safeWidgetSelection = array_map('escapeHtmlValue', $widgetSelectionText);

$replySubject = rawurlencode('FursaDolomiti - ' . $normalizedHotel);
$localeUpper = escapeHtmlValue(strtoupper($normalizedLocale));

$bookingMethod = $isWidgetTrackingEvent || $bookingMode === 'widget'
    ? $adminCopy['widgetBooking']
    : ($bookingMode === 'redirect' ? $adminCopy['linkBooking'] : $adminCopy['emailRequest']);
$bookingDetails = [[$adminCopy['bookingMethod'], $bookingMethod]];
if ($isWidgetTrackingEvent || $bookingMode === 'widget') {
    $bookingDetails[] = [$adminCopy['provider'], $normalizedWidgetProvider !== '' ? $normalizedWidgetProvider : $adminCopy['unknown']];
} elseif ($bookingMode === 'redirect') {
    $bookingDetails[] = [$adminCopy['url'], $normalizedRedirectUrl !== '' ? $normalizedRedirectUrl : $adminCopy['unknown']];
} else {
    $bookingDetails[] = [$adminCopy['hotelEmail'], $hotelRecipient ?: $adminCopy['missingHotelEmail']];
}
$bookingDetailsHtml = implode('', array_map(static fn (array $detail): string => renderRow($detail[0], escapeHtmlValue($detail[1]), true), $bookingDetails));
$bookingDetailsText = array_map(static fn (array $detail): string => $detail[0] . ': ' . $detail[1], $bookingDetails);

$htmlMessage = $isWidgetTrackingEvent
    ? '
    <div style="margin:0;padding:32px 12px;background-color:#f1eadb;font-family:Arial,Helvetica,sans-serif;color:#08211f;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:680px;margin:0 auto;border-collapse:separate;background-color:#fffaf0;border:1px solid #e5dbc6;border-radius:16px;box-shadow:0 14px 40px rgba(48,38,16,.12);overflow:hidden;">
        <tr>
          <td style="padding:28px 32px 30px;background-color:#175445;color:#fffaf0;">
            <div style="color:#d7e3d9;font-size:11px;line-height:16px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">FursaDolomiti · Widget Tracking</div>
            <div style="margin-top:13px;color:#fffaf0;font-size:27px;line-height:34px;font-weight:700;">' . $adminCopy['tracking'] . '</div>
            <div style="margin-top:12px;color:#f5eedf;font-size:15px;line-height:22px;"><strong style="color:#ffffff;">' . $safe['hotel'] . '</strong> · ' . escapeHtmlValue($normalizedWidgetProvider) . '</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 8px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">' .
              renderRow($adminCopy['hotel'], $safe['hotel'], true) .
              $bookingDetailsHtml .
              ($isBookingRequest ? renderRow($adminCopy['dates'], escapeHtmlValue($preferredDates), true) . renderRow($adminCopy['guests'], (string) $guests, true) : '') .
              renderRow($adminCopy['provider'], escapeHtmlValue($normalizedWidgetProvider), true) .
              renderRow($adminCopy['action'], escapeHtmlValue($normalizedWidgetAction !== '' ? $normalizedWidgetAction : $adminCopy['unknown'])) .
              renderRow($adminCopy['date'], $safe['localDateTime'], true) .
              renderRow($adminCopy['url'], escapeHtmlValue($normalizedRedirectUrl !== '' ? $normalizedRedirectUrl : $adminCopy['unknown'])) .
            '</table>
          </td>
        </tr>' .
        (!empty($safeWidgetSelection)
            ? '<tr><td style="padding:18px 32px 8px;"><div style="margin-bottom:13px;color:#175445;font-size:18px;line-height:24px;font-weight:700;">' . $adminCopy['selectionTitle'] . '</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">' .
                implode('', array_map(static fn (string $entry): string => renderRow($adminCopy['selection'], $entry), $safeWidgetSelection)) .
                '</table></td></tr>'
            : '') .
        '<tr>
          <td style="padding:18px 32px 32px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">' .
              renderRow($adminCopy['locale'], $safe['locale']) .
              renderRow($adminCopy['timezone'], $safe['timezone']) .
              renderRow($adminCopy['utc'], $safe['submittedAt']) .
              renderRow($adminCopy['country'], $safe['country']) .
              renderRow($adminCopy['city'], $safe['city']) .
            '</table>
          </td>
        </tr>
      </table>
    </div>'
    : '
    <div style="margin:0;padding:32px 12px;background-color:#f1eadb;font-family:Arial,Helvetica,sans-serif;color:#08211f;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">' . $safe['fullName'] . ' - ' . $safe['hotel'] . ' - ' . $safe['localDateTime'] . '</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:680px;margin:0 auto;border-collapse:separate;background-color:#fffaf0;border:1px solid #e5dbc6;border-radius:16px;box-shadow:0 14px 40px rgba(48,38,16,.12);overflow:hidden;">
        <tr>
          <td style="padding:28px 32px 30px;background-color:#175445;color:#fffaf0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="color:#d7e3d9;font-size:11px;line-height:16px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">FursaDolomiti · Booking Desk</td>
                <td align="right" style="color:#d7e3d9;font-size:11px;line-height:16px;">' . $localeUpper . '</td>
              </tr>
            </table>
            <div style="margin-top:13px;color:#fffaf0;font-size:27px;line-height:34px;font-weight:700;">' . $adminCopy['title'] . '</div>
            <div style="margin-top:12px;color:#f5eedf;font-size:15px;line-height:22px;"><strong style="color:#ffffff;">' . $safe['fullName'] . '</strong> ' . $adminCopy['interest'] . ' <strong style="color:#ffffff;">' . $safe['hotel'] . '</strong></div>
            <div style="margin-top:18px;display:inline-block;padding:8px 12px;background-color:#fffaf0;border-radius:999px;color:#175445;font-size:12px;line-height:16px;font-weight:700;">' . $adminCopy['promo'] . ': ' . $safe['promoCode'] . '</div>
          </td>
        </tr>' .
        ($safe['hotelImage'] !== ''
            ? '<tr><td style="background-color:#e8dfcc;"><img src="' . $safe['hotelImage'] . '" width="680" alt="' . $safe['hotel'] . '" style="display:block;width:100%;max-width:680px;height:auto;max-height:300px;object-fit:cover;border:0;"></td></tr>'
            : '') .
        '<tr>
          <td style="padding:28px 32px 8px;">
            <div style="margin-bottom:13px;color:#175445;font-size:18px;line-height:24px;font-weight:700;">' . $adminCopy['main'] . '</div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">' .
              renderRow($adminCopy['firstName'], $safe['firstName']) .
              renderRow($adminCopy['lastName'], $safe['lastName']) .
              renderRow('Email', '<span style="color:#08211f;text-decoration:none;">' . $safe['email'] . '</span>', true) .
              renderRow($adminCopy['hotel'], $safe['hotel'], true) .
              $bookingDetailsHtml .
              ($isBookingRequest ? renderRow($adminCopy['dates'], escapeHtmlValue($preferredDates), true) . renderRow($adminCopy['guests'], (string) $guests, true) : '') .
              renderRow($adminCopy['promo'], $safe['promoCode'], true) .
              renderRow($adminCopy['date'], $safe['localDateTime'], true) .
            '</table>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:16px;">
              <tr>
                <td bgcolor="#175445" style="border-radius:999px;">
                  <a href="mailto:' . $safe['email'] . '?subject=' . $replySubject . '" style="display:inline-block;padding:12px 20px;color:#ffffff;text-decoration:none;font-size:14px;line-height:18px;font-weight:700;">' . $adminCopy['reply'] . '</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px 8px;">
            <div style="margin-bottom:13px;color:#175445;font-size:18px;line-height:24px;font-weight:700;">' . $adminCopy['context'] . '</div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">' .
              renderRow($adminCopy['locale'], $safe['locale']) .
              renderRow($adminCopy['timezone'], $safe['timezone']) .
              renderRow($adminCopy['utc'], $safe['submittedAt']) .
            '</table>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px 32px;">
            <div style="margin-bottom:13px;color:#175445;font-size:18px;line-height:24px;font-weight:700;">' . $adminCopy['location'] . '</div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">' .
              renderRow($adminCopy['country'], $safe['country']) .
              renderRow($adminCopy['region'], $safe['region']) .
              renderRow($adminCopy['city'], $safe['city']) .
              renderRow($adminCopy['locationTimezone'], $safe['locationTimezone']) .
            '</table>
            <div style="margin-top:14px;padding:12px 14px;background-color:#f4edde;border-left:3px solid #c6a86a;color:#796e5f;font-size:11px;line-height:17px;">' . $adminCopy['geoNote'] . '</div>
            <div style="margin-top:24px;padding-top:18px;border-top:1px solid #e8dfcc;color:#998d7b;font-size:11px;line-height:17px;text-align:center;">' . $adminCopy['notice'] . ' · fursadolomiti.com</div>
          </td>
        </tr>
      </table>
    </div>';

$message = $isWidgetTrackingEvent
    ? implode("\n", [
        $adminCopy['tracking'],
        '',
        $adminCopy['hotel'] . ': ' . $normalizedHotel,
        ...$bookingDetailsText,
        $adminCopy['provider'] . ': ' . ($normalizedWidgetProvider !== '' ? $normalizedWidgetProvider : $adminCopy['unknown']),
        $adminCopy['action'] . ': ' . ($normalizedWidgetAction !== '' ? $normalizedWidgetAction : $adminCopy['unknown']),
        $adminCopy['url'] . ': ' . ($normalizedRedirectUrl !== '' ? $normalizedRedirectUrl : $adminCopy['unknown']),
        '',
        ...(!empty($widgetSelectionText) ? array_merge([$adminCopy['selectionTitle']], $widgetSelectionText, ['']) : []),
        $adminCopy['locale'] . ': ' . $normalizedLocale,
        $adminCopy['timezone'] . ': ' . $normalizedTimezone,
        $adminCopy['utc'] . ': ' . $normalizedSubmittedAt,
        $adminCopy['country'] . ': ' . $country,
        $adminCopy['region'] . ': ' . $region,
        $adminCopy['city'] . ': ' . $city,
        $adminCopy['locationTimezone'] . ': ' . $locationTimezone,
    ])
    : implode("\n", [
    $adminCopy['title'],
    '',
    $adminCopy['firstName'] . ': ' . $normalizedFirstName,
    $adminCopy['lastName'] . ': ' . $normalizedLastName,
    $adminCopy['fullName'] . ': ' . $fullName,
    'Email: ' . $normalizedEmail,
    $adminCopy['hotel'] . ': ' . $normalizedHotel,
    ...$bookingDetailsText,
    ...($isBookingRequest ? [$adminCopy['dates'] . ': ' . $preferredDates, $adminCopy['guests'] . ': ' . $guests] : []),
    $adminCopy['promo'] . ': ' . $normalizedPromoCode,
    '',
    $adminCopy['locale'] . ': ' . $normalizedLocale,
    $adminCopy['date'] . ': ' . $normalizedLocalDateTime,
    $adminCopy['timezone'] . ': ' . $normalizedTimezone,
    $adminCopy['utc'] . ': ' . $normalizedSubmittedAt,
    '',
    $adminCopy['location'],
    $adminCopy['country'] . ': ' . $country,
    $adminCopy['region'] . ': ' . $region,
    $adminCopy['city'] . ': ' . $city,
    $adminCopy['locationTimezone'] . ': ' . $locationTimezone,
]);

$customerLocale = strtolower(explode('-', $normalizedLocale)[0]);
$customerCopies = ['ru' => ['subject' => 'Ваша заявка получена',
 'title' => 'Заявка на бронирование',
'thanks' => 'Спасибо за заявку! С вами скоро свяжутся.',
'note' => 'Это подтверждение получения заявки, а не бронирования.',
'hotel' => 'Отель',
'name' => 'Имя и фамилия',
'email' => 'Email',
'dates' => 'Желаемые даты и пожелания',
'guests' => 'Количество гостей'],
'en' => ['subject' => 'Your request has been received',
 'title' => 'Booking request',
'thanks' => 'Thank you for your request! We will contact you soon.',
'note' => 'This confirms receipt of your request, not a booking.',
'hotel' => 'Hotel',
'name' => 'Full name',
'email' => 'Email',
'dates' => 'Preferred dates and requests',
'guests' => 'Number of guests'],
'it' => ['subject' => 'La vostra richiesta è stata ricevuta',
 'title' => 'Richiesta di soggiorno',
'thanks' => 'Grazie per la vostra richiesta! Vi contatteremo presto.',
'note' => 'Questa è una conferma di ricezione della richiesta, non della prenotazione.',
'hotel' => 'Hotel',
'name' => 'Nome e cognome',
'email' => 'Email',
'dates' => 'Date desiderate e richieste',
'guests' => 'Numero di ospiti']];
$bookingEmail = static function (string $language, bool $customer) use ($roleSubjects, $customerCopies, $normalizedHotel, $fullName, $normalizedEmail, $isBookingRequest, $preferredDates, $guests, $safe): array {
    $copy = $customerCopies[$language] ?? $customerCopies['en'];
    $title = $copy['title'];
    $lines = array_merge(
        $customer ? [$copy['thanks'], '', $copy['note'], ''] : [],
        [
            $copy['hotel'] . ': ' . $normalizedHotel,
            $copy['name'] . ': ' . $fullName,
            ...(!$customer ? [$copy['email'] . ': ' . $normalizedEmail] : []),
        ],
        $isBookingRequest ? [$copy['dates'] . ': ' . $preferredDates, $copy['guests'] . ': ' . $guests] : []
    );
    $text = implode("\n", $lines);
    $fields = [[$copy['hotel'], $normalizedHotel], [$copy['name'], $fullName]];
    if (!$customer) {
        $fields[] = [$copy['email'], $normalizedEmail];
    }
    if ($isBookingRequest) {
        $fields[] = [$copy['dates'], $preferredDates];
        $fields[] = [$copy['guests'], (string) $guests];
    }
    $detailRows = implode('', array_map(static fn (array $field): string => renderRow(escapeHtmlValue($field[0]), nl2br(escapeHtmlValue($field[1])), true), $fields));
    $imageHtml = $safe['hotelImage'] !== '' ? '<tr><td style="background-color:#e8dfcc;"><img src="' . $safe['hotelImage'] . '" width="680" alt="' . $safe['hotel'] . '" style="display:block;width:100%;max-width:680px;height:auto;max-height:300px;object-fit:cover;border:0;"></td></tr>' : '';
    $thanksHtml = $customer ? '<p style="margin:0 0 14px;color:#175445;font-size:18px;line-height:26px;font-weight:700;">' . escapeHtmlValue($copy['thanks']) . '</p><p style="margin:0 0 24px;color:#756b5c;font-size:14px;line-height:22px;">' . escapeHtmlValue($copy['note']) . '</p>' : '';
    $safeTitle = escapeHtmlValue($title);
    $safeHotel = $safe['hotel'];
    $html = <<<HTML
<div style="margin:0;padding:32px 12px;background-color:#f1eadb;font-family:Arial,Helvetica,sans-serif;color:#08211f;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:680px;margin:0 auto;border-collapse:separate;background-color:#fffaf0;border:1px solid #e5dbc6;border-radius:16px;box-shadow:0 14px 40px rgba(48,38,16,.12);overflow:hidden;">
    <tr><td style="padding:28px 32px 30px;background-color:#175445;color:#fffaf0;">
      <div style="color:#d7e3d9;font-size:11px;line-height:16px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">FursaDolomiti · Booking Desk</div>
      <div style="margin-top:13px;color:#fffaf0;font-size:27px;line-height:34px;font-weight:700;">{$safeTitle}</div>
      <div style="margin-top:12px;color:#f5eedf;font-size:15px;line-height:22px;font-weight:700;">{$safeHotel}</div>
    </td></tr>
    {$imageHtml}
    <tr><td style="padding:28px 32px 32px;">
      {$thanksHtml}
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">{$detailRows}</table>
      <div style="margin-top:24px;padding-top:18px;border-top:1px solid #e8dfcc;color:#998d7b;font-size:11px;line-height:17px;text-align:center;">fursadolomiti.com</div>
    </td></tr>
  </table>
</div>
HTML;
    return [
        'subject' => 'FursaDolomiti — ' . ($customer ? $copy['subject'] : $copy['title']) . ' — ' . $normalizedHotel,
        'text' => $text,
        'html' => $html,
    ];
};
$customerMail = $bookingEmail($customerLocale, true);
$hotelMail = $bookingEmail($customerLocale === 'it' ? 'it' : 'en', false);

$emailResponse = sendSmtpEmail($smtpConfig, $recipients, $subject, $message, $htmlMessage, $normalizedEmail);

if (!$emailResponse['ok']) {
    error_log('SMTP error: ' . $emailResponse['message']);
    jsonResponse(502, ['error' => 'Email delivery failed']);
}

if ($isWidgetTrackingEvent) {
    jsonResponse(200, ['ok' => true]);
}

$customerEmailResponse = sendSmtpEmail(
    $smtpConfig,
    [$normalizedEmail],
    $customerMail['subject'],
    $customerMail['text'],
    $customerMail['html'],
    $hotelRecipient ?: $smtpFromEmail
);

if (!$customerEmailResponse['ok']) {
    error_log('Customer SMTP error: ' . $customerEmailResponse['message']);
}

$hotelEmailSent = null;
if ($hotelRecipient) {
    $hotelEmailResponse = sendSmtpEmail($smtpConfig, [$hotelRecipient], $hotelMail['subject'], $hotelMail['text'], $hotelMail['html'], $normalizedEmail);
    $hotelEmailSent = $hotelEmailResponse['ok'];
    if (!$hotelEmailSent) {
        error_log('Hotel SMTP error: ' . $hotelEmailResponse['message']);
    }
}
jsonResponse(200, ['ok' => true, 'promoCode' => $normalizedPromoCode, 'customerEmailSent' => $customerEmailResponse['ok'], 'hotelEmailSent' => $hotelEmailSent]);
