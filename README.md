# BED-Assignment

# HawkerHub — Member 1 Complete Project

HawkerHub is a Node.js, Express and Microsoft SQL Server application for a
Singapore hawker-centre system. This submission completes the individual scope
for account management, authentication, menu items with multiple cuisines, and
promotions while preserving the team's shared database and unrelated modules.

## Individual scope

- Customer registration and unified login
- Bcrypt password hashing and JWT authentication
- Five-role authorization
- Own-profile retrieval and update
- Administrator User Account CRUD and filtering
- Vendor-owned Menu Item CRUD
- Multiple cuisines per menu item with SQL transactions
- Public menu search, filtering, sorting and pagination
- Vendor-owned Promotion CRUD
- Current active-promotion retrieval
- Backend discount calculation
- Responsive frontend integration
- Swagger, Jest/Supertest tests and Postman requests

Complaint Management is intentionally excluded. Order, rental agreement,
inspection and stall CRUD remain teammate-owned.

## Technology stack

- Node.js and Express 5
- Microsoft SQL Server through `mssql`
- `bcryptjs` for password hashing
- `jsonwebtoken` for signed, expiring JWTs
- Joi for authoritative request validation
- Swagger UI with OpenAPI 3
- Jest and Supertest
- Semantic HTML, shared CSS and browser JavaScript

## Prerequisites

