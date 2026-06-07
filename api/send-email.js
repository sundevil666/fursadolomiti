const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const getHeader = (request, name) => {
  const value = request.headers?.[name] ?? request.headers?.[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}

const decodeHeader = (value) => {
  if (!value) return 'Not available'

  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

export default async function handler(request, response) {
  const serviceId = process.env.EMAILJS_SERVICE_ID
  const templateId = process.env.EMAILJS_TEMPLATE_ID
  const publicKey = process.env.EMAILJS_PUBLIC_KEY
  const privateKey = process.env.EMAILJS_PRIVATE_KEY
  const recipientsValue = process.env.EMAIL_RECIPIENTS || 'sundevildi@gmail.com'
  const recipients = recipientsValue
    .split(',')
    .map((recipient) => recipient.trim())
    .filter(Boolean)

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const {
    firstName,
    lastName,
    email,
    hotelId,
    hotel,
    promoCode,
    hotelImage,
    locale,
    localDateTime,
    timezone,
    submittedAt,
  } = request.body || {}
  const normalizedFirstName = String(firstName || '').trim()
  const normalizedLastName = String(lastName || '').trim()
  const normalizedEmail = String(email || '').trim()
  const normalizedHotelId = String(hotelId || '').trim()
  const normalizedHotel = String(hotel || '').trim()
  const normalizedPromoCode = String(promoCode || '').trim()
  const normalizedHotelImage = String(hotelImage || '').trim()
  const normalizedLocale = String(locale || '').trim() || 'Not available'
  const normalizedLocalDateTime = String(localDateTime || '').trim() || 'Not available'
  const normalizedTimezone = String(timezone || '').trim() || 'Not available'
  const normalizedSubmittedAt = String(submittedAt || '').trim() || new Date().toISOString()

  if (
    !normalizedFirstName ||
    !normalizedLastName ||
    !normalizedEmail ||
    !normalizedHotelId ||
    !normalizedHotel ||
    !normalizedPromoCode
  ) {
    return response.status(400).json({ error: 'All fields are required' })
  }

  if (!emailPattern.test(normalizedEmail)) {
    return response.status(400).json({ error: 'Invalid email' })
  }

  if (!serviceId || !templateId || !publicKey || !privateKey || recipients.length === 0) {
    return response.status(500).json({ error: 'Email service is not configured' })
  }

  const fullName = `${normalizedFirstName} ${normalizedLastName}`
  const country = getHeader(request, 'x-vercel-ip-country') || 'Not available'
  const region = getHeader(request, 'x-vercel-ip-country-region') || 'Not available'
  const city = decodeHeader(getHeader(request, 'x-vercel-ip-city'))
  const locationTimezone = getHeader(request, 'x-vercel-ip-timezone') || 'Not available'
  const subjectDate = normalizedSubmittedAt.slice(0, 10)
  const subject = `${fullName} — ${normalizedHotel} — ${subjectDate} — FursaDolomiti`
  const safe = {
    fullName: escapeHtml(fullName),
    firstName: escapeHtml(normalizedFirstName),
    lastName: escapeHtml(normalizedLastName),
    email: escapeHtml(normalizedEmail),
    hotel: escapeHtml(normalizedHotel),
    promoCode: escapeHtml(normalizedPromoCode),
    hotelImage: escapeHtml(normalizedHotelImage),
    locale: escapeHtml(normalizedLocale),
    localDateTime: escapeHtml(normalizedLocalDateTime),
    timezone: escapeHtml(normalizedTimezone),
    submittedAt: escapeHtml(normalizedSubmittedAt),
    country: escapeHtml(country),
    region: escapeHtml(region),
    city: escapeHtml(city),
    locationTimezone: escapeHtml(locationTimezone),
  }
  const row = (label, value, highlighted = false) => `
    <tr>
      <td width="38%" valign="top" style="padding:13px 16px;border-bottom:1px solid #e8dfcc;color:#756b5c;font-size:12px;line-height:18px;text-transform:uppercase;letter-spacing:.4px;">${label}</td>
      <td valign="top" style="padding:13px 16px;border-bottom:1px solid #e8dfcc;color:#08211f;font-size:14px;line-height:20px;font-weight:${highlighted ? '700' : '500'};">${value}</td>
    </tr>`
  const htmlMessage = `
    <div style="margin:0;padding:32px 12px;background-color:#f1eadb;font-family:Arial,Helvetica,sans-serif;color:#08211f;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safe.fullName} — ${safe.hotel} — ${safe.localDateTime}</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:680px;margin:0 auto;border-collapse:separate;background-color:#fffaf0;border:1px solid #e5dbc6;border-radius:16px;box-shadow:0 14px 40px rgba(48,38,16,.12);overflow:hidden;">
        <tr>
          <td style="padding:28px 32px 30px;background-color:#175445;color:#fffaf0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="color:#d7e3d9;font-size:11px;line-height:16px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">FursaDolomiti · Booking Desk</td>
                <td align="right" style="color:#d7e3d9;font-size:11px;line-height:16px;">${safe.locale.toUpperCase()}</td>
              </tr>
            </table>
            <div style="margin-top:13px;color:#fffaf0;font-size:27px;line-height:34px;font-weight:700;">Новая заявка на бронирование</div>
            <div style="margin-top:12px;color:#f5eedf;font-size:15px;line-height:22px;"><strong style="color:#ffffff;">${safe.fullName}</strong> заинтересован(а) в <strong style="color:#ffffff;">${safe.hotel}</strong></div>
            <div style="margin-top:18px;display:inline-block;padding:8px 12px;background-color:#fffaf0;border-radius:999px;color:#175445;font-size:12px;line-height:16px;font-weight:700;">Промокод: ${safe.promoCode}</div>
          </td>
        </tr>
        ${
          safe.hotelImage
            ? `<tr><td style="background-color:#e8dfcc;"><img src="${safe.hotelImage}" width="680" alt="${safe.hotel}" style="display:block;width:100%;max-width:680px;height:auto;max-height:300px;object-fit:cover;border:0;"></td></tr>`
            : ''
        }
        <tr>
          <td style="padding:28px 32px 8px;">
            <div style="margin-bottom:13px;color:#175445;font-size:18px;line-height:24px;font-weight:700;">Главная информация</div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">
              ${row('Имя', safe.firstName)}
              ${row('Фамилия', safe.lastName)}
              ${row('Email', `<span style="color:#08211f;text-decoration:none;">${safe.email}</span>`, true)}
              ${row('Отель', safe.hotel, true)}
              ${row('Промокод', safe.promoCode, true)}
              ${row('Дата заявки', safe.localDateTime, true)}
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:16px;">
              <tr>
                <td bgcolor="#175445" style="border-radius:999px;">
                  <a href="mailto:${safe.email}?subject=${encodeURIComponent(`FursaDolomiti — ${normalizedHotel}`)}" style="display:inline-block;padding:12px 20px;color:#ffffff;text-decoration:none;font-size:14px;line-height:18px;font-weight:700;">Ответить клиенту</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px 8px;">
            <div style="margin-bottom:13px;color:#175445;font-size:18px;line-height:24px;font-weight:700;">Контекст заявки</div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">
              ${row('Язык сайта', safe.locale)}
              ${row('Часовой пояс пользователя', safe.timezone)}
              ${row('Время UTC', safe.submittedAt)}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px 32px;">
            <div style="margin-bottom:13px;color:#175445;font-size:18px;line-height:24px;font-weight:700;">Примерное местоположение</div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">
              ${row('Страна', safe.country)}
              ${row('Регион', safe.region)}
              ${row('Город', safe.city)}
              ${row('Часовой пояс локации', safe.locationTimezone)}
            </table>
            <div style="margin-top:14px;padding:12px 14px;background-color:#f4edde;border-left:3px solid #c6a86a;color:#796e5f;font-size:11px;line-height:17px;">География определяется приблизительно инфраструктурой Vercel и может отличаться от фактического местоположения пользователя.</div>
            <div style="margin-top:24px;padding-top:18px;border-top:1px solid #e8dfcc;color:#998d7b;font-size:11px;line-height:17px;text-align:center;">Служебное уведомление · fursadolomiti.com</div>
          </td>
        </tr>
      </table>
    </div>`
  const message = [
    'New booking request from fursadolomiti.com',
    '',
    `First name: ${normalizedFirstName}`,
    `Last name: ${normalizedLastName}`,
    `Full name: ${fullName}`,
    `Email: ${normalizedEmail}`,
    `Selected hotel: ${normalizedHotel}`,
    `Promo code: ${normalizedPromoCode}`,
    '',
    `Website language: ${normalizedLocale}`,
    `User local date and time: ${normalizedLocalDateTime}`,
    `User timezone: ${normalizedTimezone}`,
    `Submitted at (UTC): ${normalizedSubmittedAt}`,
    '',
    'Approximate location based on Vercel geolocation:',
    `Country: ${country}`,
    `Region: ${region}`,
    `City: ${city}`,
    `Location timezone: ${locationTimezone}`,
  ].join('\n')

  try {
    const emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        accessToken: privateKey,
        template_params: {
          to_email: recipients.join(','),
          subject,
          title: subject,
          sender_name: 'FursaDolomiti',
          time: normalizedLocalDateTime,
          html_message: htmlMessage,
          hotel_image: normalizedHotelImage,
          first_name: normalizedFirstName,
          last_name: normalizedLastName,
          full_name: fullName,
          user_email: normalizedEmail,
          hotel: normalizedHotel,
          promo_code: normalizedPromoCode,
          website_language: normalizedLocale,
          local_date_time: normalizedLocalDateTime,
          user_timezone: normalizedTimezone,
          submitted_at: normalizedSubmittedAt,
          country,
          region,
          city,
          location_timezone: locationTimezone,
          from_name: 'FursaDolomiti',
          name: fullName,
          email: normalizedEmail,
          reply_to: normalizedEmail,
          message,
        },
      }),
    })

    if (!emailResponse.ok) {
      console.error('EmailJS error:', emailResponse.status, await emailResponse.text())
      return response.status(502).json({ error: 'Email delivery failed' })
    }

    return response.status(200).json({ ok: true, promoCode: normalizedPromoCode })
  } catch (error) {
    console.error('Email request failed:', error)
    return response.status(502).json({ error: 'Email delivery failed' })
  }
}
