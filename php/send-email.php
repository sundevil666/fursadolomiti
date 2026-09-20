<?php

declare(strict_types=1);

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
$recipients = array_values(array_filter(array_map('trim', explode(',', $recipientsValue))));

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
$normalizedHotelImage = trim((string) ($requestBody['hotelImage'] ?? ''));
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
        $normalizedHotel === '' ||
        $normalizedPromoCode === ''
    ) {
        jsonResponse(400, ['error' => 'All fields are required']);
    }

    if (preg_match($emailPattern, $normalizedEmail) !== 1) {
        jsonResponse(400, ['error' => 'Invalid email']);
    }
}

$headers = getRequestHeadersMap();
$fullName = $normalizedFirstName . ' ' . $normalizedLastName;
$country = getHeaderValue($headers, 'x-vercel-ip-country')
    ?? getHeaderValue($headers, 'cf-ipcountry')
    ?? 'Not available';
$region = getHeaderValue($headers, 'x-vercel-ip-country-region')
    ?? getHeaderValue($headers, 'x-country-region')
    ?? 'Not available';
$city = decodeHeaderValue(
    getHeaderValue($headers, 'x-vercel-ip-city')
    ?? getHeaderValue($headers, 'x-appengine-city')
    ?? getHeaderValue($headers, 'x-city')
);
$locationTimezone = getHeaderValue($headers, 'x-vercel-ip-timezone')
    ?? getHeaderValue($headers, 'x-timezone')
    ?? 'Not available';
$subjectDate = substr($normalizedSubmittedAt, 0, 10);
$subject = $fullName . ' - ' . $normalizedHotel . ' - ' . $subjectDate . ' - FursaDolomiti';

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

$htmlMessage = $isWidgetTrackingEvent
    ? '
    <div style="margin:0;padding:32px 12px;background-color:#f1eadb;font-family:Arial,Helvetica,sans-serif;color:#08211f;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:680px;margin:0 auto;border-collapse:separate;background-color:#fffaf0;border:1px solid #e5dbc6;border-radius:16px;box-shadow:0 14px 40px rgba(48,38,16,.12);overflow:hidden;">
        <tr>
          <td style="padding:28px 32px 30px;background-color:#175445;color:#fffaf0;">
            <div style="color:#d7e3d9;font-size:11px;line-height:16px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">FursaDolomiti · Widget Tracking</div>
            <div style="margin-top:13px;color:#fffaf0;font-size:27px;line-height:34px;font-weight:700;">Пользователь ушел в бронирование</div>
            <div style="margin-top:12px;color:#f5eedf;font-size:15px;line-height:22px;"><strong style="color:#ffffff;">' . $safe['hotel'] . '</strong> · ' . escapeHtmlValue($normalizedWidgetProvider) . '</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 8px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">' .
              renderRow('Отель', $safe['hotel'], true) .
              renderRow('Провайдер', escapeHtmlValue($normalizedWidgetProvider), true) .
              renderRow('Действие', escapeHtmlValue($normalizedWidgetAction !== '' ? $normalizedWidgetAction : 'Not available')) .
              renderRow('Дата заявки', $safe['localDateTime'], true) .
              renderRow('URL перехода', escapeHtmlValue($normalizedRedirectUrl !== '' ? $normalizedRedirectUrl : 'Not available')) .
            '</table>
          </td>
        </tr>' .
        (!empty($safeWidgetSelection)
            ? '<tr><td style="padding:18px 32px 8px;"><div style="margin-bottom:13px;color:#175445;font-size:18px;line-height:24px;font-weight:700;">Что выбрал пользователь</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">' .
                implode('', array_map(static fn (string $entry): string => renderRow('Выбор', $entry), $safeWidgetSelection)) .
                '</table></td></tr>'
            : '') .
        '<tr>
          <td style="padding:18px 32px 32px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">' .
              renderRow('Язык сайта', $safe['locale']) .
              renderRow('Часовой пояс пользователя', $safe['timezone']) .
              renderRow('Время UTC', $safe['submittedAt']) .
              renderRow('Страна', $safe['country']) .
              renderRow('Город', $safe['city']) .
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
            <div style="margin-top:13px;color:#fffaf0;font-size:27px;line-height:34px;font-weight:700;">Новая заявка на бронирование</div>
            <div style="margin-top:12px;color:#f5eedf;font-size:15px;line-height:22px;"><strong style="color:#ffffff;">' . $safe['fullName'] . '</strong> заинтересован(а) в <strong style="color:#ffffff;">' . $safe['hotel'] . '</strong></div>
            <div style="margin-top:18px;display:inline-block;padding:8px 12px;background-color:#fffaf0;border-radius:999px;color:#175445;font-size:12px;line-height:16px;font-weight:700;">Промокод: ' . $safe['promoCode'] . '</div>
          </td>
        </tr>' .
        ($safe['hotelImage'] !== ''
            ? '<tr><td style="background-color:#e8dfcc;"><img src="' . $safe['hotelImage'] . '" width="680" alt="' . $safe['hotel'] . '" style="display:block;width:100%;max-width:680px;height:auto;max-height:300px;object-fit:cover;border:0;"></td></tr>'
            : '') .
        '<tr>
          <td style="padding:28px 32px 8px;">
            <div style="margin-bottom:13px;color:#175445;font-size:18px;line-height:24px;font-weight:700;">Главная информация</div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">' .
              renderRow('Имя', $safe['firstName']) .
              renderRow('Фамилия', $safe['lastName']) .
              renderRow('Email', '<span style="color:#08211f;text-decoration:none;">' . $safe['email'] . '</span>', true) .
              renderRow('Отель', $safe['hotel'], true) .
              renderRow('Промокод', $safe['promoCode'], true) .
              renderRow('Дата заявки', $safe['localDateTime'], true) .
            '</table>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:16px;">
              <tr>
                <td bgcolor="#175445" style="border-radius:999px;">
                  <a href="mailto:' . $safe['email'] . '?subject=' . $replySubject . '" style="display:inline-block;padding:12px 20px;color:#ffffff;text-decoration:none;font-size:14px;line-height:18px;font-weight:700;">Ответить клиенту</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px 8px;">
            <div style="margin-bottom:13px;color:#175445;font-size:18px;line-height:24px;font-weight:700;">Контекст заявки</div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">' .
              renderRow('Язык сайта', $safe['locale']) .
              renderRow('Часовой пояс пользователя', $safe['timezone']) .
              renderRow('Время UTC', $safe['submittedAt']) .
            '</table>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px 32px;">
            <div style="margin-bottom:13px;color:#175445;font-size:18px;line-height:24px;font-weight:700;">Примерное местоположение</div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">' .
              renderRow('Страна', $safe['country']) .
              renderRow('Регион', $safe['region']) .
              renderRow('Город', $safe['city']) .
              renderRow('Часовой пояс локации', $safe['locationTimezone']) .
            '</table>
            <div style="margin-top:14px;padding:12px 14px;background-color:#f4edde;border-left:3px solid #c6a86a;color:#796e5f;font-size:11px;line-height:17px;">География определяется приблизительно заголовками инфраструктуры и может отличаться от фактического местоположения пользователя.</div>
            <div style="margin-top:24px;padding-top:18px;border-top:1px solid #e8dfcc;color:#998d7b;font-size:11px;line-height:17px;text-align:center;">Служебное уведомление · fursadolomiti.com</div>
          </td>
        </tr>
      </table>
    </div>';

