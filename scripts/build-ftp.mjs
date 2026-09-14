import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'

if (!existsSync('php/email-config.php')) {
  throw new Error('Create php/email-config.php from php/email-config.example.php before building for FTP.')
}

// Force the same-origin PHP endpoint for this deployment only.
execFileSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, VITE_BOOKING_EMAIL_ENDPOINT: '/php/send-email.php' },
})
const output = 'dist-ftp'
rmSync(output, { recursive: true, force: true })
mkdirSync(output, { recursive: true })
cpSync('dist', `${output}/fursa-release`, { recursive: true })
mkdirSync(`${output}/fursa-release/php`, { recursive: true })
cpSync('php/send-email.php', `${output}/fursa-release/php/send-email.php`)
cpSync('php/email-config.php', `${output}/fursa-release/php/email-config.php`)
cpSync('php/.htaccess', `${output}/fursa-release/php/.htaccess`)
cpSync('deployment/.htaccess', `${output}/.htaccess`)
cpSync('deployment/README.md', `${output}/README.md`)
console.log('FTP package ready: dist-ftp/fursa-release + dist-ftp/.htaccess. Upload .htaccess last.')
