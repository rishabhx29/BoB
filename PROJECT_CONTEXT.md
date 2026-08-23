# StreakPact — AI Agent Context

**This file is designed to be read by AI coding assistants/agents to quickly understand the project state, architecture, and next steps. If you are an AI starting a new session on this codebase, READ THIS ENTIRE FILE first.**

---

## 1. Project Overview
**StreakPact** is a social accountability and habit-tracking mobile app. It combines the data visualization of Strava with the gamification of Duolingo and the social mechanics of BeReal.
- **Core Loop:** Join a group ➔ Track activities with photo proof ➔ Maintain streaks ➔ React to friends ➔ Earn XP, Levels, and Badges.

## 2. Tech Stack (Hybrid Serverless)
- **Frontend:** React Native (Expo SDK 53+, Managed Workflow, TypeScript)
- **Styling:** Tailwind CSS (via NativeWind)
- **Relational DB & Storage:** Supabase (PostgreSQL, Storage, Edge Functions)
- **Real-time, Auth & Push:** Firebase (Google Auth, Firestore for real-time social feeds, FCM for notifications)
- **State Management:** Zustand (global state) + TanStack Query (async data)

## 3. Design System: "Tactile Hardware" (Neumorphic)
- The app uses a highly physical, tactile aesthetic.
- **Colors:** Soft Matte Gray (`#E5E7EB`), Safety Orange (`#F97316`), Bright Mint (`#34D399`), Matte Black (`#111827`).
- **Typography:** `Inter` for UI, `Roboto Mono` for digital streak displays.
- **Interactions:** Heavy use of neumorphic Drop Shadows (elevated buttons/cards) and Inset Shadows (recessed screens/pressed states). Elements should visually push *into* the screen when tapped.

## 4. Current Progress & Status
- **Phase 0 (Planning):** ✅ COMPLETELY FINISHED.
- **Current Phase:** 🚀 READY TO START PHASE 1 (Foundation & Project Setup).
- **Codebase State:** No application code has been written yet. The repo currently contains only the master planning documentation.

## 5. Required Reading for Agents
Before writing code or making architectural decisions, you MUST review the following files located in the repository:
1. `Required/StreakPact-PRD.md` — The complete product requirements, feature specifications, and database schema.
2. `docs/implementation_plan.md` — The 10-phase execution strategy and technical architecture decisions.
3. `docs/design.md` — The single source of truth for all UI components, color hexes, shadow definitions, and animations.
4. `docs/task.md` — The master checkbox tracker (Phase 1 to 10). Always check this file to know exactly what has been completed and what to build next.

## 6. Next Immediate Steps (For the Agent)
If you are picking up this project right now, go to `docs/task.md` and look at **Phase 1: Foundation & Project Setup**.
Start executing tasks sequentially:
1. Initialize the Expo project (`npx create-expo-app@latest`).
2. Configure `tsconfig.json`, ESLint, Prettier.
3. Set up React Navigation v7 (Auth Stack + Main Tab Navigator).
4. Implement the design system tokens in Tailwind config.

*Always update `docs/task.md` (check off `[x]`) as you complete items.*
