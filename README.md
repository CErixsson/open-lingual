# DialectDrift — Open-Source Language Learning Platform

DialectDrift: an open-source language learning platform with role-based dashboards, Elo-rated skill tracking, and adaptive lesson authoring using React and Supabase.

## Quick Start

```sh
git clone https://github.com/CErixsson/open-lingual.git
cd open-dialectdrift
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

## Architecture

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Lovable Cloud (Supabase) — Postgres, Auth, Edge Functions
- **Curriculum**: JSON-based lesson files, CEFR descriptor-linked, Duolingo-style exercises
- **i18n**: English (complete), Spanish & Swedish (stubs)
- **Auth**: Email/password + Google OAuth via Lovable Cloud Auth

## Roles & Dashboards

| Role     | Dashboard Features                                          |
| -------- | ----------------------------------------------------------- |
| Learner  | XP, streaks, CEFR progress, descriptor mastery, skill ratings |
| Author   | Draft management, lesson editor, submit for review          |
| Reviewer | Moderation queue, approve/request changes with comments     |
| Admin    | Metrics, user management, content health checks             |

Users with multiple roles see a tab switcher at the top of their dashboard.

## Curriculum Structure

```
Descriptor (CEFR) → Skill Module → Lesson → Exercises
```

Lessons are JSON files in `public/data/curriculum/lessons/{lang}/{level}/`. Each lesson:
- Focuses on one skill or theme
- Contains 5–15 exercises (vocabulary_intro, multiple_choice, translate, match_pairs, fill_blank, word_order)
- Awards XP on completion
- Is linked to CEFR descriptor IDs

## Testing

```sh
npm test
```

## License

CC-BY-SA-4.0 for lesson content. MIT for application code.
