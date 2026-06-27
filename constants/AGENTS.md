# Constants Contract

## Purpose
This directory houses configuration constants, color palettes, and theme tokens used throughout the application.

## Ownership
- **Owner**: Zeez (Lead Developer)
- **Collaborator**: Antigravity (AI Coding Assistant)

## Local Contracts
- Every color value must be centralized under `Colors` inside `Colors.ts` for both light and dark modes.

## Work Guidance
- Avoid exposing direct raw magic numbers or hex string literals outside this folder.
- Ensure any modifications to color variables correspond with updates in `context/ui-tokens.md`.

## Verification
- Confirm that components import themes correctly from `@/constants/Colors`.
