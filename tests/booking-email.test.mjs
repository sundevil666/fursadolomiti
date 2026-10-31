import assert from 'node:assert/strict'
import test from 'node:test'
import nodemailer from 'nodemailer'
import handler from '../api/send-email.js'
Object.assign(process.env, {
  SMTP_HOST: 'test.invalid',
  SMTP_USERNAME: 'sender@example.com',
  SMTP_PASSWORD: 'mock',
  EMAIL_RECIPIENTS: 'fursa@example.com,sundevil@example.com',
})
const body = {
  hotelId: 'chalet-zenit',
  hotel: 'Chalet Zenit',
  firstName: 'Test',
  lastName: 'Guest',
  email: 'guest@example.com',
  preferredDates: 'January <flexible>',
  guests: 2,
  promoCode: 'FURSADOLOMITI',
  hotelImage: 'http://127.0.0.1:5180/chalet-zenit/chalet-zenit1.png',
}
async function run(locale, failCustomer = false, overrides = {}) {
  const sent = []
  nodemailer.createTransport = () => ({
    sendMail: async (mail) => {
      sent.push(mail)
      if (failCustomer && mail.to === body.email) throw new Error('Simulated SMTP rejection')
      return { accepted: Array.isArray(mail.to) ? mail.to : [mail.to], rejected: [] }
    },
  })
  let result, status
  await handler(
    { method: 'POST', headers: {}, body: { ...body, locale, ...overrides } },
    {
      status(code) {
        status = code
        return this
      },
      json(value) {
        result = value
      },
    },
  )
  return { sent, result, status }
}
test('separate admin, simple hotel and localized customer emails', async () => {
  for (const [locale, thanks, adminTitle] of [
    ['ru', 'Спасибо за заявку', 'Новая заявка на бронирование'],
    ['en', 'Thank you for your request', 'New booking request'],
    ['it', 'Grazie per la vostra richiesta', 'Nuova richiesta di prenotazione'],
  ]) {
    const { sent, result } = await run(locale)
    assert.deepEqual(sent[0].to, [
      'fursa@example.com',
      'sundevil@example.com',
      'booking@fursadolomiti.com',
      'sundevildi@gmail.com',
    ])
    const hotel = sent.find(
      (mail) => Array.isArray(mail.to) && /For the hotel|All’hotel/.test(mail.subject),
    )
    const customer = sent.find((mail) => mail.to === body.email)
    assert.match(sent[0].html, new RegExp(adminTitle))
    assert.match(sent[0].text, new RegExp(adminTitle))
    assert.match(hotel.html, locale === 'it' ? /Richiesta di soggiorno/ : /Booking request/)
    assert.match(hotel.text, locale === 'it' ? /Date desiderate e richieste/ : /Preferred dates and requests/)
    assert.doesNotMatch(hotel.text, /Спасибо|Thank you|Grazie/)
    assert.deepEqual(hotel.to, sent[0].to)
    assert.ok(sent.every(mail => mail.subject.startsWith('[Vercel] ')))
    assert.ok(sent.every(mail => !(Array.isArray(mail.to) ? mail.to : [mail.to]).includes('info@chaletzenit.it')))
    assert.deepEqual(sent[3].to, sent[0].to)
    assert.equal(sent[3].html, customer.html)
    assert.ok(hotel)
    assert.ok(customer)
    assert.ok(!customer.html.includes(body.email))
    assert.ok(!customer.text.includes(body.email))
    assert.ok(hotel.html.includes(body.email))
    assert.ok(sent[0].html.includes(body.email))
    for (const mail of sent) {
      assert.match(mail.html, /https:\/\/fursadolomiti.com\/chalet-zenit\/chalet-zenit1.png/)
      assert.doesNotMatch(mail.html, /127\.0\.0\.1/)
    }
    const roleLabels = {
      ru: ['Администратору', 'Гостю'],
      en: ['For the administrator', 'For our guest'],
      it: ['All’amministratore', 'Al nostro ospite'],
    }[locale]
    assert.ok(sent[0].subject.includes(roleLabels[0]))
    assert.ok(customer.subject.includes(roleLabels[1]))
    assert.match(hotel.subject, locale === 'it' ? /All’hotel · Richiesta di prenotazione/ : /For the hotel/)
    assert.equal(new Set([sent[0].subject, customer.subject, hotel.subject]).size, 3)
    assert.match(customer.text, new RegExp(thanks))
    for (const mail of [hotel, customer]) {
      assert.match(mail.text, /January <flexible>/)
      assert.doesNotMatch(mail.text, /timezone|geolocation|IP address/i)
      assert.match(mail.html, /&lt;flexible&gt;/)
    }
    assert.equal(result.customerEmailSent, true)
  }
})
test('customer failure is reported without losing the accepted request', async () => {
  const { result, status } = await run('en', true)
  assert.equal(status, 200)
  assert.equal(result.customerEmailSent, false)
})

