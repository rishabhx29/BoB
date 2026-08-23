# StreakPact — Design System Document

**Version:** 1.1  
**Date:** August 23, 2026  
**Theme Codename:** "Tactile Hardware" (Neumorphic)

---

## 1. Design Philosophy

StreakPact's visual identity embraces **tactile neumorphism**. It should feel like an expensive piece of physical hardware (like a Teenage Engineering synthesizer or a premium mechanical keyboard). Every button looks like it can be physically pushed, and every screen feels like a molded plastic or metal console.

### Core Principles
1. **Physicality:** Use soft drop shadows for elevated elements and harsh inset shadows for recessed elements.
2. **Satisfying Interactions:** Every tap must have an active state that visually pushes the element into the surface (`translate-y` + inset shadows).
3. **Utilitarian + Playful:** The base is a clean, mechanical gray, accented by bright, highly saturated pops of Safety Orange and Bright Mint.
4. **Digital displays:** Data (like streak counts) shouldn't just be text on a background; it should look like an LED or LCD screen embedded in the plastic.

---

## 2. Color System

### 2.1 Core Tokens

| Token | Hex | Usage |
|---|---|---|
| `--surface-base` | `#E5E7EB` | The global background (soft matte gray) |
| `--surface-dark` | `#D1D5DB` | Slightly deeper gray for pressed states |
| `--surface-screen` | `#111827` | Matte black for recessed digital displays |
| `--brand-primary` | `#F97316` | Safety Orange (Main CTA, FAB, streaks) |
| `--brand-primary-dark` | `#C2410C` | Deep orange for 3D button edges |
| `--success` | `#34D399` | Bright Mint (Completed activities, LEDs) |
| `--danger` | `#EF4444` | Red (Missed streaks, destructive actions) |
| `--text-primary` | `#1F2937` | Dark gray/black for main text |
| `--text-secondary` | `#6B7280` | Medium gray for subtitles |
| `--text-display` | `#F97316` | Orange text inside digital displays |
| `--shadow-light` | `#FFFFFF` | The top-left highlight shadow |
| `--shadow-dark` | `#C8C9CC` | The bottom-right drop shadow |

---

## 3. Neumorphic Shadow System

The entire aesthetic relies on precise shadow values.

### 3.1 Drop Shadows (Elevated / Convex)
Used for cards, unpressed buttons, and the bottom tab bar.
*   **Soft Elevation (Buttons):** `shadow-[3px_3px_6px_#c8c9cc,-3px_-3px_6px_#ffffff]`
*   **Medium Elevation (Cards):** `shadow-[8px_8px_16px_#c8c9cc,-8px_-8px_16px_#ffffff]`
*   **High Elevation (Header/Footer):** `shadow-[0_-5px_20px_rgba(0,0,0,0.05)]`

### 3.2 Inset Shadows (Recessed / Concave)
Used for pressed states, image placeholders, and input fields.
*   **Shallow Recess (Pressed Button):** `shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.7)]`
*   **Deep Recess (Screens/Images):** `shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.8)]`

---

## 4. Typography System

### 4.1 Font Stack

| Role | Font | Weight | Fallback |
|---|---|---|---|
| **Headings & Body** | `Inter` | Regular (400), Medium (500), Bold (700) | system-ui, sans-serif |
| **Data & Numbers** | `Roboto Mono` | Medium (500), Bold (700) | monospace |

*We use Inter for a clean, mechanical, utilitarian look. Roboto Mono is used strictly inside recessed "screens" to mimic digital hardware displays.*

### 4.2 Type Scale
- `heading-lg`: 24px, Bold (Inter)
- `heading-md`: 18px, SemiBold (Inter)
- `body`: 16px, Regular (Inter)
- `caption`: 12px, Medium (Inter)
- `digital-display`: 20px, Bold (Roboto Mono, usually Orange)

---

## 5. Component Specifications

### 5.1 The "Hardware" Card
- Background: `--surface-base`
- Shadow: Medium Elevation drop shadow
- Border Radius: `32px` (very pillowy)
- Padding: `24px`

### 5.2 Recessed Image/Media Placeholder
- Background: `--surface-dark`
- Shadow: Deep Recess inset shadow
- Border Radius: `16px`
- Usage: For submission photos. It makes the photo look like a screen embedded in the plastic card.

### 5.3 Digital Display (Streak Counter)
- Background: `--surface-screen` (Matte Black)
- Text: `--text-display` (Safety Orange)
- Font: Roboto Mono
- Shadow: Shallow Recess inset shadow (to look embedded)
- Border Radius: `8px`
- Padding: `8px 12px`

### 5.4 Buttons (Physical Rubber Keys)
- Background: `--surface-base`
- Shadow (Default): Soft Elevation drop shadow
- Shadow (Pressed): Shallow Recess inset shadow
- Transform (Pressed): `translate-y: 2px` (moves down physically)
- Border Radius: `12px` for normal keys, `999px` (pill) for main actions.

### 5.5 Main FAB (The "Big Red Button")
- Background: `--brand-primary` (Safety Orange)
- Shadow (Default): Hard physical bottom edge `shadow-[0_4px_0_#c2410c]`
- Shadow (Pressed): Removes bottom edge `shadow-[0_0px_0_#c2410c]`
- Transform (Pressed): `translate-y: 4px` (satisfying deep click)
- Border Radius: `999px`

### 5.6 LED Indicators (Today Banner)
- Pending: A dark inset circle `shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)]`
- Completed: A glowing Mint Green circle `bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)]`

---

## 6. Layout & Spacing

- Base unit: 4px
- Standard screen padding: 24px
- Gap between cards: 24px
- Top Header: Pill-shaped or etched metal plate with rounded bottom corners (`rounded-b-[32px]`).
- Bottom Console: Floating tab bar that looks like a physical controller dock.

---

## 7. Assets Required
- Since the design relies heavily on shadows and pure geometry, we need very few image assets.
- Icons should be thick, line-art or solid SVGs (like Phosphor Icons, Bold weight).
- No complex illustrations needed; empty states should feature recessed panels and LED typography.

---
*This document supersedes previous theme concepts and is the master blueprint for the Tactile Hardware Neumorphic UI.*
