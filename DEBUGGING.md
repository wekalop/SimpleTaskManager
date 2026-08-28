# Task Manager Debugging Guide

Debug one layer at a time in this exact order:

```text
React
→ API request
→ NestJS controller
→ DTO validation
→ NestJS service
→ Prisma
→ PostgreSQL
→ Response
→ React state
```

Do not change several layers at once. Find the first layer that behaves
differently from what you expect.

## 1. React

Open browser developer tools and check the **Console**.

- A blank page usually means a JSX/import runtime error.
- Confirm `main.jsx` imports `App.jsx` and `styles.css`.
- Confirm `vite.config.js` includes the React plugin.
- Check that button handlers receive the expected props.
- Temporarily log a value, for example `console.log(tasks)`, then remove the log
  after debugging.
- Restart `npm run dev` after changing Vite configuration or `.env`.

If client-side blank-title validation appears, enter a nonblank title before
checking later layers.

## 2. API request

In developer tools, open **Network**, perform the action, and select the
request.

- The URL must start with `http://localhost:3001` unless you deliberately
  changed both servers.
- Adding uses POST `/tasks`.
- Loading uses GET `/tasks`.
- Editing/completing uses PATCH `/tasks/:id`.
- Deleting uses DELETE `/tasks/:id`.
- POST and PATCH must include `Content-Type: application/json`.
- The payload must be valid JSON, not a JavaScript object printed as text.

If no request appears, the React handler did not run. If it is red, inspect its
status and response body.

## 3. NestJS controller and route errors

Watch the terminal running `npm run start:dev`. At startup it should list the
five `/tasks` routes.

- `404 Cannot GET /task` means the path is wrong; it is `/tasks` (plural).
- `404 Cannot POST /tasks/1` means the method/path combination is wrong.
- A request sent to frontend port `5173` never reaches NestJS.
- `EADDRINUSE` means another process is already using the configured port.
- If startup fails before listing routes, read the first Nest error and fix it
  before using React.

The controller should only receive values and call `TasksService`. Put CRUD
debugging in the service, not additional hidden controller logic.

## 4. DTO validation errors

Nest's global `ValidationPipe` returns `400 Bad Request` before the service runs
when a body fails its DTO.

Examples:

- `{"title":""}` fails because title is empty.
- `{"title":"   "}` fails because it contains only spaces.
- `{"completed":"true"}` fails because the value is a string; send
  `{"completed":true}`.
- An overly long title or description fails its `MaxLength` rule.
- `/tasks/abc` fails `ParseIntPipe` because the ID is not numeric.
- `/tasks/0` reaches the service ID check and returns 400 because IDs must be
  positive.

Read the `message` array in the JSON response for the exact rule.

## 5. NestJS service

If validation passes but behavior is wrong, inspect `tasks.service.ts`.

- Confirm the correct method (`findMany`, `findUnique`, `create`, `update`, or
  `delete`) is called.
- Confirm `where: { id }` uses the numeric route ID.
- Confirm update data includes only the intended changes.
- A real numeric ID that does not exist should become `404 Not Found`.
- Unexpected Prisma failures should become a readable `500` database message.

Add a temporary `console.log(id, updateTaskDto)` immediately before the Prisma
call when necessary, then remove it.

## 6. Prisma and migration errors

Run these commands from `task-manager/backend`.

Validate the Prisma file without changing the database:

```bash
npx prisma validate
```

Regenerate the client after changing `schema.prisma`:

```bash
npx prisma generate
```

Check migration state:

```bash
npx prisma migrate status
```

Apply checked-in migrations:

```bash
npx prisma migrate deploy
```

Common Prisma/migration errors:

- **Environment variable not found:** `.env` is missing or lacks
  `DATABASE_URL`.
- **Table does not exist:** migration was not applied to this database.
- **P1000:** PostgreSQL rejected the credentials.
- **P1001:** Prisma cannot reach the host/port.
- **P1003:** the named database does not exist.
- **Migration failed:** read the first SQL/database error, fix the cause, and
  check `npx prisma migrate status` before retrying. Do not delete migration
  history from a database that contains important data.
- **Generated client is stale:** run `npx prisma generate` and restart NestJS.

## 7. PostgreSQL connection errors

Check that the server is ready:

```bash
pg_isready -h localhost -p 5432
```

Test the same user and database as `DATABASE_URL`:

```bash
psql -h localhost -p 5432 -U YOUR_USER -d task_manager
```

Then inspect:

- Username and password are correct.
- Host is `localhost` and port is normally `5432`.
- Database name is exactly `task_manager`.
- PostgreSQL is running.
- Special password characters are URL-encoded in `DATABASE_URL`.
- The PostgreSQL role has permission to use the database/schema.

Inside `psql`, use `\dt` to list tables and `\d "Task"` to inspect the Task
table. Type `\q` to exit.

## 8. Response and HTTP status codes

Inspect the Network response or use `curl -i`.

| Status | Meaning here | What to check |
| --- | --- | --- |
| 200 | GET, PATCH, or DELETE succeeded | Response JSON has expected data |
| 201 | POST created a task | Response has new `id` |
| 400 | Invalid ID or DTO/body | Read response `message` |
| 404 | Route or task not found | Check path and current task ID |
| 500 | Unexpected server/database failure | Check Nest and PostgreSQL terminals |

If Nest logs a successful request but the browser says CORS blocked it, the
response exists but the browser refuses to expose it to React. Match the React
origin in `app.enableCors()` and restart NestJS.

## 9. React state

If the response is correct but the UI is wrong, the issue is after the API.

- POST should prepend `newTask` to the current array.
- PATCH should map the array and replace the matching ID.
- DELETE should filter out the matching ID.
- Filters should derive `filteredTasks` without changing the original `tasks`.
- Never mutate a task or the tasks array directly; create a new array so React
  knows it must rerender.
- Remember that a completed task intentionally disappears under **Pending**.

Reload the page. If PostgreSQL has the correct data after reload, the backend
worked and the earlier problem was only React state. If the data is wrong after
reload, move backward through the debugging order until you find the first bad
layer.

## CORS checklist

For this project the normal origins are:

```text
React:  http://localhost:5173
NestJS: http://localhost:3001
```

Check spelling, protocol, host, and port. `localhost` and `127.0.0.1` count as
different origins. After changing CORS, restart NestJS.

## Incorrect request body checklist

Correct create body:

```json
{
  "title": "Learn Prisma",
  "description": "Practice CRUD"
}
```

Correct completion body:

```json
{
  "completed": true
}
```

Use double quotes in JSON, send booleans without quotes, and do not send an
empty title. Confirm the `Content-Type` header is `application/json`.