$message = $isWidgetTrackingEvent
    ? implode("\n", [
        'Widget booking redirect detected from fursadolomiti.com',
        '',
        'Hotel: ' . $normalizedHotel,
        'Provider: ' . ($normalizedWidgetProvider !== '' ? $normalizedWidgetProvider : 'Not available'),
        'Action: ' . ($normalizedWidgetAction !== '' ? $normalizedWidgetAction : 'Not available'),
        'Redirect URL: ' . ($normalizedRedirectUrl !== '' ? $normalizedRedirectUrl : 'Not available'),
        '',
        ...(!empty($widgetSelectionText) ? array_merge(['Selected values:'], $widgetSelectionText, ['']) : []),
        'Website language: ' . $normalizedLocale,
        'User timezone: ' . $normalizedTimezone,
        'Submitted at (UTC): ' . $normalizedSubmittedAt,
        'Country: ' . $country,
        'Region: ' . $region,
        'City: ' . $city,
        'Location timezone: ' . $locationTimezone,
    ])
    : implode("\n", [
    'New booking request from fursadolomiti.com',
    '',
    'First name: ' . $normalizedFirstName,
    'Last name: ' . $normalizedLastName,
    'Full name: ' . $fullName,
    'Email: ' . $normalizedEmail,
    'Selected hotel: ' . $normalizedHotel,
    'Promo code: ' . $normalizedPromoCode,
    '',
    'Website language: ' . $normalizedLocale,
    'User local date and time: ' . $normalizedLocalDateTime,
    'User timezone: ' . $normalizedTimezone,
    'Submitted at (UTC): ' . $normalizedSubmittedAt,
    '',
    'Approximate location based on request headers:',
    'Country: ' . $country,
    'Region: ' . $region,
    'City: ' . $city,
    'Location timezone: ' . $locationTimezone,
]);

