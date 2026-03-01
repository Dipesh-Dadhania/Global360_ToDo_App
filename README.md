# Global360 ToDo App

Full-stack To-Do application.

- Backend: ASP.NET Core Web API (`ToDoApi`)
- Frontend: Angular (`TodoFrontend`)
- Tests: xUnit + Moq (backend), Angular/Vitest (frontend)

## Quick Setup and Run (Start Here)

### 1) Prerequisites

- .NET SDK 10+
- Node.js 20+ and npm

Check versions:

```bash
dotnet --version
node --version
npm --version
```

### 2) Install dependencies (one-time)

From repository root:

```bash
npm install
npm --prefix Global360_ToDo_App/TodoFrontend install
```

### 3) Run backend + frontend together

From repository root:

```bash
npm run todoapp
```

App URLs:

- Frontend: http://localhost:4200
- Backend API base: http://localhost:5001/api
- Swagger: http://localhost:5001/swagger

## Alternative Run Modes

### Run backend only

```bash
cd Global360_ToDo_App
dotnet run --project ToDoApi
```

### Run frontend only

```bash
cd Global360_ToDo_App/TodoFrontend
npm start
```

## Testing

### Backend tests

```bash
dotnet test Global360_ToDo_App/ToDoApi.Tests/ToDoApi.Tests.csproj
```

### Frontend tests (single run)

```bash
npm --prefix Global360_ToDo_App/TodoFrontend test -- --watch=false
```

## Build

### Backend

```bash
dotnet build Global360_ToDo_App/ToDoApi/ToDoApi.csproj
```

### Frontend

```bash
npm --prefix Global360_ToDo_App/TodoFrontend run build
```

## Project Structure

```text
Global360_ToDo_App/
├── README.md
├── package.json                           # root runner script (backend + frontend)
└── Global360_ToDo_App/
		├── Global360_ToDo_App.slnx
		├── ToDoApi/                           # ASP.NET Core API
		│   ├── Controllers/
		│   ├── Services/
		│   ├── Repositories/
		│   ├── DTOs/
		│   └── Models/
		├── ToDoApi.Tests/                     # backend unit tests
		└── TodoFrontend/                      # Angular app
				└── src/app/todos/
						├── data-access/
						├── feature/
						└── models/
```

## Features Implemented

- Add To-Do with title + description
- Edit title + description
- Delete To-Do
- Mark complete / uncomplete (checkbox icon toggle)
- Separate section for checked items (`Checked To-Do Items`)
- Search with prefix matching + highlighted text
- Expand/collapse description with Material icons
- Client-side pagination (5 per page)
- Empty-state and success/error messaging

## Architecture Notes

The backend follows layered separation:

- **Controller layer**: HTTP transport concerns only
- **Service layer**: business rules/validation/mapping
- **Repository layer**: data persistence abstraction

Why this is useful:

- Cleaner, testable units
- Easier to swap storage implementation later
- Reduced coupling between API contract and persistence

## Configuration

### Backend ports

From `Global360_ToDo_App/ToDoApi/Properties/launchSettings.json`:

- HTTP: `http://localhost:5001`
- HTTPS: `https://localhost:7025`

### Frontend API target

From `Global360_ToDo_App/TodoFrontend/src/environments/environment.ts`:

```ts
apiBaseUrl: "http://localhost:5001/api";
```

If backend URL/port changes, update this value accordingly.

## Troubleshooting

- **Frontend cannot reach API**
  - Ensure backend is running on port `5001`.
  - Verify `apiBaseUrl` in Angular environment.

- **Edit returns 404/405**
  - Restart backend to ensure latest API is running.

- **No data after restart**
  - Current repository is in-memory; data resets when API restarts.

- **Frontend test/build style budget warning**
  - This is currently a warning (not a failure).
  - Can be resolved by reducing component SCSS or adjusting Angular style budget.
