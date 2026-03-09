# Salary Transparent – Frontend

Frontend for the community-driven tech salary transparency platform. Built with **Next.js 16**, **React 19**, and **Tailwind CSS 4**. All API requests go through the **BFF (Backend-for-Frontend)**; the frontend never talks directly to backend microservices.

## Features

- **Home** – Hero and recent salary submissions (from search API).
- **Search** – Filter salaries by country, company, role, and level (no login).
- **Submit** – Anonymous salary submission (no login).
- **Statistics** – Aggregated stats by country/role (no login).
- **Login / Register** – Required only for **voting** and reporting. Identity is stored separately from salary data.
- **Voting** – Logged-in users can upvote/downvote submissions on salary cards (trustworthy?).

## Getting started

1. **Install and run**

   ```bash
   npm install
   npm run dev
   ```

2. **Configure BFF URL** (required for API calls)

   Copy `.env.local.example` to `.env.local` and set the BFF base URL, e.g.:

   ```env
   NEXT_PUBLIC_BFF_URL=http://localhost:5000
   ```

   With this, the app calls `http://localhost:5000/api/*` for auth, salaries, votes, search, and stats.

3. Open [http://localhost:3000](http://localhost:3000).

## BFF API usage

The frontend expects the BFF to expose:

| Path | Methods | Purpose |
|------|---------|--------|
| `/api/auth/register` | POST | Register (email, password) |
| `/api/auth/login` | POST | Login (email, password) |
| `/api/salaries/submit` | POST | Anonymous salary submission |
| `/api/salaries/{id}` | GET | Get one salary (if needed) |
| `/api/search` | GET | Search with query params (country, company, role, level, …) |
| `/api/stats` | GET | Stats with query params (country, role, …) |
| `/api/votes/{salaryId}` | GET | Vote counts for a salary |
| `/api/votes` | POST | Submit vote (salaryId, userId, voteType: UP/DOWN); requires auth |

## Project structure

- `app/` – Routes: `page.tsx` (home), `search/`, `submit/`, `stats/`, `login/`, `register/`, `layout.tsx`, `providers.tsx`, `globals.css`
- `components/` – `Header.tsx`, `SalaryCard.tsx` (with voting for logged-in users)
- `context/` – `AuthContext.tsx` (login state, token, userId)
- `lib/` – `api.ts` (BFF client), `types.ts` (shared types)

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) (Geist) and Tailwind for styling.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
