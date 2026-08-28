# Beginner Task Manager

A deliberately small full-stack learning project using React, NestJS, Prisma,
and PostgreSQL. It supports viewing, adding, completing, editing, deleting, and
filtering tasks. It has no authentication and no advanced architecture.

## Project structure and what each file does

```text
task-manager/
├── backend/
│   ├── prisma/
│   │   ├── migrations/20260826000000_init/migration.sql
│   │   └── schema.prisma
│   ├── src/
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── tasks/
│   │   │   ├── dto/
│   │   │   │   ├── create-task.dto.ts
│   │   │   │   └── update-task.dto.ts
│   │   │   ├── tasks.controller.ts
│   │   │   ├── tasks.service.ts
│   │   │   └── tasks.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TaskForm.jsx
│   │   │   ├── TaskList.jsx
│   │   │   └── TaskItem.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── DEBUGGING.md
```

### Backend files

- `backend/prisma/schema.prisma`: describes the `Task` table and selects
  PostgreSQL as the database.
- `backend/prisma/migrations/.../migration.sql`: SQL that creates the table.
- `backend/src/prisma/prisma.service.ts`: opens the database connection and
  gives NestJS access to Prisma queries.
- `backend/src/prisma/prisma.module.ts`: makes `PrismaService` available to the
  other Nest modules.
- `backend/src/tasks/dto/create-task.dto.ts`: validates a new task request.
- `backend/src/tasks/dto/update-task.dto.ts`: validates fields that may be
  changed.
- `backend/src/tasks/tasks.controller.ts`: maps HTTP routes to service methods.
  It deliberately contains very little logic.
- `backend/src/tasks/tasks.service.ts`: contains CRUD queries, ID checks,
  not-found handling, and database error handling.
- `backend/src/tasks/tasks.module.ts`: groups the task controller and service.
- `backend/src/app.module.ts`: joins the Prisma and Tasks modules.
- `backend/src/main.ts`: starts NestJS, enables validation and CORS, and listens
  on the configured port.
- `backend/.env`: contains the private local database URL and backend port. It
  is ignored by Git.

### Frontend files

- `frontend/index.html`: contains the DOM element where React is mounted.
- `frontend/src/main.jsx`: starts React and loads the CSS.
- `frontend/src/App.jsx`: owns task state, filters, all `fetch` calls, loading,
  and request errors.
- `frontend/src/components/TaskForm.jsx`: validates and submits a new task.
- `frontend/src/components/TaskList.jsx`: renders all currently filtered tasks.
- `frontend/src/components/TaskItem.jsx`: handles completion, editing, and
  deletion controls for one task.
- `frontend/src/styles.css`: basic responsive styling.
- `frontend/vite.config.js`: tells Vite to compile React JSX correctly.

## Installation and startup

Run each section in order. Do not continue when a command reports an error;
use `DEBUGGING.md` first.

### 1. Create the PostgreSQL database

The following command connects as the `postgres` role and creates an empty
database named `task_manager`. It may ask for your PostgreSQL password.

```bash
createdb -h localhost -p 5432 -U postgres task_manager
```

If it says the database already exists, do not create it again. Check it with:

```bash
psql -h localhost -p 5432 -U postgres -d task_manager
```

Type `\q` to leave `psql`.

### 2. Configure the backend environment

Enter the backend folder:

```bash
cd task-manager/backend
```

Copy the safe example to the real environment file:

```bash
cp .env.example .env
```

Edit `.env` and replace the example username and password:

```dotenv
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/task_manager?schema=public"
PORT=3001
```

If a password contains characters such as `@`, `:`, `/`, or `#`, URL-encode
them. Never commit `.env`.

### 3. Install and prepare the backend

This downloads the NestJS, Prisma, and validation packages in `package.json`:

```bash
npm install
```

This reads `schema.prisma` and generates the type-safe Prisma client:

```bash
npx prisma generate
```

This applies the checked-in initial migration to PostgreSQL:

```bash
npx prisma migrate deploy
```

During future schema practice, create a new development migration with:

```bash
npx prisma migrate dev --name describe_your_change
```

Confirm that every migration has been applied:

```bash
npx prisma migrate status
```

Compile the backend to catch TypeScript errors:

```bash
npm run build
```

Start NestJS in watch mode:

```bash
npm run start:dev
```

The API should be available at `http://localhost:3001/tasks`. Keep this
terminal open.

### 4. Install and start the frontend

Open a second terminal and enter the frontend folder:

```bash
cd task-manager/frontend
```

Install React and Vite:

```bash
npm install
```

Optional: create `frontend/.env` when the API is not on the default URL:

```dotenv
VITE_API_URL=http://localhost:3001
```

Start the React development server:

```bash
npm run dev
```

Open `http://localhost:5173`. A production build can be checked with:

```bash
npm run build
```

## How the layers communicate

### React to NestJS

