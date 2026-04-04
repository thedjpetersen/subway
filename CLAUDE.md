# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Subway is a web-based IRC client with a multi-user backend. It uses WebSockets for frontend/backend communication (with polling fallback), supports connection persistence when the browser disconnects, and optional message logging.

**Note:** This project is not currently under active development.

## Common Commands

```bash
# Start the server (dev mode, port 3000)
./subway.js

# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run a single test file
npx mocha test/unit/models.test.js

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Fix lint errors automatically
npm run lint:fix

# Run tests with coverage
npm run test:coverage

# Full CI validation (lint + coverage + audit)
npm run ci
```

## Architecture

### Backend (Node.js/Express)

- **`subway.js`** - Main entry point. Orchestrates startup: fetches plugins, installs Bower dependencies, compiles static assets, then starts Express server with Socket.IO.

- **`lib/connection.js`** - Core WebSocket handler. Manages all client-server communication:
  - IRC connection lifecycle (connect, disconnect, restore)
  - User authentication (login/logout/register) with bcrypt
  - IRC command proxying (say, join, part, etc.)
  - Session persistence for logged-in users
  - Message logging to database

- **`lib/models.js`** - Database schema using JugglingDB with SQLite. Models: User, Message, Connection, Settings.

- **`lib/static.js`** - Grunt-based build pipeline. Compiles Jade templates, Stylus CSS, and React JSX. In dev mode, watches for file changes.

- **`lib/plugins.js`** - Plugin system that fetches plugins from GitHub Gists.

### Frontend (Backbone.js/React)

- **`src/js/models/models.js`** - Backbone models and collections shared between client and server. Defines App, Connection, Channel, Message, and User models. Isomorphic (works in browser and Node).

- **`src/js/handle_irc.js`** - IRC message parser/handler. Translates raw IRC commands (PRIVMSG, JOIN, PART, etc.) into Backbone model updates. Also isomorphic.

- **`src/js/app.js`** - Client-side app initialization. Sets up Socket.IO listeners and React component rendering.

- **`src/components/`** - React components (JSX files) for the UI.

### Configuration

- **`settings/server.js`** - Server configuration (port, database, server whitelist, default servers).
- **`settings/client.js`** - Client-side settings (plugins, highlights).

### Key Patterns

- Models in `src/js/models/models.js` run both client-side and server-side (isomorphic). Changes on the server update the same Backbone models that the client uses.
- IRC messages flow: node-irc → `lib/connection.js` raw handler → `src/js/handle_irc.js` → Backbone models → Socket.IO emit to client.
- Static assets are built to `tmp/` directory which serves as the Express static root.
- Environment controlled by `IRC_ENV` (defaults to "dev"). Production mode enables JS uglification.

## Testing

Tests use Mocha with Chai assertions and Sinon for mocking. Integration tests use Supertest for HTTP and socket.io-client for WebSocket testing.
