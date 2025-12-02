# Dyzo Dashboard (Pwpulse-frontend-dashcode)

Dyzo is a productivity and workforce management platform that streamlines projects, tasks, time tracking, reporting, and team operations. This repository contains the React dashboard powering Admin, Employee, and Client experiences with real‑time insights, AI assistance, and subscription controls.


## Core Capabilities

- **Tasks & Sections**: Create, assign, filter, bulk‑select, reorder, and manage tasks within sections; fast inline task creation, attachments, task drawer, and persisted filters/state.
- **Projects**: Grid/list views, favorites prioritization, leader/date filters, pagination, add/edit/delete, member assignment, and project screenshots archive.
- **Time Tracking & Timesheets**: Task‑level time aggregation, detailed logs, and screenshot timelines; client, project, and company timesheet reports with CSV export.
- **Screenshots & Live Activity**: Review per‑user, per‑project, and per‑task screenshots; live activity dashboards for real‑time visibility.
- **Reporting & Analytics**: Timesheet, project, client, and live reports with filters, pagination, and downloadable output.
- **AI Copilot**: In‑app AI modal for Q&A and task creation; onboarding workflow integrates with a task agent to generate project tasks; resilient WebSocket streaming.
- **Communication & Notifications**: Email pages, chat route, in‑app notifications, and push notifications (Firebase/OneSignal).
- **HR & People Ops**: Leaves (with detail), attendance, salary management, calendar, teams and team detail, and notices management.
- **Client Portal**: Dedicated client pages for projects and timesheet/reporting views.
- **Billing & Plans**: Razorpay‑backed subscriptions; plan gating via `PlanCheck`; subscription and storage transaction histories.
- **Access Control & Security**: Protected routes, Super Admin routes, JWT with refresh token handling, and Google OAuth; Slack flows supported.


## Detailed Feature Breakdown

### 1) Task & Section Task Management

- Section‑based tasks live under `src/features/section-task/` with Redux state in `store/sectionTaskSlice.js` (filters persisted to `localStorage`, per‑section pagination, task stats, optimistic updates, and task drawer state persistence).
- Inline creation: Debounced save converts temp IDs to server IDs in place for smooth UX.
- Filters: search, priority, status, assignees, projects, due date; saved across sessions.
- Bulk selection and section‑wide select/deselect.
- Drag‑and‑drop for reordering tasks/sections and a Kanban demo page.
- Attachments and a detailed task drawer/panel integrated with comments and real‑time updates where applicable.

Key files:
- `src/features/section-task/store/sectionTaskSlice.js`
- `src/features/section-task/components/SectionTaskTable.jsx`
- `src/features/section-task/components/SectionTaskPanel.jsx`


### 2) Project Management

- Project listing with grid/list switch, favorites ordering, pagination, leader filter, date range filter, search, and member assignment.
- Add/Edit/Delete projects; view project dashboards and screenshot archives.

Key files:
- `src/pages/manage/projects/ProjectManagement.jsx`
- `src/components/project/ProjectGrid.jsx`, `src/components/project/ProjectList.jsx`
- `src/components/Projects/AddProject.jsx`, `src/components/Projects/EditProjectModal.jsx`
- `src/components/project/AllScreenshot.jsx`


### 3) Time Tracking, Timesheets, Logs, and Screenshots

- New timesheet module with task logs and screenshot timeline routes:
  - `/timesheet-report`, `/timesheet-report/timesheet-logs/:taskId`, `/timesheet-report/timelog-screenshots/:taskId`
- Aggregated reports with pagination and CSV export:
  - `/timesheet-reports`, `/project-reports`, `/client-reports`, `/live-reports`
- Client‑specific timesheet/report pages and navigation.

Key files:
- `src/pages/reports/newTimesheet/index.jsx`, `TimesheetLogs.jsx`, `TimeLogScreenshots.jsx`
- `src/pages/reports/timesheet/TimesheetReport.jsx`, `TimeSheetTable.jsx`
- `src/clientpages/timesheet/ClientTimesheet.jsx`
- Screenshot views also exist under `src/pages/screenshot/`, `src/pages/tasklogs/`, and profile/project components.


### 4) AI Assistant & Onboarding Automation

- Dyzo AI modal provides an in‑app assistant for Q&A and task creation, gated by active subscription.
- Robust WebSocket handling (reconnect with backoff), message queueing, and minimal UI latency.
- Project onboarding flow connects to a task agent API to generate project tasks via guided Q&A.
- Optional OpenAI integration is provided for generic chat completions.

Key files:
- `src/components/dyzoAi/DyzoAiModal.jsx`, `AiResponseFormat.jsx`, `TaskCreationView.jsx`
- `src/components/dyzoAi/FormattedInputBox.jsx`, `MentionList.jsx`, `TaskTimeTable.jsx`
- `src/components/onboarding/ProjectOnboarding.jsx`
- `src/store/api/apiSlice.js` → `askChatGPT`


### 5) Reporting & Live Monitoring

- Timesheet, project, client reports with filters, pagination, and CSV export.
- Live reports for real‑time activity and status overview.

