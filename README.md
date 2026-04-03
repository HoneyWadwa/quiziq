# 🧠 QuizIQ — Adaptive Quiz Generator

> AI-powered adaptive learning platform that dynamically adjusts question difficulty based on your accuracy and response time.

![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Node%20%2B%20MongoDB-blueviolet)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

| Feature | Details |
|---|---|
| **Adaptive Engine** | Promotes/demotes difficulty based on last 3 answers + response time |
| **4 Topics** | JavaScript, React, Python, Data Structures & Algorithms |
| **Two Modes** | Timed (30s) and Practice (unlimited) |
| **XP & Levels** | Earn XP per correct answer; speed bonuses; hard × 2 multiplier |
| **Streak Tracking** | Daily login streak with gamification |
| **Analytics Dashboard** | Accuracy charts, weak-area detection, weekly activity |
| **Leaderboard** | Global top-10 by XP |
| **JWT Auth** | Secure register/login with bcrypt hashing |
| **Responsive UI** | Mobile-first glassmorphism design (Space Grotesk + DM Sans) |

---

## 🗂 Project Structure

```
quiziq/
├── backend/
│   └── src/
│       ├── config/         # MongoDB connection
│       ├── controllers/    # auth, quiz, user, question
│       ├── data/           # seed.js — populates 60 questions
│       ├── middleware/      # JWT protect, error handler, validators
│       ├── models/         # User, Question, QuizSession (Mongoose)
│       ├── routes/         # auth, quiz, user, question routes
│       ├── app.js          # Express app (CORS, rate-limiting, routes)
│       └── server.js       # Entry point
│
├── frontend/
│   └── src/
│       ├── api/            # Axios client + service modules
│       ├── components/
│       │   ├── layout/     # Navbar, ProtectedRoute
│       │   ├── pages/      # Auth, Dashboard, Topic, Quiz, Results, Profile
│       │   └── ui/         # LoadingScreen, Skeleton, TimerRing, ProgressBar, XPLevelCard
│       ├── context/        # AuthContext, ToastContext
│       ├── data/           # constants.js — adaptive algorithm, TOPICS config
│       ├── hooks/          # useTimer, useLocalStorage, useAsync, useDocumentTitle
│       ├── styles/         # global.css — full design system
│       └── App.jsx         # React Router setup
│
├── package.json            # Root: concurrently dev script
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas free tier)

### 1 — Clone & install

```bash
git clone https://github.com/yourname/quiziq.git
cd quiziq
npm run install:all
```

### 2 — Configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env:
#   MONGODB_URI=mongodb://localhost:27017/quiziq
#   JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">

# Frontend
cp frontend/.env.example frontend/.env
# VITE_API_URL=http://localhost:5200/api   (default, no change needed for local dev)
```

### 3 — Seed the database

```bash
npm run seed
# Seeds 60 questions (15 per topic × 4 topics × easy/medium/hard)
```

### 4 — Run in development

```bash
npm run dev
# Starts backend on :5200 and frontend on :5174 concurrently
```

Open **http://localhost:5174** and register an account.

---

## 📡 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Get JWT token |
| GET | `/api/auth/me` | ✅ | Get current user |

### Quiz
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/quiz/next-question?topic=&history=&usedIds=` | ✅ | Adaptive next question (no answer) |
| POST | `/api/quiz/check-answer` | ✅ | Validate answer, get explanation |
| POST | `/api/quiz/submit` | ✅ | Finalise session, update XP |
| GET | `/api/quiz/history` | ✅ | Paginated past sessions |
| GET | `/api/quiz/history/:id` | ✅ | Full session detail |

### Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users/profile` | ✅ | Full profile |
| PATCH | `/api/users/profile` | ✅ | Update name |
| GET | `/api/users/analytics` | ✅ | Per-topic stats, weekly XP |
| GET | `/api/users/leaderboard` | ✅ | Top 10 + your rank |

---

## 🧠 Adaptive Algorithm

```
Promote (Easy→Medium, Medium→Hard):
  Last 3 attempts ALL correct AND average response time < 12 seconds

Demote (any level → one below):
  Last 2 attempts BOTH incorrect

Default: stay at current difficulty

XP Formula:
  base       = 10
  speedBonus = answered < 5s ? +5 : < 10s ? +3 : < 20s ? +1 : 0
  multiplier = easy × 1.0 | medium × 1.5 | hard × 2.0
  xp         = (base + speedBonus) × multiplier   [only if correct]

Level Formula:
  level = floor(totalXP / 200) + 1
```

---

## 🎨 Design System

| Token | Value |
|---|---|
| Primary | `#6C3BFF` Electric Violet |
| Accent | `#00D4FF` Cyan Spark |
| Success | `#22D3A5` Mint |
| Warning | `#FFB347` Amber |
| Error | `#FF6B6B` Coral |
| Background | `#0D0B1A` Deep Space |
| Card | `#1E1933` Cosmos |
| Heading font | Space Grotesk |
| Body font | DM Sans |

---

## 🚢 Deployment

### Backend → Render

1. Push to GitHub
2. Create **New Web Service** on [render.com](https://render.com)
3. Build command: `npm install`
4. Start command: `node src/server.js`
5. Add environment variables from `.env`
6. Run seed: in Render Shell → `npm run seed`

### Frontend → Vercel

1. Import frontend folder to [vercel.com](https://vercel.com)
2. Framework preset: **Vite**
3. Add env var: `VITE_API_URL=https://your-render-url.onrender.com/api`
4. Deploy

---

## 📦 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, React Router v6 |
| Styling | Pure CSS custom properties (no Tailwind required) |
| Backend | Node.js, Express 4 |
| Database | MongoDB + Mongoose 8 |
| Auth | JWT + bcryptjs |
| Validation | express-validator |
| Rate limiting | express-rate-limit |
| HTTP client | Axios |
| Dev tooling | nodemon, concurrently |

---

## 📄 License

MIT © 2024 QuizIQ
