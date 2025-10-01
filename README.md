# Backtick Ops ⚡️

**Daily Timebox Planner & Employee Management** — an internal SaaS for Backtick Labs.
Built with **Next.js 15, MongoDB, and JWT-based roles**, it combines a **daily timebox planner** (🗓️ Top 3 priorities, ✍️ Brain Dump, ⏱️ Timeline) with **employee operations** (👥 Attendance, ✅ Tasks, 📂 Projects, 📊 Productivity Index).

The design follows a **clean, black & white premium theme** inspired by [backtick.app](https://backtick.app) — modern, minimal, and intentional.

---

## ✨ Features

- 🔐 **Authentication & Roles**
  - Secure login/register with JWT
  - Role-based access control (Admin, Manager, Employee)

- 🗓️ **Daily Timebox Planner**
  - Top 3 priorities
  - Brain Dump panel
  - Drag-and-drop Timeline blocks
  - Productivity Index calculation

- 👥 **Employee Management**
  - Attendance check-in/out
  - Employee directory with roles

- ✅ **Tasks & Projects**
  - Task CRUD with assignments & due dates
  - Project CRUD with members & owners

- 📊 **Productivity Index**
  - Focus time, priorities completed, task completion ratio

- 🎵 **Integrations (Planned)**
  - Spotify OAuth + embedded player
  - AI suggestions for planning & summaries

---

## 🛠️ Tech Stack

- **Frontend:** [Next.js 15](https://nextjs.org/), TypeScript, TailwindCSS, shadcn/ui
- **State:** [Zustand](https://github.com/pmndrs/zustand)
- **Backend:** Next.js Route Handlers (API)
- **Database:** [MongoDB Atlas](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/)
- **Auth:** JWT (Access + Refresh), RBAC Middleware
- **Utilities:** dayjs, bcryptjs

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/your-org/backtick-ops.git
cd backtick-ops
pnpm install   # or npm install / bun install


2. Environment Setup

Copy .env.example → .env.local and fill:

MONGODB_URI=your-mongodb-uri
JWT_SECRET=super-secret
JWT_REFRESH_SECRET=another-super-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000


📌 Roadmap

 Kanban Board for Tasks

 Spotify Integration (OAuth + Web Playback SDK)

 AI-powered planning & summaries

 Analytics dashboards

 Multi-tenant / Team workspaces

🤝 Contributing

This is an internal project for Backtick Labs, but external contributions are welcome.
Fork the repo, raise issues, or submit pull requests.

Fork this repo

Create your feature branch (git checkout -b feature/amazing)

Commit your changes (git commit -m 'Add something amazing')

Push to the branch (git push origin feature/amazing)

Open a Pull Request

🖤 Credits

Crafted with precision by Backtick Labs.
Premium minimal design, inspired by backtick.app
.
