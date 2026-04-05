

# ReservaEdu — School Reservation System

## Overview
A clean, institutional web app for teachers/staff to reserve school rooms and equipment. Fully mocked data, responsive, minimal design with DM Sans/DM Mono fonts.

## Screens

### 1. Login
- Centered card on #F7F8FA background
- School logo placeholder, "ReservaEdu" title, subtitle in Portuguese
- Email + password fields, "Entrar" button (#1A56DB)
- Mock auth — any credentials work, stores user in state

### 2. Home — Category Selection
- Header bar: logo left, user name ("Prof. Ana Silva") + logout icon right
- "O que você deseja reservar?" title
- Two large cards: **Espaços** (rooms) and **Instrumentos** (equipment)
- Each with icon, label, subtitle. Stacked on mobile, side-by-side on desktop

### 3. Listing Screen
- Back arrow + category title
- Real-time search filter input
- Responsive card grid (2 cols desktop, 1 mobile)
- Each card: placeholder image, title, green/red availability badge
- Mock data: ~8 rooms, ~8 instruments

### 4. Reservation Screen
- Item summary with image, title, description
- Date picker (calendar, no past dates)
- Time slot pills in grid layout with real school periods (07:50–17:15)
- Slot states: green (available), blue (selected), gray (break/occupied)
- Multi-slot selection for consecutive periods
- **Instruments only**: quantity input with available units
- "Confirmar Reserva" button → success modal with summary

### 5. My Reservations
- Accessible from header icon/link
- Tab bar: "Próximas" | "Passadas"
- Each row: item, date, time, status badge, cancel button (upcoming only)
- Empty state with icon and message

## Design System
- Fonts: DM Sans (body), DM Mono (time slots/codes)
- Colors: bg #F7F8FA, cards #FFF, primary #1A56DB, text #111827/#6B7280, border #E5E7EB, available #16A34A, unavailable #DC2626
- No gradients, no decorative elements — institutional minimalism

## Tech
- React + Tailwind + TypeScript
- date-fns for dates
- React Router for navigation
- All data mocked with realistic Portuguese content
- Fully responsive

