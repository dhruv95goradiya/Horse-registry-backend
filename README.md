# Horse Registry Backend

This repository contains the backend code for a Horse Registry application. It provides endpoints to manage horse profiles, member profiles, authentication, and administrative functions.

## Installation

To install the dependencies, run the following command:

```bash
npm install
```

## Usage

To start the server, run:

```bash
npm start
```

To run the server with nodemon for automatic reloading during development, use:

```bash
npm run local
```

## Endpoints

### Members

- **POST /api/members**: Create a new member profile.
- **POST /api/members/login**: Member login route for authentication.
- **GET /api/members**: Retrieve all members with pagination.
- **GET /api/members/:id**: Retrieve a member by ID.
- **PUT /api/members/:id**: Update a member by ID.
- **DELETE /api/members/:id**: Delete a member by ID.
- **GET /api/members/pending-horses**: Retrieve pending horses belonging to the authenticated member with pagination.
- **PUT /api/members/pending-horses/:horseId**: Update pending horse details.

### Horses

- **POST /api/horses**: Create or register a horse with documents.
- **GET /api/horses**: Retrieve all horses with pagination.
- **GET /api/horses/member**: Retrieve horses belonging to the authenticated member with pagination.
- **GET /api/horses/:id**: Retrieve a horse by ID.
- **PUT /api/horses/:id**: Update a horse by ID.
- **DELETE /api/horses/:id**: Delete a horse by ID.

### Authentication

- **POST /api/auth/login**: Member login route for authentication.
- **POST /api/auth/admin-login**: Admin login route for authentication.
- **GET /api/auth/horses/search**: Search for approved horses with pagination, including member information.
- **GET /api/auth/horses**: List all approved horses owned by a member with pagination.
- **GET /api/auth/pending-horses**: Fetch pending or registered horse profiles for authenticated member with pagination.
- **POST /api/auth/request-owner-change**: Route for a member to request a change in horse owner.

### Admin

- **POST /api/admin/register**: Register a new admin.
- **GET /api/admin/admin-only**: Access an admin-only route.
- **GET /api/admin/members**: Get all members with pagination and isActive filter.
- **GET /api/admin/members/:memberId/horses**: Get all horses within a member's account with pagination and approval status filter.
- **GET /api/admin/horses**: Get all approved horses in the system with pagination.
- **GET /api/admin/pending-horses**: Get all pending horse requests with pagination.
- **GET /api/admin/statistics**: Get statistics related to members, horses, and requests.
- **PUT /api/admin/approve-horse/:id**: Approve or reject a horse request.
- **GET /api/admin/owner-change-requests**: Get owner change requests with pagination and status filter.
- **GET /api/admin/members/search**: Search for members with pagination.
- **GET /api/admin/horses/search**: Search for horses with owner information and pagination.

## Testing

To run tests, execute:

```bash
npm test
```

## Test Coverage

To generate a coverage report, run:

```bash
npm run coverage
```

This command will generate a coverage report in the `coverage` directory, detailing the percentage of code covered by tests.

## Dependencies

- axios: ^1.6.7
- bcrypt: ^5.1.1
- body-parser: ^1.20.2
- cors: ^2.8.5
- express: ^4.18.2
- jsonwebtoken: ^9.0.2
- mongoose: ^8.1.1
- multer: ^1.4.5-lts.1

## Development Dependencies

- nodemon: ^3.0.3

## License

This project is licensed under the ISC License.