Key files:
- `src/pages/reports/timesheet/*`, `src/pages/reports/project/*`, `src/pages/reports/client/*`, `src/pages/reports/live/*`


### 6) Communication, Notifications, and Integrations

- Email and chat routes; notifications UI and a test route for sending notifications.
- Integrations: Google OAuth, Slack callback routes, Push notifications (Firebase/OneSignal), and Chrome Extension support.

Key files:
- `src/pages/app/email/*`, `src/pages/app/chat/Chat.jsx`
- `src/firebase/index.js`, `public/OneSignalSDKWorker.js`, `public/sw.js`
- Slack: `src/App.jsx` has success/error routes


### 7) HR, Teams, and Admin Tools

- Leaves (with detailed view), attendance, salary management, calendar, teams, team detail, and notices management.
- Employee and client management pages; super‑admin company list/detail.

Key files:
- `src/pages/leaves/*`, `src/pages/attendance/*`, `src/pages/salary/*`, `src/pages/calendar/*`
- `src/pages/manage/*`, `src/pages/superuser/*`


### 8) Billing, Plans, and Gating

- Razorpay configuration; subscription and storage transaction histories; upgrade plan pages.
- `PlanCheck` wraps key routes to enforce plan limits; AI features check active subscription status.

Key files:
- `src/config/razorpay.config.js`
- `src/store/planSlice.js`
- `src/pages/plans/*`, `src/pages/subscriptions/*`


## Architecture & Tech Stack

- **Frontend**: React 18, Vite, React Router v6, Redux Toolkit (slices + RTK Query base), TailwindCSS/SCSS, Headless UI, Heroicons.
- **State & Data**: Redux slices under `src/store` and `src/features/**/store`; cached GETs via `utils/apiCache`; persisted UI state in `localStorage`.
- **API Client & Auth**:
  - `axiosInstance` with base URL `VITE_APP_DJANGO`, credentials enabled, and interceptors for JWT access/refresh token handling.
  - Helper methods: `fetchGET/POST`, `fetchAuthGET/Post/Patch/Put/Delete`, `uploadtoS3` (presigned URLs), and CSV helpers.
- **Realtime**: WebSocket usage in AI modal and task panels; live reports for near‑real‑time visibility.
- **UI/UX**: Large component library in `src/components`, skeleton loaders, tours, and responsive layouts.


## Routing Highlights (Protected area)

- Dashboard: `/dashboard`
- Tasks: `/tasks`, Section Tasks: `/sectiontask`
- Timesheet: `/timesheet-report`, logs: `/timesheet-report/timesheet-logs/:taskId`, screenshots: `/timesheet-report/timelog-screenshots/:taskId`
- Reports: `/timesheet-reports`, `/project-reports`, `/client-reports`, `/live-reports`
- Projects: `/projects`, details and screenshots routes available
- HR: `/leaves`, `/attendance`, `/salary-management`, `/calendar`
- Communication: `/email`, `/chat`
- Plans and Billing: `/plans`, `/modify-subscription`, histories
- Admin/Super Admin: company list/detail

Public routes include Home, Login/Register (Google OAuth, Email OTP), Desktop/Slack callbacks, legal pages, and onboarding.


## Setup & Development

Prerequisites:
- Node.js 16+ (recommended), Yarn or npm

Install:

```
yarn
# or
npm install
```

Run Dev Server:

```
yarn dev
# or
npm run dev
```

Build & Preview:

```
yarn build && yarn preview
# or
npm run build && npm run preview
```

Environment variables (examples):
- `VITE_APP_DJANGO` – Backend API base URL
- `VITE_APP_CHATGPT_API_KEY` – OpenAI key for `askChatGPT` (optional)
- Firebase / Push config (see `src/firebase/index.js` and `public/OneSignalSDKWorker.js`)
- OAuth client IDs (Google, Slack callbacks configured in routes)


## API & Data Notes

- API helpers return structured responses and handle token refresh transparently where possible.
- Delete with body and file uploads are supported; S3 uploads use presigned `PUT` via `uploadtoS3`.
- See `api_docs/` for high‑level endpoint descriptions for projects, tasks, HR, and more.


## Folder Highlights

- `src/features/section-task/` – New section‑based task experience (state, table, panel, hooks)
- `src/pages/reports/` – Timesheet, project, client, and live reporting
- `src/pages/manage/` – Projects, clients, employees
- `src/components/dyzoAi/` – AI assistant and task creation UI
- `src/store/` – Global slices (auth, plan, projects, etc.) and API utilities
- `src/utils/axiosInstance.js` – Axios with robust JWT refresh handling


## Access Control & Security

- Route protection via `ProtectedRoute`, `PublicRoute`, and `SuperAdminRoute`.
- Subscription enforcement via `PlanCheck` around key routes; AI modal checks active subscription.
- JWT authentication with automatic access token refresh and safe queuing of inflight requests.


## License

Proprietary – All rights reserved by Dyzo. Contact the maintainers for usage permissions.