`App.jsx` calls URLs such as `http://localhost:3001/tasks` with the browser
Fetch API. It sets the HTTP method, JSON headers, and request body. NestJS sends
JSON back. React reads that JSON and updates component state, which rerenders
the page. CORS in `backend/src/main.ts` permits requests from the React
development origin.

### NestJS to Prisma

The controller receives the HTTP request. Nest's validation pipe checks the
DTO. The controller then calls a clearly named method in `TasksService`.
`TasksService` uses the injected `PrismaService`, for example
`prisma.task.findMany()` or `prisma.task.create()`.

### Prisma to PostgreSQL

Prisma reads `DATABASE_URL`, connects to PostgreSQL, translates the Prisma
method into SQL, and maps the database row back to a JavaScript object. The
service returns that object and NestJS serializes it as JSON.

## Complete request workflow

Example: the user clicks **Add task**.

```text
TaskForm submit
→ App.jsx calls fetch("POST /tasks")
→ TasksController.create receives the request
→ ValidationPipe checks CreateTaskDto
→ TasksService.create trims and prepares the data
→ Prisma runs an INSERT query
→ PostgreSQL stores and returns the row
→ Prisma returns a Task object
→ NestJS responds with HTTP 201 and JSON
→ App.jsx adds the task to React state
→ React rerenders TaskList
```

The same path is used for reading, editing, completing, and deleting; only the
HTTP method and Prisma query change.

## Test with the React interface

1. Start PostgreSQL, backend, and frontend.
2. Open `http://localhost:5173`.
3. Submit a blank title. Expect `Please enter a task title.`
4. Add a title and optional description. Expect the new task at the top.
5. Check its checkbox. Expect crossed-out text.
6. Click **Completed**. Expect the completed task to remain visible.
7. Click **Pending**. Expect that completed task to be hidden.
8. Click **All**, then **Edit**, change the values, and click **Save**.
9. Click **Delete**. Expect the item to disappear.

## Test with browser developer tools

Open developer tools and select the **Network** tab. Perform each React action
and select its request. Check:

- Request URL is on `localhost:3001`.
- Method is `GET`, `POST`, `PATCH`, or `DELETE` as expected.
- POST/PATCH request payload is JSON.
- Response status is `2xx` for success or `4xx` for a bad request.
- Response preview contains the task or understandable error JSON.

Use the **Console** tab for React errors. Use the **Elements** tab to confirm
that the rendered list changes after state changes.

## Test every endpoint with curl or Postman

The same URLs, methods, headers, and bodies can be entered in Postman. Replace
`1` with an ID returned by POST.

### GET /tasks

```bash
curl -i http://localhost:3001/tasks
```

Expected: `200 OK` and an array such as `[]` or `[{"id": 1, ...}]`.

### POST /tasks

```bash
curl -i -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Prisma","description":"Practice CRUD"}'
```

Expected: `201 Created` and a task containing an integer `id`, `completed:
false`, and `createdAt`.

Blank-title test:

```bash
curl -i -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"   "}'
```

Expected: `400 Bad Request` with a title validation message.

### GET /tasks/:id

```bash
curl -i http://localhost:3001/tasks/1
```

Expected: `200 OK` and one task. A missing task returns `404 Not Found`.
`/tasks/abc` returns `400 Bad Request` because the ID is not numeric.

### PATCH /tasks/:id

```bash
curl -i -X PATCH http://localhost:3001/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Prisma CRUD","completed":true}'
```

Expected: `200 OK` and the updated task. Sending `"completed":"yes"`
returns `400 Bad Request`.

### DELETE /tasks/:id

```bash
curl -i -X DELETE http://localhost:3001/tasks/1
```

Expected: `200 OK` and `{"message":"Task 1 was deleted"}`. Repeating it
returns `404 Not Found`.

## Common errors and quick fixes

- **Cannot reach backend:** start NestJS and verify the URL/port in `App.jsx`
  or `VITE_API_URL`.
- **CORS error:** open React at `http://localhost:5173` or update the allowed
  origin in `backend/src/main.ts`.
- **EADDRINUSE:** another program owns the port. Stop it or choose another
  `PORT` and update `VITE_API_URL`.
- **Password authentication failed:** correct the user/password in
  `DATABASE_URL`.
- **Database does not exist:** run `createdb` with the exact database name.
- **Prisma table missing:** run `npx prisma migrate deploy`.
- **DTO returns 400:** check JSON types, required title, and
  `Content-Type: application/json`.
- **404 task not found:** use an ID that currently exists.
- **React shows old code:** restart Vite and hard-refresh the browser.

See `DEBUGGING.md` for a systematic guide.

## What you learned

- How React state and forms drive a small CRUD interface.
- How to call an HTTP API with `fetch` and handle failures.
- How NestJS modules, controllers, services, DTOs, pipes, and CORS fit together.
- How to keep route handling thin and database logic in a service.
- How Prisma models become migrations and type-safe CRUD queries.
- How PostgreSQL stores the data behind Prisma.
- How to follow one request across every layer using browser and server tools.
- How HTTP status codes distinguish success, validation, missing data, and
  server failures.
