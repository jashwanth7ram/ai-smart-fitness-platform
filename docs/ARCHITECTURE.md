# AI Fitness Tracker — Architecture Documentation

## 1. System Overview

Production-ready SaaS platform for health & fitness tracking with AI-powered recommendations (Gemini API). Supports weight loss, muscle gain, and general fitness goals.

## 2. Folder Structure

```
ai-fitness-tracker/
├── backend/
│   ├── src/
│   │   ├── config/        # Database, logger
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Auth, validation, rate limit, errors
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # Express route definitions
│   │   ├── services/      # Gemini AI, business logic
│   │   ├── validators/    # Joi schemas
│   │   ├── app.js         # Express app config
│   │   └── server.js      # Entry point
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/       # Auth context
│   │   ├── pages/
│   │   ├── services/      # API client
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── tailwind.config.js
├── docker-compose.yml
├── azure-pipelines.yml
└── docs/
```

## 3. MongoDB Schemas

| Model | Purpose |
|-------|---------|
| **User** | Auth (email, hashed password), profile, fitness goal, role (user/premium/admin) |
| **HealthLog** | Polymorphic: nutrition entries, activity, sleep, weight per date |
| **AIRecommendation** | Stores Gemini responses (calorie/macro, food, motivation, plateau) |
| **Progress** | Aggregated weekly/monthly metrics for reports |

## 4. Authentication & Authorization

- **JWT** access tokens (7d expiry), signed with `JWT_SECRET`
- **bcrypt** password hashing (12 rounds)
- **protect** middleware: validates Bearer token, attaches `req.user`
- **authorize(...roles)**: restricts routes by role

## 5. API Routes (RESTful)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register user |
| POST | `/api/v1/auth/login` | Login, returns token |
| GET | `/api/v1/auth/me` | Current user (protected) |
| GET/POST | `/api/v1/logs` | List/create health logs |
| GET/PATCH/DELETE | `/api/v1/logs/:id` | Get/update/delete log |
| GET | `/api/v1/progress/weight-trend` | Weight over time |
| GET | `/api/v1/progress/weekly` | Weekly aggregated metrics |
| GET | `/api/v1/ai/calorie-macro` | AI calorie/macro targets |
| GET | `/api/v1/ai/food-suggestions` | AI food ideas |
| GET | `/api/v1/ai/motivation` | AI motivation message |
| GET | `/api/v1/ai/plateau-check` | Plateau detection |
| PATCH | `/api/v1/users/profile` | Update profile |

## 6. Security Middleware

- **Helmet**: Security headers
- **CORS**: Configurable origin
- **mongo-sanitize**: NoSQL injection prevention
- **express-rate-limit**: 100 req/15min general, 10 req/15min auth
- **Joi validation**: Request body/query validation
- **JWT protect**: All /logs, /progress, /ai, /users require auth

## 7. Gemini AI Integration

- **Calorie & macro**: User profile + recent logs → JSON {calories, protein, carbs, fat, rationale}
- **Food suggestions**: Today's intake + profile → 5 food options
- **Motivation**: Goal + recent activity → short motivational text
- **Plateau detection**: 2+ weeks weight data → plateau flag + suggestion

Responses are persisted in `AIRecommendation` for history.

## 8. Docker

- **backend**: Node 20 Alpine, exposes 5000
- **frontend**: Multi-stage (Vite build → nginx), exposes 80 (mapped 3000)
- **mongodb**: MongoDB 7, volume for persistence
- **docker-compose**: Orchestrates all three

## 9. CI/CD (Azure DevOps)

- **Trigger**: main, develop
- **Build**: Node 20, npm ci, lint (backend), build (frontend), Docker build
- **Deploy**: On main, deploy to Azure (Container Apps/AKS) — customize for your subscription

## 10. Logging & Monitoring

- **Winston**: Structured logs to console; in production also to `logs/error.log`, `logs/combined.log`
- **Azure Monitor**: Use `APPLICATIONINSIGHTS_CONNECTION_STRING` for Application Insights (add `applicationinsights` package and initialize in `server.js` for production)

## 11. Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Min 32 chars for JWT signing |
| `GEMINI_API_KEY` | Google Gemini API key |
| `CORS_ORIGIN` | Allowed frontend origin |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window |
