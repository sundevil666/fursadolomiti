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
      (mail) => Array.isArray(mail.to) && mail.to.includes('info@chaletzenit.it'),
    )
    const customer = sent.find((mail) => mail.to === body.email)
    assert.match(sent[0].html, new RegExp(adminTitle))
    assert.match(sent[0].text, new RegExp(adminTitle))
    assert.match(hotel.html, locale === 'it' ? /Richiesta di soggiorno/ : /Booking request/)
    assert.match(hotel.text, locale === 'it' ? /Date desiderate e richieste/ : /Preferred dates and requests/)
    assert.doesNotMatch(hotel.text, /Спасибо|Thank you|Grazie/)
    assert.deepEqual(hotel.to, ['info@chaletzenit.it', ...sent[0].to])
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

test('both administrators receive two roles, plus the guest role only when entered in the form', async () => {
  const savedRecipients = process.env.EMAIL_RECIPIENTS
  try {
    process.env.EMAIL_RECIPIENTS = 'sundevildi@gmail.com, BOOKING@FURSADOLOMITI.COM'
    for (const email of [
      'booking@fursadolomiti.com',
      'sundevildi@gmail.com',
      'guest@example.com',
    ]) {
      const { sent } = await run('ru', false, { email })
      assert.equal(sent.length, 3)
      for (const admin of ['booking@fursadolomiti.com', 'sundevildi@gmail.com']) {
        const received = sent.filter((mail) =>
          (Array.isArray(mail.to) ? mail.to : [mail.to]).includes(admin),
        )
        assert.equal(received.length, email === admin ? 3 : 2)
        for (const mail of sent) {
          if (Array.isArray(mail.to)) assert.equal(mail.to.filter((to) => to === admin).length, 1)
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
      assert.ok(sent.every(mail => !(Array.isArray(mail.to) && mail.to.includes('info@chaletzenit.it'))))
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
