# KODA API Documentation

This Bruno collection contains API requests for testing the KODA backend.

## Setup

1. Start the backend server: `npm run start` (runs on http://localhost:3000)
2. Open Bruno and import this collection.
3. Set environment variables:
   - `token`: Your JWT token (obtain via GitHub OAuth)
   - `teamId`: A team UUID for team operations
   - `userId`: A user UUID for user operations
   - `issueId`: An issue UUID for issue operations
   - `assignmentId`: An assignment UUID for assignment operations
   - `batchId`: A batch UUID for batch operations

## Authentication

### GitHub OAuth Flow
Since Bruno doesn't handle OAuth redirects directly:
1. Visit `http://localhost:3000/auth/github` in your browser.
2. Complete GitHub login.
3. You'll be redirected to the frontend with a token in the URL (e.g., `?token=...`).
4. Copy the token and set it as the `{{token}}` variable in Bruno.

### Using Bearer Token
All protected endpoints use Bearer authentication with the `{{token}}` variable.

## Endpoints

### Auth
- **Get Current User** (`GET /auth/me`): Get authenticated user info.

### Users (Admin Only)
- **Onboard User** (`POST /users/onboard`): Set role for a user.
- **Get All Users** (`GET /users`): List all users.

### Batches
- **Create Batch** (`POST /batches`): Create a new batch.
- **Get All Batches** (`GET /batches`): List all batches (with optional search).
- **Get Batch** (`GET /batches/:id`): Get a specific batch.
- **Update Batch** (`PATCH /batches/:id`): Update a batch.
- **Assign Interns** (`POST /batches/:id/interns`): Assign interns to a batch.

### Issues
- **Get All Issues** (`GET /issues`): List all issues (with filters).
- **Get Issues by Intern** (`GET /issues/intern/:internId`): Get issues assigned to an intern.
- **Get Issue** (`GET /issues/:id`): Get a specific issue.

### Issue Assignments
- **Get Assignments** (`GET /issues/:issueId/assignments`): Get assignments for an issue.
- **Manual Assign** (`POST /issues/:issueId/assignments`): Manually assign an intern to an issue.
- **Remove Assignment** (`DELETE /issues/:issueId/assignments/:assignmentId`): Remove an assignment.

### Teams
- **Create Team** (`POST /teams`): Create a new team (Team Lead only).
- **Add Team Member** (`POST /teams/:id/members`): Add user to team (Team Lead only).
- **Remove Team Member** (`DELETE /teams/:id/members/:userId`): Remove user from team (Team Lead only).
- **Get Team Details** (`GET /teams/:id`): Get team with members.

### Dashboard
- **Get Dashboard Stats** (`GET /dashboard/stats`): Coordinator dashboard counters and average score.
- **Get Dashboard Performance Trend** (`GET /dashboard/performance-trend`): Weekly average score trend.
- **Get Dashboard Activity Feed** (`GET /dashboard/activity`): Recent merged activity feed.

## Variables
- `{{token}}`: JWT token from OAuth
- `{{teamId}}`: Team UUID (set after creating a team)
- `{{userId}}`: User UUID (set from user list)
- `{{issueId}}`: Issue UUID (set from issue list)
- `{{assignmentId}}`: Assignment UUID (set from assignments list)
- `{{batchId}}`: Batch UUID (set from batch list)

## Notes
- Replace placeholders like `user-uuid-here` with actual UUIDs.
- Roles: `intern`, `team_lead`, `coordinator`
- Ensure your user has the required role for restricted endpoints.
- Set variables like `{{issueId}}` from responses of GET requests (e.g., from "Get All Issues").