test('Vercel administrators receive all three roles and guest copies are deduplicated', async () => {
  const savedRecipients = process.env.EMAIL_RECIPIENTS
  try {
    process.env.EMAIL_RECIPIENTS = 'sundevildi@gmail.com, BOOKING@FURSADOLOMITI.COM'
    for (const email of [
      'booking@fursadolomiti.com',
      'sundevildi@gmail.com',
      'guest@example.com',
    ]) {
      const { sent } = await run('ru', false, { email })
      assert.equal(sent.length, 4)
      for (const admin of ['booking@fursadolomiti.com', 'sundevildi@gmail.com']) {
        const received = sent.filter((mail) =>
          (Array.isArray(mail.to) ? mail.to : [mail.to]).includes(admin),
        )
        assert.equal(received.length, 3)
        for (const mail of sent) {
          if (Array.isArray(mail.to)) assert.ok(mail.to.filter((to) => to === admin).length <= 1)
        }
      }
    }
  } finally {
    process.env.EMAIL_RECIPIENTS = savedRecipients
  }
})

test('widget and link submissions send only admin and guest mail in the selected language', async () => {
  for (const bookingMode of ['widget', 'redirect']) {
    for (const locale of ['ru', 'en', 'it']) {
      const { sent, status, result } = await run(locale, false, {
        bookingMode, promoCode: '',
        ...(bookingMode === 'widget' ? { preferredDates: '', guests: 0 } : {}),
      })
      assert.equal(status, 200)
      assert.equal(sent.length, 2)
      assert.equal(result.hotelEmailSent, null)
      assert.equal(result.customerEmailSent, true)
      assert.ok(sent.every(mail => !(Array.isArray(mail.to) && /For the hotel|All’hotel/.test(mail.subject))))
      if (bookingMode === 'redirect') {
        assert.ok(sent.every(mail => mail.text.includes(body.preferredDates)))
      } else {
        assert.ok(sent.every(mail => !mail.text.includes(body.preferredDates)))
      }
    }
  }
})

test('redirect requests validate dates and guest count even without a hotel recipient', async () => {
  for (const fields of [{ preferredDates: '' }, { guests: 0 }, { guests: 1.5 }, { guests: 101 }]) {
    const { status, sent } = await run('en', false, { hotelId: 'luna-mondschein', bookingMode: 'redirect', ...fields })
    assert.equal(status, 400)
    assert.equal(sent.length, 0)
  }
})

test('Vercel Invictus requests route the hotel template to admins and retain the destination in admin notes', async () => {
  for (const [locale, note] of [
    ['ru', 'Email отеля: info@chaletinvictus.it'],
    ['en', 'Hotel email: info@chaletinvictus.it'],
    ['it', 'Email della struttura: info@chaletinvictus.it'],
  ]) {
    const { status, sent, result } = await run(locale, false, {
      hotelId: 'chalet-invictus',
      hotel: 'Chalet Invictus',
      bookingMode: 'request',
    })
    assert.equal(status, 200)
    assert.equal(sent.length, 4)
    assert.equal(result.hotelEmailSent, true)
    const hotel = sent.find((mail) => Array.isArray(mail.to) && /Отелю|For the hotel|All’hotel/.test(mail.subject))
    assert.ok(hotel)
    assert.equal(hotel.replyTo, body.email)
    assert.ok(!hotel.html.includes(note))
    assert.ok(!hotel.text.includes(note))
    assert.ok(sent[0].html.includes('info@chaletinvictus.it'))
    assert.ok(sent[0].text.includes(note))
    const guest = sent.find((mail) => mail.to === body.email)
    assert.ok(guest)
    assert.ok(!guest.html.includes(note))
    assert.ok(!guest.text.includes(note))
    const existing = await run(locale)
    assert.ok(!existing.sent[0].html.includes(note))
    assert.ok(!existing.sent[0].text.includes(note))
  }
})

test('admin mail identifies each configured email destination', async () => {
  for (const [hotelId, address] of [
    ['chalet-zenit', 'info@chaletzenit.it'],
    ['villa-carolina', 'info@villa-carolina.com'],
    ['chalet-invictus', 'info@chaletinvictus.it'],
  ]) {
    const { sent, status } = await run('en', false, { hotelId, bookingMode: 'request' })
    assert.equal(status, 200)
    assert.ok(sent[0].text.includes(`Hotel email: ${address}`))
    assert.ok(sent[0].html.includes(address))
    assert.ok(sent.every(mail => !(Array.isArray(mail.to) ? mail.to : [mail.to]).includes(address)))
  }
})

test('admin mail explains widget, redirect and missing email without leaking markup', async () => {
  for (const [overrides, expected] of [
    [{ bookingMode: 'widget', widgetProvider: 'Booking Südtirol', preferredDates: '', guests: 0 }, ['Booking through a widget', 'Booking Südtirol']],
    [{ bookingMode: 'redirect', redirectUrl: 'https://www.hoteldiamant.it/?test=<value>' }, ['Redirect to booking website', 'https://www.hoteldiamant.it/?test=<value>']],
    [{ eventType: 'widget_redirect', widgetProvider: 'BookingExpert', redirectUrl: 'https://example.com/booking' }, ['Booking through a widget', 'BookingExpert']],
    [{ bookingMode: 'request', hotelId: 'unknown-hotel' }, ['Email request', 'No hotel email provided.']],
  ]) {
    const { sent, status } = await run('en', false, overrides)
    assert.equal(status, 200)
    for (const value of expected) assert.ok(sent[0].text.includes(value))
    assert.ok(!sent[0].html.includes('<value>'))
    assert.ok(sent[0].html.includes('Booking method'))
  }
})
