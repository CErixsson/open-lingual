# LinguaFlow — Language Learning Platform

An open-source, role-based language learning app with Elo-rated skill tracking, lesson authoring, moderation workflows, and adaptive coaching.

## Quick Start

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
cp .env.example .env   # fill in your Lovable Cloud credentials
npm run dev
```

## Demo Accounts

After seeding, use these accounts (password: `Demo1234!`):

| Email              | Roles              |
| ------------------ | ------------------ |
| admin@demo.com     | admin, learner     |
| reviewer@demo.com  | reviewer, learner  |
| author@demo.com    | author, learner    |
| learner@demo.com   | learner            |

## Seeding

Invoke the `seed-demo-data` backend function to populate demo users, lessons, progress, and a reviewer queue item.

## Architecture

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Lovable Cloud (Supabase) — Postgres, Auth, Edge Functions
- **i18n**: English (complete), Spanish & Swedish (stubs)
- **Auth**: Email/password + Google OAuth via Lovable Cloud Auth

## Roles & Dashboards

| Role     | Dashboard Features                                          |
| -------- | ----------------------------------------------------------- |
| Learner  | XP, streaks, assigned lessons, skill ratings, coaching      |
| Author   | Draft management, lesson editor, submit for review          |
| Reviewer | Moderation queue, approve/request changes with comments     |
| Admin    | Metrics, user management, content health checks             |

Users with multiple roles see a tab switcher at the top of their dashboard.

## Lesson Editor

Block-based editor supporting: Text, Vocabulary, MCQ, Cloze, Match, Order Words, Translate, Audio, Image blocks. Features live preview, JSON import/export, and validation panel.

## Testing

```sh
npm test
```

## Tech Stack

- Vite, TypeScript, React, shadcn/ui, Tailwind CSS
- Recharts for data visualization
- Tanstack Query for data fetching
- Framer-motion ready for animations

## License

CC-BY-SA-4.0 for lesson content. MIT for application code.
