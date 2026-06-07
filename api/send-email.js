const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const describeEnv = (name, value) => ({
  name,
  present: Boolean(value),
  length: value?.length ?? 0,
  preview: value ? `${value.slice(0, 4)}...${value.slice(-3)}` : null,
  hasWhitespace: value ? value !== value.trim() : false,
})

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

  const environment = [
    describeEnv('EMAILJS_SERVICE_ID', serviceId),
    describeEnv('EMAILJS_TEMPLATE_ID', templateId),
    describeEnv('EMAILJS_PUBLIC_KEY', publicKey),
    describeEnv('EMAILJS_PRIVATE_KEY', privateKey),
    describeEnv('EMAIL_RECIPIENTS', recipientsValue),
  ]

  if (request.method === 'GET') {
    return response.status(200).json({ environment })
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  console.info('EmailJS environment:', environment)

  const {
    firstName,
    lastName,
    email,
    hotel,
    hotelImage,
    locale,
    localDateTime,
    timezone,
    submittedAt,
  } = request.body || {}
  const normalizedFirstName = String(firstName || '').trim()
  const normalizedLastName = String(lastName || '').trim()
  const normalizedEmail = String(email || '').trim()
  const normalizedHotel = String(hotel || '').trim()
  const normalizedHotelImage = String(hotelImage || '').trim()
  const normalizedLocale = String(locale || '').trim() || 'Not available'
  const normalizedLocalDateTime = String(localDateTime || '').trim() || 'Not available'
  const normalizedTimezone = String(timezone || '').trim() || 'Not available'
  const normalizedSubmittedAt = String(submittedAt || '').trim() || new Date().toISOString()

  if (!normalizedFirstName || !normalizedLastName || !normalizedEmail || !normalizedHotel) {
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
      <td style="width:36%;padding:12px 16px;border-bottom:1px solid #e4dac3;color:#6b6255;font-size:13px;">${label}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e4dac3;color:#08211f;font-size:14px;font-weight:${highlighted ? '700' : '500'};">${value}</td>
    </tr>`
  const htmlMessage = `
    <div style="margin:0;padding:28px 12px;background:#f3ecdc;font-family:Arial,sans-serif;color:#08211f;">
      <table role="presentation" style="width:100%;max-width:680px;margin:0 auto;border-collapse:collapse;background:#fff9ec;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:24px 28px;background:#175445;color:#fff9ec;">
            <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;opacity:.8;">FursaDolomiti</div>
            <div style="margin-top:6px;font-size:24px;font-weight:700;">Новая заявка на бронирование</div>
            <div style="margin-top:7px;font-size:14px;opacity:.9;">${safe.fullName} заинтересован(а) в ${safe.hotel}</div>
          </td>
        </tr>
        ${
          safe.hotelImage
            ? `<tr><td><img src="${safe.hotelImage}" alt="${safe.hotel}" style="display:block;width:100%;height:240px;object-fit:cover;"></td></tr>`
            : ''
        }
        <tr>
          <td style="padding:24px 28px 10px;">
            <div style="margin-bottom:12px;font-size:17px;font-weight:700;color:#175445;">Главная информация</div>
            <table role="presentation" style="width:100%;border-collapse:collapse;border:1px solid #e4dac3;border-radius:8px;overflow:hidden;">
              ${row('Имя', safe.firstName)}
              ${row('Фамилия', safe.lastName)}
              ${row('Email', `<a href="mailto:${safe.email}" style="color:#175445;">${safe.email}</a>`, true)}
              ${row('Отель', safe.hotel, true)}
              ${row('Дата заявки', safe.localDateTime, true)}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px 10px;">
            <div style="margin-bottom:12px;font-size:17px;font-weight:700;color:#175445;">Контекст заявки</div>
            <table role="presentation" style="width:100%;border-collapse:collapse;border:1px solid #e4dac3;border-radius:8px;overflow:hidden;">
              ${row('Язык сайта', safe.locale)}
              ${row('Часовой пояс пользователя', safe.timezone)}
              ${row('Время UTC', safe.submittedAt)}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px 28px;">
            <div style="margin-bottom:12px;font-size:17px;font-weight:700;color:#175445;">Примерное местоположение</div>
            <table role="presentation" style="width:100%;border-collapse:collapse;border:1px solid #e4dac3;border-radius:8px;overflow:hidden;">
              ${row('Страна', safe.country)}
              ${row('Регион', safe.region)}
              ${row('Город', safe.city)}
              ${row('Часовой пояс локации', safe.locationTimezone)}
            </table>
            <div style="margin-top:12px;color:#84796a;font-size:11px;line-height:1.45;">География определяется приблизительно инфраструктурой Vercel и может отличаться от фактического местоположения пользователя.</div>
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
          html_message: htmlMessage,
          hotel_image: normalizedHotelImage,
          first_name: normalizedFirstName,
          last_name: normalizedLastName,
          full_name: fullName,
          user_email: normalizedEmail,
          hotel: normalizedHotel,
          website_language: normalizedLocale,
          local_date_time: normalizedLocalDateTime,
          user_timezone: normalizedTimezone,
          submitted_at: normalizedSubmittedAt,
          country,
          region,
          city,
          location_timezone: locationTimezone,
          from_name: fullName,
          from_email: normalizedEmail,
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

    return response.status(200).json({ ok: true })
  } catch (error) {
    console.error('Email request failed:', error)
    return response.status(502).json({ error: 'Email delivery failed' })
  }
}
