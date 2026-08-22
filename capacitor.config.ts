import type { CapacitorConfig } from '@capacitor/cli';

// This app is server-rendered (Server Actions, auth, a real database) — there is no
// static bundle to ship inside the app, so the WebView loads the live Next.js server
// instead of local files. For the iOS Simulator, `localhost` resolves back to this
// Mac, so pointing at the dev server here is enough to run/demo the real app.
// For a physical device or App Store build, point `server.url` at a real HTTPS
// deployment instead (e.g. Vercel) and remove `cleartext`.
const config: CapacitorConfig = {
  appId: 'com.restaurantprofit.app',
  appName: 'Restaurant Profit',
  webDir: 'public',
  server: {
    url: 'http://localhost:3100',
    cleartext: true,
  },
};

export default config;
