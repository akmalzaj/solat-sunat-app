# Design-system governance

This document is the source of truth for UI decisions once the application is
implemented. Gemini reviews against it and may propose additions, but Codex
remains responsible for approving and implementing them.

## Rules

- Prefer existing semantic color, spacing, typography, radius, and elevation tokens.
- Reuse components before creating variants or adding a dependency.
- Test primary, hover, focus, disabled, loading, empty, error, and success states where applicable.
- Review desktop (1280px), tablet (768px), and mobile (375px) screenshots for substantial UI changes.
- Target WCAG AA contrast and visible keyboard focus; visual review supplements, never replaces, automated accessibility checks.
