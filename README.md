# 🚀 PUA UniTrack

### AI-Powered Faculty Tracking & Management Platform

PUA UniTrack is a full-stack university platform designed to make it easier for students to find and access up-to-date faculty information.

The platform provides a centralized system where students can check faculty availability, current location, office information, and schedules, while doctors can manage their information and administrators can manage and approve faculty accounts.

The project also includes an AI-powered assistant that uses the application's faculty data to provide students with natural and contextual answers.

---

## 🎯 Project Purpose

In a university environment, students often need to know:

- Where a doctor is currently located
- Whether a doctor is available
- When a doctor can be reached
- Where their office is located
- What their current schedule looks like

Finding this information manually can be inconvenient and time-consuming.

**PUA UniTrack solves this problem by bringing faculty information into one centralized platform.**

---

## 🤖 AI-Powered Assistant

One of the main features of PUA UniTrack is an AI-powered assistant designed to help students interact with faculty information naturally.

Instead of manually searching through the platform, students can ask questions in natural language.

### Example Questions

```text
Which doctors are currently available?

Where is this doctor located?

When can I find this doctor?

Who is available right now?

The AI assistant receives relevant faculty data from the application and generates contextual responses based on the available information.

This creates a more natural way for students to interact with university data.

✨ Features
🎓 Student Experience
Search and discover faculty
Search by doctor name
Search by building
Search by office
View faculty profiles
Check current availability
View current location
View academic schedules
Ask questions using the AI assistant
Access information through a responsive interface
👨‍🏫 Doctor Portal

Doctors can manage their academic information through their dashboard.

Profile Management
Update personal information
Update academic title
Update phone number
Update office information
Update building information
Availability & Location

Doctors can update:

Current building
Current room
Availability status

Available statuses include:

AVAILABLE
IN_LECTURE
UNAVAILABLE
Schedule Management

Doctors can:

Add schedules
Update schedules
Specify building and room
Specify schedule time
Manage their academic availability
🛡️ Admin Dashboard

The platform includes an administrator dashboard for managing faculty accounts.

Administrators can:

View registered doctors
Review pending doctor registrations
Approve doctor accounts
Reject doctor accounts
Delete doctor accounts
Manage faculty access

New doctor accounts remain pending until they are approved by an administrator.

🔐 Authentication & Security

PUA UniTrack implements a role-based authentication system.

Authentication
JWT-based authentication
Secure password hashing with bcrypt
Protected API routes
Token-based sessions
Authorization

Different roles have different permissions:

ADMIN
DOCTOR

Doctor accounts must be approved before accessing protected doctor features.

💻 Frontend

The frontend was built with:

HTML5
CSS3
JavaScript
Responsive design
Modern dark UI
Interactive forms
Dashboard interfaces
REST API integration

The interface includes dedicated experiences for:

Students
Doctors
Administrators
Authentication
⚙️ Backend

The backend is built using:

Node.js
Express.js
REST API
JWT
bcrypt
Prisma ORM

The backend handles:

Authentication
User registration
Login
Faculty management
Doctor approval
Location updates
Schedule management
Profile management
AI requests
Database operations
🗄️ Database

PUA UniTrack uses PostgreSQL as its relational database.

Database operations are managed using Prisma ORM.

Main Data Models
User
Doctor
Subject
Schedule
Location

The database stores information related to:

User accounts
Doctor profiles
Faculty availability
Office locations
Academic schedules
Subjects
Approval status
Location history
Database Tools
PostgreSQL
Prisma ORM
Prisma Migrations
Prisma Seed
Supabase
🏗️ System Architecture
                    ┌─────────────────────┐
                    │      Students       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Frontend       │
                    │   HTML/CSS/JS       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Express.js API    │
                    │      Node.js        │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
          ┌──────────┐   ┌──────────┐   ┌──────────┐
          │ Prisma   │   │   JWT    │   │    AI    │
          │   ORM    │   │   Auth   │   │Assistant │
          └────┬─────┘   └──────────┘   └──────────┘
               │
               ▼
       ┌──────────────────┐
       │    PostgreSQL    │
       │     Supabase     │
       └──────────────────┘
📁 Project Structure
pua-unitrack/
│
├── backend/
│   │
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.js
│   │
│   ├── src/
│   │   ├── ai.js
│   │   ├── db.js
│   │   ├── server.js
│   │   │
│   │   └── middleware/
│   │       └── auth.js
│   │
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── doctor.html
│   ├── admin.html
│   ├── app.js
│   ├── auth.js
│   ├── dashboard.js
│   ├── admin.js
│   └── styles.css
│
├── .gitignore
└── README.md
🚀 Getting Started
1. Clone the Repository
git clone https://github.com/ahmedosama2321/pua-unitrack.git
cd pua-unitrack
📦 Backend Setup

Navigate to the backend:

cd backend

Install dependencies:

npm install
🔑 Environment Variables

Create a .env file inside the backend folder.

Example:

DATABASE_URL="your_postgresql_connection_string"

JWT_SECRET="your_jwt_secret"

PORT=4000

CLIENT_URL="http://localhost:4000"

AI_API_KEY="your_ai_api_key"

Never commit your real .env file or API keys to GitHub.

🗄️ Database Setup

Run Prisma migrations:

npx prisma migrate deploy

Seed the database:

npx prisma db seed

Or:

node prisma/seed.js
▶️ Run the Application

From the backend directory:

npm run dev

The application will be available at:

http://localhost:4000
❤️ Health Check

You can verify that the backend is running by visiting:

http://localhost:4000/api/health

Expected response:

{
  "ok": true,
  "service": "PUA UniTrack API"
}
🔑 Demo Admin

The seed script creates an administrator account for development/testing.

Email:
admin@pua-unitrack.com

The password is defined by the seed configuration and should not be exposed publicly.

🛠️ Technologies
Frontend
HTML5
CSS3
JavaScript
Backend
Node.js
Express.js
Database
PostgreSQL
Prisma ORM
Supabase
Authentication & Security
JWT
bcrypt
AI
AI-powered contextual assistant
Faculty data integration
Development
Git
GitHub
npm
Prisma CLI
🔮 Future Improvements

Possible future improvements include:

Real-time location updates
Push notifications
Advanced faculty filtering
Improved AI responses
Mobile application
Analytics dashboard
More granular permissions
Enhanced monitoring and logging
Production deployment improvements
📸 Project Demo

A short screen recording demonstrates the platform while testing the main user flows, authentication, dashboards, and AI functionality.

👨‍💻 Author

Ahmed Osama

Computer Science & Artificial Intelligence

GitHub:

https://github.com/ahmedosama2321

⭐ Project Status

Active Development

PUA UniTrack is currently being tested and improved, with ongoing work on deployment, security, performance, and user experience.
- Use university-approved authentication/data

## Branding
The included PUA mark is a clean placeholder lockup so the project runs immediately.
For the official PUA logo, replace `.brand-mark` with the approved logo asset from the university branding guidelines.
