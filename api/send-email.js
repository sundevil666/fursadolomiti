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

  const { firstName, lastName, email, hotel, locale, localDateTime, timezone, submittedAt } =
    request.body || {}
  const normalizedFirstName = String(firstName || '').trim()
  const normalizedLastName = String(lastName || '').trim()
  const normalizedEmail = String(email || '').trim()
  const normalizedHotel = String(hotel || '').trim()
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
  const subject = `FursaDolomiti: booking request — ${normalizedHotel}`
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
