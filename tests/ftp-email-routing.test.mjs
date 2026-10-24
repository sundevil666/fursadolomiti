import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

// Run after npm run build:ftp. Exercise the actual generated PHP handler with SMTP mocked.
function deliver(handlerPath, email, hotelId, eventType = '', overrides = {}) {
  let source = readFileSync(handlerPath, 'utf8')
  const start = source.indexOf('function sendSmtpEmail(')
  const end = source.indexOf("if (($_SERVER['REQUEST_METHOD']", start)
  assert.ok(start > 0 && end > start)
  source = source.slice(0, start) + `
function sendSmtpEmail(array $config, array $recipients, string $subject, string $text, string $html, ?string $replyTo = null): array {
    $GLOBALS['testMails'][] = compact('recipients', 'subject', 'text', 'html');
    return ['ok' => true];
}
$_SERVER['REQUEST_METHOD'] = 'POST';
` + source.slice(end)
  source = source.replace("file_get_contents('php://input')", "file_get_contents('php://stdin')")
  source = source.replace('echo json_encode($payload,', "echo json_encode(array_merge($payload, ['mails' => $GLOBALS['testMails'] ?? []]),")
  const directory = mkdtempSync(join(tmpdir(), 'ftp-email-test-'))
  try {
    const file = join(directory, 'send-email.php')
    writeFileSync(file, source)
    return JSON.parse(execFileSync('php', [file], {
      encoding: 'utf8',
      input: JSON.stringify({ email, hotelId, hotel: hotelId, eventType, widgetProvider: 'Test provider', firstName: 'Test', lastName: 'Guest', promoCode: 'TEST', preferredDates: 'Flexible dates', guests: 2, locale: 'en', ...overrides }),
      env: { ...process.env, SMTP_HOST: 'test.invalid', SMTP_USERNAME: 'sender@example.com', SMTP_FROM_EMAIL: 'sender@example.com', SMTP_PASSWORD: 'mock', SMTP_PORT: '465', SMTP_ENCRYPTION: 'ssl', EMAIL_RECIPIENTS: ' SUNDEVILDI@GMAIL.COM ,extra-admin@example.com' },
    })).mails
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

test('FTP artifact excludes Sundevil from admin and hotel copies but preserves guest delivery', () => {
  for (const [id, hotel] of [['chalet-zenit', 'info@chaletzenit.it'], ['villa-carolina', 'info@villa-carolina.com']]) {
    for (const email of ['guest@example.com', 'sundevildi@gmail.com']) {
      const mails = deliver('dist-ftp/fursa-release/php/send-email.php', email, id)
      assert.equal(mails.length, 3)
      assert.deepEqual(mails[0].recipients, ['extra-admin@example.com', 'booking@fursadolomiti.com'])
      assert.deepEqual(mails[1].recipients, [email])
      assert.deepEqual(mails[2].recipients, [hotel, 'extra-admin@example.com', 'booking@fursadolomiti.com'])
      assert.equal(mails.filter(mail => mail.recipients.includes('sundevildi@gmail.com')).length, email === 'sundevildi@gmail.com' ? 1 : 0)
    }
  }
  const tracking = deliver('dist-ftp/fursa-release/php/send-email.php', '', 'test-hotel', 'widget_redirect')
  assert.equal(tracking.length, 1)
  assert.ok(!tracking[0].recipients.includes('sundevildi@gmail.com'))
})

test('FTP build leaves the PHP source policy unchanged', () => {
  const mails = deliver('php/send-email.php', 'guest@example.com', 'chalet-zenit')
  assert.ok(mails[0].recipients.includes('sundevildi@gmail.com'))
  assert.ok(mails[2].recipients.includes('sundevildi@gmail.com'))
})


test('PHP and FTP apply locale and delivery rules to all three booking modes', () => {
  for (const path of ['php/send-email.php', 'dist-ftp/fursa-release/php/send-email.php']) {
    for (const locale of ['ru', 'en', 'it']) {
      const labels = { ru: ['Администратору', 'Гостю'], en: ['For the administrator', 'For our guest'], it: ['All’amministratore', 'Al nostro ospite'] }[locale]
      for (const bookingMode of ['request', 'redirect', 'widget']) {
        const mails = deliver(path, 'guest@example.com', 'chalet-zenit', '', { locale, bookingMode, promoCode: '', ...(bookingMode === 'widget' ? { preferredDates: '', guests: 0 } : {}) })
        assert.equal(mails.length, bookingMode === 'request' ? 3 : 2)
        assert.ok(mails[0].subject.includes(labels[0]))
        assert.ok(mails[1].subject.includes(labels[1]))
        if (bookingMode === 'request') {
          assert.ok(mails[2].subject.includes(locale === 'it' ? 'All’hotel' : 'For the hotel'))
          assert.ok(mails[2].text.includes(locale === 'it' ? 'Date desiderate e richieste' : 'Preferred dates and requests'))
        }
        if (bookingMode !== 'widget') assert.ok(mails.every(mail => mail.text.includes('Flexible dates')))
      }
    }
  }
})
