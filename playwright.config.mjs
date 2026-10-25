import { defineConfig } from '@playwright/test'
const PORT = process.env.PW_PORT || '8787'   // 2つの試験を同時に回す時は別の番号に（受け口の取り合いを防ぐ）
// スマホ幅（iPhone 13 相当 390×844）で、この Mac の Chrome を使う（ブラウザの追加ダウンロード不要）
export default defineConfig({
  testDir: 'tests',
  timeout: 60000,   // 冷間起動でページの用意に30秒を超えることがある（周回6 東条）
  retries: 0,
  reporter: [['list']],
  use: {
    channel: 'chrome',
    baseURL: `http://127.0.0.1:${PORT}`,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
  webServer: {
    command: `node scripts/serve.mjs ${PORT}`,
    url: `http://127.0.0.1:${PORT}/index.html`,
    reuseExistingServer: true,
    timeout: 15000,
  },
})
