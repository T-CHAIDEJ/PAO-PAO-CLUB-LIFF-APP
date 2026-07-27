import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'

// Lets the running app show exactly which commit it was built from (see
// ProfileScreen footer) — the only reliable way to confirm a deploy actually
// picked up the latest push, since Vercel/browser caching can otherwise make
// an old build look current. Falls back gracefully if git isn't available
// (e.g. a source-only build environment with no .git folder).
function getCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_COMMIT__: JSON.stringify(getCommitHash()),
    __APP_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
})
