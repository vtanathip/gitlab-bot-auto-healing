# Simple GitLab Bot

A simple Node.js bot that automates checking and updating code in a GitLab repository.

## features
- Connects to GitLab using a Personal Access Token.
- Creates a new branch.
- Makes a commit (e.g., updating a timestamp).
- Opens a Merge Request.

## Setup

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Configure Environment**
   Duplicate `.env.example` to `.env` and fill in your details:
   ```bash
   cp .env.example .env
   ```
   - `GITLAB_TOKEN`: Your Personal Access Token with API scope.
   - `PROJECT_ID`: The numeric ID of target GitLab project.
   - `GITLAB_URL`: Your GitLab instance URL (default: `https://gitlab.com`).

3. **Run the Bot**
   ```bash
   pnpm start
   ```

## Development
- `pnpm build`: Compile TypeScript to JavaScript.
