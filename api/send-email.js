const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const recipients = (process.env.EMAIL_RECIPIENTS || 'sundevildi@gmail.com')
  .split(',')
  .map((email) => email.trim())
  .filter(Boolean)

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const { firstName, lastName, email, hotel } = request.body || {}
  const normalizedFirstName = String(firstName || '').trim()
  const normalizedLastName = String(lastName || '').trim()
  const normalizedEmail = String(email || '').trim()
  const normalizedHotel = String(hotel || '').trim()

  if (!normalizedFirstName || !normalizedLastName || !normalizedEmail || !normalizedHotel) {
    return response.status(400).json({ error: 'All fields are required' })
  }

  if (!emailPattern.test(normalizedEmail)) {
    return response.status(400).json({ error: 'Invalid email' })
  }

  const serviceId = process.env.EMAILJS_SERVICE_ID
  const templateId = process.env.EMAILJS_TEMPLATE_ID
  const publicKey = process.env.EMAILJS_PUBLIC_KEY

  if (!serviceId || !templateId || !publicKey || recipients.length === 0) {
    return response.status(500).json({ error: 'Email service is not configured' })
  }

  const fullName = `${normalizedFirstName} ${normalizedLastName}`

  try {
    const emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_email: recipients.join(','),
          first_name: normalizedFirstName,
          last_name: normalizedLastName,
          user_email: normalizedEmail,
          hotel: normalizedHotel,
          from_name: fullName,
          from_email: normalizedEmail,
          name: fullName,
          email: normalizedEmail,
          reply_to: normalizedEmail,
          message: `Hotel: ${normalizedHotel}`,
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
