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
  const recipients = [
    ...new Set(
      [...recipientsValue.split(','), 'booking@fursadolomiti.com', 'sundevildi@gmail.com']
        .map((recipient) => recipient.trim().toLowerCase())
        .filter(Boolean),
    ),
  ]

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
  const emailImages = new Map([
    ['chalet-zenit', 'https://fursadolomiti.com/chalet-zenit/chalet-zenit1.png'],
    ['villa-carolina', 'https://fursadolomiti.com/villa-carolina/villa-carolina1.jpg'],
  ])
  const normalizedHotelImage = emailImages.get(normalizedHotelId) || String(hotelImage || '').trim()
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
  const hotelRecipients = new Map([
    ['chalet-zenit', 'info@chaletzenit.it'],
    ['villa-carolina', 'info@villa-carolina.com'],
  ])
  const bookingMode = String(request.body?.bookingMode || '').trim()
  const hotelRecipient = !isWidgetTrackingEvent && !['widget', 'redirect'].includes(bookingMode) && hotelRecipients.get(normalizedHotelId)
  const preferredDates = String(request.body?.preferredDates || '').trim()
  const guests = Number(request.body?.guests)
  const isBookingRequest = !isWidgetTrackingEvent && (['request', 'redirect'].includes(bookingMode) || Boolean(hotelRecipient))
  if (isBookingRequest) {
    if (
      !preferredDates ||
      preferredDates.length > 2000 ||
      !Number.isInteger(guests) ||
      guests < 1 ||
      guests > 100
    ) {
      return response.status(400).json({ error: 'Preferred dates and guest count are required' })
    }
  }

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
      !normalizedHotel
    ) {
      return response.status(400).json({ error: 'All fields are required' })
    }

    if (!emailPattern.test(normalizedEmail)) {
      return response.status(400).json({ error: 'Invalid email' })
    }
  }

  const emailLocale = normalizedLocale.toLowerCase().split('-')[0]
  const adminCopies = {
    ru: {
      title: 'Новая заявка на бронирование',
      tracking: 'Пользователь ушел в бронирование',
      hotel: 'Отель',
      provider: 'Провайдер',
      action: 'Действие',
      date: 'Дата заявки',
      url: 'URL перехода',
      selectionTitle: 'Что выбрал пользователь',
      selection: 'Выбор',
      locale: 'Язык сайта',
      timezone: 'Часовой пояс пользователя',
      utc: 'Время UTC',
      country: 'Страна',
      city: 'Город',
      interest: 'заинтересован(а) в',
      promo: 'Промокод',
      main: 'Главная информация',
      firstName: 'Имя',
      lastName: 'Фамилия',
      fullName: 'Имя и фамилия',
      reply: 'Ответить клиенту',
      context: 'Контекст заявки',
      location: 'Примерное местоположение',
      region: 'Регион',
      locationTimezone: 'Часовой пояс локации',
      notice: 'Служебное уведомление',
      dates: 'Желаемые даты и пожелания',
      guests: 'Количество гостей',
      unknown: 'Нет данных',
      geoNote:
        'Местоположение определяется приблизительно по данным инфраструктуры и может отличаться от фактического.',
    },
    en: {
      title: 'New booking request',
      tracking: 'User proceeded to booking',
      hotel: 'Hotel',
      provider: 'Provider',
      action: 'Action',
      date: 'Request date',
      url: 'Redirect URL',
      selectionTitle: 'User selection',
      selection: 'Selection',
      locale: 'Website language',
      timezone: 'User timezone',
      utc: 'Submitted at (UTC)',
      country: 'Country',
      city: 'City',
      interest: 'is interested in',
      promo: 'Promo code',
      main: 'Main information',
      firstName: 'First name',
      lastName: 'Last name',
      fullName: 'Full name',
      reply: 'Reply to guest',
      context: 'Request context',
      location: 'Approximate location',
      region: 'Region',
      locationTimezone: 'Location timezone',
      notice: 'Service notification',
      dates: 'Preferred dates and requests',
      guests: 'Number of guests',
      unknown: 'Not available',
      geoNote:
        'Location is estimated from infrastructure data and may differ from the actual location.',
    },
    it: {
      title: 'Nuova richiesta di prenotazione',
      tracking: 'L’utente è passato alla prenotazione',
      hotel: 'Hotel',
      provider: 'Fornitore',
      action: 'Azione',
      date: 'Data della richiesta',
      url: 'URL di destinazione',
      selectionTitle: 'Selezione dell’utente',
      selection: 'Selezione',
      locale: 'Lingua del sito',
      timezone: 'Fuso orario dell’utente',
      utc: 'Invio (UTC)',
      country: 'Paese',
      city: 'Città',
      interest: 'è interessato/a a',
      promo: 'Codice promozionale',
      main: 'Informazioni principali',
      firstName: 'Nome',
      lastName: 'Cognome',
      fullName: 'Nome e cognome',
      reply: 'Rispondi al cliente',
      context: 'Contesto della richiesta',
      location: 'Posizione approssimativa',
      region: 'Regione',
      locationTimezone: 'Fuso orario della posizione',
      notice: 'Notifica di servizio',
      dates: 'Date desiderate e richieste',
      guests: 'Numero di ospiti',
      unknown: 'Non disponibile',
      geoNote:
        'La posizione è stimata dai dati dell’infrastruttura e può differire da quella effettiva.',
    },
  }
  const adminCopy = adminCopies[emailLocale] || adminCopies.en
  const roleSubjects = {
    ru: {
      admin: 'Администратору · Новая заявка',
      guest: 'Гостю · Спасибо за вашу заявку',
      hotel: 'Отелю · Запрос на бронирование',
    },
    en: {
      admin: 'For the administrator · New request',
      guest: 'For our guest · Thank you for your request',
      hotel: 'For the hotel · Booking request',
    },
    it: {
      admin: 'All’amministratore · Nuova richiesta',
      guest: 'Al nostro ospite · Grazie per la vostra richiesta',
      hotel: 'All’hotel · Richiesta di prenotazione',
    },
  }
  const roleSubject = roleSubjects[emailLocale] || roleSubjects.en
  const fullName = `${normalizedFirstName} ${normalizedLastName}`
  const country = getHeader(request, 'x-vercel-ip-country') || adminCopy.unknown
  const region = getHeader(request, 'x-vercel-ip-country-region') || adminCopy.unknown
  const city = decodeHeader(getHeader(request, 'x-vercel-ip-city'))
  const locationTimezone = getHeader(request, 'x-vercel-ip-timezone') || adminCopy.unknown
  const subjectDate = normalizedSubmittedAt.slice(0, 10)
  const subject = `FursaDolomiti — ${roleSubject.admin} — ${normalizedHotel} — ${fullName} — ${subjectDate}`
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
            <div style="margin-top:13px;color:#fffaf0;font-size:27px;line-height:34px;font-weight:700;">${adminCopy.tracking}</div>
            <div style="margin-top:12px;color:#f5eedf;font-size:15px;line-height:22px;"><strong style="color:#ffffff;">${safe.hotel}</strong> · ${escapeHtml(normalizedWidgetProvider)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 8px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">
              ${row(adminCopy.hotel, safe.hotel, true)}
              ${isBookingRequest ? row(adminCopy.dates, escapeHtml(preferredDates), true) + row(adminCopy.guests, String(guests), true) : ''}
              ${row(adminCopy.provider, escapeHtml(normalizedWidgetProvider), true)}
              ${row(adminCopy.action, escapeHtml(normalizedWidgetAction || adminCopy.unknown))}
              ${row(adminCopy.date, safe.localDateTime, true)}
              ${row(adminCopy.url, escapeHtml(normalizedRedirectUrl || adminCopy.unknown))}
            </table>
          </td>
        </tr>
        ${
          safeWidgetSelection.length
            ? `<tr><td style="padding:18px 32px 8px;"><div style="margin-bottom:13px;color:#175445;font-size:18px;line-height:24px;font-weight:700;">${adminCopy.selectionTitle}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">${safeWidgetSelection
                .map((entry) => row(adminCopy.selection, entry))
                .join('')}</table></td></tr>`
            : ''
        }
        <tr>
          <td style="padding:18px 32px 32px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">
              ${row(adminCopy.locale, safe.locale)}
              ${row(adminCopy.timezone, safe.timezone)}
              ${row(adminCopy.utc, safe.submittedAt)}
              ${row(adminCopy.country, safe.country)}
              ${row(adminCopy.city, safe.city)}
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
            <div style="margin-top:13px;color:#fffaf0;font-size:27px;line-height:34px;font-weight:700;">${adminCopy.title}</div>
            <div style="margin-top:12px;color:#f5eedf;font-size:15px;line-height:22px;"><strong style="color:#ffffff;">${safe.fullName}</strong> ${adminCopy.interest} <strong style="color:#ffffff;">${safe.hotel}</strong></div>
            <div style="margin-top:18px;display:inline-block;padding:8px 12px;background-color:#fffaf0;border-radius:999px;color:#175445;font-size:12px;line-height:16px;font-weight:700;">${adminCopy.promo}: ${safe.promoCode}</div>
          </td>
        </tr>
        ${
          safe.hotelImage
            ? `<tr><td style="background-color:#e8dfcc;"><img src="${safe.hotelImage}" width="680" alt="${safe.hotel}" style="display:block;width:100%;max-width:680px;height:auto;max-height:300px;object-fit:cover;border:0;"></td></tr>`
            : ''
        }
        <tr>
          <td style="padding:28px 32px 8px;">
            <div style="margin-bottom:13px;color:#175445;font-size:18px;line-height:24px;font-weight:700;">${adminCopy.main}</div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">
              ${row(adminCopy.firstName, safe.firstName)}
              ${row(adminCopy.lastName, safe.lastName)}
              ${row('Email', `<span style="color:#08211f;text-decoration:none;">${safe.email}</span>`, true)}
              ${row(adminCopy.hotel, safe.hotel, true)}
              ${isBookingRequest ? row(adminCopy.dates, escapeHtml(preferredDates), true) + row(adminCopy.guests, String(guests), true) : ''}
              ${row(adminCopy.promo, safe.promoCode, true)}
              ${row(adminCopy.date, safe.localDateTime, true)}
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:16px;">
              <tr>
                <td bgcolor="#175445" style="border-radius:999px;">
                  <a href="mailto:${safe.email}?subject=${encodeURIComponent(`FursaDolomiti — ${normalizedHotel}`)}" style="display:inline-block;padding:12px 20px;color:#ffffff;text-decoration:none;font-size:14px;line-height:18px;font-weight:700;">${adminCopy.reply}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px 8px;">
            <div style="margin-bottom:13px;color:#175445;font-size:18px;line-height:24px;font-weight:700;">${adminCopy.context}</div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">
              ${row(adminCopy.locale, safe.locale)}
              ${row(adminCopy.timezone, safe.timezone)}
              ${row(adminCopy.utc, safe.submittedAt)}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px 32px;">
            <div style="margin-bottom:13px;color:#175445;font-size:18px;line-height:24px;font-weight:700;">${adminCopy.location}</div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">
              ${row(adminCopy.country, safe.country)}
              ${row(adminCopy.region, safe.region)}
              ${row(adminCopy.city, safe.city)}
              ${row(adminCopy.locationTimezone, safe.locationTimezone)}
            </table>
            <div style="margin-top:14px;padding:12px 14px;background-color:#f4edde;border-left:3px solid #c6a86a;color:#796e5f;font-size:11px;line-height:17px;">${adminCopy.geoNote}</div>
            <div style="margin-top:24px;padding-top:18px;border-top:1px solid #e8dfcc;color:#998d7b;font-size:11px;line-height:17px;text-align:center;">${adminCopy.notice} · fursadolomiti.com</div>
          </td>
        </tr>
      </table>
    </div>`
  const message = isWidgetTrackingEvent
    ? [
        adminCopy.tracking,
        '',
        `${adminCopy.hotel}: ${normalizedHotel}`,
        `${adminCopy.provider}: ${normalizedWidgetProvider || adminCopy.unknown}`,
        `${adminCopy.action}: ${normalizedWidgetAction || adminCopy.unknown}`,
        `${adminCopy.url}: ${normalizedRedirectUrl || adminCopy.unknown}`,
        '',
        ...(widgetSelectionText.length
          ? [adminCopy.selectionTitle, ...widgetSelectionText, '']
          : []),
        `${adminCopy.locale}: ${normalizedLocale}`,
        `${adminCopy.timezone}: ${normalizedTimezone}`,
        `${adminCopy.utc}: ${normalizedSubmittedAt}`,
        `${adminCopy.country}: ${country}`,
        `${adminCopy.region}: ${region}`,
        `${adminCopy.city}: ${city}`,
        `${adminCopy.locationTimezone}: ${locationTimezone}`,
      ].join('\n')
    : [
        adminCopy.title,
        '',
        `${adminCopy.firstName}: ${normalizedFirstName}`,
        `${adminCopy.lastName}: ${normalizedLastName}`,
        `${adminCopy.fullName}: ${fullName}`,
        `Email: ${normalizedEmail}`,
        `${adminCopy.hotel}: ${normalizedHotel}`,
        ...(isBookingRequest
          ? [`${adminCopy.dates}: ${preferredDates}`, `${adminCopy.guests}: ${guests}`]
          : []),
        `${adminCopy.promo}: ${normalizedPromoCode}`,
        '',
        `${adminCopy.locale}: ${normalizedLocale}`,
        `${adminCopy.date}: ${normalizedLocalDateTime}`,
        `${adminCopy.timezone}: ${normalizedTimezone}`,
        `${adminCopy.utc}: ${normalizedSubmittedAt}`,
        '',
        adminCopy.location,
        `${adminCopy.country}: ${country}`,
        `${adminCopy.region}: ${region}`,
        `${adminCopy.city}: ${city}`,
        `${adminCopy.locationTimezone}: ${locationTimezone}`,
      ].join('\n')
  const customerLocale = ['ru', 'en', 'it'].includes(normalizedLocale.toLowerCase().split('-')[0])
    ? normalizedLocale.toLowerCase().split('-')[0]
    : 'en'
  const copies = {
    ru: {
      subject: 'Ваша заявка получена',
      title: 'Заявка на бронирование',
      thanks: 'Спасибо за заявку! С вами скоро свяжутся.',
      note: 'Это подтверждение получения заявки, а не бронирования.',
      hotel: 'Отель',
      name: 'Имя и фамилия',
      email: 'Email',
      dates: 'Желаемые даты и пожелания',
      guests: 'Количество гостей',
    },
    en: {
      subject: 'Your request has been received',
      title: 'Booking request',
      thanks: 'Thank you for your request! We will contact you soon.',
      note: 'This confirms receipt of your request, not a booking.',
      hotel: 'Hotel',
      name: 'Full name',
      email: 'Email',
      dates: 'Preferred dates and requests',
      guests: 'Number of guests',
    },
    it: {
      subject: 'La vostra richiesta è stata ricevuta',
      title: 'Richiesta di soggiorno',
      thanks: 'Grazie per la vostra richiesta! Vi contatteremo presto.',
      note: 'Questa è una conferma di ricezione della richiesta, non della prenotazione.',
      hotel: 'Hotel',
      name: 'Nome e cognome',
      email: 'Email',
      dates: 'Date desiderate e richieste',
      guests: 'Numero di ospiti',
    },
  }
  const bookingEmail = (language, customer) => {
    const copy = copies[language] || copies.en
    const title = copy.title
    const fields = [
      [copy.hotel, normalizedHotel],
      [copy.name, fullName],
      ...(!customer ? [[copy.email, normalizedEmail]] : []),
      ...(isBookingRequest
        ? [
            [copy.dates, preferredDates],
            [copy.guests, String(guests)],
          ]
        : []),
    ]
    const detailRows = fields
      .map(([label, value]) =>
        row(escapeHtml(label), escapeHtml(value).replaceAll('\n', '<br>'), true),
      )
      .join('')
    const imageHtml = safe.hotelImage
      ? `<tr><td style="background-color:#e8dfcc;"><img src="${safe.hotelImage}" width="680" alt="${safe.hotel}" style="display:block;width:100%;max-width:680px;height:auto;max-height:300px;object-fit:cover;border:0;"></td></tr>`
      : ''
    const thanksHtml = customer
      ? `<p style="margin:0 0 14px;color:#175445;font-size:18px;line-height:26px;font-weight:700;">${escapeHtml(copy.thanks)}</p><p style="margin:0 0 24px;color:#756b5c;font-size:14px;line-height:22px;">${escapeHtml(copy.note)}</p>`
      : ''
    const lines = [
      ...(customer ? [copy.thanks, '', copy.note, ''] : []),
      `${copy.hotel}: ${normalizedHotel}`,
      `${copy.name}: ${fullName}`,
      ...(!customer ? [`${copy.email}: ${normalizedEmail}`] : []),
      ...(isBookingRequest ? [`${copy.dates}: ${preferredDates}`, `${copy.guests}: ${guests}`] : []),
    ]
    return {
      subject: `FursaDolomiti — ${(roleSubjects[language] || roleSubjects.en)[customer ? 'guest' : 'hotel']} — ${normalizedHotel}`,
      text: lines.join('\n'),
      html: `<div style="margin:0;padding:32px 12px;background-color:#f1eadb;font-family:Arial,Helvetica,sans-serif;color:#08211f;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:680px;margin:0 auto;border-collapse:separate;background-color:#fffaf0;border:1px solid #e5dbc6;border-radius:16px;box-shadow:0 14px 40px rgba(48,38,16,.12);overflow:hidden;">
    <tr><td style="padding:28px 32px 30px;background-color:#175445;color:#fffaf0;">
      <div style="color:#d7e3d9;font-size:11px;line-height:16px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">FursaDolomiti · Booking Desk</div>
      <div style="margin-top:13px;color:#fffaf0;font-size:27px;line-height:34px;font-weight:700;">${escapeHtml(title)}</div>
      <div style="margin-top:12px;color:#f5eedf;font-size:15px;line-height:22px;font-weight:700;">${safe.hotel}</div>
    </td></tr>
    ${imageHtml}
    <tr><td style="padding:28px 32px 32px;">
      ${thanksHtml}
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e8dfcc;border-radius:10px;">${detailRows}</table>
      <div style="margin-top:24px;padding-top:18px;border-top:1px solid #e8dfcc;color:#998d7b;font-size:11px;line-height:17px;text-align:center;">fursadolomiti.com</div>
    </td></tr>
  </table>
</div>`,
    }
  }
  const customerMail = bookingEmail(customerLocale, true)
  const hotelMail = bookingEmail(customerLocale === 'it' ? 'it' : 'en', false)

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

    // Send independently: a hotel failure must not prevent the customer copy.
    const deliver = async (to, replyTo, mail, label) => {
      try {
        const result = await transporter.sendMail({
          from: `FursaDolomiti <${smtpFromEmail}>`,
          to,
          replyTo,
          ...mail,
        })
        if (!result.accepted?.length || result.rejected?.length)
          throw new Error('SMTP recipient was not accepted')
        return true
      } catch (error) {
        console.error(`${label} SMTP error:`, error)
        return false
      }
    }
    const [customerEmailSent, hotelEmailSent] = await Promise.all([
      deliver(normalizedEmail, hotelRecipient || smtpFromEmail, customerMail, 'Customer'),
      hotelRecipient
        ? deliver(
            [...new Set([hotelRecipient, ...recipients])],
            normalizedEmail,
            hotelMail,
            'Hotel',
          )
        : Promise.resolve(null),
    ])
    return response
      .status(200)
      .json({ ok: true, promoCode: normalizedPromoCode, customerEmailSent, hotelEmailSent })
  } catch (error) {
    console.error('Email request failed:', error)
    return response.status(502).json({ error: 'Email delivery failed' })
  }
}
