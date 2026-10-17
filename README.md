# Hammamet Connect

Municipal reporting dashboard with a React frontend and Laravel JSON API.

## Project structure

- `frontend/` - React application, Vite configuration, and frontend dependencies.
- `backend/` - Laravel API, database migrations, and seeders.
- `docs/` - project diagrams and reference material.

## Run locally

Requirements: Node.js, PHP 8.4.1 or newer for the installed backend dependencies, Composer, and MySQL.

1. Start MySQL in XAMPP and create a database named `hammamet_connect` in phpMyAdmin.
2. In `backend/.env`, configure `DB_CONNECTION=mysql`, `DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_DATABASE=hammamet_connect`, and your MySQL username and password.
3. In a terminal, start Laravel:

   ```powershell
   cd backend
   composer install
   php artisan migrate --seed
   php artisan serve
   ```

4. In a second terminal from the project root, start React:

   ```powershell
   cd frontend
   npm.cmd install
   npm.cmd run dev
   ```

Open the Vite URL, usually `http://localhost:5173`. The frontend calls `http://127.0.0.1:8000/api` by default; set `VITE_API_BASE_URL` in `frontend/.env.local` to override it.

The API provides `GET /api/reports`, `GET /api/reports/{reference}`, `PATCH /api/reports/{reference}`, and `GET /api/services`. Seed data is optional; omit `--seed` to start with an empty database.
