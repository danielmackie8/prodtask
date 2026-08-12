# TALIN — iOS app

The iOS app is your existing web app (including the `MobileApp` mobile view
you designed), wrapped in a native shell via [Capacitor](https://capacitorjs.com/).
There's no separate UI to maintain — the app ships a built copy of `src/App.jsx`
and looks and behaves exactly like the web app.

(There's also an earlier `mobile/` folder in this repo — a from-scratch React
Native rewrite that was tried first and works, but doesn't match the web
app's design. It's kept around unused. This Capacitor setup is the one to use.)

## How it works

- `capacitor.config.json` points Capacitor at `dist/` (the Vite build output)
- The app **bundles** that build into the binary — no server needs to be running,
  the app works offline except for the parts that inherently need network
  (Supabase sync, the AI Assistant's calls to Anthropic)
- To ship a UI change, you rebuild the web app and re-sync into the native
  project, then rebuild/resubmit through Xcode — same as any app store update

## One-time setup

### 1. Install dependencies
```bash
npm install
```

### 2. Set your Anthropic key
```bash
cp .env.example .env    # if .env.example doesn't exist, just create .env directly
```
Set (note the `VITE_` prefix, not `EXPO_PUBLIC_` — that naming is specific to
the unused `mobile/` React Native project, this is the web app's own convention):
```
VITE_ANTHROPIC_KEY=sk-ant-your-real-key-here
```

### 3. Google sign-in redirect
Already configured — if you went through the `mobile/` walkthrough earlier,
`talin://auth-callback` is already in Supabase's allowed Redirect URLs, and
this app reuses the same custom URL scheme. Nothing to do here.

If you're setting this up fresh (skipped the `mobile/` app entirely): add
`talin://auth-callback` in Supabase Dashboard → **Authentication → URL
Configuration → Redirect URLs**.

### 4. Build the web app and sync it into the native project
```bash
npm run ios:sync
```
This runs `vite build` then copies the result into `ios/App/App/public` and
updates native plugin config. Run this again any time you change `src/App.jsx`
and want the native app to pick it up.

### 5. Open in Xcode
```bash
npm run ios:open
```
(No CocoaPods step needed — this Capacitor version uses Swift Package Manager,
which Xcode resolves automatically on first open.)

### 6. Set your signing team
In Xcode: select **App** in the navigator → **Signing & Capabilities** tab →
check "Automatically manage signing" → choose your Team.

### 7. Run it
Pick a simulator or your device from the scheme dropdown, then ▶ (`Cmd+R`).

Unlike the React Native app, there's no separate bundler process to keep
running — the JS is already built into the app, so this should just launch
directly.

## Making changes later

1. Edit `src/App.jsx` as usual
2. `npm run ios:sync`
3. Back in Xcode, ▶ to rebuild and relaunch

## Icons / branding

Source images live in `assets/icon.png` (1024×1024) and `assets/splash.png`
(2732×2732) — the same TALIN mark used everywhere else. To regenerate the
native icon/splash files after changing those sources:
```bash
npx capacitor-assets generate --ios
```
