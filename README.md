# THE SYSTEM

> *"You have acquired the qualifications to be a Player."*

A **star-themed self-improvement RPG** for Android. THE SYSTEM turns your
real-life habits into an RPG progression loop: complete your daily **disciplines**,
earn **XP**, climb the hunter **ranks** (E → D → C → B → A → S), open **mandate**
loot chests, and watch your chosen **star** brighten — gaining a glow halo, ring,
orbiting motes, and finally a full corona — as you ascend. The interface wears a
warm charcoal-and-coral "System" aura with constellation iconography throughout.

It is a single-player, fully offline app — all data lives in a local SQLite database
on the device. No account, no server, no cloud.

---

## What it does

- **Disciplines** — Your daily quests across eight life domains (RISE, REST, NOURISH,
  SILENCE, FORGE, KNOWLEDGE, PRESENCE, RITUAL). Each has a difficulty, an XP gain for
  completion and an XP loss for failure. You can use the defaults or add custom ones.
- **XP & Levels** — Completing disciplines grants XP and raises your global level.
  Missing them costs XP. A **level-up splash** fires when you cross a threshold.
- **Ranks (E → S)** — Hitting level milestones promotes your hunter rank. Each rank
  re-themes the whole app (color aura escalates) and triggers a **rank promotion
  splash**; reaching **S-Rank** plays a full cutscene.
- **Your star** — At awakening you **select your star**: **Antares** (red supergiant —
  relentless), **Polaris** (the fixed north — steady), or **Altair** (swift eagle star).
  Your star is your avatar, and it visibly evolves with your rank: an E-rank star is a
  dim ember; by S-rank it pulses/spins with a glow halo, ring, orbiting motes, and a
  full corona. The star also drives your notification banner.
- **Mandates** — Bronze/Silver/Gold loot chests granted for milestones. Open them to
  reveal cosmetic loot (weapons, armor, crowns, titles, backgrounds, accessories).
- **Shield** — A no-admin focus session that locks you into a deep-work overlay with
  an escalating rank aura. Helps you protect SILENCE/FORGE time.
- **Midnight engine** — At local midnight the day rolls over: unmet disciplines are
  scored, streaks update, and the next day's quests reset.
- **Native rich notifications** — Scheduled reminders render as Android BigPicture
  notifications with your class avatar banner and large icon, plus interactive
  actions. Exact-alarm scheduling with an Android 14 fallback.

### Main screens

| Tab | Purpose |
|-----|---------|
| **Command** | Today's disciplines — log completions and failures |
| **Ascend** | Rank/level progression, the path to S-Rank |
| **Mirror** | Your star avatar, equipped cosmetics, mood state |
| **Codex** | Lore, discipline reference, unlock catalogue |
| **Archive** | History and stats of past performance |

---

## Tech stack

- **React Native 0.85** + **React 19** on **Expo SDK 56** (bare workflow — the
  native `android/` project is committed to git)
- **Zustand** state, **expo-sqlite** persistence
- **react-native-reanimated** + **react-native-svg** for FX (ambient embers, grid
  glow, radial aura, the SVG star avatars and constellation tab icons)
- Custom native Android modules (rich notifications, usage stats, shield)
- **Lora** serif applied as the single typeface app-wide

---

## Run it on your phone

Two paths. **Path A** is for actively developing on a phone you have plugged in.
**Path B** builds a standalone APK file you can copy to any phone and install — no
dev tools needed on the phone.

> ⚠️ This app uses custom native modules, so **Expo Go will not work**. You must use
> a development build (Path A) or a release APK (Path B).

### Prerequisites (build machine)

- **Node.js 18+** and npm
- **Android Studio** with the Android SDK
  (default SDK path on this machine: `C:\Users\User\AppData\Local\Android\Sdk`)
- **JDK 21** — the build is pinned to Android Studio's bundled **JBR 21** via
  `android/gradle.properties` (`org.gradle.java.home=...\Android Studio\jbr`).
  A newer system JDK (e.g. 25) will fail the native CMake configure step — keep that
  pin in place.

Install dependencies first:

```powershell
cd the-system
npm install
```

---

### Path A — USB development build (run from source)

For developing on your own phone with live reload.

1. On the phone: enable **Developer options** → **USB debugging**, then plug it in
   over USB and accept the debugging prompt.
2. Confirm the device is visible:
   ```powershell
   adb devices
   ```