- Node.js 22 or newer
- npm
- Microsoft SQL Server
- The already upgraded and verified database:
  `HawkerCentreManagementSystem`

  ## Important database rule

  The existing upgraded database is the source of truth.

  Do not create another database. Do not rerun:

  - `database/02_individual_migration.sql`
  - `database/03_individual_sample_data.sql`
  - `database/05_stage1_verification.sql`

  Do not run:

  - `HCMS.sql`
  - `database/01_individual_clean_install.sql`

  The SQL files are retained only for submission evidence. The backend adapts to
  the verified schema; it does not rebuild or modify it.

  One Stage 1 constraint, `CK_MenuItem_Price`, requires `ItemPrice > 0`.
  Therefore the API rejects zero even though some assignment wording says
  "zero or greater."

  ## Installation

  ```bash
  npm install
  ```

  Copy `.env.example` to `.env`, then enter only your local development values.
  Never commit `.env`.

  ```env
  DB_SERVER=localhost
  DB_PORT=1433
  DB_DATABASE=HawkerCentreManagementSystem
  DB_USER=YOUR_SQL_SERVER_USERNAME
  DB_PASSWORD=YOUR_SQL_SERVER_PASSWORD
  DB_ENCRYPT=false
  DB_TRUST_SERVER_CERTIFICATE=true

  JWT_SECRET=use-a-random-value-of-at-least-32-characters
  JWT_EXPIRES_IN=2h
  PORT=3000
  NODE_ENV=development
  ```

  If SQL Server uses a named instance or different port, use the exact settings
  from SQL Server Configuration Manager.

  ## Run commands

  ```bash
  npm start
  ```

  Development with automatic restart:

  ```bash
  npm run dev
  ```

  Open:

  - Application: `http://localhost:3000`
  - Login: `http://localhost:3000/Html/login.html`
  - Swagger: `http://localhost:3000/api-docs`
  - OpenAPI JSON: `http://localhost:3000/api-docs.json`

  The server refuses to start if required environment variables are missing, the
  database connection fails, the database name is not
  `HawkerCentreManagementSystem`, or Stage 1 objects are absent.

  ## Test commands

  Portable API/controller/service tests:

  ```bash
  npm test
  ```

  Static project checks:

  ```bash
  npm run check
  ```

  The portable tests mock the model layer, so they do not write to SQL Server.
  The database transaction tests are documented but skipped unless a local test
  database is explicitly configured. See
  `tests/database.integration.test.js`.

  ## Demo accounts

  These local-only accounts were inserted by the already completed optional
  Stage 1 sample-data script. Password: `Demo123!`.

  | Role | Email |
  |---|---|
  | Customer | `customer@hawkerhub.test` |
  | Vendor | `vendor@hawkerhub.test` |
  | Operator | `operator@hawkerhub.test` |
  | NEA Officer | `officer@hawkerhub.test` |
  | Administrator | `admin@hawkerhub.test` |

  Only the demo Vendor is linked to `SO013`, whose active rental agreement proves
  ownership of `S013`. Newly created Vendor accounts need an existing
  `StallOwner` profile link before they can manage a stall.

  ## Main API

  | Method | Route | Access |
  |---|---|---|
  | POST | `/api/auth/register` | Public; Customer only |
  | POST | `/api/auth/login` | Public |
  | POST | `/api/users` | Administrator |
  | GET | `/api/users` | Administrator |
  | GET | `/api/users/me` | Authenticated |
  | PATCH | `/api/users/me` | Authenticated self |
  | GET | `/api/users/:userId` | Self or Administrator |
  | PATCH | `/api/users/:userId` | Administrator |
  | DELETE | `/api/users/:userId` | Administrator; soft deactivation |
  | GET | `/api/cuisines` | Public |
  | GET | `/api/menu-items` | Public |
  | GET | `/api/menu-items/:itemId` | Public |
  | POST | `/api/menu-items` | Vendor owner |
  | PATCH | `/api/menu-items/:itemId` | Vendor owner |
  | DELETE | `/api/menu-items/:itemId` | Vendor owner; soft deactivation |
  | GET | `/api/promotions/active` | Public |
  | POST | `/api/promotions` | Vendor owner |
  | PATCH | `/api/promotions/:promotionId` | Vendor owner |
  | DELETE | `/api/promotions/:promotionId` | Vendor owner; soft deactivation |

  Full request/response documentation is available in Swagger.

  ## Authorization rules

  | Role | Own profile | Manage all users | Public menu/promotions | Manage owned menu/promotions |
  |---|---:|---:|---:|---:|
  | Customer | Yes | No | Yes | No |
  | Vendor | Yes | No | Yes | Yes |
  | Operator | Yes | No individual-scope permission | Yes | No |
  | NEA Officer | Yes | No individual-scope permission | Yes | No |
  | Administrator | Yes | Yes | Yes | No vendor ownership bypass |

  Frontend role checks only control navigation. Protected APIs verify the JWT,
  reload the active user from the database, check the role, and check ownership
  through `StallOwner → RentalAgreement → FoodStall`.

  ## Promotion rule

  When several numeric promotions apply to one item, the backend selects the
  promotion producing the lowest non-negative price. If two promotions produce
  the same price, the one ending sooner wins. Existing `ITEM_OFFER` promotions
  remain descriptive because Stage 1 intentionally stores no numeric value for
  them.

  ## Folder structure

  ```text
  config/             shared SQL Server pool and startup check
  controllers/        HTTP request/response logic
  database/           verified Stage 1 evidence; do not rerun
  docs/               OpenAPI, implementation guide, final report and demo
  FED-Assignment-main frontend and preserved teammate pages/assets
  middlewares/        authentication, authorization, validation, errors
  models/              parameterized SQL and transactions
  postman/             collection and local environment
  routes/              API route definitions
  scripts/             static project checker
  services/            backend promotion calculations
  tests/               Jest/Supertest and optional DB integration tests
  utils/               reusable error and async helpers
  validators/          Joi schemas and allowlists
  app.js               Express configuration (exported for tests)
  server.js            database check and HTTP startup
  ```

  ## Security notes

  - Passwords are hashed with bcrypt cost 12.
  - Password hashes are never returned.
  - JWTs contain only `userId` and `role`, expire, and use an environment secret.
  - Active identity and role are rechecked from SQL Server on protected requests.
  - SQL values are parameterized.
  - Sort fields and directions use allowlists.
  - Browser-supplied `ownerId`, `role`, status and final prices are never trusted.
  - Missing/invalid/expired JWT returns 401; insufficient permission returns 403.
  - Errors never expose SQL text, credentials or production stack traces.
  - Account, menu and promotion deletion is soft deactivation.

  ## Postman

  Import both:

  - `postman/HawkerHub.postman_collection.json`
  - `postman/HawkerHub.postman_environment.json`

  Select **HawkerHub Local**, run Login, and the script stores the JWT in the
  environment. Creating test records changes the development database, so use the
  backed-up database and deactivate test records afterward.

  ## Known limitations

  - This workspace could not connect to the user's local SQL Server, so real
    database integration and browser end-to-end tests were not executed here.
    - Public Customer registration creates the central `UserAccount`. It does not
      invent an NRIC to populate the legacy `Customer` table.
      - Administrator creation can optionally link an account to an existing profile
        ID. It does not create teammate-owned profile records.
        - Operator permissions beyond own-profile access were not invented because no
          individual-scope relationship approved them.
          - JWT in `sessionStorage` reduces persistence compared with `localStorage`, but
            JavaScript-readable storage is still vulnerable to XSS. Production systems
              should consider secure, `HttpOnly`, `SameSite` cookies and CSRF protection.

              See `docs/IMPLEMENTATION_GUIDE.md`, `docs/DEMO_SCRIPT.md` and
              `docs/FINAL_REPORT.md` for explanation and presentation preparation.
              