# Dumsel Merchants Backend

This project adds a Node.js + Express backend to the existing business website and connects it to PostgreSQL.

## What is included

- `server.js` — Express server with API routes
- `db.js` — PostgreSQL connection helper using `pg`
- `db/init.sql` — database schema and sample data
- `scripts/init-db.js` — initialize the database from SQL
- Updated frontend JS to call the backend APIs

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a PostgreSQL database.

3. Copy `.env.example` to `.env` and update the database connection string:

   ```bash
   copy .env.example .env
   ```

4. Initialize the database:

   ```bash
   npm run db:init
   ```

5. Start the server:

   ```bash
   npm start
   ```

6. Open the site in your browser:

   ```text
   http://localhost:3000
   ```

## API Endpoints

- `GET /api/products`
- `POST /api/login`
- `POST /api/contact`
- `POST /api/checkout`
- `GET /api/admin/stats`

## Notes

- The backend serves the existing frontend from `business website/`.
- The sample admin user is `william` / `9089089`.