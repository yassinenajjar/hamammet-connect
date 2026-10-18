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

The API runs at `http://localhost:8000`. Laravel's health endpoint is `GET /up`. Public endpoints include `POST /api/register`, `POST /api/login`, `POST /api/reports`, `POST /api/anonymous/reports/{reference}/access`, and `GET /api/services` or `/api/categories`. Authenticated citizens use `GET /api/user`, `POST /api/logout`, and `GET /api/my/reports`. Staff endpoints are under `/api/staff` and require a Sanctum bearer token plus a `staff` or `admin` role. Public list/detail/update routes are intentionally not provided. The Vite frontend origin is configurable with `FRONTEND_URL` in `.env` (default `http://localhost:5173`).

Set `DB_CONNECTION=mysql`, `DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_DATABASE=hammamet_connect`, and the MySQL credentials in `.env`. Create the database in phpMyAdmin or with `CREATE DATABASE hammamet_connect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;` before migrating. The checked-in `.env.example` contains local XAMPP defaults; do not commit `.env` credentials.

The frontend reads citizen and staff data through the Laravel API. Configure `VITE_API_BASE_URL` in the frontend environment to override its default `http://127.0.0.1:8000/api` base URL. Tokens are held in session storage and expire after 30 days. Anonymous report secrets are shown once at submission and must be kept by the visitor.

Public registration always creates a `citizen`; never expose role selection in the public registration flow. In local and testing environments, `php artisan db:seed --class=MunicipalAgentSeeder` creates `agent@hammamet.tn` with role `staff` and prints a randomly generated one-time password. Set `MUNICIPAL_AGENT_EMAIL`, `MUNICIPAL_AGENT_NAME`, and `MUNICIPAL_AGENT_PASSWORD` in the backend environment to choose the account and password. The seeder does not reset existing accounts and refuses to promote an existing citizen. It is skipped in production; provision production staff through a trusted deployment process. Apply the new schema migration against a backed-up database before seeding.

The seeded reports are sample data matching the frontend. Status changes, rejection reasons, and staff notes persist in MySQL. Rejections require a reason; each actual status change is written to the report history.
