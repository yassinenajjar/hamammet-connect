# Hammamet Connect backend

Laravel JSON API for the Hammamet Connect frontend. The local setup uses MySQL through XAMPP.

## Requirements

- PHP 8.4.1 or newer for the installed Composer dependencies
- Composer
- MySQL

## Run locally

From this directory:

```powershell
composer install
Copy-Item .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

The API runs at `http://localhost:8000`. Laravel's health endpoint is `GET /up`. `GET /api/reports`, `GET /api/reports/{reference}`, `PATCH /api/reports/{reference}`, and `GET /api/services` provide the data consumed by the frontend. The starter authenticated user endpoint is `GET /api/user` and expects a Sanctum bearer token. The Vite frontend origin is configurable with `FRONTEND_URL` in `.env` (default `http://localhost:5173`).

Set `DB_CONNECTION=mysql`, `DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_DATABASE=hammamet_connect`, and the MySQL credentials in `.env`. Create the database in phpMyAdmin or with `CREATE DATABASE hammamet_connect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;` before migrating. The checked-in `.env.example` contains local XAMPP defaults; do not commit `.env` credentials.

The frontend reads and updates reports through the Laravel API. Configure `VITE_API_BASE_URL` in the frontend environment to override its default `http://127.0.0.1:8000/api` base URL.

The seeded reports are sample data matching the frontend. Status changes, rejection reasons, and staff notes persist in MySQL. Rejections require a reason; each actual status change is written to the report history.
