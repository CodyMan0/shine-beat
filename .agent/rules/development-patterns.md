---
alwaysApply: true
---
# Development Patterns & Best Practices

## UI Component Patterns

### Styling Conventions
- Use Tailwind CSS classes (utility-first)
- Global styles and CSS variables in `src/app/index.css`
- Dark studio theme with amber accent (`--color-accent`)

### Component Guidelines
- Functional components with TypeScript interfaces for props
- Use `useCallback` for event handlers passed as props
- Use `useRef` for values accessed inside intervals/schedulers
- Expose imperative APIs via ref callbacks (not forwardRef)

## State Management

### Client State
- Use React hooks for local state (`useState`)
- Use refs for scheduler/timer values that shouldn't trigger re-renders (`useRef`)
- Lift state to App.tsx for cross-feature coordination
- No external state management libraries

## Web Audio API Patterns
- Lazy AudioContext initialization (user gesture required)
- Look-ahead scheduling with `setInterval` + Web Audio timing
- Store mutable values in refs for real-time access from schedulers

## Feature Communication
- Parent-child: Props and ref callbacks
- Sibling features communicate through App.tsx (lifted state)
