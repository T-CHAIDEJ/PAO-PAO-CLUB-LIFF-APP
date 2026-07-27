import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

// Manually-bumped release number (package.json "version") rather than a git
// commit hash — lets everyone (DEV, this handoff package, UAT) agree on the
// same number regardless of which repo/commit history they're built from.
// Bump package.json's "version" before cutting a new handoff so the number
// showing in the app (see ProfileScreen footer) always matches what you
// intended to ship, instead of relying on git history that a handoff export
// doesn't carry.
const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
})
