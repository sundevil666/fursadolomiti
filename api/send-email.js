import nodemailer from 'nodemailer'

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
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = Number(process.env.SMTP_PORT || 465)
  const smtpEncryption = (process.env.SMTP_ENCRYPTION || 'ssl').toLowerCase()
  const smtpUsername = process.env.SMTP_USERNAME
  const smtpPassword = process.env.SMTP_PASSWORD
  const smtpFromEmail = process.env.SMTP_FROM_EMAIL || smtpUsername
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
    eventType,
    widgetProvider,
    widgetAction,
    widgetSelection,
    redirectUrl,
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
  const normalizedEventType = String(eventType || '').trim()
  const normalizedWidgetProvider = String(widgetProvider || '').trim()
  const normalizedWidgetAction = String(widgetAction || '').trim()
  const normalizedWidgetSelection = Array.isArray(widgetSelection) ? widgetSelection : []
  const normalizedRedirectUrl = String(redirectUrl || '').trim()
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
    !smtpHost ||
    !smtpUsername ||
    !smtpPassword ||
    !smtpFromEmail ||
    !Number.isInteger(smtpPort) ||
    smtpPort < 1 ||
    !['ssl', 'tls', 'none'].includes(smtpEncryption) ||
    !emailPattern.test(smtpFromEmail) ||
    recipients.length === 0 ||
    recipients.some((recipient) => !emailPattern.test(recipient))
  ) {
    return response.status(500).json({ error: 'Email service is not configured' })
  }

  const isWidgetTrackingEvent = normalizedEventType === 'widget_redirect'

  if (isWidgetTrackingEvent) {
    if (!normalizedHotelId || !normalizedHotel || !normalizedWidgetProvider) {
      return response.status(400).json({ error: 'Tracking payload is incomplete' })
    }
  } else {
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
  const widgetSelectionText = normalizedWidgetSelection
    .map((entry) => {
      const label = String(entry?.label || '').trim()
      const value = String(entry?.value || '').trim()
      return label && value ? `${label}: ${value}` : ''
    })
    .filter(Boolean)
  const safeWidgetSelection = widgetSelectionText.map((entry) => escapeHtml(entry))
  const row = (label, value, highlighted = false) => `
    <tr>
      <td width="38%" valign="top" style="padding:13px 16px;border-bottom:1px solid #e8dfcc;color:#756b5c;font-size:12px;line-height:18px;text-transform:uppercase;letter-spacing:.4px;">${label}</td>
      <td valign="top" style="padding:13px 16px;border-bottom:1px solid #e8dfcc;color:#08211f;font-size:14px;line-height:20px;font-weight:${highlighted ? '700' : '500'};">${value}</td>
    </tr>`
  const htmlMessage = isWidgetTrackingEvent
    ? `
    <div style="margin:0;padding:32px 12px;background-color:#f1eadb;font-family:Arial,Helvetica,sans-serif;color:#08211f;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:680px;margin:0 auto;border-collapse:separate;background-color:#fffaf0;border:1px solid #e5dbc6;border-radius:16px;box-shadow:0 14px 40px rgba(48,38,16,.12);overflow:hidden;">
        <tr>
          <td style="padding:28px 32px 30px;background-color:#175445;color:#fffaf0;">
            <div style="color:#d7e3d9;font-size:11px;line-height:16px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">FursaDolomiti · Widget Tracking</div>
            <div style="margin-top:13px;color:#fffaf0;font-size:27px;line-height:34px;font-weight:700;">Пользователь ушел в бронирование</div>
            <div style="margin-top:12px;color:#f5eedf;font-size:15px;line-height:22px;"><strong style="color:#ffffff;">${safe.hotel}</strong> · ${escapeHtml(normalizedWidgetProvider)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 8px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">
              ${row('Отель', safe.hotel, true)}
              ${row('Провайдер', escapeHtml(normalizedWidgetProvider), true)}
              ${row('Действие', escapeHtml(normalizedWidgetAction || 'Not available'))}
              ${row('Дата заявки', safe.localDateTime, true)}
              ${row('URL перехода', escapeHtml(normalizedRedirectUrl || 'Not available'))}
            </table>
          </td>
        </tr>
        ${
          safeWidgetSelection.length
            ? `<tr><td style="padding:18px 32px 8px;"><div style="margin-bottom:13px;color:#175445;font-size:18px;line-height:24px;font-weight:700;">Что выбрал пользователь</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">${safeWidgetSelection
                .map((entry) => row('Выбор', entry))
                .join('')}</table></td></tr>`
            : ''
        }
        <tr>
          <td style="padding:18px 32px 32px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">
              ${row('Язык сайта', safe.locale)}
              ${row('Часовой пояс пользователя', safe.timezone)}
              ${row('Время UTC', safe.submittedAt)}
              ${row('Страна', safe.country)}
              ${row('Город', safe.city)}
            </table>
          </td>
        </tr>
      </table>
    </div>`
    : `
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
  const message = isWidgetTrackingEvent
    ? [
        'Widget booking redirect detected from fursadolomiti.com',
        '',
        `Hotel: ${normalizedHotel}`,
        `Provider: ${normalizedWidgetProvider || 'Not available'}`,
        `Action: ${normalizedWidgetAction || 'Not available'}`,
        `Redirect URL: ${normalizedRedirectUrl || 'Not available'}`,
        '',
        ...(widgetSelectionText.length ? ['Selected values:', ...widgetSelectionText, ''] : []),
        `Website language: ${normalizedLocale}`,
        `User timezone: ${normalizedTimezone}`,
        `Submitted at (UTC): ${normalizedSubmittedAt}`,
        `Country: ${country}`,
        `Region: ${region}`,
        `City: ${city}`,
        `Location timezone: ${locationTimezone}`,
      ].join('\n')
    : [
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
  const customerLocale = ['ru', 'en', 'it'].includes(normalizedLocale.toLowerCase().split('-')[0])
    ? normalizedLocale.toLowerCase().split('-')[0]
    : 'en'
  const customerCopy = {
    ru: {
      subject: 'Ваш запрос на бронирование отправлен',
      paragraphs: [
        'Спасибо, что решили отправить запрос на бронирование через мой сайт.',
        'Отель получил Ваш запрос и должен ответить Вам в течение 1–2 дней, предложив доступные варианты для бронирования.',
        'Если Вы не получили ответ, Вы также можете отправить запрос напрямую через официальный сайт отеля. Пожалуйста, обязательно укажите промокод FURSADOLOMITI в комментариях к запросу.',
        'Если проблема сохраняется и Вы по-прежнему не получаете ответа, свяжитесь со мной напрямую. Я постараюсь решить вопрос и отправить вам подходящее предложение как можно скорее.',
      ],
    },
    en: {
      subject: 'Your booking request has been sent',
      paragraphs: [
        'Thank you for choosing to send your booking request through my website.',
        'The hotel has received your request and should reply within 1–2 days with the available booking options.',
        'If you do not receive a response, you can also send your request directly through the hotel’s official website. Please make sure to enter the promo code FURSADOLOMITI in the comments section of your request.',
        'If you still experience any problems or do not receive a reply, please contact me directly. I will do my best to resolve the issue and send you a suitable proposal as soon as possible.',
      ],
    },
    it: {
      subject: 'La vostra richiesta di prenotazione è stata inviata',
      paragraphs: [
        'Grazie per aver scelto di inviare la vostra richiesta di prenotazione tramite il mio sito.',
        'L’hotel ha ricevuto la vostra richiesta e dovrebbe rispondervi entro 1–2 giorni, inviandovi le opzioni disponibili per la prenotazione.',
        'Se non ricevete una risposta, potete inviare la richiesta anche direttamente tramite il sito ufficiale dell’hotel. Vi prego di indicare il codice promo FURSADOLOMITI nel campo dei commenti della richiesta.',
        'Se il problema persiste e non ricevete ancora una risposta, potete contattarmi direttamente. Cercherò di risolvere il problema e di inviarvi una proposta adatta alle vostre esigenze il prima possibile.',
      ],
    },
  }[customerLocale]
  const customerSubject = `FursaDolomiti - ${customerCopy.subject}`
  const customerParagraphsHtml = customerCopy.paragraphs
    .map((paragraph) => `<p style="margin:0 0 18px;color:#3d342c;font-size:15px;line-height:23px;">${escapeHtml(paragraph).replaceAll('FURSADOLOMITI', '<strong>FURSADOLOMITI</strong>')}</p>`)
    .join('')
  const customerHtmlMessage = `
    <div style="margin:0;padding:32px 12px;background-color:#f1eadb;font-family:Arial,Helvetica,sans-serif;color:#08211f;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;margin:0 auto;border-collapse:separate;background-color:#fffaf0;border:1px solid #e5dbc6;border-radius:16px;box-shadow:0 14px 40px rgba(48,38,16,.12);overflow:hidden;">
        <tr>
          <td style="padding:28px 32px 30px;background-color:#175445;color:#fffaf0;">
            <div style="color:#d7e3d9;font-size:11px;line-height:16px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">FursaDolomiti</div>
            <div style="margin-top:13px;color:#fffaf0;font-size:26px;line-height:34px;font-weight:700;">${escapeHtml(customerCopy.subject)}</div>
          </td>
        </tr>
        ${
          safe.hotelImage
            ? `<tr><td style="background-color:#e8dfcc;"><img src="${safe.hotelImage}" width="640" alt="${safe.hotel}" style="display:block;width:100%;max-width:640px;height:auto;max-height:280px;object-fit:cover;border:0;"></td></tr>`
            : ''
        }
        <tr>
          <td style="padding:28px 32px 32px;">
            ${customerParagraphsHtml}
            <div style="margin-top:24px;padding-top:18px;border-top:1px solid #e8dfcc;color:#998d7b;font-size:11px;line-height:17px;text-align:center;">fursadolomiti.com</div>
          </td>
        </tr>
      </table>
    </div>`
  const customerMessage = customerCopy.paragraphs.join('\n\n')

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpEncryption === 'ssl',
      requireTLS: smtpEncryption === 'tls',
      auth: { user: smtpUsername, pass: smtpPassword },
    })

    await transporter.sendMail({
      from: `FursaDolomiti <${smtpFromEmail}>`,
      to: recipients,
      replyTo: normalizedEmail,
      subject,
      text: message,
      html: htmlMessage,
    })

    if (isWidgetTrackingEvent) {
      return response.status(200).json({ ok: true })
    }

    try {
      await transporter.sendMail({
        from: `FursaDolomiti <${smtpFromEmail}>`,
        to: normalizedEmail,
        replyTo: recipients[0],
        subject: customerSubject,
        text: customerMessage,
        html: customerHtmlMessage,
      })
    } catch (error) {
      console.error('Customer SMTP error:', error)
    }

    return response.status(200).json({ ok: true, promoCode: normalizedPromoCode })
  } catch (error) {
    console.error('Email request failed:', error)
    return response.status(502).json({ error: 'Email delivery failed' })
  }
}
