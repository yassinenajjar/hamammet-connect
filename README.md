# Hammamet Connect

Hammamet Connect is one React application with a citizen portal and a municipal dashboard, backed by a Laravel API.

## Project structure

- `backend/` - Laravel API, database migrations, and seeders.
- `frontend/src/citizen/` - citizen portal and its prototype municipal area.
- `frontend/src/municipal/` - API connected municipal dashboard.
- `frontend/` - shared React, Vite, and routing setup.
- `docs/` - project diagrams and reference material.

## Run locally

Requirements: Node.js, PHP 8.4.1 or newer for the installed backend dependencies, Composer, and MySQL.

1. Start MySQL in XAMPP and create a database named `hammamet_connect` in phpMyAdmin.
2. In `backend/.env`, configure `DB_CONNECTION=mysql`, `DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_DATABASE=hammamet_connect`, and your MySQL username and password.
3. Start Laravel from `backend/`:

   ```powershell
   composer install
   php artisan migrate --seed
   php artisan serve
   ```

4. Start the React app from `frontend/`:

   ```powershell
   npm.cmd install
   npm.cmd run dev
   ```

The citizen portal opens at `/`. The municipal dashboard is available at `/dashboard` and requires a staff account. It calls `http://127.0.0.1:8000/api` by default; set `VITE_API_BASE_URL` in `frontend/.env.local` to override it. Citizens can register, submit anonymous or account-linked reports, and view their own reports. Anonymous tracking requires both the report reference and the one-time secret shown after submission. Staff report APIs require a Sanctum bearer token and the `staff` or `admin` role.
