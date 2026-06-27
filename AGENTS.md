# Root Agents Contract (DOX Rail)

## Purpose
This root AGENTS.md defines repository-wide instructions, global workflows, and coordinates all sub-folders within the voice-assistant-react-native project.

## Ownership
- **Owner**: Zeez (Lead Developer)
- **Collaborator**: Antigravity (AI Coding Assistant)

## Local Contracts
- All folder-level modifications must adhere to their local `AGENTS.md` contracts.
- Any architectural, flow, or UI component additions must update the corresponding files under `context/`.

## Work Guidance
- Build incrementally using the spec-driven workflow.
- Ensure type-safety using strict TypeScript annotations.
- Do not bypass connection hooks (`hooks/useConnection.tsx`) or color palettes (`constants/Colors.ts`).
- When introducing third-party libraries, document the constraints in `context/library-docs.md`.

## Verification
- Run `npm run typescript` to verify TypeScript compile-time correctness.
- Run `npm run lint` to enforce formatting and code style.
- Run `npm run test` or `npm run ci:test` for unit testing.

## Child DOX Index
- [app/AGENTS.md](file:///home/zeez/gitcloned/agent-starter-react-native/app/AGENTS.md) - Handles screens, routing, and user interface components.
- [hooks/AGENTS.md](file:///home/zeez/gitcloned/agent-starter-react-native/hooks/AGENTS.md) - Handles business logic, session state, and device state hooks.
- [constants/AGENTS.md](file:///home/zeez/gitcloned/agent-starter-react-native/constants/AGENTS.md) - Holds styles, themes, and global constants.
- [setup/AGENTS.md](file:///home/zeez/gitcloned/agent-starter-react-native/setup/AGENTS.md) - Holds setup functions for third-party libraries.
- [context/AGENTS.md](file:///home/zeez/gitcloned/agent-starter-react-native/context/AGENTS.md) - Holds project context, architecture, design rules, and progress tracking.
