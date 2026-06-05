# Issue Tracker API

A RESTful backend API for managing project issues with role-based access control. Built with Node.js, Express, TypeScript, and PostgreSQL.

**Live URL:** https://dev-pulse-peach-nine.vercel.app

---

## Features

- User registration and login with JWT authentication
- Role-based access control — `contributor` and `maintainer` roles
- Full CRUD for issues (create, read, update, delete)
- Filter issues by type (`bug`, `feature_request`) and status (`open`, `in_progress`, `resolved`)
- Sort issues by newest or oldest
- Reporter details embedded in issue responses
- Contributors can only update their own issues; maintainers can manage all issues
- Global error handling with consistent JSON response shape

---

## Tech Stack

| Layer      | Technology                       |
| ---------- | -------------------------------- |
| Runtime    | Node.js                          |
| Framework  | Express 5                        |
| Language   | TypeScript                       |
| Database   | PostgreSQL (via `pg`)            |
| Auth       | JSON Web Tokens (`jsonwebtoken`) |
| Passwords  | `bcryptjs`                       |
| Build      | `tsup`                           |
| Dev server | `tsx`                            |
| Deployment | Vercel                           |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted, e.g. Neon, Supabase)

### Installation

```bash
git clone https://github.com/alifbinhossain/Assignment-2.git
cd Assignment-2
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
CONNECTION_STRING=postgresql://user:password@host:port/dbname
JWT_SECRET=your_jwt_secret_key
JWT_SECRET_EXPIRY=7d
```

### Run in Development

```bash
npm run dev
```

### Build and Run for Production

```bash
npm run build
npm start
```

The server initializes the database tables automatically on first run.

---

## API Endpoints

Base URL: `https://assignment-2-gamma-sable.vercel.app` (production) or `http://localhost:5000` (local)

### Auth

| Method | Endpoint           | Access | Description         |
| ------ | ------------------ | ------ | ------------------- |
| POST   | `/api/auth/signup` | Public | Register a new user |
| POST   | `/api/auth/login`  | Public | Login and get token |

**POST `/api/auth/signup` — Request Body**

```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret123",
  "role": "contributor"
}
```

`role` is optional and defaults to `contributor`. Accepted values: `contributor`, `maintainer`.

**POST `/api/auth/login` — Request Body**

```json
{
  "email": "alice@example.com",
  "password": "secret123"
}
```

Returns a JWT token in `data.token`. Pass it as the `Authorization` header on protected routes:

```
Authorization: <token>
```

---

### Issues

| Method | Endpoint          | Auth Required | Role                        | Description        |
| ------ | ----------------- | ------------- | --------------------------- | ------------------ |
| POST   | `/api/issues`     | Yes           | `contributor`, `maintainer` | Create a new issue |
| GET    | `/api/issues`     | No            | Public                      | Get all issues     |
| GET    | `/api/issues/:id` | No            | Public                      | Get a single issue |
| PATCH  | `/api/issues/:id` | Yes           | `contributor`, `maintainer` | Update an issue    |
| DELETE | `/api/issues/:id` | Yes           | `maintainer` only           | Delete an issue    |

**POST `/api/issues` — Request Body**

```json
{
  "title": "Login button not working",
  "description": "Clicking the login button does nothing on Firefox.",
  "type": "bug",
  "status": "open"
}
```

`status` is optional and defaults to `open`. `description` must be at least 20 characters.

**GET `/api/issues` — Query Parameters**

| Parameter | Values                            | Description           |
| --------- | --------------------------------- | --------------------- |
| `type`    | `bug`, `feature_request`          | Filter by issue type  |
| `status`  | `open`, `in_progress`, `resolved` | Filter by status      |
| `sort`    | `newest` (default), `oldest`      | Sort by creation date |

Example: `GET /api/issues?type=bug&status=open&sort=oldest`

**PATCH `/api/issues/:id` — Request Body** (all fields optional)

```json
{
  "title": "Updated title",
  "description": "Updated description with at least 20 characters.",
  "type": "feature_request",
  "status": "in_progress"
}
```

Contributors can only update issues they reported. Maintainers can update any issue.

---

### Response Format

All endpoints return a consistent JSON shape:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Issues retrieved successfully",
  "data": { ... }
}
```

---

## Database Schema

### `users`

| Column       | Type         | Constraints              |
| ------------ | ------------ | ------------------------ |
| `id`         | SERIAL       | PRIMARY KEY              |
| `name`       | VARCHAR(120) | NOT NULL                 |
| `email`      | VARCHAR(120) | UNIQUE, NOT NULL         |
| `password`   | TEXT         | NOT NULL (bcrypt hashed) |
| `role`       | TEXT         | DEFAULT `'contributor'`  |
| `created_at` | TIMESTAMP    | NOT NULL, DEFAULT NOW()  |
| `updated_at` | TIMESTAMP    | NOT NULL, DEFAULT NOW()  |

### `issues`

| Column        | Type         | Constraints                                                    |
| ------------- | ------------ | -------------------------------------------------------------- |
| `id`          | SERIAL       | PRIMARY KEY                                                    |
| `title`       | VARCHAR(150) | NOT NULL                                                       |
| `description` | TEXT         | NOT NULL, minimum 20 characters                                |
| `type`        | VARCHAR(50)  | NOT NULL (`bug` or `feature_request`)                          |
| `status`      | VARCHAR(50)  | NOT NULL, DEFAULT `'open'` (`open`, `in_progress`, `resolved`) |
| `reporter_id` | INT          | FOREIGN KEY → `users(id)` ON DELETE CASCADE                    |
| `created_at`  | TIMESTAMP    | NOT NULL, DEFAULT NOW()                                        |
| `updated_at`  | TIMESTAMP    | NOT NULL, DEFAULT NOW()                                        |

---

## Project Structure

```
src/
├── app.ts                    # Express app setup
├── server.ts                 # Entry point
├── config/index.ts           # Environment config
├── db/index.ts               # DB connection and table initialization
├── types/index.ts            # Shared enums and types
├── middleware/
│   ├── auth.ts               # JWT auth middleware with role checks
│   └── globalErrorHandler.ts
├── modules/
│   ├── auth/                 # Signup and login
│   └── issue/                # Issue CRUD
└── utils/sendResponse.ts     # Unified response helper
```
