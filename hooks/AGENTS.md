# Hooks & Business Logic Contract

## Purpose
This directory contains reusable React hooks, context providers, and integration layers with LiveKit SDKs.

## Ownership
- **Owner**: Zeez (Lead Developer)
- **Collaborator**: Antigravity (AI Coding Assistant)

## Local Contracts
- `useConnection` must serve as the single source of truth for connecting/disconnecting the LiveKit room session.
- Platform-specific overrides (like `.web.ts`) must mirror the identical API interface of their native counterparts.

## Work Guidance
- Hook files must avoid direct UI rendering. They should only expose state, setters, and callback references.
- Leverage `useMemo` and `useCallback` to ensure stable hook return values to avoid unnecessary re-renders in UI components.

## Verification
- Run `npm run typescript` to ensure type verification of context provider values.
