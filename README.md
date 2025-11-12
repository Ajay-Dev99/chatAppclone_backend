# WhatsApp Clone – Server

## Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Create a `.env` file in the `server` directory:

   ```
   MONGODB_URI=<your mongodb connection string>
   JWT_SECRET=<a long random string>
   JWT_EXPIRES_IN=7d # optional, defaults to 7d
   EMAIL_USER=<smtp username>
   EMAIL_PASS=<smtp password>
   ```

3. Run the server
   ```bash
   npm run dev
   ```

## Authentication

- Users request an OTP via `/api/v1/auth/send-otp`.
- On successful verification via `/api/v1/auth/verify-otp`, the server issues a JWT.
- Include the token in subsequent requests using the `Authorization: Bearer <token>` header.
- Protected routes (e.g. `/api/v1/users/list`) require a valid token.

## Helpful Commands

- `npm run dev` – Start the development server with nodemon.
- `npm start` – Start the server without nodemon.
