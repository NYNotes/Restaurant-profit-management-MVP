import type { CapacitorConfig } from '@capacitor/cli';

// This app is server-rendered (Server Actions, auth, a real database) — there is no
// static bundle to ship inside the app, so the WebView loads the live Next.js server
// instead of local files.
//
// For a physical iPhone, `localhost` means the phone itself, not this Mac — so this
// points at the Mac's LAN IP instead. That only works while the phone is on the same
// Wi-Fi as this Mac AND the dev server is running here. This IP can change (DHCP);
// re-run `ipconfig getifaddr en0` if the app stops loading.
//
// For App Store distribution, point `server.url` at a real HTTPS deployment instead
// (e.g. Vercel) and remove `cleartext`.
const config: CapacitorConfig = {
  appId: 'com.restaurantprofit.app',
  appName: 'Restaurant Profit',
  webDir: 'public',
  server: {
    url: 'http://192.168.0.121:3100',
    cleartext: true,
  },
};

export default config;
