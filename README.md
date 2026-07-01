# Forge — Training

A build-your-own-workout app: a **Vue 3 web core wrapped by Capacitor** for iOS + Android (the same
code also runs in a browser via `bun run dev`). Works fully offline, re-brandable via design tokens.
Implements the **Forge** design (`docs/design/raw/Forge.dc.html`) on the architecture confirmed in
`docs/superpowers/specs/2026-07-01-training-app-design.md`.

## Develop (web)

```bash
bun install
bun run dev        # http://localhost:5173 — fastest iteration loop
bun run build      # web build → dist/
bun run preview    # serve the build
bun run test       # domain unit tests (vitest)
bun run typecheck  # vue-tsc
```

## Native (Capacitor)

The native projects live in `android/` and `ios/`; `dist/` is the web bundle they load.

```bash
bun run sync       # typecheck + build web + copy into android/ & ios/  (run after code changes)
bun run android    # open Android Studio  (needs Android Studio + SDK)
bun run ios        # open Xcode           (needs macOS + Xcode)
```

Then Run/▶ from the IDE onto a simulator or device, and Archive to submit to the stores. Offline is
inherent — the web assets are bundled in the app and all data is local (IndexedDB via Dexie).

Bundle id: `com.atvantage.forgefit` (in `capacitor.config.ts`). Rest-timer alerts already fire in the
background via `@capacitor/local-notifications` (the `Notifier` port + Capacitor adapter, no-op on
web). Add more native hardware the same way — `@capacitor-community/bluetooth-le` for a
`DeviceDataSource`, Health plugins for a `HealthProvider` — wiring each adapter in `src/app/container.ts`.

## Architecture (hexagonal / ports & adapters)

Dependencies point inward; `domain/` imports nothing.

```
src/
  domain/            pure, framework-free
    types.ts           entities + constants (GROUPS, FELT, defaults)
    services/          training.ts (e1RM, PRs, streak, session build, balance, progress,
                       calendar), timer.ts (pure tick state machine)
    ports.ts           repository / Clock / DataTransfer interfaces
  infrastructure/    adapters implementing the ports
    db.ts, repositories.ts   Dexie (IndexedDB)
    dataset.ts               bundled exercise library + demo seed
    importexport.ts          JSON export + validate + merge
    backup.ts, clock.ts, sound.ts
  app/               container.ts (composition root), data.ts (bootstrap/reset/import/export)
  stores/            Pinia — reactive state + orchestration (settings, library, plans, workout, ui)
  components/ui/     the 20 Forge design components (owned SFCs) + Icon
  views/             17 screens
  router/            routes
```

**Data flow:** view → store (application) → repository *port* ← Dexie adapter; stores call pure
domain services. Swapping storage or adding a backend = one new adapter, wired in `app/container.ts`.

## Notes on the confirmed ADRs

A few v1 decisions were tightened toward the spec's own "Simplicity > Complexity" guideline:

- **Native-first (Capacitor), not PWA.** The spec scoped v1 as "browser PWA now, Capacitor later";
  the target is a Capacitor app, so it ships that way directly. `vite-plugin-pwa` was removed (a
  service worker inside the Capacitor webview causes stale-asset bugs); offline is provided by the
  bundled native assets + local Dexie data. The router uses hash history for the webview.
- **Application layer folded into the Pinia stores.** The v1 use-cases are thin CRUD orchestration;
  a separate pass-through layer would be ceremony. The valuable seam — stores depending on
  repository *ports*, not Dexie — is kept, so extracting use-cases later is mechanical.
- **Stub ports omitted (ADR §5.4).** `AuthProvider` / `SyncProvider` / `DeviceDataSource` /
  `HealthProvider` are defined alongside the first adapter that needs them, not as dead interfaces
  today. The real seams (repositories, `Clock`, `DataTransfer`) exist now.
- **shadcn-vue toolchain is set up** (`components.json`, `lib/utils.ts` `cn`, reka-ui installed) but
  the Forge components ship as owned Tailwind SFCs — the design is already a complete, tokenized
  component library, so re-expressing it in vendor primitives would add nothing. `npx shadcn-vue add`
  still works for any future primitive.

## Design tokens / white-label

All colors/spacing come from CSS variables in `src/style.css` (`:root` + `[data-theme="dark"]`),
mapped into Tailwind via `@theme inline`. A brand overrides `--accent` (or any token) at `:root` —
every component reads the same tokens.
