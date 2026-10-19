import { defineConfig } from '@playwright/test'
// スマホ幅（iPhone 13 相当 390×844）で、この Mac の Chrome を使う（ブラウザの追加ダウンロード不要）
export default defineConfig({
  testDir: 'tests',
  timeout: 30000,
  retries: 0,
  reporter: [['list']],
  use: {
    channel: 'chrome',
    baseURL: 'http://127.0.0.1:8787',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
  webServer: {
    command: 'python3 -m http.server 8787 --bind 127.0.0.1',
    url: 'http://127.0.0.1:8787/index.html',
    reuseExistingServer: true,
    timeout: 15000,
  },
})
