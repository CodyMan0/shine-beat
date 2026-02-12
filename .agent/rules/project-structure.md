---
alwaysApply: true
---
# Project Structure

## Feature Sliced Design (FSD) Architecture

The codebase follows Feature Sliced Design with these layers:

- **app**: Application shell - entry point, global styles, root component
- **features**: Product-level features with domain-specific logic and UI
- **shared**: Reusable utilities and common UI components

## Key Dependency Rules

1. Upper layers depend on lower layers only: app → features → shared
2. Lower layers don't know about upper layers
3. Features within the same layer should not depend on each other

## File Organization

Each feature follows consistent organization:
- `ui/`: UI components (PascalCase)
- `model/`: Hooks, types, business logic (camelCase)
- `api/`: External API integrations
- `index.ts`: Public barrel exports

## Directory Structure

```
src/
├── app/                        # App layer
│   ├── App.tsx                 # Root component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles + Tailwind
├── features/                   # Features layer
│   ├── metronome/              # Metronome engine + controls
│   │   ├── ui/
│   │   ├── model/
│   │   └── index.ts
│   ├── youtube-player/         # YouTube embed + controls
│   │   ├── ui/
│   │   ├── model/
│   │   ├── api/
│   │   └── index.ts
│   ├── bpm-detection/          # BPM search + tap tempo
│   │   ├── ui/
│   │   ├── model/
│   │   └── index.ts
│   └── sync-control/           # Play/pause/stop sync
│       ├── ui/
│       └── index.ts
└── vite-env.d.ts
```

## Naming Conventions
- Components: PascalCase (e.g., `MetronomeControl.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useMetronome.ts`)
- Types: PascalCase in `.types.ts` files
- Utilities: camelCase
