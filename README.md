# PUA UniTrack AI — Full Stack Starter

## What is included
- Student-facing landing page and live doctor search
- Doctor registration/login
- Admin login + doctor approval
- Doctor dashboard
- Live location/status updates
- Weekly schedules
- PostgreSQL database via Prisma
- JWT authentication + bcrypt password hashing
- AI endpoint with real OpenAI Responses API when `OPENAI_API_KEY` is set
- Safe fallback AI when no API key is configured
- Responsive animated design

## Folder structure
pua-unitrack-pro/
  backend/
    prisma/schema.prisma
    prisma/seed.js
    src/server.js
    src/ai.js
    src/db.js
    src/middleware/auth.js
    .env.example
    package.json
  frontend/
    index.html
    login.html
    doctor.html
    admin.html
    styles.css
    app.js
    auth.js
    dashboard.js
    admin.js

## 1) Requirements
Install Node.js 20+ and PostgreSQL.

## 2) Create database
Create a PostgreSQL database named:
pua_unitrack

## 3) Backend setup
Open a terminal:
  cd backend
  npm install

Copy `.env.example` to `.env` and edit DATABASE_URL and JWT_SECRET.

Then:
  npm run prisma:generate
  npm run prisma:migrate -- --name init
  npm run seed
  npm run dev

Open:
  http://localhost:4000

## 4) Admin
The seed creates the admin from ADMIN_EMAIL / ADMIN_PASSWORD in `.env`.
Change the default password before deploying.

## 5) Real AI
Put your AI API key in:
  OPENAI_API_KEY="..."

Keep the key ONLY in backend `.env`. Never put it in frontend JavaScript.

The server sends only approved doctor directory/schedule context to the AI.
The `/api/ai/ask` route can answer in Arabic/Egyptian Arabic/English.

## 6) Important production upgrades
Before real university use:
- HTTPS
- Strong JWT secret and secret management
- Rate limiting
- Audit logs
- Email verification
- Password reset
- Admin roles/permissions
- Database backups
- Privacy/consent policy for location
- Do not expose exact live location unless approved and necessary
- Use university-approved authentication/data

## Branding
The included PUA mark is a clean placeholder lockup so the project runs immediately.
For the official PUA logo, replace `.brand-mark` with the approved logo asset from the university branding guidelines.
