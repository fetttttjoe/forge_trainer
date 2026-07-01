# Training App — Design Spec

**Date:** 2026-07-01
**Status:** Draft for review
**Phase:** v1 (browser PWA), architected so backend / login / device tracking attach later without rewrites.

> Guiding principle for every decision below: **Simplicity > Complexity.** Build the simple thing now, but put clean seams (interfaces) where growth is expected so later work is *additive*, never a rewrite.

---

## 1. Introduction & Goals

A training app for building your own workout plans from a large exercise library. Runs in any browser and on any phone from a single codebase, works fully offline, and can be re-branded per company (white-label).

### Core capabilities (v1 must-haves)
- Browse / search a large bundled exercise library
- Create, edit, delete your own exercises
- Create training plans; organize them into days; assign exercises with target sets / reps / rest
- Run a workout: rest timer **and** interval / HIIT multi-timer, with start / pause / stop
- Track progress (weight × reps, per-exercise history, automatic personal records) — **optional**: you can just check a set off
- Import / export plans and custom exercises as JSON
- White-label theming via design tokens

### Quality goals (drive the architecture)
| Goal | What it means here |
|---|---|
| **Portability** | One codebase → browser (PWA) + iOS + Android (Capacitor later) |
| **Modifiability** | Attach backend, login, and devices later by writing one adapter each; the core never changes |
| **Usability** | Offline-first, instant, simple UX; rich features are opt-in |
| **Maintainability** | Small team; framework-agnostic domain; few, well-chosen dependencies |
| **Testability** | Domain + use-cases testable in plain TS with no DOM and no real database |

### Non-goals for v1
No accounts / login, no backend, no cloud sync, no native device integration, no multi-tenant brand delivery infrastructure. All are *designed for* (ports exist) but not *built*.

---

## 2. Constraints

- **Hard:** runs in a real browser **and** mobile, one codebase, offline-first, no backend at launch.
- **Roadmap (must stay additive):** app-store distribution, Bluetooth sensors, Apple Health / Health Connect, cloud APIs (Strava/Garmin), backend + sync, login, per-company branding.
- **Team:** small; favors mainstream, well-documented tools and minimal moving parts.

---

## 3. Context

```
                 ┌───────────────────────────┐
   User  ───────▶│      Training App          │
                 │  (browser PWA now,          │
                 │   Capacitor native later)   │
                 └───────────────────────────┘
                          │
     Now:  bundled exercise dataset (on device), local storage (IndexedDB), JSON files (import/export)
   Later:  backend API + auth · BLE sensors · Apple Health / Health Connect · cloud fitness APIs
```

All "Later" arrows are represented in the domain as **ports** (interfaces) with no implementation in v1.

---

## 4. Solution Strategy

| Concern | Decision | Why |
|---|---|---|
| Distribution | **Web app** shipped as a **PWA now**, wrapped by **Capacitor** later | Native device APIs (BLE, Health) are native-only; Capacitor adds them to the *same* web codebase without giving up the browser |
| UI framework | **Vue 3** + Vite + `vite-plugin-pwa` | Clean DX for a small team, first-class PWA tooling |
| Components + theming | **shadcn-vue** (Reka UI primitives, Tailwind v4) + **CSS-variable design tokens** | Own the components → no vendor look to fight; white-label is pure token overrides. (Ionic rejected: its opinionated look forces theming workarounds.) |
| Native wrapper | **Capacitor 8** (deferred) | Consensus web-to-native wrapper; dormant in browser build, active in native builds |
| Local data | **Dexie** (IndexedDB) behind repository interfaces | Free, simple, works in browser + native WebView; the *interface* is the "backend later" seam |
| Architecture | **Hexagonal / ports & adapters**; domain in plain TypeScript | Domain logic isolated from UI, storage, and platform → the SoC and additivity requirements |
| Documentation | **arc42** structure + **ADRs** | ISAQB-aligned: decisions captured and justified |

---

## 5. Building Block View

### 5.1 Layers

