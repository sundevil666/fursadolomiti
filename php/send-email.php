<?php

declare(strict_types=1);

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
    $value = getenv($name);
    if ($value !== false && $value !== '') {
        return $value;
    }

    if (isset($_ENV[$name]) && $_ENV[$name] !== '') {
        return (string) $_ENV[$name];
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

function sendEmailJsRequest(array $payload): array
{
    $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($body === false) {
        return ['ok' => false, 'status' => 0, 'body' => 'Failed to encode request body'];
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n",
            'content' => $body,
            'ignore_errors' => true,
            'timeout' => 20,
        ],
    ]);

    $responseBody = @file_get_contents('https://api.emailjs.com/api/v1.0/email/send', false, $context);
    $responseHeaders = $http_response_header ?? [];
    $statusCode = 0;

    if (isset($responseHeaders[0]) && preg_match('/\s(\d{3})\s/', $responseHeaders[0], $matches) === 1) {
        $statusCode = (int) $matches[1];
    }

    return [
        'ok' => $statusCode >= 200 && $statusCode < 300,
        'status' => $statusCode,
        'body' => is_string($responseBody) ? $responseBody : '',
    ];
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    jsonResponse(405, ['error' => 'Method not allowed'], ['Allow' => 'POST']);
}

$rawBody = file_get_contents('php://input');
$requestBody = json_decode($rawBody ?: '{}', true);

if (!is_array($requestBody)) {
    jsonResponse(400, ['error' => 'Invalid JSON body']);
}

$serviceId = getEnvValue('EMAILJS_SERVICE_ID');
$templateId = getEnvValue('EMAILJS_TEMPLATE_ID');
$publicKey = getEnvValue('EMAILJS_PUBLIC_KEY');
$privateKey = getEnvValue('EMAILJS_PRIVATE_KEY');
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

if (!$serviceId || !$templateId || !$publicKey || !$privateKey || count($recipients) === 0) {
    jsonResponse(500, ['error' => 'Email service is not configured']);
}

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

$customerSubject = 'FursaDolomiti - ' . $normalizedHotel . ' booking request received';
$customerHtmlMessage = '
    <div style="margin:0;padding:32px 12px;background-color:#f1eadb;font-family:Arial,Helvetica,sans-serif;color:#08211f;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;margin:0 auto;border-collapse:separate;background-color:#fffaf0;border:1px solid #e5dbc6;border-radius:16px;box-shadow:0 14px 40px rgba(48,38,16,.12);overflow:hidden;">
        <tr>
          <td style="padding:28px 32px 30px;background-color:#175445;color:#fffaf0;">
            <div style="color:#d7e3d9;font-size:11px;line-height:16px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">FursaDolomiti</div>
            <div style="margin-top:13px;color:#fffaf0;font-size:26px;line-height:34px;font-weight:700;">Your request has been received</div>
            <div style="margin-top:12px;color:#f5eedf;font-size:15px;line-height:22px;">Thank you, <strong style="color:#ffffff;">' . $safe['firstName'] . '</strong>. We have received your request for <strong style="color:#ffffff;">' . $safe['hotel'] . '</strong>.</div>
          </td>
        </tr>' .
        ($safe['hotelImage'] !== ''
            ? '<tr><td style="background-color:#e8dfcc;"><img src="' . $safe['hotelImage'] . '" width="640" alt="' . $safe['hotel'] . '" style="display:block;width:100%;max-width:640px;height:auto;max-height:280px;object-fit:cover;border:0;"></td></tr>'
            : '') .
        '<tr>
          <td style="padding:28px 32px 32px;">
            <p style="margin:0 0 16px;color:#3d342c;font-size:15px;line-height:23px;">Please complete your reservation on the hotel&apos;s official booking page. If requested, use this promo code:</p>
            <div style="display:inline-block;margin-bottom:20px;padding:10px 14px;background-color:#175445;border-radius:999px;color:#fffaf0;font-size:14px;line-height:18px;font-weight:700;">' . $safe['promoCode'] . '</div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">' .
              renderRow('Name', $safe['fullName']) .
              renderRow('Hotel', $safe['hotel'], true) .
              renderRow('Request date', $safe['localDateTime'], true) .
            '</table>
            <p style="margin:18px 0 0;color:#796e5f;font-size:13px;line-height:20px;">The hotel or its booking system will send a separate confirmation after you finish the reservation there.</p>
            <div style="margin-top:24px;padding-top:18px;border-top:1px solid #e8dfcc;color:#998d7b;font-size:11px;line-height:17px;text-align:center;">fursadolomiti.com</div>
          </td>
        </tr>
      </table>
    </div>';