$customerLocale = strtolower(explode('-', $normalizedLocale)[0]);
$customerCopies = [
    'ru' => [
        'subject' => 'Ваш запрос на бронирование отправлен',
        'paragraphs' => [
            'Спасибо, что решили отправить запрос на бронирование через мой сайт.',
            'Отель получил Ваш запрос и должен ответить Вам в течение 1–2 дней, предложив доступные варианты для бронирования.',
            'Если Вы не получили ответ, Вы также можете отправить запрос напрямую через официальный сайт отеля. Пожалуйста, обязательно укажите промокод FURSADOLOMITI в комментариях к запросу.',
            'Если проблема сохраняется и Вы по-прежнему не получаете ответа, свяжитесь со мной напрямую. Я постараюсь решить вопрос и отправить вам подходящее предложение как можно скорее.',
        ],
    ],
    'en' => [
        'subject' => 'Your booking request has been sent',
        'paragraphs' => [
            'Thank you for choosing to send your booking request through my website.',
            'The hotel has received your request and should reply within 1–2 days with the available booking options.',
            'If you do not receive a response, you can also send your request directly through the hotel’s official website. Please make sure to enter the promo code FURSADOLOMITI in the comments section of your request.',
            'If you still experience any problems or do not receive a reply, please contact me directly. I will do my best to resolve the issue and send you a suitable proposal as soon as possible.',
        ],
    ],
    'it' => [
        'subject' => 'La vostra richiesta di prenotazione è stata inviata',
        'paragraphs' => [
            'Grazie per aver scelto di inviare la vostra richiesta di prenotazione tramite il mio sito.',
            'L’hotel ha ricevuto la vostra richiesta e dovrebbe rispondervi entro 1–2 giorni, inviandovi le opzioni disponibili per la prenotazione.',
            'Se non ricevete una risposta, potete inviare la richiesta anche direttamente tramite il sito ufficiale dell’hotel. Vi prego di indicare il codice promo FURSADOLOMITI nel campo dei commenti della richiesta.',
            'Se il problema persiste e non ricevete ancora una risposta, potete contattarmi direttamente. Cercherò di risolvere il problema e di inviarvi una proposta adatta alle vostre esigenze il prima possibile.',
        ],
    ],
];
$customerCopy = $customerCopies[$customerLocale] ?? $customerCopies['en'];
$customerSubject = 'FursaDolomiti - ' . $customerCopy['subject'];
$customerParagraphsHtml = implode('', array_map(
    static fn (string $paragraph): string => '<p style="margin:0 0 18px;color:#3d342c;font-size:15px;line-height:23px;">' .
        str_replace('FURSADOLOMITI', '<strong>FURSADOLOMITI</strong>', escapeHtmlValue($paragraph)) . '</p>',
    $customerCopy['paragraphs']
));
$customerHtmlMessage = '
    <div style="margin:0;padding:32px 12px;background-color:#f1eadb;font-family:Arial,Helvetica,sans-serif;color:#08211f;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;margin:0 auto;border-collapse:separate;background-color:#fffaf0;border:1px solid #e5dbc6;border-radius:16px;box-shadow:0 14px 40px rgba(48,38,16,.12);overflow:hidden;">
        <tr>
          <td style="padding:28px 32px 30px;background-color:#175445;color:#fffaf0;">
            <div style="color:#d7e3d9;font-size:11px;line-height:16px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">FursaDolomiti</div>
            <div style="margin-top:13px;color:#fffaf0;font-size:26px;line-height:34px;font-weight:700;">' . escapeHtmlValue($customerCopy['subject']) . '</div>
          </td>
        </tr>' .
        ($safe['hotelImage'] !== ''
            ? '<tr><td style="background-color:#e8dfcc;"><img src="' . $safe['hotelImage'] . '" width="640" alt="' . $safe['hotel'] . '" style="display:block;width:100%;max-width:640px;height:auto;max-height:280px;object-fit:cover;border:0;"></td></tr>'
            : '') .
        '<tr>
          <td style="padding:28px 32px 32px;">
            ' . $customerParagraphsHtml . '
            <div style="margin-top:24px;padding-top:18px;border-top:1px solid #e8dfcc;color:#998d7b;font-size:11px;line-height:17px;text-align:center;">fursadolomiti.com</div>
          </td>
        </tr>
      </table>
    </div>';

$customerMessage = implode("\n\n", $customerCopy['paragraphs']);

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
    $customerSubject,
    $customerMessage,
    $customerHtmlMessage,
    $recipients[0]
);

if (!$customerEmailResponse['ok']) {
    error_log('Customer SMTP error: ' . $customerEmailResponse['message']);
}

jsonResponse(200, ['ok' => true, 'promoCode' => $normalizedPromoCode]);