```
┌──────────────────────────────────────────────────────────┐
│ ui/         Vue + shadcn-vue: views, components,           │  depends ↓ (calls use-cases only)
│             Pinia stores, router, theme provider           │
├──────────────────────────────────────────────────────────┤
│ application/  use-cases (orchestrate domain + ports)       │  depends ↓
├──────────────────────────────────────────────────────────┤
│ domain/     entities · value objects · PORTS (interfaces)  │  depends on NOTHING
│             · domain services (timer, PR calc)             │
├──────────────────────────────────────────────────────────┤
│ infrastructure/  ADAPTERS implementing the ports:          │  implements ↑ ports
│             dexie repos · json import/export · dataset     │
│             seeder · brand loader · media cache · clock     │
├──────────────────────────────────────────────────────────┤
│ app/        composition root — wires adapters → ports,     │
│             bootstraps the app (manual DI, no framework)    │
└──────────────────────────────────────────────────────────┘
```

**Dependency rule:** dependencies point *inward*. `domain/` imports nothing outside itself. `ui/` never imports `infrastructure/` directly — only use-cases, which only know ports.

### 5.2 Proposed folder structure
```
src/
  domain/
    entities/         # Exercise, Plan, PlanDay, PlannedExercise, WorkoutSession, LoggedSet ...
    ports/            # ExerciseRepository, PlanRepository, WorkoutRepository, BrandingProvider,
                      #   Clock, DataTransfer, MediaProvider  (+ stubbed: SyncProvider, AuthProvider,
                      #   DeviceDataSource, HealthProvider)
    services/         # TimerService, PersonalRecordCalculator
  application/
    exercises/  plans/  workout/  progress/  data/  branding/   # use-cases grouped by feature
  infrastructure/
    dexie/            # Dexie DB + repository implementations
    dataset/          # bundled exercise JSON + seeder
    importexport/     # JSON serializer / validator
    branding/         # brand config loader → applies CSS variables
    media/            # exercise image lazy-cache
    clock/            # real Clock
  ui/
    views/  components/  stores/  router/  theme/
  app/
    container.ts      # composition root: build adapters, inject into use-cases
    main.ts           # bootstrap
  assets/
    exercises.json    # bundled dataset (text/metadata)
    brand.default.json
```

### 5.3 Ports (v1)
- `ExerciseRepository` — list, getById, search, saveCustom, update, delete
- `PlanRepository` — CRUD plans (with days + planned exercises)
- `WorkoutRepository` — create/finish sessions, save logged sets, query history
- `BrandingProvider` — load the active brand config
- `MediaProvider` — resolve + cache an exercise image URL
- `DataTransfer` — export/import serialized data (JSON)
- `Clock` — `now()` (injectable for testable timers)

### 5.4 Ports defined but **not implemented** in v1 (the additive seams)
`SyncProvider`, `AuthProvider`, `DeviceDataSource` (BLE), `HealthProvider` (HealthKit / Health Connect). Present so future work is "write an adapter," not "restructure the app."

---

## 6. Domain Model

```
Exercise           id, name, instructions, primaryMuscles[], secondaryMuscles[],
                   equipment, category, mediaRef?, isCustom
Plan               id, name, description?, days: PlanDay[]
PlanDay            id, label, order, entries: PlannedExercise[]
PlannedExercise    id, exerciseId, targetSets, targetReps, targetRestSeconds, notes?
WorkoutSession     id, planId?, dayId?, startedAt, endedAt?, entries: SessionEntry[]
SessionEntry       id, exerciseId, completed, sets: LoggedSet[]
LoggedSet          id, weight?, reps?, completed, at
BrandConfig        id, name, logoRef?, tokens: Record<string,string>   # CSS variable values
```

- **Personal records** are *derived* from `LoggedSet` history (best weight, best est. 1RM), not stored as a separate source of truth — keeps logging simple and progress additive.
- Logging is optional: a `SessionEntry` can be `completed` with zero `LoggedSet`s (pure check-off).
- IDs: UUID.

---

## 7. Key Runtime Scenarios

1. **First launch** — seeder loads `exercises.json` into Dexie (versioned; re-runs only on dataset version bump); default brand applied; `navigator.storage.persist()` requested.
2. **Browse / search** — view → `ListExercises` / `SearchExercises` → `ExerciseRepository` (Dexie).
3. **Custom exercise** — editor → `CreateCustomExercise` / `EditExercise` → repo.
4. **Build a plan** — plan editor → plan use-cases → `PlanRepository`.
5. **Run a workout** — `StartWorkout` opens a session; `TimerService` (driven by `Clock`) powers rest + interval timers with pause/resume; `LogSet` optional; `FinishWorkout` closes it.
6. **View progress** — `GetExerciseHistory` / `GetPersonalRecords` derive from logged sets.
7. **Import / export** — `ExportData` serializes plans + custom exercises → JSON blob download; `ImportData` reads a file, **validates**, and merges.
8. **Apply brand** — `LoadBrand` → `BrandingProvider` → writes token values to CSS variables at `:root`.

