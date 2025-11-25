# SmartCook · AI Kitchen Companion

> Track what is in your kitchen, surface nutritious recipes, and chat with an AI assistant that understands your pantry.

## Table of Contents
- [Overview](#overview)
- [Feature Highlights](#feature-highlights)
- [Architecture](#architecture)
- [Repository Layout](#repository-layout)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Common Scripts](#common-scripts)
- [API Highlights](#api-highlights)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Overview
SmartCook combines a Flask API, a modern React dashboard, and Groq’s Llama 3.1 models to help home cooks reduce waste and plan meals. Users can scan groceries, auto-track inventory, receive expiry reminders, and ask an AI sous-chef for recipes tailored to their dietary needs and pantry.

### Why SmartCook?
- Reduce waste by surfacing ingredients that expire soon.
- Keep nutrition goals on track with calorie and macro logging.
- Plan meals faster with an AI assistant that respects restrictions, allergies, and spice preferences.

## Feature Highlights
- **AI Kitchen Assistant** – Groq Llama 3.1 powered chat surfaces contextual recipes using inventory, dietary tags, spice lists, and rating feedback loops.
- **Inventory Management** – CRUD operations for ingredients, quantity/unit normalization, categories, and expiration tracking backed by PostgreSQL.
- **Scanning & Barcodes** – Camera-based barcode and QR scanning via Quagga/ZXing plus manual search utilities to speed up data entry.
- **Nutrition & Goals** – Macro dashboards, per-user goals, and nutrition logs keyed by recipe hashes for historical analysis.
- **Personalization Loop** – Recipe ratings, saved recipes, spice collections, and user preferences are fed back into the assistant prompts.
- **Automated Notifications** – APScheduler triggers daily SMTP emails warning users about ingredients expiring within 3 days.

## Architecture
- **Backend (`backend/`)** – Flask + SQLAlchemy service with JWT auth, Alembic migrations, APScheduler jobs, and email notifications.
- **Frontend (`frontend2/`)** – React 19 (CRA) SPA with Tailwind/Framer Motion UI, React Router pages, and componentized assistant, inventory, and dashboard widgets.
- **Data** – PostgreSQL (hosted or local) stores users, inventory, preferences, nutrition logs, ratings, and saved recipes.
- **AI** – Groq API (`llama-3.1-8b-instant`) generates recipes; helper layers enforce JSON outputs, normalize measurements, and filter banned ingredients.

```text
frontend2 (React UI) ── axios ─┐
                              │           APScheduler → SMTP
                        Flask API (backend/app) ── SQLAlchemy ── PostgreSQL
                              │
                         Groq API
```

## Repository Layout
```text
backend/
  app/
    routes/…            # REST blueprints (auth, inventory, recipes, assistant, etc.)
    services/…          # Business logic, Groq integration, notifications, rating engine
    utils/…             # Nutrition math, unit normalizers, barcode helpers
    models.py           # SQLAlchemy models
    config.py           # Flask config + env bindings
  migrations/           # Alembic migrations
  run.py                # Backend entry point
frontend2/
  src/components/…      # UI modules (assistant, dashboard, inventory, scanner, etc.)
  src/pages/…           # Routed pages (Dashboard, Inventory, Assistant, Auth, Scan)
  package.json          # React app scripts & dependencies
```

## Getting Started

### Prerequisites
- Python 3.11+ (project tested with 3.12)
- Node.js 18+ and npm 9+
- PostgreSQL 14+ (local or hosted, e.g., Supabase)
- Groq API key (for AI suggestions)
- SMTP credentials (Gmail app password or any TLS-enabled provider)

### 1. Clone & bootstrap
```bash
git clone https://github.com/<your-org>/smartcook.git
cd smartcook1
python -m venv venv
venv\Scripts\activate          # On Windows; use `source venv/bin/activate` on macOS/Linux
pip install -r backend/requirements.txt
npm install --prefix frontend2
```

### 2. Configure environment
Create `backend/.env` (or set system variables):
```ini
DATABASE_URL=postgresql://<user>:<pass>@<host>:5432/<db>
JWT_SECRET_KEY=choose-a-long-secret
GROQ_API_KEY=groq_xxx
SMTP_USER=you@example.com
SMTP_PASS=app-specific-password
ALLOWED_ORIGINS=http://localhost:3000
```

Optional frontend `.env` (place in `frontend2/.env`) if you need to override the API base:
```ini
REACT_APP_API_BASE=http://localhost:5000/api
```

### 3. Run database migrations
```bash
cd backend
flask db upgrade
```
> Ensure `FLASK_APP=run.py` or `app` is set if using the Flask CLI.

### 4. Start the backend
```bash
cd backend
python run.py              # or: flask run --debug
```
The server listens on `http://localhost:5000` with API routes under `/api`.

### 5. Start the frontend
```bash
cd frontend2
npm start
```
CRA dev server runs on `http://localhost:3000` and proxies API calls to the Flask backend.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string (use `sslmode=require` for Supabase). |
| `JWT_SECRET_KEY` | ✅ | Secret for `flask_jwt_extended` tokens. |
| `GROQ_API_KEY` | ✅ | Groq API key for the AI assistant. |
| `SMTP_USER` / `SMTP_PASS` | ⚠️ (for emails) | Credentials used by the expiry notification service. |
| `ALLOWED_ORIGINS` | optional | Comma-separated origins for CORS (defaults to localhost dev ports). |
| `REACT_APP_API_BASE` | optional (frontend) | Override API base URL in the React app. |

## Common Scripts
- `pip install -r backend/requirements.txt` – Install backend dependencies.
- `flask db migrate` / `flask db upgrade` – Manage database schema via Alembic.
- `python backend/run.py` – Launch backend with auto scheduler + email reminders.
- `npm start --prefix frontend2` – Run React dev server with live reload.
- `npm run build --prefix frontend2` – Production build of the SPA.
- `npm test --prefix frontend2` – Execute CRA test suite.

## API Highlights
- `POST /api/auth/register` & `/login` – User onboarding with JWT issuance.
- `GET /api/inventory` & `POST /api/inventory` – Inventory CRUD + unit normalization.
- `POST /api/assistant/recipes` – Generate Groq-backed recipes based on inventory and user prompts.
- `POST /api/recipes/save` & `GET /api/recipes/saved` – Persist curated recipes.
- `GET /api/nutrition/summary` – Macro insights vs. personal goals.
- `POST /api/use-recipe` – Log recipe usage, feeding nutrition logs and inventory deductions.
- `GET /api/spices` – Manage user spice library injected into assistant prompts.

Refer to `backend/app/routes/` for the full list and payload schemas.

## Troubleshooting
- **CORS errors** – Ensure frontend origin is listed in `ALLOWED_ORIGINS` or update the CORS array in `app/__init__.py`.
- **Groq errors** – Check that `GROQ_API_KEY` is valid and that the Groq Python SDK is installed (`pip install groq`).
- **Emails not sending** – Verify SMTP credentials and allow “less secure app” or app passwords for Gmail.
- **Migrations fail** – Confirm PostgreSQL is reachable and that the target database exists; rerun `flask db upgrade`.

## Contributing
1. Fork & branch (`git checkout -b feature/my-feature`).
2. Keep backend and frontend lint-free (`flake8`/`black`, CRA linting).
3. Open a PR with screenshots or GIFs for UI-facing changes plus notes on any new env vars or migrations.
4. Tag reviewers and describe testing performed.

---
SmartCook is an internal project; add a LICENSE file if you plan to distribute it publicly.


