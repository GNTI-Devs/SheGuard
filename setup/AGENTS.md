# Setup Contract

## Purpose
This directory houses setup and bootstrapping logic required for native/third-party WebRTC/LiveKit integrations prior to running main application routes.

## Ownership
- **Owner**: Zeez (Lead Developer)
- **Collaborator**: Antigravity (AI Coding Assistant)

## Local Contracts
- Execution of setup logic must run synchronously or at early load-time in `index.js`.

## Work Guidance
- Keep native setup configurations minimal, delegating heavy operations to lazy-loaded hooks or pages.

## Verification
- Run compilation checks (`npm run typescript`) to verify setup scripts do not introduce environment-specific type errors.