---

## 8. Crosscutting Concepts

- **Offline** — `vite-plugin-pwa` precaches the app shell; dataset in Dexie; images lazy-cached (`MediaProvider`); `storage.persist()` to resist eviction.
- **Exercise media** — text/metadata bundled offline; images fetched on first view and cached (avoids a huge install). Behind `MediaProvider` so the strategy can change.
- **Theming** — semantic CSS-variable tokens; a `BrandConfig` overrides them at `:root`; components (owned via shadcn-vue) all read the same tokens. Default brand ships in-app.
- **Timers** — `TimerService` is a pure domain service ticking off `Clock`; UI renders it. *iOS caveat:* no reliable background execution — timers are foreground; native local-notification alerts come with the Capacitor phase.
- **Validation** — domain invariants on entity creation; JSON-schema validation at the import boundary (untrusted input).
- **Dependency injection** — a single composition root (`app/container.ts`) wires concrete adapters to ports. Manual, explicit, no DI framework.
- **Testing** — domain + use-cases unit-tested in plain TS against an in-memory fake repository (no DOM, no IndexedDB); a thin set of component tests for critical UI (timer, workout runner).

---

## 9. Architecture Decisions (ADR index)

Each will get a short `docs/adr/NNN-*.md`. Decisions:

- **ADR-001** Web app + Capacitor over React Native / Flutter / Tauri — browser is a first-class target; device roadmap needs native, which Capacitor adds to the same web code.
- **ADR-002** Vue 3 as the UI framework.
- **ADR-003** shadcn-vue + Reka UI + CSS-variable tokens; Ionic rejected (theming friction for white-label).
- **ADR-004** Hexagonal ports & adapters; domain in plain TypeScript.
- **ADR-005** Dexie / IndexedDB now behind repositories; sync engine deferred.
- **ADR-006** Exercise text bundled offline; images lazy-cached.
- **ADR-007** No auth in v1; `AuthProvider` port stubbed.
- **ADR-008** Capacitor + BLE / Health / cloud integrations deferred behind ports.

---

## 10. Scope

### In (v1)
Everything under §1 "Core capabilities": exercise library + custom exercises, plans + days + planned exercises, workout runner with rest + interval timers, optional set logging + history + PRs, JSON import/export, token-based theming, offline PWA.

### Out (deferred, each behind an existing port)
Capacitor native builds · app-store release · backend + sync · login/accounts · Bluetooth sensors · Apple Health / Health Connect · cloud APIs (Strava/Garmin) · per-company build/deploy delivery · bundled exercise media · calendar scheduling of plan days to real dates.

---

## 11. Risks & Technical Debt

| Risk | Mitigation |
|---|---|
| **Exercise dataset & image licensing** | Verify the license of the chosen source (ExerciseDB / GitHub dataset) and image usage rights **before shipping**. Keep the dataset behind `ExerciseRepository` + `MediaProvider` so the source can be swapped. |
| iOS PWA has no install prompt | In-app "Add to Home Screen" guidance; or steer iOS users to the Capacitor store build later. |
| iOS background timers unreliable | Foreground timers only in v1; local-notification alerts arrive with Capacitor. |
| Pure-browser iOS storage eviction | Only affects uninstalled sites idle 7+ days; `storage.persist()`; installed PWA + native build are stable. |
| Future BLE/Health plugins are community-maintained | Wrap behind `DeviceDataSource` / `HealthProvider` ports; pin to Capacitor major. |
| Tailwind v4 dependency (via shadcn-vue) | Accepted: Tailwind v4's CSS-variable model is what makes theming clean; components are owned in-repo. |

---

## 12. Open Questions

1. **Exercise dataset source of truth** — bundle a static export of the GitHub `exercises-dataset`, or a static snapshot pulled from the ExerciseDB API? (Both are offline once bundled; this affects licensing and shape.)
2. **Import merge semantics** — on import, merge-by-id vs. duplicate vs. replace? (Proposed default: merge-by-id, imported wins, with a summary.)
3. **Plan-day scheduling** — v1 keeps plans as ordered days (no calendar). Confirm calendar scheduling is genuinely out for v1.