3. Build, install, and launch on the connected device:
   ```powershell
   cd the-system
   npx expo run:android
   ```
   First build takes a while (it compiles the native modules). The app installs and
   opens automatically, and the Metro dev server starts for live reload.

   This default build is the **debug** variant — its JS loads from the Metro dev
   server, so it only runs while your computer is running Metro (USB connected).
   Unplugged, it hangs on the splash. To install a **standalone** build over USB that
   runs on its own (JS bundled in, survives unplug/reboot), add `--variant release`:
   ```powershell
   npx expo run:android --variant release
   ```
   Use this when you want the real app on your phone for daily use but still prefer the
   one-command USB install over building an APK by hand (Path B).

> If you change the **icon or splash** assets or `app.json`, regenerate native
> resources before rebuilding — run `npx expo prebuild --platform android`
> (**never** `--clean`; it wipes the committed custom native modules), then
> `npx expo run:android` again.

---

### Path B — Release APK (sideload onto any phone)

Produces a single installable `.apk` file. The release build is signed with the
project's debug keystore, so it installs on any phone without extra signing setup
(suitable for personal use, not for the Play Store).

1. Build the release APK:
   ```powershell
   cd the-system/android
   ./gradlew assembleRelease
   ```
2. The APK lands at:
   ```
   the-system/android/app/build/outputs/apk/release/app-release.apk
   ```
3. Get the APK onto the phone — copy it over USB, or:
   ```powershell
   adb install -r the-system/android/app/build/outputs/apk/release/app-release.apk
   ```
   To install manually instead, transfer the file (USB / cloud / email), then on the
   phone tap it and allow **Install unknown apps** for your file manager when
   prompted.
4. Launch **THE SYSTEM** from the app drawer.

> The app requests notification and exact-alarm permissions on first run — grant them
> so scheduled discipline reminders fire on time.

> **Updating without losing progress:** all builds (debug and release) are signed with
> the same project debug keystore, so reinstalling over an existing install with
> `adb install -r ...` (or tapping a newer APK) **keeps your SQLite data** — hero,
> XP, rank, streaks, and history all persist across updates. Only a full
> **uninstall** or **Clear data** wipes progress.

> **Note for live development:** a **debug** build (Path A) loads its JS from the
> Metro dev server, so it needs your computer running Metro (USB + `adb reverse
> tcp:8081 tcp:8081`) on every launch — unplugged, it hangs on the splash. For a
> phone you use normally, install a **release** APK (Path B): the JS is bundled into
> the APK, so it runs standalone.

---

## Backup & restore your progress (Export / Import)

All progress lives in a local SQLite database. **Settings → Data** has two JSON tools:

- **Export data (JSON)** — dumps your full save (hero, disciplines, logs, streaks,
  mandates, cosmetics, settings) to a `.json` file you can share off-device for backup.
- **Import data (JSON)** — pick a previously exported file to restore. ⚠️ Import
  **overwrites ALL current data** (a confirm dialog guards it). Runs in a transaction,
  so a malformed file aborts cleanly and leaves your current save untouched.

This is the supported way to **carry progress across a fresh install or repair bad
data**. Typical recovery flow after updating a buggy build:

1. In the old app: **Settings → Export data** → save the `.json` somewhere safe.
2. (Optional) Edit the JSON on a PC — e.g. correct `hero[0].global_xp` or add a missing
   log row — keeping the column names intact. Bad JSON is rejected on import.
3. Install the new release build (Path B) and finish onboarding.
4. **Settings → Import data** → pick the file → confirm. Done.

> The exporter caps at the most recent **1000 log rows**. For a 180-day journey with a
> handful of disciplines that's far more than enough.

---

## Permissions

| Permission | Why |
|-----------|-----|
| `POST_NOTIFICATIONS` | Show discipline reminders and milestone alerts |
| `SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM` | Fire reminders at the exact scheduled time |
| `RECEIVE_BOOT_COMPLETED` | Re-arm scheduled notifications after a reboot |

---

## Project layout

```
the-system/
├─ src/
│  ├─ screens/        App screens (Command, Ascend, Mirror, Codex, Archive, …)
│  ├─ engine/         XP, mandate, and midnight roll-over logic
│  ├─ store/          Zustand global state (useSystemStore)
│  ├─ db/             SQLite schema, migrations, queries
│  ├─ components/     Avatars, UI, particles, FX
│  ├─ notifications/  Scheduling + native rich-notification setup
│  ├─ native/         JS bridges to custom Android modules
│  └─ theme/          Rank themes, global font
├─ android/           Committed native project (bare workflow)
└─ app.json           Expo config
```

---

*Arise.*
