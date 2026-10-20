# Flowers 4U

Flower-shop version of the ITCP318 MERN system. Same MongoDB database / Mongoose collections (`users`, `products`, `orders`) plus a new `categories` collection.

## Setup
1. `backend/env.txt` -> copy to `backend/config/.env` and fill it in (same `DB_URI`/`JWT_SECRET` as the original system, Cloudinary keys, Mailtrap SMTP, `FIREBASE_PROJECT_ID`).
2. `frontend/.env` -> `VITE_API` plus the `VITE_FIREBASE_*` values (leave empty if you don't need Google login yet).
3. Backend (port 4002): `cd backend && npm install && npm start`
4. Frontend (port 5174): `cd frontend && npm install && npm run dev`
5. Optional sample data: `cd backend && npm run seed` (`-- --reset` clears Flowers 4U products first)
6. Make an admin: in MongoDB, set your user's `role` to `admin`.

## Google sign-in (Firebase)
1. console.firebase.google.com -> create a project -> Build -> Authentication -> Sign-in method -> enable **Google**.
2. Project settings -> Your apps -> add a **Web app** -> copy `apiKey`, `authDomain`, `projectId`, `appId` into `frontend/.env`.
3. Put the same project id in `backend/config/.env` as `FIREBASE_PROJECT_ID`.
4. Authentication -> Settings -> Authorized domains must include `localhost`.
5. Restart both servers.

## How it shares the database
- Users are shared with the original system (same accounts and admins).
- Products, orders and categories carry `shop: "Flowers 4U"` and every query filters on it, so the two shops' data stays separate.
- Shop name, order statuses, low-stock level, delivery window and shipping/tax rules live in `backend/config/shop.js`.

## Notes
- Payment is simulated (as in the original). Nothing real is charged.
- Order emails need working SMTP settings; if they fail the order still goes through.
