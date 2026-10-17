# Hammamet Connect

Hammamet Connect includes a Laravel API and two React interfaces: the citizen and municipal prototype from `ui/frontend`, plus the API-connected dashboard from `master`.

## Project structure

- `backend/` - Laravel API, database migrations, and seeders.
- `frontend/` - citizen and municipal UI prototype.
- `frontend/dashboard/` - API-connected municipal dashboard.
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

4. To run the citizen and municipal UI prototype, start a second terminal in `frontend/`:

   ```powershell
   npm.cmd install
   npm.cmd run dev
   ```

5. To run the API-connected dashboard instead, use `frontend/dashboard/`:

   ```powershell
   npm.cmd install
   npm.cmd run dev
   ```

The connected dashboard calls `http://127.0.0.1:8000/api` by default. Set `VITE_API_BASE_URL` in `frontend/dashboard/.env.local` to override it. The API provides `GET /api/reports`, `GET /api/reports/{reference}`, `PATCH /api/reports/{reference}`, and `GET /api/services`.
