# Backend Ledger

Backend Ledger is a Node.js and Express API for user registration, accounts, and account-to-account transfers. It stores users, accounts, transactions, and an append-only ledger in MongoDB. Account balances are calculated from ledger credits minus debits.

## Features

- Register and sign in with email and password. Passwords are hashed with bcrypt.
- Authenticate using a signed JWT returned in the response and set as an HTTP-only cookie.
- Create and list accounts belonging to the signed-in user, and retrieve an account balance.
- Transfer funds between active accounts with balance checks and idempotency keys.
- Credit initial funds to an account through a system-user-only endpoint.
- Write each transfer's transaction record and ledger entries atomically in a MongoDB transaction.
- Send welcome and transfer notification emails through Gmail OAuth2 when configured.
- `GET /health` reports whether the API process is responding.

## Requirements

- Node.js
- MongoDB configured as a replica set (MongoDB transactions are used for transfers and initial credits)
- Gmail OAuth2 credentials if email notifications are wanted

## Setup

Install dependencies:

```sh
npm install
```

Create a `.env` file in the project root. Do not commit this file.

```dotenv
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/backend-ledger?replicaSet=rs0
JWT_SECRET=replace-with-a-long-random-secret

# Optional: Gmail OAuth2 email configuration
EMAIL_USER=your-sender@gmail.com
CLIENT_ID=your-google-oauth-client-id
CLIENT_SECRET=your-google-oauth-client-secret
REFRESH_TOKEN=your-google-oauth-refresh-token

# Set to production when serving over HTTPS (enables the secure cookie flag)
NODE_ENV=development
```

Start the API:

```sh
npm start
```

For development with automatic restarts:

```sh
npm run dev
```

The API listens on port `3000` by default, or the port set by `PORT`. It connects to MongoDB before starting the HTTP listener.

## Authentication

Register and login responses include a JWT in `token` and set the same token in an HTTP-only cookie. Protected routes accept either that cookie or an `Authorization: Bearer <token>` header. Tokens expire after three days. In production, the cookie is marked `Secure`; serve the API over HTTPS in that environment.

## API

All request and response bodies use JSON. Send `Content-Type: application/json` with JSON requests.

### Health

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Returns `{ "status": "ok" }` when the API is responding. |

### Authentication

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | No | Create a user and sign in. Requires `name`, `email`, and `password` (at least 6 characters). |
| `POST` | `/api/auth/login` | No | Sign in with `email` and `password`. |

Example registration request:

```sh
curl -i http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Asha Rao","email":"asha@example.com","password":"change-me"}'
```

Successful registration returns `201` with a `user` object and `token`; login returns `200` in the same format. Registration rejects an existing email with `422`. Invalid input returns `400`; invalid login credentials return `401`.

### Accounts

The account routes are available under both `/api/account` and `/api/accounts`.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/accounts` | User | Create an account for the signed-in user. New accounts are `ACTIVE` and default to `INR`. |
| `GET` | `/api/accounts` | User | List the signed-in user's accounts. |
| `GET` | `/api/accounts/balance/:accountId` | Account owner | Return the balance for an account owned by the signed-in user. |

Example (replace the token and account ID):

```sh
curl http://localhost:3000/api/accounts/balance/ACCOUNT_ID \
  -H 'Authorization: Bearer TOKEN'
```

The balance response contains `accountId` and `balance`. An account balance starts at zero and is derived from immutable ledger entries. The schema permits only one `ACTIVE` account per user at a time.

### Transactions

Transaction routes are available under both `/api/transiction` (legacy spelling) and `/api/transactions`.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/transactions` | User | Transfer funds from an account owned by the signed-in user to another active account. |
| `POST` | `/api/transactions/system/initial-funds` | System user | Credit initial funds to an active account. |
| `POST` | `/api/transactions/system/intital-funds` | System user | Legacy misspelled alias for initial funds. |

Transfer request:

```json
{
  "fromAccount": "SENDER_ACCOUNT_ID",
  "toAccount": "RECIPIENT_ACCOUNT_ID",
  "amount": 25,
  "idempotencyKey": "unique-client-generated-key"
}
```

Example:

```sh
curl -i http://localhost:3000/api/transactions \
  -H 'Authorization: Bearer TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"fromAccount":"SENDER_ACCOUNT_ID","toAccount":"RECIPIENT_ACCOUNT_ID","amount":25,"idempotencyKey":"transfer-2026-001"}'
```

Amounts must be positive, accounts must be different and active, and the sender must have enough funds. A successful transfer returns `201` with the completed transaction and sender's updated balance. Reusing an idempotency key for the same transfer returns the existing transaction; using it for different transaction details returns `409`.

Initial-funds request:

```json
{
  "toAccount": "ACCOUNT_ID",
  "amount": 100,
  "idempotencyKey": "initial-funds-ACCOUNT_ID-001"
}
```

This endpoint requires a JWT belonging to a user whose `systemUser` field is `true`. That field is immutable and defaults to `false`; create or provision system users through a trusted administrative process. A normal registration does not grant this role.

### Transaction and ledger behavior

A transfer creates a `PENDING` transaction, writes a debit for the sender and a credit for the recipient, then marks the transaction `COMPLETED`, all in one MongoDB transaction. If a database step fails, the transaction is aborted. The ledger is append-only through the model's update and delete guards. Initial funding records one credit and a completed transaction. Email notification is attempted after a transfer commits; notification failures are logged and do not undo the transfer.

## Common errors

Responses use a JSON `message` field. Common status codes include:

- `400` — missing or invalid input, invalid IDs, insufficient balance, or invalid JSON
- `401` — missing, invalid, or expired authentication token
- `403` — account is not active or caller lacks system-user access
- `404` — route or requested account was not found
- `409` — duplicate database value or idempotency key reused with different transaction details
- `413` — request body exceeds the configured JSON body limit
- `500` — unexpected server error

## Data models

- **User:** unique, normalized email; unique name; bcrypt-hashed password; optional immutable `systemUser` flag.
- **Account:** owner, status (`ACTIVE`, `FROZEN`, or `CLOSED`), currency (defaults to `INR`).
- **Transaction:** optional sender, required recipient, positive amount, status, and globally unique idempotency key.
- **Ledger entry:** account, amount, transaction reference, and type (`DEBIT` or `CREDIT`). Entries cannot be edited or deleted through the model's guarded operations.

## Notes

- This project currently has no automated test suite configured (`npm test` is a placeholder).
- Configure `JWT_SECRET` and email credentials through environment variables. Never put real credentials in source control.
