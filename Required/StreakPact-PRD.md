# StreakPact — Product Requirements Document

**Version:** 1.0  
**Date:** August 2026  
**Author:** Rishabh  
**Status:** Draft  
**App Type:** Cross-Platform Mobile (iOS + Android)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Vision & Goals](#3-product-vision--goals)
4. [Target Audience](#4-target-audience)
5. [App Branding & Identity](#5-app-branding--identity)
6. [Feature Overview (MoSCoW)](#6-feature-overview-moscow)
7. [Detailed Feature Specifications](#7-detailed-feature-specifications)
   - 7.1 Onboarding & Authentication
   - 7.2 Home Feed
   - 7.3 Groups & Teams
   - 7.4 Activity System
   - 7.5 Submission System
   - 7.6 Calendar & Tracker View
   - 7.7 Gamification System
   - 7.8 Notification System
   - 7.9 User Profile & Stats
   - 7.10 Social Features
   - 7.11 Settings & Preferences
8. [Built-In Activity Templates](#8-built-in-activity-templates)
9. [User Flows](#9-user-flows)
10. [UI/UX Design System](#10-uiux-design-system)
11. [Technical Architecture](#11-technical-architecture)
12. [Data Models & Schema](#12-data-models--schema)
13. [API Design](#13-api-design)
14. [Security & Privacy](#14-security--privacy)
15. [Edge Cases & Error Handling](#15-edge-cases--error-handling)
16. [Success Metrics & KPIs](#16-success-metrics--kpis)
17. [Future Roadmap (v2+)](#17-future-roadmap-v2)

---

## 1. Executive Summary

**StreakPact** is a social accountability mobile application that allows two people or a group to track shared activities together in a fun, interactive, and mutually verifiable way. Users create or join "pacts" — shared activity groups — where they log daily proof of their progress (gym sessions, study hours, LeetCode problems, etc.), react to each other's submissions, and keep a visible streak going side-by-side. The app blends the discipline of habit tracking with the social energy of a competitive feed, making it feel more like a game and less like a chore log.

**Core Value Proposition:** *"You're more likely to show up when someone's watching — and when you're watching them back."*

---

## 2. Problem Statement

Most habit tracking apps are solo endeavors. They track your behavior in isolation, which makes it easy to silently quit without consequence. At the same time, holding each other accountable informally via WhatsApp or in person is inconsistent — people forget, lose track, or ghost.

**Key pain points:**
- No lightweight way to track the same activity with a friend and verify each other's consistency.
- Proof of effort is scattered across DMs, Instagram stories, and group chats.
- Standard streak apps don't have social accountability built in.
- There's no fun, gamified layer that makes showing up feel rewarding.
- Group activity data is never centralized or visible to everyone in the team.

---

## 3. Product Vision & Goals

**Vision:** Build the go-to accountability companion for friends who grind together — a space where effort is visible, progress is shared, and consistency is celebrated.

**Primary Goals (v1.0):**
- Allow 2–6 users to track shared activities with daily proof submissions.
- Show a live, comparative calendar/streak view for all members in a group.
- Make the submission experience quick, expressive, and rich (photo, description, activity-specific fields).
- Add a gamified layer (XP, streaks, badges, shields) that incentivizes consistency.

**Secondary Goals:**
- Make it feel like a social app, not a productivity app.
- Minimize friction: a full submission should take under 90 seconds.
- Support full customization — any activity, any rules, any team size.

---

## 4. Target Audience

**Primary:** Gen-Z and Millennials (17–27 years old) who have shared goals with a friend, partner, or study group — students, gym beginners, developers doing daily coding, book clubs.

**Secondary:** Gym duos, couples doing wellness challenges, study partners, developer communities doing code streaks.

**Persona 1 — The Study Grinder:**
Riya (21, Engineering student) and her roommate started a daily study-for-2-hours pact. She wants to see if her roommate actually studied without having to ask, and she wants to be held accountable herself.

**Persona 2 — The Gym Duo:**
Arjun (23, works out with his friend) wants to keep track of who went to the gym and what they trained, and see if his buddy is consistent or making excuses.

**Persona 3 — The LeetCode Grinder:**
Dev (22, preparing for SDE placements) and two classmates are solving one problem a day. They want a streak tracker and a way to see what problems each other solved.

---

## 5. App Branding & Identity

### 5.1 Working Title
**StreakPact** — a pact to keep your streak. Communicates both the commitment (pact) and the mechanic (streak). Clean, memorable, and modern.

*Alternative names to explore: PactUp, BuddyStreak, Commitly, GrindPact.*

### 5.2 Brand Personality
- **Energetic but not aggressive.** Motivating, not guilt-tripping.
- **Playful with substance.** Fun animations and micro-interactions, but serious tracking underneath.
- **Honest.** Shows both your wins and gaps without sugarcoating.
- **Personal.** Feels like it's built for your specific crew, not a generic audience.

### 5.3 Mascot
A small animated character — a lightning bolt with arms called **"Volt"** — that reacts to user submissions: jumping when you submit, sleeping when you're overdue, celebrating at milestones. Optional and togglable, but adds a distinctive personality layer.

### 5.4 Color System

| Token | Hex | Usage |
|---|---|---|
| `--brand-primary` | `#6D28D9` | CTAs, active tabs, highlights |
| `--brand-secondary` | `#F97316` | Streak fire, XP, energy |
| `--success` | `#10B981` | Submitted days, verified |
| `--warning` | `#FBBF24` | Pending, grace period |
| `--danger` | `#EF4444` | Missed days, broken streak |
| `--surface-dark` | `#111827` | Dark mode background |
| `--surface-card` | `#1F2937` | Card backgrounds |
| `--text-primary` | `#F9FAFB` | Primary text |
| `--text-muted` | `#9CA3AF` | Secondary text |

Light mode mirrors these with inverted surface values (#FFFFFF, #F3F4F6, etc.).

### 5.5 Typography

- **Display/Headings:** `Poppins Bold` — punchy, modern, young energy
- **Body:** `Inter Regular/Medium` — clean readability
- **Data/Numbers:** `JetBrains Mono` — for streak counts, XP, problem numbers; gives a coder aesthetic
- **Captions:** `Inter Regular`, 12px, `text-muted`

### 5.6 Motion Language
- Submission success: confetti burst + bouncing XP chip
- Streak milestones: fire animation + full-screen flash
- Streak break: shake animation + grey-out of the streak counter
- Nudge sent: lightning bolt shoots across screen
- Day complete: card flips from "pending" to "done" with a satisfying flip

---

## 6. Feature Overview (MoSCoW)

### Must Have (v1.0)
- User authentication (email + Google OAuth)
- Group creation, invite via code/link
- Activity creation (preset templates + custom)
- Daily proof submission (photo, title, description, activity fields)
- Calendar/tracker view per activity per user
- Streak counter per user per activity
- Real-time feed of group submissions
- Reactions to submissions (emoji)
- Push notifications (submission reminders, teammate submitted)
- User profile with stats

### Should Have (v1.0)
- Comment on submissions
- Nudge teammate (if they haven't submitted)
- XP and leveling system
- Badges and achievements
- Streak Shields
- Rest day declarations
- Activity-specific fields (gym muscle groups, LC difficulty, etc.)

### Could Have (v1.5)
- Weekly wrap-up summary card
- Leaderboard (within group, and optionally global)
- Activity rules & admin controls
- Progress photo timeline (gym long-term before/after)
- Apple Health / Google Fit integration
- Home screen widget (iOS/Android)

### Won't Have (v1.0)
- Public/discovery feed
- Monetization layer
- Video proof (storage constraints — v2)
- In-app messaging (WhatsApp already exists)

---

## 7. Detailed Feature Specifications

---

### 7.1 Onboarding & Authentication

**Screens:**
1. Splash Screen — animated Volt mascot + app name
2. Welcome Screen — brief 3-slide value prop carousel (animated, skippable)
3. Sign Up / Login — Email + Google OAuth
4. Username Setup + Avatar picker (12 preset avatars or camera upload)
5. "Start a Pact or Join One" decision screen

**Auth Flow:**
- Email/password registration with email verification
- Google OAuth (single tap)
- JWT-based session, refresh tokens persisted in secure storage
- Biometric login (Face ID / Fingerprint) on subsequent logins — togglable

**Username Rules:** 3–20 chars, alphanumeric + underscores, unique.

**Deep Link Handling:**
- Opening an invite link (`streakpact://invite/CODE`) while not logged in → stores the invite code → redirects to signup → auto-joins after auth.

---

### 7.2 Home Feed

The home feed is the daily landing screen. It aggregates submissions from all groups the user is part of, sorted chronologically (newest first).

**Feed Card Anatomy:**
- User avatar + name + group tag
- Activity icon + name
- Submission photo (if provided) — full-width, rounded
- Title + description preview
- Activity-specific summary (e.g., "Chest & Triceps — 75 min")
- Timestamp + relative time ("2 hrs ago")
- Streak badge ("🔥 Day 14")
- Reaction bar (fire, clap, 100, flex, heart — tap to react)
- Comment count (tap to expand)

**Feed Filters:**
- All (default)
- By Group (dropdown)
- By Activity type

**Empty State:**
- Illustrated Volt looking bored
- CTA: "Be the first to submit today 👊"

**Pull-to-refresh** with a satisfying animation.

**Today Banner (top of feed):**
- Shows a horizontal scroll of all your active activities for today with a green checkmark if submitted, orange dot if pending. Tap any to quick-submit.

---

### 7.3 Groups & Teams

**Groups Screen:**
Lists all groups the user belongs to. Each card shows:
- Group name + avatar/emoji
- Member avatars (stacked)
- Active activities count
- Today's submission status: "X/N submitted today"
- Quick action: Tap to open group, long-press to leave

**Creating a Group:**
1. Set group name (max 30 chars)
2. Pick group emoji/avatar
3. Choose starting activities (from templates or create new)
4. Set group "vibe" (optional flavor: 🔥 Hustle Mode, 📚 Study Mode, 💪 Gym Pact, 🎯 Custom)
5. Get an invite code (6-char alphanumeric) + shareable deep link
6. Optionally set group goal description (displayed on group home)

**Joining a Group:**
- Enter invite code manually
- Tap a shared deep link (auto-fills)
- QR code scan

**Group Home Screen (inside a group):**
- Header: Group name, member avatars, "X-day group streak" (if all members submitted)
- Tabs: Feed | Activities | Members | Leaderboard
  - **Feed tab:** Group-specific submission feed
  - **Activities tab:** All activities in this group + individual streaks per member per activity
  - **Members tab:** Member list with their XP, level, streak status, and "Nudge" button
  - **Leaderboard tab:** Ranked by total XP in this group this month

**Group Roles:**
- **Admin (creator):** Can add/remove activities, rename group, remove members, set rules
- **Member:** Can submit, react, comment, nudge

**Group Settings (Admin only):**
- Rename group, change avatar
- Add/archive activities
- Set submission window (default: 12:00 AM – 11:59 PM)
- Allow rest days (0–2 per week, configurable per activity)
- Require photo proof (toggle)
- Enable group streak (all-or-nothing streak that counts only if everyone submits)

**Max group size:** 6 members in v1 (expandable in v2).

---

### 7.4 Activity System

Activities are the trackable behaviors within a group. Each activity runs on a daily cadence.

**Activity Types:**
- **Preset Templates:** Gym, Study, LeetCode, Running, Reading, Meditation, Language Learning, Water Intake, Cold Shower, Sleep (see Section 8 for full templates)
- **Custom:** User-defined with custom fields, icon, and color

**Activity Card (in Activities tab):**
- Activity icon + name
- Color-coded header
- Member streak grid (each member's current streak + today's status icon)
- "Submit for today" CTA button

**Creating a Custom Activity:**
1. Name the activity (e.g., "Daily Journaling")
2. Choose icon (from 60+ icon set) and color
3. Set frequency: Daily / Specific days (Mon-Sun multi-select) / X days per week
4. Add custom fields:
   - **Text input** (e.g., "What did you journal about?")
   - **Number input** (e.g., "Pages written")
   - **Multi-select chips** (e.g., mood options)
   - **Single select** (e.g., difficulty)
   - **Toggle** (e.g., "Did you meditate after?")
5. Require photo? (toggle)
6. Set rest days for this activity

**Activity Archiving:**
Activities can be archived by the group admin (hidden from active view, historical data preserved).

---

### 7.5 Submission System

This is the highest-engagement part of the app. The submission flow must be quick, fun, and expressive.

**Trigger Points:**
- "Submit" button on a specific activity card
- Tapping an orange pending dot in the Today Banner
- "+" FAB on home screen → selects activity

**Submission Flow (screen-by-screen):**

**Step 1 — Camera / Photo (optional but encouraged)**
- Camera opens by default (with option to pick from gallery)
- Overlay shows the activity name
- Skip photo option always visible
- Compact cropper (1:1 or 4:5 ratio)
- Photo is auto-compressed (max 800KB upload)

**Step 2 — Activity-Specific Fields**
- Dynamically rendered based on the activity template
- For gym: muscle group multi-select chips (Chest, Back, Arms, Legs, Shoulders, Core, Cardio, Full Body), workout duration (number), session notes (text, optional)
- Fields marked required are validated on proceed
- All fields are optional if not marked required

**Step 3 — Title + Description**
- Title: short summary (e.g., "Push day done 💪") — optional but encouraged
- Description: free-form text (e.g., thoughts on the session) — optional
- Character limits: Title 80 chars, Description 500 chars

**Step 4 — Confirm & Submit**
- Preview card showing photo, title, activity summary
- "Submit StreakPact 🚀" button (big, primary CTA)
- On submit: confetti burst animation + XP gained notification chip slides up ("+ 60 XP 🔥")
- Volt mascot cheers

**Submission Editing:**
- User can edit their own submission within 1 hour of posting (title, description, and fields only — photo cannot be swapped).

**Submission Deletion:**
- User can delete own submission within 24 hours. Doing so breaks the streak for that day.

**One submission per activity per day** per user (edit is allowed, not replacement).

---

### 7.6 Calendar & Tracker View

The calendar is the accountability core of the app. It answers "who showed up and when."

**Access:** Via an activity's detail screen → "Calendar" tab.

**Layout — Group Calendar View:**
- Month grid at the top (standard calendar layout, current month by default)
- Each day cell shows:
  - A colored dot per group member (stacked vertically or as a small grid)
  - **Green dot:** Submitted
  - **Red dot:** Missed (day has passed, no submission)
  - **Orange dot:** Pending (today, not yet submitted)
  - **Grey dot:** Scheduled rest day
  - **Purple dot:** Activity not active that day (e.g., Sunday if activity is Mon–Fri)
- Tap any day → bottom sheet expands showing all submissions from group members for that day (with their photo, title, and activity data)

**Streak Summary Bar (below calendar):**
- For each member: avatar, name, current streak 🔥, longest streak, total submissions
- Sorted by current streak (desc)

**Comparative View (2-person pact):**
- Special side-by-side view for 2-person groups
- Two mini calendars side by side, each member's calendar highlighted
- Streak battle: "You're ahead by 3 days" / "Tied! 🏆"

**Navigation:**
- Swipe left/right to move between months
- "Today" button to return to current month
- Year overview: condensed 12-month grid showing consistency pattern (inspired by GitHub contribution graph)

---

### 7.7 Gamification System

Gamification makes the difference between an app people use for a week and one they return to every day.

#### XP (Experience Points)

**Earning XP:**
| Action | XP |
|---|---|
| Submit on time | +50 |
| Add photo proof | +20 |
| Add title + description | +10 |
| Submit before noon (Early Bird) | +15 |
| Submit after 10 PM (Night Owl) | +5 |
| Receiving 3+ reactions | +10 |
| Leaving a comment on teammate's post | +5 |
| Nudging a teammate (who then submits) | +15 |
| 7-day streak milestone | +100 bonus |
| 30-day streak milestone | +500 bonus |

**XP Multipliers (Streak Bonus):**
- Day 1–6: 1.0x
- Day 7–13: 1.2x
- Day 14–29: 1.5x
- Day 30+: 2.0x

#### Levels

| Level | Name | XP Required |
|---|---|---|
| 1 | Newcomer | 0 |
| 2 | Consistent | 500 |
| 3 | Grinder | 1,500 |
| 4 | Hustler | 3,500 |
| 5 | Dedicated | 7,000 |
| 6 | Elite | 15,000 |
| 7 | Legend | 30,000 |

Level-up triggers a full-screen celebration animation.

#### Badges

**Streak Badges (per activity):**
- 🔥 First Flame — 7-day streak
- ⚡ Charged — 14-day streak
- 💎 Diamond Grinder — 30-day streak
- 👑 Unstoppable — 60-day streak
- 🌟 Legend — 100-day streak

**Activity Badges:**
- 💪 Iron Body — 30 gym submissions
- 📚 Scholar — 30 study submissions
- 🧠 Algorithm Brain — 50 LeetCode submissions
- 🏃 Road Runner — 20 running submissions

**Social Badges:**
- 🤜 Hype Man — reacted to 50 teammate submissions
- 👊 Team Captain — sent 20 nudges that resulted in submissions
- 💬 Coach — left 30 comments

**Special Badges:**
- 🌅 Early Bird — submitted before 8 AM ten times
- 🦉 Night Owl — submitted after 11 PM ten times
- 🛡️ Shield Bearer — saved a streak with a Streak Shield
- 💥 Comeback Kid — resumed a streak after missing 3+ days

#### Streak Shields

Streak Shields protect your streak when you accidentally miss a day.

- **Earning:** 1 shield every 7 consecutive submission days
- **Max stockpile:** 3 shields
- **Using:** If you missed yesterday's submission, a modal appears when you open the app: "Use a Streak Shield to protect your streak? You have X shields." Auto-applied or manual.
- **Rule:** A shield can only protect 1 missed day per activity per week. Cannot be stacked for consecutive misses.
- **Visual:** Shield icon with count displayed on each activity card and on profile.

#### Streak Freeze (Rest Days)

- Users can declare a rest day for a specific activity (e.g., "No gym today — rest day")
- Rest day does not break the streak, but also does not increment it
- Each activity can have 0–2 allowed rest days per week (set by group admin)
- Rest day must be declared before midnight of that day (cannot be backdated)
- Shown on calendar as a grey dot with a 🛌 icon

#### Weekly Challenges

Every Monday, a new group challenge auto-generates:
- "Submit 5 out of 7 days this week"
- "All members submit on the same day"
- "Get a perfect week (all activities, all days)"

Custom challenges can be created by any group member:
- Challenge name
- Condition (e.g., "First to 10 gym sessions this month wins")
- Prize: just bragging rights + a special badge in v1
- Deadline

---

### 7.8 Notification System

Notifications are the re-engagement backbone. They must be helpful and timely, not spammy.

**Notification Types:**

| Notification | Trigger | Timing |
|---|---|---|
| Daily Reminder | User hasn't submitted by chosen time | User-set time (default 8 PM) |
| Teammate Submitted | Group member posts a submission | Real-time |
| Streak At Risk | User hasn't submitted, within 3 hrs of midnight | 9 PM if not submitted |
| Streak Broken | Day ends without submission | 12:01 AM |
| Streak Milestone | User hits 7/14/30/60/100 days | On milestone |
| Nudge Received | Teammate sends a nudge | Real-time |
| Reaction Received | Someone reacts to your submission | Batched per 30 min |
| Comment Received | Someone comments on submission | Real-time |
| New Group Member | Someone joins your group | Real-time |
| Weekly Wrap-up | Sunday evening | 7 PM Sunday |
| Badge Earned | Achievement unlocked | Instant |
| Level Up | XP threshold crossed | Instant |
| Shield Earned | 7-day streak completed | Instant |

**Notification Personalization:**
- Users can toggle each notification type on/off
- Per-activity granularity (e.g., "Remind me for LeetCode but not for gym")
- Quiet hours: set start and end time for no notifications
- Weekend mode: optional separate settings for Sat/Sun

**Notification Copy Tone:**
Casual and motivating, never guilt-driven:
- ✅ "Arjun just crushed his chest day 💪 You're next."
- ✅ "🔥 Don't break the 12-day streak — 3 hours left!"
- ✅ "Riya just nudged you. She believes in you more than you do 😤"
- ❌ Never: "You failed to log today." "You're falling behind."

---

### 7.9 User Profile & Stats

**Profile Screen Sections:**

**Header:**
- Avatar (editable)
- Display name + username
- Level badge + XP progress bar to next level
- Total shields remaining
- Edit Profile button

**Stats Overview Row:**
- Total submissions | Longest streak | Total XP | Badges earned

**Active Streaks:**
- Horizontal scroll of all activities with current streaks and flame icons

**Achievements Grid:**
- All earned badges displayed, unearned shown as locked (greyscale) — gives completionist motivation

**Activity History:**
- Filterable list of all submissions across all activities
- Tap any submission to re-view it

**Year in Review (GitHub-style contribution graph):**
- Heat map of submission density across 365 days (all activities combined)
- Green intensity = number of activities submitted that day

**Groups:**
- List of all groups user is part of

**Public Profile:**
- Other users can view your profile from within a group (read-only view of stats and badges)

---

### 7.10 Social Features

#### Reactions

5 emoji reactions on any submission:
- 🔥 Fire (default, the most common)
- 💪 Flex
- 👏 Clap
- ❤️ Heart
- 💯 100

Tap once to react, tap again to remove. A user can only leave one reaction type per submission. Reaction count is shown under the submission. Tapping the count shows who reacted with what.

#### Comments

- Text comments on submissions
- Comment shows user avatar + name + text + timestamp
- @mention support within the group
- Comments are visible to all group members

#### Nudge

If a teammate hasn't submitted today and it's past noon, a "Nudge" button appears on their member card in the group view.

- Sending a nudge triggers a push notification to them with your name
- Nudge has a 4-hour cooldown per recipient per day (no spam)
- "Nudge" animations: lightning bolt shoots across screen for sender, pop-in on recipient's app
- If the recipient submits within 2 hours of a nudge, the nudger earns the "Hype Man" XP bonus

#### Weekly Wrap-Up Card

Every Sunday at 7 PM, the app generates a shareable summary card per group per activity:
- Group name + activity
- Each member's week: days submitted, streak, XP earned
- MVP of the week (most consistent)
- "Share to Instagram Stories / WhatsApp" export (PNG card)

---

### 7.11 Settings & Preferences

**Account:**
- Edit profile (name, username, avatar, bio)
- Change email / password
- Linked accounts (Google)
- Delete account (with confirmation flow + 30-day recovery window)

**Notifications:**
- Per-type toggles (as described in 7.8)
- Quiet hours
- Weekend mode

**Appearance:**
- Dark mode / Light mode / System default
- Mascot (Volt) on/off
- Reduced motion toggle (accessibility)

**Privacy:**
- Profile visibility: Group members only (default) / Public
- Submission visibility: Group members only

**Data & Storage:**
- Clear cached images
- View storage usage
- Export your data (JSON download)

**Integrations (v1.5):**
- Apple Health / Google Fit
- Export to Google Sheets

**About:**
- Version, changelog, licenses
- Terms of Service, Privacy Policy
- Send feedback / Report a bug

---

## 8. Built-In Activity Templates

Each template defines its dynamic form fields shown during submission.

---

### 🏋️ Gym / Workout

**Fields:**
- Muscle groups trained (multi-select chips): Chest, Back, Arms, Shoulders, Core, Legs, Cardio, Full Body
- Session duration (number, minutes)
- Session type (single select): Strength, Hypertrophy, Endurance, Mobility, CrossFit
- Notes (text, optional)
- Energy level today (emoji scale: 😴 → 😤)

**Calendar dot:** Purple

---

### 📚 Study Session

**Fields:**
- Subject(s) studied (multi-select): Math, CS, Physics, Chemistry, English, Other (custom text)
- Duration (number, minutes)
- Topics covered (text)
- Resource used (single select): Textbook, YouTube, Notes, Online Course, Other
- Self-rating: How productive was it? (1–5 stars)

**Calendar dot:** Blue

---

### 💻 LeetCode / DSA

**Fields:**
- Problems solved (number)
- Difficulty (multi-select chips): Easy, Medium, Hard
- Topics covered (multi-select): Arrays, Trees, DP, Graphs, Strings, Two Pointers, Sliding Window, Backtracking, Other
- Problem names/links (text, optional)
- Time spent (number, minutes)

**Calendar dot:** Yellow-green

---

### 🏃 Running / Cardio

**Fields:**
- Distance covered (number, km or miles — user preference)
- Duration (number, minutes)
- Route description (text, optional)
- Pace auto-calc (shown if both distance and duration provided)
- Terrain (single select): Road, Track, Trail, Treadmill
- How did it feel? (emoji scale)

**Calendar dot:** Teal

---

### 📖 Reading

**Fields:**
- Book / Article title (text)
- Author (text, optional)
- Pages read (number)
- Cumulative pages (auto-tracked across sessions for same title)
- Key takeaway (text, optional)

**Calendar dot:** Amber

---

### 🧘 Meditation

**Fields:**
- Duration (number, minutes)
- Type (single select): Guided, Breathwork, Silent, Body Scan, Visualization
- Mood before (1–5 slider)
- Mood after (1–5 slider)
- App used (text, optional — e.g., Headspace, Wim Hof)

**Calendar dot:** Lavender

---

### 💧 Water Intake

**Fields:**
- Glasses / liters consumed (number)
- Goal met? (toggle — based on their set daily goal)
- Notes (optional)

**Calendar dot:** Cyan

---

### 🌡️ Cold Shower / Ice Bath

**Fields:**
- Duration (number, seconds or minutes)
- Water temperature (optional, number, °C)
- Difficulty rating today (1–5)

**Calendar dot:** Icy Blue

---

### 🌍 Language Learning

**Fields:**
- Language being learned (text)
- Minutes practiced (number)
- Platform used (single select): Duolingo, Anki, YouTube, Speaking practice, Other
- Skill practiced (multi-select): Reading, Writing, Listening, Speaking, Vocabulary

**Calendar dot:** Green

---

### ⚙️ Custom Activity

**User defines:**
- Activity name (text)
- Icon (picker: 60+ icons)
- Color (picker: 12 preset colors)
- Custom fields (up to 5): each field has a label and a type (text / number / multi-select / toggle / star rating)
- Require photo? (toggle)

---

## 9. User Flows

### 9.1 New User — First Submission Flow
```
App Install
  → Splash Screen
  → Onboarding Slides (3 slides, skippable)
  → Sign Up (Email or Google)
  → Username + Avatar
  → "Join or Create a Pact" screen
    [Option A: Create Group]
      → Name group → Pick emoji → Choose activities
      → Invite screen (code + link)
      → Group Home
    [Option B: Join Group]
      → Enter code or tap shared link
      → Group Home
  → Today Banner shows pending activity
  → Tap activity → Submission Flow
    → Camera (optional)
    → Activity fields
    → Title + Description
    → Submit → Confetti + XP
  → Feed shows their submission
```

### 9.2 Returning User — Daily Loop
```
Open App (or tap notification)
  → Home Feed
  → Today Banner (pending activity dots)
  → Tap pending dot → Quick Submit flow
  → Submit → XP earned
  → Browse feed → React to teammate's post
  → Check calendar → See both streaks
  → App closed
```

### 9.3 Missed Day → Shield Recovery
```
User opens app next morning
  → System detects missed submission yesterday
  → Modal: "You missed yesterday — use a Streak Shield?"
    [Yes] → Shield consumed → Streak preserved → "🛡️ Shield Used! Streak Saved"
    [No]  → Streak breaks → Streak counter resets to 0
             → Encourage message: "Start again today 💪"
```

### 9.4 Group Admin — Create Custom Activity
```
Group Home → Activities Tab → "Add Activity"
  → Choose: Preset Template | Custom
    [Preset] → Pick template → Configure (frequency, rest days)
    [Custom] → Name + Icon + Color → Add fields → Configure
  → Activity appears on all members' dashboards next day
```

---

## 10. UI/UX Design System

### 10.1 Navigation Structure

**Bottom Tab Bar (5 tabs):**
```
[ Home ]  [ Groups ]  [ ⊕ Submit ]  [ Leaderboard ]  [ Profile ]
```
- Center tab (⊕ Submit) is a large, pill-shaped FAB that pops up an activity selector sheet.
- Active tabs use `--brand-primary` with filled icons; inactive use `text-muted` with outline icons.

### 10.2 Screen Architecture

```
App
├── Auth Stack
│   ├── Splash
│   ├── Onboarding
│   ├── Login
│   └── Register
│
└── Main Tab Navigator
    ├── Home (Feed)
    │   └── Submission Detail → Reactions | Comments
    ├── Groups
    │   └── Group Home
    │       ├── Feed Tab
    │       ├── Activities Tab
    │       │   └── Activity Detail → Calendar | Submissions
    │       ├── Members Tab
    │       └── Leaderboard Tab
    ├── Quick Submit (modal overlay)
    │   ├── Activity Selector Sheet
    │   └── Submission Form
    ├── Leaderboard (global XP - future)
    │   └── Your Groups' Leaderboards
    └── Profile
        ├── Edit Profile
        ├── Stats + Badges
        └── Settings
            ├── Notifications
            ├── Appearance
            └── Account
```

### 10.3 Component Patterns

**Cards:** 16px border radius, subtle shadow (elevation 2), slight gradient on header.

**Chips / Tags:** Pill-shaped, 8px border radius, 24px height. Colorful for active/selected, grey outline for unselected.

**Streak Counter:**
- A flame icon (animated flicker when > 0) next to the number
- Grey flame when streak = 0
- Counter uses `JetBrains Mono` for character-specific feel
- Scale up animation on increment

**Activity Status Indicators:**
- ✅ (green checkmark circle) — Submitted today
- 🟠 (orange dot) — Pending, day not over
- ❌ (red X circle) — Missed
- 💤 (grey cloud) — Rest day

**Modals / Bottom Sheets:**
- All secondary interactions use bottom sheets (react-native-bottom-sheet)
- Dragable handle visible
- Backdrop tap to close
- Smooth spring animation

**Loading States:**
- Skeleton screens (not spinners) for feed cards
- Small shimmer on streak numbers while loading

**Empty States:**
- Each empty state has a unique illustration + copy
- Always includes a primary CTA button

### 10.4 Accessibility
- All interactive elements: minimum 44x44pt tap target
- Color not used as the sole status indicator (icons always accompany color)
- Reduced motion mode: replaces animations with simple fades
- Font scaling: UI must not break at 140% font size
- Screen reader labels on all icon buttons

---

## 11. Technical Architecture

### 11.1 Tech Stack

**Frontend:**
- **Framework:** React Native with Expo (Managed Workflow → SDK 53+)
- **Navigation:** React Navigation v7 (Stack + Bottom Tabs)
- **State Management:** Zustand (lightweight, reactive)
- **Server State / Caching:** TanStack Query (React Query)
- **UI Components:** Custom design system + react-native-reanimated for animations
- **Forms:** React Hook Form + Zod validation
- **Real-time:** Firestore real-time listeners
- **Image handling:** Expo ImagePicker + expo-image-manipulator (compression)
- **Notifications:** Expo Notifications + FCM

**Backend:**
- **Runtime:** Node.js (v20 LTS)
- **Framework:** NestJS (TypeScript, modular, scalable)
- **Primary DB:** PostgreSQL (via Prisma ORM) — users, groups, activities, submissions metadata
- **Real-time DB:** Firebase Firestore — feed updates, reactions, comments (low latency)
- **File Storage:** Firebase Storage (submission photos), with CDN via Firebase Hosting
- **Authentication:** Firebase Auth (JWT tokens verified on NestJS side)
- **Push Notifications:** FCM (via firebase-admin SDK)
- **Task Queue:** BullMQ + Redis — for scheduled notifications, weekly wrap-ups, XP calculations
- **Caching:** Redis — streak data, leaderboard, XP totals

**Infrastructure:**
- **Hosting:** Railway (backend) or Render — easy deployment for solo dev
- **Database Hosting:** Supabase (managed PostgreSQL) or Neon
- **CDN:** Firebase Hosting for media
- **Monitoring:** Sentry (error tracking), Posthog (product analytics)
- **CI/CD:** GitHub Actions → Expo EAS Build

### 11.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  React Native (Expo)                    │
│    Zustand │ TanStack Query │ React Navigation           │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / REST
          ┌──────────────▼──────────────────┐
          │      NestJS API Gateway         │
          │  Auth middleware (Firebase JWT) │
          └─────┬───────────┬──────────────┘
                │           │
    ┌───────────▼──┐   ┌────▼──────────────┐
    │ PostgreSQL   │   │ Firebase Services  │
    │ (Prisma ORM) │   │ ┌──────────────┐  │
    │              │   │ │ Firestore    │  │
    │ Users        │   │ │ (Real-time)  │  │
    │ Groups       │   │ └──────────────┘  │
    │ Activities   │   │ ┌──────────────┐  │
    │ Submissions  │   │ │ Firebase     │  │
    │ Streaks      │   │ │ Storage      │  │
    │ Badges       │   │ └──────────────┘  │
    │ XP/Levels    │   │ ┌──────────────┐  │
    └──────────────┘   │ │ Firebase     │  │
                       │ │ Auth         │  │
    ┌──────────────┐   │ └──────────────┘  │
    │ Redis Cache  │   │ ┌──────────────┐  │
    │ Streaks      │   │ │ FCM Push     │  │
    │ Leaderboard  │   │ │ Notifications│  │
    │ XP totals    │   │ └──────────────┘  │
    └──────────────┘   └───────────────────┘
         │
    ┌────▼─────────────┐
    │ BullMQ + Redis   │
    │ Job Queue        │
    │ ─ Daily reminders│
    │ ─ Streak checks  │
    │ ─ Weekly wrap-up │
    │ ─ XP processing  │
    └──────────────────┘
```

### 11.3 Key Technical Decisions

**Why Firestore for real-time feed?**
Feed updates (new submissions, reactions, comments) need sub-second propagation to all group members. Firestore's real-time listeners are ideal here without needing WebSocket infrastructure.

**Why PostgreSQL for core data?**
Relational data (users → groups → activities → submissions → streaks) is best modeled in SQL with ACID guarantees. Streak calculations and leaderboard queries are complex SQL, not document queries.

**Why Expo managed workflow?**
Eliminates native build complexity for solo dev. EAS Build handles OTA updates. Can eject if needed for native modules later.

**Offline Support:**
- TanStack Query caches all feed data locally
- Pending submissions are stored in AsyncStorage queue
- On reconnection, queued submissions upload automatically
- Offline state banner shown at top of screen when no connection

---

## 12. Data Models & Schema

### PostgreSQL Schema (Prisma format)

```prisma
model User {
  id           String   @id @default(cuid())
  firebaseUid  String   @unique
  username     String   @unique
  displayName  String
  email        String   @unique
  avatarUrl    String?
  bio          String?
  xp           Int      @default(0)
  level        Int      @default(1)
  streakShields Int     @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  memberships  GroupMember[]
  submissions  Submission[]
  badges       UserBadge[]
  streaks      Streak[]
}

model Group {
  id          String   @id @default(cuid())
  name        String
  emoji       String   @default("🏆")
  inviteCode  String   @unique
  maxMembers  Int      @default(6)
  createdBy   String
  createdAt   DateTime @default(now())

  members     GroupMember[]
  activities  Activity[]
}

model GroupMember {
  id       String @id @default(cuid())
  userId   String
  groupId  String
  role     Role   @default(MEMBER)
  joinedAt DateTime @default(now())

  user     User   @relation(fields: [userId], references: [id])
  group    Group  @relation(fields: [groupId], references: [id])

  @@unique([userId, groupId])
}

enum Role {
  ADMIN
  MEMBER
}

model Activity {
  id              String       @id @default(cuid())
  groupId         String
  name            String
  type            ActivityType @default(CUSTOM)
  icon            String
  color           String
  templateFields  Json         // Array of field definitions
  activeDays      Int[]        // 0=Sun, 1=Mon ... 6=Sat
  allowedRestDays Int          @default(1)
  requirePhoto    Boolean      @default(false)
  isArchived      Boolean      @default(false)
  createdBy       String
  createdAt       DateTime     @default(now())

  group           Group        @relation(fields: [groupId], references: [id])
  submissions     Submission[]
  streaks         Streak[]
}

enum ActivityType {
  GYM
  STUDY
  LEETCODE
  RUNNING
  READING
  MEDITATION
  WATER
  COLD_SHOWER
  LANGUAGE
  CUSTOM
}

model Submission {
  id             String   @id @default(cuid())
  userId         String
  activityId     String
  groupId        String
  date           String   // "YYYY-MM-DD" format
  title          String?
  description    String?
  mediaUrl       String?
  templateData   Json     // Activity-specific fields
  xpEarned       Int      @default(0)
  submittedAt    DateTime @default(now())

  user           User     @relation(fields: [userId], references: [id])
  activity       Activity @relation(fields: [activityId], references: [id])

  @@unique([userId, activityId, date])
}

model Streak {
  id            String   @id @default(cuid())
  userId        String
  activityId    String
  currentStreak Int      @default(0)
  longestStreak Int      @default(0)
  totalDays     Int      @default(0)
  lastSubmitDate String?
  shieldUsedAt  String?

  user          User     @relation(fields: [userId], references: [id])
  activity      Activity @relation(fields: [activityId], references: [id])

  @@unique([userId, activityId])
}

model Badge {
  id          String @id @default(cuid())
  slug        String @unique
  name        String
  description String
  iconUrl     String
  category    BadgeCategory
}

enum BadgeCategory {
  STREAK
  ACTIVITY
  SOCIAL
  SPECIAL
}

model UserBadge {
  id        String   @id @default(cuid())
  userId    String
  badgeId   String
  earnedAt  DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
  badge     Badge    @relation(fields: [badgeId], references: [id])

  @@unique([userId, badgeId])
}
```

### Firestore Collections (Real-time layer)

```
/feed/{groupId}/submissions/{submissionId}
  → mirrors Submission record + denormalized user data for fast reads

/reactions/{submissionId}/users/{userId}
  → { reactionType: "FIRE", createdAt }

/comments/{submissionId}/list/{commentId}
  → { userId, displayName, avatarUrl, text, createdAt }

/nudges/{recipientId}/queue/{nudgeId}
  → { senderId, senderName, activityId, sentAt }

/notifications/{userId}/list/{notifId}
  → { type, title, body, read: false, createdAt, meta }
```

---

## 13. API Design

### Authentication
All endpoints (except auth) require `Authorization: Bearer <firebase_jwt>` header.

### Core Endpoints

```
// AUTH
POST   /auth/register          → register user in PostgreSQL after Firebase signup
GET    /auth/me                 → current user profile

// GROUPS
POST   /groups                 → create group
GET    /groups                 → list user's groups
GET    /groups/:id             → group detail
POST   /groups/join            → join by invite code { inviteCode }
PATCH  /groups/:id             → update group (admin only)
DELETE /groups/:id/leave       → leave group

// ACTIVITIES
POST   /groups/:groupId/activities     → create activity
GET    /groups/:groupId/activities     → list activities
PATCH  /activities/:id                 → update activity (admin only)
PATCH  /activities/:id/archive        → archive activity (admin only)

// SUBMISSIONS
POST   /submissions                    → create submission
GET    /submissions/:id                → get submission
PATCH  /submissions/:id               → edit submission (owner, within 1 hr)
DELETE /submissions/:id               → delete submission (owner, within 24 hrs)
GET    /activities/:id/calendar       → calendar data for activity
  ?year=2026&month=8&groupId=xxx

// STREAKS
GET    /streaks/user/:userId/activity/:activityId → streak data
GET    /groups/:groupId/activities/:activityId/leaderboard → streak leaderboard

// GAMIFICATION
GET    /users/:id/xp            → XP and level
GET    /users/:id/badges        → earned badges
POST   /shields/use             → consume a streak shield { activityId }
GET    /shields/count           → user's shield count

// NOTIFICATIONS
GET    /notifications           → list notifications
PATCH  /notifications/:id/read  → mark as read
POST   /nudge                   → send nudge { recipientId, activityId }

// PROFILE
PATCH  /users/profile           → update profile (name, bio, avatar)
GET    /users/:username         → public profile
```

### Calendar API Response Shape
```json
{
  "activityId": "...",
  "year": 2026,
  "month": 8,
  "members": [
    {
      "userId": "...",
      "displayName": "Rishabh",
      "avatarUrl": "...",
      "currentStreak": 14,
      "longestStreak": 21,
      "days": {
        "2026-08-01": "SUBMITTED",
        "2026-08-02": "SUBMITTED",
        "2026-08-03": "MISSED",
        "2026-08-04": "REST",
        "2026-08-05": "PENDING"
      }
    }
  ]
}
```

---

## 14. Security & Privacy

### Authentication & Authorization
- Firebase Auth handles token issuance; NestJS verifies JWT on every request
- Role checks for admin-only operations (activity management, group settings)
- Group membership verified on every submission/reaction/comment operation
- Users can only edit/delete their own submissions

### Data Privacy
- Submissions are visible only to group members (enforced at both API and Firestore rules level)
- Profiles are private-by-default (group members only)
- No data sold or shared with third parties
- Users can request a full data export (JSON) at any time
- Account deletion: all user data purged within 30 days (soft-delete for 30-day recovery)

### Media Storage
- Images stored in Firebase Storage with access rules: only group members can read
- Signed URLs (expire in 24 hours) used for secure image delivery
- Image content moderation: Google Cloud Vision API to flag explicit content before storage (v1.5)

### Rate Limiting
- Submission: max 3 per activity per day (prevents abuse; 1 real + 2 edits counted as 1)
- Nudge: max 1 per recipient per 4 hours
- API: 100 req/min per user (Redis-backed rate limiter)

### Input Validation
- All user inputs sanitized on backend via class-validator
- File type whitelist: JPEG, PNG, WebP only
- Max file size: 5MB pre-compression (800KB post-compress target)

---

## 15. Edge Cases & Error Handling

| Scenario | Handling |
|---|---|
| User submits at 11:59 PM, network delays until 12:01 AM | Timestamp captured client-side at submission click; server validates within a 2-min grace window |
| User in different timezone than group | Each user's submissions are checked against their own device timezone; admin can set group timezone |
| User loses connection mid-submission | Submission queued in AsyncStorage; auto-retries on reconnect with original timestamp |
| Two users submit at the exact same time (real-time conflict) | Firestore handles concurrent writes; no conflict (each user has own document) |
| User is removed from group | Loses access immediately; historical submissions archived but not deleted |
| Group invite code collision | Codes are 6-char alphanumeric (2.1B combinations); collision retry on generate |
| Submission photo upload fails | Submit succeeds without photo; user prompted to retry photo upload separately |
| User hits max shield stockpile (3) | Notified that next eligible shield won't be earned until one is used |
| User deletes account mid-active-streak | Streak and submission data anonymized (not deleted) to preserve group calendar integrity |
| Activity archived mid-streak | Streak frozen at last value; calendar data preserved |
| Group reaches max size (6) | Invite code still works; joiner sees "Group is full" error with option to notify admin |

---

## 16. Success Metrics & KPIs

### Activation (D1–D7)
- % of registered users who complete first submission within 24 hrs (target: 65%)
- % of users who still active on Day 7 (target: 40%)
- Avg time from install to first submission (target: < 5 min)

### Engagement (D30)
- D30 retention (target: 25%)
- Avg submissions per user per week (target: 4.5)
- % of users with a current streak ≥ 7 days (target: 30%)
- Avg reactions per submission (target: 1.5)

### Social (Network Effects)
- Avg group size (target: 2.5 users)
- % of users in 2+ groups (target: 20%)
- Nudge-to-submission conversion rate (target: 35%)

### Retention Drivers to Monitor
- Streak length vs churn correlation (hypothesis: streak > 14 days = strong retention)
- Groups with 2 members vs 3+ — retention comparison
- Activities per group vs engagement

---

## 17. Future Roadmap (v2+)

### v1.5 (3 months post-launch)
- **Progress Photo Timeline:** For gym activity, stack submission photos chronologically as a scrollable before/after timeline
- **Apple Health + Google Fit integration:** Auto-import steps, workout sessions, sleep data as proof
- **Home Screen Widget (iOS/Android):** Shows today's pending activities and streak counts
- **Video Proof (short-form, 30s max):** Upload a short clip instead of photo
- **Activity Templates Marketplace:** Community-shared custom activity templates

### v2.0 (6 months)
- **AI Submission Analysis:** Use vision AI to analyze gym photos and auto-suggest muscle groups trained
- **Smart Nudges:** AI determines the best time to send reminders based on each user's historical submission times
- **Public Pact Mode:** Opt-in public pacts that other users can browse and join (community streaks)
- **Challenges Marketplace:** Pre-built 7-day, 21-day, and 30-day challenge programs (e.g., "30-day push-up challenge")
- **Goal System:** Set a quantified goal per activity (e.g., "Run 100km in 30 days") — tracked cumulatively
- **In-App Messaging:** Lightweight group chat within a Pact (not to replace WhatsApp, but for accountability-specific chats)

### v2.5 (9 months)
- **Team vs Team:** Two groups compete in the same activity — group streak vs group streak
- **Creator Mode:** Fitness coaches or educators can create "public programs" that users follow and track
- **Monetization Layer:**
  - StreakPact Pro (subscription): extra Streak Shields, custom themes, expanded group size, analytics dashboard
  - Cosmetic items: special avatar frames, unique reaction animations, custom mascot outfits
- **Wearable Integration:** Apple Watch / WearOS app for quick submissions from wrist

---

## Appendix A — Submission XP Formula

```
base_xp = 50
photo_bonus = media_url ? 20 : 0
description_bonus = (title && description) ? 10 : 0
early_bird_bonus = submitted_hour < 12 ? 15 : 0
reaction_bonus = reactions >= 3 ? 10 : 0

streak_multiplier =
  current_streak >= 30 ? 2.0 :
  current_streak >= 14 ? 1.5 :
  current_streak >= 7  ? 1.2 : 1.0

total_xp = Math.round((base_xp + photo_bonus + description_bonus + early_bird_bonus + reaction_bonus) * streak_multiplier)
```

---

## Appendix B — Invite Code Generation

```typescript
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1 (ambiguous)
const CODE_LENGTH = 6;

function generateInviteCode(): string {
  return Array.from({ length: CODE_LENGTH }, () =>
    CHARSET[Math.floor(Math.random() * CHARSET.length)]
  ).join('');
}
// Collision check against DB; regenerate if taken (vanishingly rare)
```

---

## Appendix C — Streak Break Detection (Cron Job)

Runs daily at 00:05 AM (server UTC — adjusts per user timezone):

```
For each user:
  For each active activity on their schedule:
    If today's date > lastSubmitDate + 1 day:
      If streak.shieldUsedAt != yesterday:
        // Streak break
        streak.currentStreak = 0
        push notification: "💔 Streak broken — but you can start again today"
      Else:
        // Shield already used — break anyway (can't chain shields)
        streak.currentStreak = 0
```

---

*End of Document — StreakPact PRD v1.0*
*This document covers all features, flows, architecture, and design for the v1.0 launch build.*