$customerMessage = implode("\n", [
    'Your FursaDolomiti request has been received.',
    '',
    'Name: ' . $fullName,
    'Hotel: ' . $normalizedHotel,
    'Promo code: ' . $normalizedPromoCode,
    '',
    'Please complete your reservation on the official hotel booking page.',
    'The hotel or booking system will send a separate confirmation after the booking is completed.',
]);

$emailPayloadBase = [
    'service_id' => $serviceId,
    'template_id' => $templateId,
    'user_id' => $publicKey,
    'accessToken' => $privateKey,
];

$emailResponse = sendEmailJsRequest($emailPayloadBase + [
    'template_params' => [
        'to_email' => implode(',', $recipients),
        'subject' => $subject,
        'title' => $subject,
        'sender_name' => 'FursaDolomiti',
        'time' => $normalizedLocalDateTime,
        'html_message' => $htmlMessage,
        'hotel_image' => $normalizedHotelImage,
        'first_name' => $normalizedFirstName,
        'last_name' => $normalizedLastName,
        'full_name' => $fullName,
        'user_email' => $normalizedEmail,
        'hotel' => $normalizedHotel,
        'promo_code' => $normalizedPromoCode,
        'website_language' => $normalizedLocale,
        'local_date_time' => $normalizedLocalDateTime,
        'user_timezone' => $normalizedTimezone,
        'submitted_at' => $normalizedSubmittedAt,
        'country' => $country,
        'region' => $region,
        'city' => $city,
        'location_timezone' => $locationTimezone,
        'from_name' => 'FursaDolomiti',
        'name' => $fullName,
        'email' => $normalizedEmail,
        'reply_to' => $normalizedEmail,
        'message' => $message,
    ],
]);

if (!$emailResponse['ok']) {
    error_log('EmailJS error: ' . $emailResponse['status'] . ' ' . $emailResponse['body']);
    jsonResponse(502, ['error' => 'Email delivery failed']);
}

if ($isWidgetTrackingEvent) {
    jsonResponse(200, ['ok' => true]);
}

$customerEmailResponse = sendEmailJsRequest($emailPayloadBase + [
    'template_params' => [
        'to_email' => $normalizedEmail,
        'subject' => $customerSubject,
        'title' => $customerSubject,
        'sender_name' => 'FursaDolomiti',
        'time' => $normalizedLocalDateTime,
        'html_message' => $customerHtmlMessage,
        'hotel_image' => $normalizedHotelImage,
        'first_name' => $normalizedFirstName,
        'last_name' => $normalizedLastName,
        'full_name' => $fullName,
        'user_email' => $normalizedEmail,
        'hotel' => $normalizedHotel,
        'promo_code' => $normalizedPromoCode,
        'website_language' => $normalizedLocale,
        'local_date_time' => $normalizedLocalDateTime,
        'user_timezone' => $normalizedTimezone,
        'submitted_at' => $normalizedSubmittedAt,
        'from_name' => 'FursaDolomiti',
        'name' => $fullName,
        'email' => $normalizedEmail,
        'reply_to' => $recipients[0],
        'message' => $customerMessage,
    ],
]);

if (!$customerEmailResponse['ok']) {
    error_log('Customer EmailJS error: ' . $customerEmailResponse['status'] . ' ' . $customerEmailResponse['body']);
}

jsonResponse(200, ['ok' => true, 'promoCode' => $normalizedPromoCode]);
