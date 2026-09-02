import type { CapacitorConfig } from '@capacitor/cli';

// This app is server-rendered (Server Actions, auth, a real database) — there is no
// static bundle to ship inside the app, so the WebView loads the live Next.js server
// instead of local files.
//
// Points at the real production deployment (Vercel) — works from anywhere, not just
// this Mac's Wi-Fi, and needs no `cleartext` exception since it's HTTPS.
const config: CapacitorConfig = {
  appId: 'com.restaurantprofit.app',
  appName: 'Restaurant Profit',
  webDir: 'public',
  server: {
    url: 'https://restaurant-profit-app.vercel.app',
  },
};

export default config;
