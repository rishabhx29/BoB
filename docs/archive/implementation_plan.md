# StreakPact — Complete Implementation Plan

**App:** StreakPact — Social Accountability & Streak Tracking  
**Date:** August 23, 2026  
**PRD Reference:** [StreakPact-PRD.md](file:///c:/Rishabh/BoB/Required/StreakPact-PRD.md)

---

## Technology Stack Decision

### Framework: **React Native (Expo SDK 53+ Managed Workflow)**

> [!IMPORTANT]
> After evaluating both Flutter and React Native against the project requirements, **React Native with Expo** is the recommended choice for the following reasons:

| Factor | React Native + Expo | Flutter |
|---|---|---|
| **Real-time features** | Seamless Firebase/Firestore integration (first-party SDK) | Firebase support exists but less mature |
| **Developer velocity** | Hot reload + OTA updates via EAS + vast npm ecosystem | Hot reload excellent, but smaller package ecosystem |
| **Image handling** | Expo ImagePicker, expo-image-manipulator — battle-tested | image_picker works but more boilerplate |
| **Animations** | react-native-reanimated + Lottie = cinema-grade motion | Rive/Lottie support strong, but custom animations need more code |
| **Community / Hiring** | Massive JS/TS ecosystem — easier to find contributors | Dart has a smaller talent pool |
| **Free-tier backend fit** | Supabase JS SDK is first-class; Firebase JS SDK is native | Supabase Dart SDK exists but less mature |

### Backend: **Supabase (Primary) + Firebase (Real-time & Push)**

> [!IMPORTANT]
> **Hybrid architecture** — Supabase handles the relational core (users, groups, activities, submissions, streaks, badges) with its PostgreSQL database + built-in Storage (1GB free for images). Firebase handles real-time feed updates (Firestore listeners), push notifications (FCM), and authentication (Firebase Auth with Google OAuth).

| Service | Role | Free Tier |
|---|---|---|
| **Supabase** | PostgreSQL DB, file storage (images), Row-Level Security, Edge Functions | 500MB DB, 1GB storage, 50K MAU |
| **Firebase** | Auth (Google OAuth), Firestore (real-time feed/reactions/comments), FCM (push) | Spark plan: 1GB Firestore, 50K auth, generous FCM |
| **Cloudinary** | Image CDN + auto-compression (backup if Supabase egress is tight) | 25 credits/mo free |
| **Expo EAS** | Build, OTA updates, push notification service | Free tier for individual devs |

### Why Not a Custom NestJS Backend?

The PRD specifies NestJS, but for a solo/small-team build with a free-tier constraint, **Supabase Edge Functions** (Deno-based serverless) replace the need for a dedicated backend server. This eliminates hosting costs (Railway/Render), simplifies deployment, and provides built-in auth middleware, rate limiting, and CORS handling. Complex business logic (XP calculations, streak cron jobs, weekly wrap-ups) runs as scheduled Supabase Edge Functions or pg_cron jobs directly in PostgreSQL.

---

## Phase Overview

| Phase | Name | Duration | Key Deliverables |
|---|---|---|---|
| **1** | Foundation & Project Setup | 1.5 weeks | Expo project, navigation shell, design system, Supabase + Firebase config |
| **2** | Authentication & Onboarding | 1.5 weeks | Splash, onboarding carousel, email/Google auth, username setup, deep link handling |
| **3** | Groups & Team Management | 2 weeks | Group CRUD, invite system (code/link/QR), group home with tabs, roles & admin controls |
| **4** | Activity System & Templates | 1.5 weeks | Activity creation (presets + custom), dynamic form builder, activity cards, archiving |
| **5** | Submission System & Media | 2 weeks | Camera/gallery flow, dynamic form rendering, photo compression, submission CRUD, offline queue |
| **6** | Calendar & Streak Engine | 2 weeks | Calendar views (group/comparative/year), streak calculation cron, streak shields, rest days |
| **7** | Social Features & Feed | 1.5 weeks | Home feed with cards, reactions, comments, nudge system, Today Banner |
| **8** | Gamification & Rewards | 1.5 weeks | XP engine, levels, badges, weekly challenges, leaderboards, celebrations |
| **9** | Notifications & User Profile | 1.5 weeks | Push notifications (FCM), notification center, user profile, stats, achievements grid, settings |
| **10** | Polish, Testing & Launch Prep | 2 weeks | Animations, accessibility, performance optimization, E2E testing, app store assets |

**Total estimated duration: ~17 weeks (4.25 months)**

---

## Phase 1: Foundation & Project Setup
**Duration:** 1.5 weeks

### 1.1 Project Initialization
- [ ] Initialize Expo project with TypeScript template: `npx create-expo-app@latest ./ --template tabs`
- [ ] Configure `tsconfig.json` with strict mode and path aliases (`@/components`, `@/screens`, `@/hooks`, `@/store`, `@/utils`, `@/constants`, `@/types`)
- [ ] Set up ESLint + Prettier with consistent rules
- [ ] Initialize Git repo, add `.gitignore`, create `develop` and `main` branches
- [ ] Configure `app.json` / `app.config.ts` with app metadata, splash config, icons, scheme (`streakpact://`)

### 1.2 Navigation Architecture
- [ ] Install React Navigation v7 (Stack + Bottom Tabs + Native Stack)
- [ ] Create Auth Stack: `SplashScreen` → `OnboardingScreen` → `LoginScreen` → `RegisterScreen`
- [ ] Create Main Tab Navigator with 5 tabs: Home, Groups, Submit (FAB), Leaderboard, Profile
- [ ] Implement the center Submit tab as a raised pill-shaped FAB that opens a bottom sheet
- [ ] Set up deep linking config for `streakpact://invite/:code`
- [ ] Add screen transition animations (shared element for profile, slide for stacks)

### 1.3 Design System Implementation
- [ ] Create `constants/theme.ts` with complete color tokens (Tactile Hardware theme), typography scale, spacing scale, border radii, and extensive neumorphic shadow definitions (drop/inset)
- [ ] Install Google Fonts: Inter (Headings/Body) and Roboto Mono (Digital Displays)
- [ ] Create base components: `Text` (with variant props), `Button` (with physical press states), `Card` (pillowy shadows), `Avatar`, `Badge`, `Chip`, `Input`, `BottomSheet`
- [ ] Create `StatusIndicator` component (physical LED lights: recessed dark vs glowing mint)
- [ ] Build skeleton loader components for feed cards, profile sections, calendar cells
- [ ] Set up Tailwind configuration for custom neumorphic box-shadows
- [ ] Create animated components: `StreakCounter` (digital display), `XPChip` (bounce-in), `ConfettiBurst`
- [ ] Reference: [design.md](file:///c:/Rishabh/BoB/docs/design.md) for full design token specification

### 1.4 Backend Infrastructure
- [ ] Create Supabase project, configure environment variables
- [ ] Create Firebase project, enable Auth (email + Google), Firestore, Cloud Messaging
- [ ] Set up Supabase database schema (all tables from PRD Section 12):
  - `users`, `groups`, `group_members`, `activities`, `submissions`, `streaks`, `badges`, `user_badges`
- [ ] Configure Row-Level Security (RLS) policies on all Supabase tables
- [ ] Set up Supabase Storage bucket `submission-photos` with access policies
- [ ] Create Firestore collections structure: `/feed`, `/reactions`, `/comments`, `/nudges`, `/notifications`
- [ ] Write Firestore security rules (group membership verification)
- [ ] Set up Supabase Edge Functions project for server-side logic

### 1.5 State Management & Data Layer
- [ ] Install and configure Zustand stores: `useAuthStore`, `useGroupStore`, `useActivityStore`, `useSubmissionStore`, `useStreakStore`, `useNotificationStore`
- [ ] Install TanStack Query and configure `QueryClient` with default stale times and cache policies
- [ ] Create API service layer (`services/`) with Supabase client and Firebase client wrappers
- [ ] Set up offline submission queue using AsyncStorage
- [ ] Create custom hooks: `useCurrentUser`, `useGroups`, `useActivities`, `useSubmissions`, `useStreaks`

---

## Phase 2: Authentication & Onboarding
**Duration:** 1.5 weeks

### 2.1 Splash Screen
- [ ] Animated splash with Volt mascot (Lottie animation): lightning bolt character bounces in, app name types out
- [ ] Auto-redirect: if JWT exists and is valid → Main Tab; else → Onboarding
- [ ] Handle app version check on splash

### 2.2 Onboarding Carousel
- [ ] 3-slide animated value prop carousel:
  - Slide 1: "Track Together" — illustration of two people tracking the same activity
  - Slide 2: "Stay Accountable" — calendar with green/red dots, streak fire
  - Slide 3: "Level Up" — XP bar filling, badges unlocking
- [ ] Parallax scroll animation on illustrations
- [ ] Skip button (top-right), dot indicators, "Get Started" on final slide
- [ ] Store onboarding completion in AsyncStorage (never show again)

### 2.3 Authentication Screens
- [ ] **Login Screen:** Email/password fields + "Sign in with Google" button (one-tap) + "Don't have an account? Sign up" link
- [ ] **Register Screen:** Email, password, confirm password fields + Google OAuth + "Already have an account? Login" link
- [ ] Firebase Auth integration: `createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `signInWithGoogle`
- [ ] Email verification flow (send verification email, check status)
- [ ] JWT token management: store refresh token in SecureStore, auto-refresh on expiry
- [ ] Error handling: invalid credentials, email already exists, network error, weak password
- [ ] Form validation with React Hook Form + Zod schemas

### 2.4 Username & Avatar Setup
- [ ] Username input with real-time availability check (debounced Supabase query)
- [ ] Username rules validation: 3–20 chars, alphanumeric + underscores
- [ ] Avatar picker: 12 preset illustrated avatars (grid) + camera upload option
- [ ] Camera upload: Expo ImagePicker → crop to 1:1 → compress → upload to Supabase Storage
- [ ] Create user record in Supabase `users` table after setup

### 2.5 "Start a Pact or Join One" Decision Screen
- [ ] Two large illustrated cards: "Create a Pact" and "Join a Pact"
- [ ] Animated entrance (staggered fade-up)
- [ ] Deep link handling: if invite code was stored pre-auth, auto-navigate to join flow

### 2.6 Biometric Login (Subsequent Logins)
- [ ] Expo LocalAuthentication for Face ID / Fingerprint
- [ ] Toggle in Settings to enable/disable
- [ ] Fallback to email/password if biometric fails

---

## Phase 3: Groups & Team Management
**Duration:** 2 weeks

### 3.1 Groups List Screen
- [ ] Scrollable list of all groups the user belongs to
- [ ] Group card: name, emoji, stacked member avatars (max 4 shown + "+N"), active activities count, "X/N submitted today" status
- [ ] Tap → navigate to Group Home; Long-press → "Leave Group" confirmation
- [ ] FAB: "Create Group" / "Join Group" action sheet
- [ ] Empty state: Volt looking lonely, CTA "Start your first Pact!"
- [ ] Pull-to-refresh

### 3.2 Create Group Flow
- [ ] **Step 1:** Group name (max 30 chars) + emoji picker (searchable emoji grid)
- [ ] **Step 2:** Choose starting activities — show preset templates as illustrated cards + "Create Custom" option (can select multiple)
- [ ] **Step 3:** Set group "vibe" (optional): 🔥 Hustle Mode, 📚 Study Mode, 💪 Gym Pact, 🎯 Custom
- [ ] **Step 4:** Group goal description (optional, max 200 chars)
- [ ] **Step 5:** Invite screen — auto-generated 6-char code (ambiguity-safe charset: no I/O/0/1) + shareable deep link + QR code
- [ ] Store group in Supabase `groups` table, creator gets ADMIN role in `group_members`
- [ ] Generate invite code with collision retry logic (Appendix B from PRD)

### 3.3 Join Group Flow
- [ ] Three join methods:
  - Manual code entry (6-char input with auto-uppercase, large segmented fields)
  - Deep link tap (auto-fills code, confirms join)
  - QR code scanner (Expo Camera barcode scanning)
- [ ] Validate invite code against Supabase
- [ ] Check group capacity (max 6 members in v1)
- [ ] Show "Group is full" error with option to notify admin
- [ ] Add user to `group_members` table, trigger "New Group Member" notification to group

### 3.4 Group Home Screen
- [ ] Header: Group name, emoji, member avatar row (tappable for member profile), "X-day group streak" (calculated if all members submitted)
- [ ] **4 tabs (top tab bar with animated indicator):**
  - **Feed Tab:** Group-specific submission feed (filtered view of home feed)
  - **Activities Tab:** All activities in this group, each showing member streak grid
  - **Members Tab:** Member list with XP, level, streak status, and "Nudge" button (visible after noon if member hasn't submitted)
  - **Leaderboard Tab:** Ranked by total XP in this group this month (animated bars)
- [ ] Settings gear icon (visible only to ADMIN) → Group Settings screen

### 3.5 Group Settings (Admin Only)
- [ ] Rename group, change emoji
- [ ] Add/archive activities
- [ ] Set submission window (time picker: default 12:00 AM – 11:59 PM)
- [ ] Configure rest days (0–2 per week slider, per activity)
- [ ] Toggle "Require photo proof"
- [ ] Toggle "Group streak" (all-or-nothing)
- [ ] Remove members (with confirmation)
- [ ] Regenerate invite code
- [ ] Delete group (with confirmation + 7-day soft delete)

### 3.6 Group Invite Sharing
- [ ] Share sheet with pre-formatted message: "Join my StreakPact group! 💪 Code: XXXXXX or tap: https://streakpact.app/join/XXXXXX"
- [ ] Copy code button with haptic feedback
- [ ] QR code generation (render as SVG)

---

## Phase 4: Activity System & Templates
**Duration:** 1.5 weeks

### 4.1 Activity Templates Engine
- [ ] Create template definitions for all 9 preset activities (from PRD Section 8):
  - 🏋️ Gym / Workout
  - 📚 Study Session
  - 💻 LeetCode / DSA
  - 🏃 Running / Cardio
  - 📖 Reading
  - 🧘 Meditation
  - 💧 Water Intake
  - 🌡️ Cold Shower / Ice Bath
  - 🌍 Language Learning
- [ ] Each template defines: icon, color, calendar dot color, and an array of field definitions
- [ ] Field definition schema: `{ id, label, type: 'text'|'number'|'multiselect'|'singleselect'|'toggle'|'stars'|'emoji-scale', options?: string[], required: boolean }`
- [ ] Store templates as a JSON config file (`constants/activityTemplates.ts`)

### 4.2 Create Activity Flow (from Group)
- [ ] Activity selector: scrollable grid of preset template cards (icon + name + preview of fields)
- [ ] "Create Custom" card at the end
- [ ] **Preset flow:** Select template → configure frequency (Daily / Specific days / X days per week) → set rest days → toggle photo requirement → Confirm
- [ ] **Custom flow:**
  - Step 1: Name (max 30 chars) + icon picker (60+ icons using `@expo/vector-icons`) + color picker (12 preset colors)
  - Step 2: Set frequency (day picker UI with toggleable Mon–Sun pills)
  - Step 3: Add custom fields (up to 5) — each field: label + type selector + options (if multi/single select)
  - Step 4: Toggle photo requirement + set rest days
  - Step 5: Preview card → Confirm
- [ ] Store activity in Supabase `activities` table with `templateFields` as JSON

### 4.3 Activity Card Component
- [ ] Color-coded header bar matching activity color
- [ ] Activity icon + name
- [ ] Member streak grid: for each group member → avatar + current streak 🔥 + today's status icon (✅/🟠/❌/💤)
- [ ] "Submit for today" CTA button (primary, pulsing glow if pending)
- [ ] Tap card → Activity Detail screen

### 4.4 Activity Detail Screen
- [ ] Header: activity icon, name, color bar
- [ ] Tabs: Calendar | Submissions History
- [ ] Activity info: frequency, rest day allowance, required fields
- [ ] Admin actions: Edit activity, Archive activity (with confirmation)

### 4.5 Dynamic Form Renderer
- [ ] Generic `DynamicForm` component that renders fields from a `templateFields` JSON array
- [ ] Field type renderers:
  - **Text:** TextInput with character limit
  - **Number:** NumberInput with optional unit suffix (min, km, pages)
  - **Multi-select chips:** Horizontal scrollable pill buttons (tap to toggle, color fill on select)
  - **Single select:** Radio-style chip group (one selected at a time)
  - **Toggle:** Switch component with label
  - **Star rating:** 5-star interactive component
  - **Emoji scale:** Horizontal emoji strip (😴 😐 😊 😤 🔥) with selection highlight
- [ ] Validation: required field indicators, inline error messages
- [ ] Form state managed by React Hook Form

---

## Phase 5: Submission System & Media
**Duration:** 2 weeks

### 5.1 Submission Entry Points
- [ ] **FAB (center tab):** Opens bottom sheet with activity selector → select → full submission flow
- [ ] **Activity card "Submit" button:** Directly enters submission flow for that activity
- [ ] **Today Banner pending dot:** Taps directly into submission flow for that specific activity
- [ ] All entry points resolve to the same `SubmissionFlow` modal stack

### 5.2 Camera & Photo Step
- [ ] Expo ImagePicker with camera as default (gallery option available)
- [ ] Camera overlay: activity name badge at top, capture button at bottom
- [ ] "Skip photo" button always visible (text link, not hidden)
- [ ] Post-capture: crop interface (1:1 or 4:5 aspect ratio selector)
- [ ] Auto-compression via expo-image-manipulator: resize to max 1080px width, compress to ≤800KB JPEG
- [ ] Photo preview with retake/remove options

### 5.3 Activity Fields Step
- [ ] Render `DynamicForm` component with the activity's `templateFields`
- [ ] Pre-populate any fields that have sensible defaults
- [ ] Validate required fields before allowing navigation to next step
- [ ] Smooth keyboard-avoiding scroll view

### 5.4 Title & Description Step
- [ ] Title input (optional but encouraged): max 80 chars, placeholder "What did you crush today? 💪"
- [ ] Description textarea (optional): max 500 chars, placeholder "Tell your crew about it..."
- [ ] Character counters on both fields
- [ ] Quick suggestion chips: "Crushed it! 💪", "Easy day today", "Pushed through 🔥"

### 5.5 Confirm & Submit Step
- [ ] Preview card: photo thumbnail, title, activity-specific field summary, activity name + icon
- [ ] "Submit StreakPact 🚀" large primary button
- [ ] On submit:
  1. Client-side timestamp capture (for timezone edge cases)
  2. Upload photo to Supabase Storage (if present)
  3. Create submission record in Supabase `submissions` table
  4. Mirror submission to Firestore `/feed/{groupId}/submissions/` for real-time propagation
  5. Update streak in Supabase `streaks` table
  6. Calculate and award XP (Edge Function)
  7. Trigger "Teammate Submitted" notifications (FCM)
- [ ] Success animation: confetti burst + XP chip slides up ("+ 60 XP 🔥") + Volt mascot cheers
- [ ] Navigate back to feed where new submission appears at top

### 5.6 Submission Editing & Deletion
- [ ] Edit: within 1 hour of posting — title, description, activity fields only (photo locked)
- [ ] Delete: within 24 hours — confirmation modal warns "This will break your streak for today"
- [ ] Both update Supabase record and sync to Firestore

### 5.7 Offline Submission Queue
- [ ] If no network: submission saved to AsyncStorage queue with timestamp
- [ ] Offline banner at top of screen
- [ ] On reconnect: auto-upload queued submissions with original timestamps
- [ ] Toast notification: "Queued submission uploaded ✅"
- [ ] Handle photo upload failures gracefully (submit without photo, prompt retry later)

---

## Phase 6: Calendar & Streak Engine
**Duration:** 2 weeks

### 6.1 Calendar View — Group Mode
- [ ] Month grid (standard 7-column calendar, current month default)
- [ ] Each day cell: stacked colored dots per group member
  - 🟢 Green: Submitted
  - 🔴 Red: Missed (day passed, no submission)
  - 🟠 Orange: Pending (today, not yet submitted)
  - ⚪ Grey: Rest day (with 🛌 icon)
  - 🟣 Purple: Activity not active that day
- [ ] Tap day → bottom sheet expands with all member submissions for that day (photo thumbnails, titles, activity data)
- [ ] Month navigation: swipe left/right with smooth transition
- [ ] "Today" button to snap back to current month

### 6.2 Streak Summary Bar
- [ ] Below calendar: horizontal scroll of member streak cards
- [ ] Each card: avatar, name, current streak 🔥, longest streak, total submissions
- [ ] Sorted by current streak (descending)
- [ ] Animated flame icon: size scales with streak length (bigger flame = longer streak)

### 6.3 Comparative View (2-Person Pact)
- [ ] Special layout for 2-person groups: two mini calendars side by side
- [ ] Each member's calendar highlighted with their color
- [ ] "Streak Battle" banner: "You're ahead by 3 days" / "Tied! 🏆" / "They're ahead by 2 days 😤"
- [ ] Animated versus indicator between the two calendars

### 6.4 Year Overview (GitHub-Style Contribution Graph)
- [ ] Condensed 12-month grid (365 cells) showing submission density
- [ ] Color intensity = number of activities submitted that day (light green → dark green)
- [ ] Tap any month to jump to the detailed month view
- [ ] Scrollable horizontally with current month highlighted

### 6.5 Streak Calculation Engine
- [ ] Supabase Edge Function / pg_cron job running daily at 00:05 AM UTC:
  - For each user → each active activity → check if submission exists for yesterday
  - If no submission and no shield used → `currentStreak = 0`, send "Streak Broken" notification
  - If submission exists → increment streak, check milestones (7/14/30/60/100)
  - If rest day declared → streak frozen (no increment, no break)
- [ ] Handle timezone: submissions tagged with user's device timezone; cron adjusts per user
- [ ] Edge case: submission at 11:59 PM with network delay → 2-minute grace window (client timestamp)

### 6.6 Streak Shields
- [ ] Earn 1 shield every 7 consecutive submission days
- [ ] Max stockpile: 3 shields
- [ ] On app open after missed day: modal → "Use a Streak Shield? You have X shields."
  - Yes → consume shield, preserve streak, show "🛡️ Shield Used! Streak Saved" animation
  - No → streak breaks, show encouraging "Start again today 💪"
- [ ] Shield count displayed on activity cards and profile header
- [ ] Rule: max 1 shield per activity per week (cannot chain for consecutive misses)

### 6.7 Rest Day System
- [ ] Declare rest day for a specific activity before midnight
- [ ] Rest day picker: bottom sheet showing active activities → select → confirm "Resting today from [Activity]"
- [ ] Does not break streak, does not increment streak
- [ ] Calendar shows grey dot with 🛌 icon
- [ ] Allowance: 0–2 rest days per week per activity (configurable by group admin)
- [ ] Cannot be backdated (only today's rest day can be declared)

---

## Phase 7: Social Features & Feed
**Duration:** 1.5 weeks

### 7.1 Home Feed
- [ ] Chronological feed aggregating submissions from all groups
- [ ] **Feed Card anatomy:**
  - User avatar + display name + group tag (pill badge)
  - Activity icon + activity name
  - Submission photo (full-width, rounded 12px, aspect ratio preserved)
  - Title + description preview (truncated to 3 lines, "Read more")
  - Activity-specific summary line (e.g., "Chest & Triceps — 75 min")
  - Relative timestamp ("2 hrs ago")
  - Streak badge ("🔥 Day 14")
  - Reaction bar (5 emojis)
  - Comment count (tap to expand)
- [ ] Feed filters: All (default), By Group (dropdown), By Activity type
- [ ] Empty state: Volt looking bored, CTA "Be the first to submit today 👊"
- [ ] Pull-to-refresh with satisfying bounce animation
- [ ] Infinite scroll with pagination (20 items per page)

### 7.2 Today Banner
- [ ] Horizontal scroll at top of Home Feed
- [ ] Shows all active activities for today: icon + name + status indicator
  - ✅ Green checkmark if submitted
  - 🟠 Orange dot if pending
- [ ] Tap any pending activity → launches submission flow for that activity
- [ ] Sticky at top with slight blur backdrop

### 7.3 Reactions System
- [ ] 5 emoji reactions: 🔥 Fire, 💪 Flex, 👏 Clap, ❤️ Heart, 💯 100
- [ ] Tap once to react (emoji bounces + count increments with animation)
- [ ] Tap again to un-react
- [ ] One reaction type per user per submission
- [ ] Reaction counts shown under submission
- [ ] Tap count → bottom sheet shows who reacted with what (avatar + name + emoji)
- [ ] Real-time sync via Firestore `/reactions/{submissionId}/users/{userId}`

### 7.4 Comments System
- [ ] Tap comment icon → expandable comment section below submission
- [ ] Comment input: text field + send button
- [ ] Comment display: avatar + name + text + relative timestamp
- [ ] @mention support: type `@` → member autocomplete dropdown
- [ ] Comments visible to all group members
- [ ] Firestore collection: `/comments/{submissionId}/list/{commentId}`
- [ ] Real-time listener for new comments

### 7.5 Nudge System
- [ ] "Nudge" button appears on member card in Group > Members tab if:
  - It's past noon AND the member hasn't submitted today
- [ ] Sending nudge:
  - Lightning bolt animation shoots across sender's screen
  - Push notification to recipient: "Riya just nudged you. She believes in you more than you do 😤"
  - 4-hour cooldown per recipient per day (prevents spam)
- [ ] If recipient submits within 2 hours of nudge → nudger earns "Hype Man" XP bonus (+15 XP)
- [ ] Store nudges in Firestore `/nudges/{recipientId}/queue/`

### 7.6 Weekly Wrap-Up Card
- [ ] Auto-generated every Sunday at 7 PM (Supabase scheduled Edge Function)
- [ ] Per group per activity:
  - Group name + activity
  - Each member's week: days submitted, streak, XP earned
  - MVP of the week (most consistent member)
- [ ] Rendered as a shareable PNG card
- [ ] "Share to Instagram Stories / WhatsApp" export button
- [ ] Card stored in Supabase Storage for re-access

---

## Phase 8: Gamification & Rewards
**Duration:** 1.5 weeks

### 8.1 XP Engine
- [ ] Implement XP formula (Appendix A from PRD):
  ```
  base_xp = 50
  photo_bonus = mediaUrl ? 20 : 0
  description_bonus = (title && description) ? 10 : 0
  early_bird_bonus = submittedHour < 12 ? 15 : (submittedHour >= 22 ? 5 : 0)
  reaction_bonus = reactions >= 3 ? 10 : 0
  streak_multiplier = streak >= 30 ? 2.0 : streak >= 14 ? 1.5 : streak >= 7 ? 1.2 : 1.0
  total_xp = Math.round((base + photo + desc + early + reaction) * streak_multiplier)
  ```
- [ ] XP awarded via Supabase Edge Function on submission create
- [ ] Reaction bonus recalculated when 3rd reaction lands (Edge Function trigger)
- [ ] XP chip animation on earn: slides up from bottom, shows "+XX XP 🔥", fades after 2s

### 8.2 Leveling System
- [ ] 7 levels with XP thresholds (from PRD):
  - L1 Newcomer (0) → L2 Consistent (500) → L3 Grinder (1,500) → L4 Hustler (3,500) → L5 Dedicated (7,000) → L6 Elite (15,000) → L7 Legend (30,000)
- [ ] Level progress bar on profile (animated fill)
- [ ] Level-up: full-screen celebration animation (Lottie: stars burst + level name + Volt dancing)
- [ ] Level badge shown next to username everywhere

### 8.3 Badges & Achievements
- [ ] Implement all badge categories from PRD Section 7.7:
  - **Streak Badges** (5): First Flame, Charged, Diamond Grinder, Unstoppable, Legend
  - **Activity Badges** (4): Iron Body, Scholar, Algorithm Brain, Road Runner
  - **Social Badges** (3): Hype Man, Team Captain, Coach
  - **Special Badges** (4): Early Bird, Night Owl, Shield Bearer, Comeback Kid
- [ ] Badge unlock detection via Supabase database triggers / Edge Functions
- [ ] Unlock notification: push + in-app toast with badge icon and name
- [ ] Badge display: earned = full color + glow; unearned = greyscale + locked icon (completionist UX)

### 8.4 Weekly Challenges
- [ ] Auto-generate group challenge every Monday (Supabase scheduled function):
  - Random selection from pool: "Submit 5/7 days", "All members submit same day", "Perfect week"
- [ ] Custom challenge creation by any group member:
  - Challenge name, condition text, deadline
  - Prize: bragging rights + special badge (v1)
- [ ] Challenge card in Group Home → shows progress bar, participants, deadline countdown
- [ ] Challenge completion: confetti + badge earn

### 8.5 Leaderboard
- [ ] Group leaderboard: ranked by total XP this month
- [ ] Animated bar chart with member avatars
- [ ] Monthly reset with "Last month's champion" highlight
- [ ] Rank change indicators (↑2, ↓1, →)

---

## Phase 9: Notifications & User Profile
**Duration:** 1.5 weeks

### 9.1 Push Notification System
- [ ] Expo Notifications + FCM integration
- [ ] Implement all notification types from PRD Section 7.8:
  - Daily Reminder, Teammate Submitted, Streak At Risk, Streak Broken, Streak Milestone, Nudge Received, Reaction Received (batched), Comment Received, New Group Member, Weekly Wrap-up, Badge Earned, Level Up, Shield Earned
- [ ] Notification scheduling: Daily reminders via Supabase pg_cron, real-time via FCM triggers
- [ ] Casual, motivating copy tone (never guilt-driven)
- [ ] Notification personalization settings:
  - Per-type toggles
  - Per-activity granularity
  - Quiet hours (start/end time picker)
  - Weekend mode (separate Sat/Sun settings)

### 9.2 In-App Notification Center
- [ ] Bell icon in header with unread count badge
- [ ] Notification list: icon + title + body + timestamp + read/unread indicator
- [ ] Tap notification → deep link to relevant screen (submission, group, profile)
- [ ] "Mark all as read" action
- [ ] Firestore collection: `/notifications/{userId}/list/`

### 9.3 User Profile Screen
- [ ] **Header section:**
  - Avatar (tappable to edit)
  - Display name + @username
  - Level badge + XP progress bar to next level (animated)
  - Total shields remaining (shield icon + count)
  - "Edit Profile" button
- [ ] **Stats overview row:** Total submissions | Longest streak | Total XP | Badges earned (4 stat cards with icons)
- [ ] **Active Streaks:** Horizontal scroll of activity cards with current streaks and animated flame icons
- [ ] **Achievements Grid:** Grid of all badges — earned (full color + glow) and unearned (greyscale + lock)
- [ ] **Activity History:** Filterable list of all submissions (by activity, by date range) — tap to re-view
- [ ] **Year in Review (GitHub-style):** 365-day heat map of submission density
- [ ] **Groups:** List of all groups with quick-navigate
- [ ] **Public Profile:** Read-only view accessible by group members (stats + badges only)

### 9.4 Settings Screen
- [ ] **Account:** Edit profile, change email/password, linked accounts (Google), delete account (30-day recovery flow)
- [ ] **Notifications:** All toggles from 9.1
- [ ] **Appearance:** Dark/Light/System toggle, Volt mascot on/off, reduced motion toggle
- [ ] **Privacy:** Profile visibility (group members only / public), submission visibility
- [ ] **Data & Storage:** Clear cached images, view storage usage, export data (JSON download)
- [ ] **About:** Version, changelog, licenses, Terms of Service, Privacy Policy, Send feedback, Report bug

---

## Phase 10: Polish, Testing & Launch Prep
**Duration:** 2 weeks

### 10.1 Animation & Motion Polish
- [ ] Implement all motion language from PRD Section 5.6:
  - Submission success: confetti burst + bouncing XP chip (react-native-reanimated)
  - Streak milestones: fire animation + full-screen flash (Lottie)
  - Streak break: shake animation + grey-out of streak counter
  - Nudge sent: lightning bolt shoots across screen
  - Day complete: card flip from "pending" to "done"
- [ ] Level-up celebration: full-screen Lottie animation
- [ ] Micro-interactions: button press scale, haptic feedback on key actions, tab switch animations
- [ ] Loading state animations: skeleton shimmer on all content areas
- [ ] Volt mascot reactions: jumping (submission), sleeping (overdue), celebrating (milestones) — toggleable

### 10.2 Accessibility Compliance
- [ ] All interactive elements: minimum 44×44pt tap targets
- [ ] Icons always accompanied by semantic meaning (not color-only status indicators)
- [ ] Reduced motion mode: replace all animations with simple fades
- [ ] Font scaling: verify UI doesn't break at 140% system font size
- [ ] Screen reader labels (accessibilityLabel) on all icon buttons, cards, and status indicators
- [ ] Contrast ratio check: all text meets WCAG AA (4.5:1 minimum)
- [ ] Test with VoiceOver (iOS) and TalkBack (Android)

### 10.3 Performance Optimization
- [ ] Image optimization: lazy loading with progressive JPEG placeholders
- [ ] List virtualization: FlatList with `getItemLayout`, `removeClippedSubviews`, `windowSize` tuning
- [ ] Bundle size analysis and tree-shaking
- [ ] Hermes engine optimization for Android
- [ ] Memory profiling with React Native DevTools
- [ ] Network request optimization: batch API calls, connection pooling
- [ ] Cache strategy: TanStack Query stale times tuned per data type (feed = 30s, profile = 5min, calendar = 1min)

### 10.4 Testing
- [ ] **Unit tests:** Jest + React Native Testing Library for all utility functions, hooks, and components
- [ ] **Integration tests:** Test flows — auth, submission, streak calculation, XP award
- [ ] **E2E tests:** Detox for critical user flows (onboarding → join group → submit → view calendar)
- [ ] **Backend tests:** Supabase Edge Function tests, RLS policy tests
- [ ] **Manual QA:** Device testing matrix (iPhone 12-16, Pixel 6-8, Samsung S23-S25)
- [ ] **Accessibility testing:** VoiceOver + TalkBack walkthrough of all screens
- [ ] **Offline testing:** Airplane mode submission queue, reconnection sync

### 10.5 App Store Preparation
- [ ] App icons: generate all required sizes (Expo handles most via `app.json`)
- [ ] Screenshots: 6.7" (iPhone 15 Pro Max), 6.1" (iPhone 15 Pro), 12.9" (iPad) — design marketing screenshots
- [ ] App Store description, keywords, categories
- [ ] Play Store listing: feature graphic, description, content rating
- [ ] Privacy policy and Terms of Service pages (hosted on web)
- [ ] EAS Build configuration: production build profiles for iOS and Android
- [ ] TestFlight / Internal testing track setup for beta distribution

### 10.6 Launch Checklist
- [ ] All Supabase RLS policies audited
- [ ] Firestore security rules audited
- [ ] Rate limiting configured (100 req/min per user)
- [ ] Error tracking: Sentry integration verified
- [ ] Analytics: PostHog events for all KPIs from PRD Section 16
- [ ] Monitoring dashboard for activation, engagement, and social metrics
- [ ] Backup strategy documented
- [ ] Incident response playbook created

---

## Additional Features (Beyond PRD v1.0)

### Bonus: Smart Defaults & UX Enhancements
- [ ] **Submission time intelligence:** Track user's typical submission times and adjust reminder timing
- [ ] **Activity suggestions:** Based on what's trending among similar-age groups
- [ ] **Streak recovery encouragement:** When a streak breaks, show "X users recovered a longer streak today" to reduce churn
- [ ] **Group activity heatmap:** Overview of which activities get the most engagement in a group
- [ ] **Quick reactions from notifications:** React to submissions directly from push notification (iOS actionable notifications)
- [ ] **Haptic feedback:** Subtle haptics on submission success, streak milestone, reaction tap

### Bonus: Progressive Web App (PWA) Landing Page
- [ ] Marketing landing page at streakpact.app
- [ ] App Store / Play Store badges
- [ ] Feature showcase with animated screenshots
- [ ] "Enter invite code" web flow that redirects to app or app store

---

## Resolved Decisions

> [!TIP]
> **1. Backend: Supabase + Firebase hybrid ✅ APPROVED.** No NestJS server needed. Supabase handles relational data + storage, Firebase handles real-time + auth + push notifications. Zero hosting costs.

> [!TIP]
> **2. Volt mascot: Placeholder character for v1 ✅.** Use a simple placeholder animation for now. Architecture will support swapping in custom Lottie animations later when commissioned.

> [!TIP]
> **3. Image storage: Use Cloudinary CDN layer ✅.** Compress images to ~200KB and serve via Cloudinary free tier (25 credits/mo). Supabase Storage as origin, Cloudinary as CDN with auto-optimization. This extends capacity significantly.

> [!TIP]
> **4. QR code: Include in v1 ✅.** QR code scanning included since Expo Camera permissions are lightweight and the feature adds polish to the invite flow.

## Verification Plan

### Automated Tests
- `npm test` — Jest unit/integration test suite
- `npm run test:e2e` — Detox E2E flows
- `npm run lint` — ESLint + TypeScript checks

### Manual Verification
- Test on physical iPhone + Android device
- Complete flow: install → onboard → create group → invite friend → submit → view calendar → check streaks
- Offline mode: submit while airplane mode, reconnect, verify sync
- Notification testing: verify all 13 notification types fire correctly
