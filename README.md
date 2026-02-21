# AI Fitness Tracker — Production SaaS Platform

A production-ready health & fitness AI web application built with MERN stack, Gemini API, Docker, and Azure DevOps CI/CD.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  React SPA      │────▶│  Express API    │────▶│  MongoDB        │
│  (Port 3000)    │     │  (Port 5000)    │     │  (Port 27017)   │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  Gemini API     │
                        │  (AI Engine)    │
                        └─────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| AI | Google Gemini API |
| Auth | JWT + bcrypt |
| Container | Docker, docker-compose |
| CI/CD | Azure DevOps |
| Monitoring | Azure Monitor |

## Quick Start

```bash
# Development (with Docker)
docker-compose up -d

# Frontend: http://localhost:3000
# Backend API: http://localhost:5000/api
```

## Environment Variables

Copy `.env.example` to `.env` and configure (see docs in respective folders).

## License

Proprietary — All rights reserved.
