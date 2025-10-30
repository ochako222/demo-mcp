See @README for project overview and @package.json for available npm commands for this project.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo containing two independent MCP (Model Context Protocol) servers:
1. **Telegram MCP Server** - Fetches and searches messages from Telegram channels
2. **Trading 212 MCP Server** - Provides read-only access to Trading 212 portfolio data

Both servers run independently and communicate via stdio transport. They can be run locally or via Docker containers.

## Build Commands

```bash
# Build both servers
npm run build

# Build specific servers
npm run build:telegram
npm run build:trading212
```

Each server has its own `tsconfig.*.json` in its respective directory that extends the root `tsconfig.json`. The build outputs go to:
- Telegram: `dist/telegram/`
- Trading 212: `dist/trading212/`

## Running Servers

```bash
# Development mode (with tsx hot reload)
npm run dev:telegram
npm run dev:trading212

# Production mode (requires build first)
npm run start:telegram
npm run start:trading212

# Docker
npm run docker:build    # Build images
npm run docker:up       # Start both servers
npm run docker:down     # Stop servers
npm run docker:logs     # View logs
```

## Architecture

### TypeScript Configuration
- Root `tsconfig.json` sets strict type checking with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `verbatimModuleSyntax`
- Each service has its own tsconfig that extends the root config and specifies unique `outDir` and `rootDir`
- Module system: `nodenext` with ESM imports (`.js` extensions required in imports)

### Server Structure
Both servers follow the same pattern:
1. Initialize MCP Server from `@modelcontextprotocol/sdk`
2. Set up StdioServerTransport for stdio communication
3. Define capabilities (tools for Telegram, resources for Trading 212)
4. Implement request handlers
5. Connect transport and start server

### Telegram Server (`src/telegram/index.ts`)
- Uses `telegram` library with `StringSession` for authentication
- **CRITICAL stdout suppression** (triple-layer approach):
  1. Overrides `console.log/warn/info/debug` globally BEFORE importing Telegram library
  2. Passes custom `SilentLogger` class as `baseLogger` option to TelegramClient
  3. Calls `client.setLogLevel("none")` before connecting
  - This prevents ALL colored ANSI logs from polluting stdout and breaking MCP stdio protocol
- Implements two tools:
  - `get_telegram_messages`: Fetch recent messages (limit: 100 max)
  - `search_telegram_messages`: Search messages by keyword
- Requires `TELEGRAM_API_ID`, `TELEGRAM_API_HASH`, and `TELEGRAM_SESSION` environment variables
- Includes robust error handling for EPIPE and uncaught exceptions

### Trading 212 Server (`src/trading212/index.ts`)
- Uses custom `Trading212ApiClient` (in `api-client.ts`) with Basic Auth via btoa
- Implements resource-based API (read-only):
  - `trading212://portfolio` - Complete portfolio overview
  - `trading212://account/cash` - Cash information
  - `trading212://orders/history` - Historical orders (supports query params)
  - `trading212://account/metadata` - Account information
- Resource URIs support query parameters (e.g., `?limit=50&ticker=AAPL`)
- API client uses Basic Auth with credentials encoded as base64
- Types defined in `src/trading212/types.ts`
- Error handling via `Trading212ApiClient.isError()` type guard

### API Client Pattern
The Trading 212 API client (`src/trading212/api-client.ts`):
- Uses native `fetch` for HTTP requests
- Encodes credentials as base64 Basic Auth in constructor
- Returns union types: `Data | Trading212ApiError`
- Provides static `isError()` method for type narrowing
- Base URL: `https://live.trading212.com/api/v0`

## Environment Configuration

Required environment variables:
```bash
# Telegram
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_SESSION=your_session_string

# Trading 212
TRADING212_API_KEY=your_api_key
TRADING212_API_SECRET=your_api_secret
```

**Note:** When running via Claude Code desktop, these are provided through `claude_desktop_config.json`. When running locally for development, use `npm run dev:telegram` or `npm run dev:trading212` which will load from a `.env` file if present.

## Docker Architecture

- Each server has its own Dockerfile in its service directory:
  - `src/telegram/Dockerfile.telegram`
  - `src/trading212/Dockerfile.trading212`
- Both use multi-stage builds
- Run as non-root users for security
- `docker-compose.yml` orchestrates both services on a shared `mcp-network`
- Both containers use `stdin_open: true` and `tty: true` for MCP stdio communication

## Adding New Features

### To add a Telegram tool:
1. Add tool definition in `ListToolsRequestSchema` handler in `src/telegram/index.ts`
2. Implement handler in `CallToolRequestSchema` switch statement
3. Use `telegramClient.getMessages()` or similar Telegram API methods

### To add a Trading 212 resource:
1. Add resource definition in `ListResourcesRequestSchema` handler in `src/trading212/index.ts`
2. Implement path handler in `ReadResourceRequestSchema` switch statement
3. Add corresponding method to `Trading212ApiClient` if needed
4. Define types in `src/trading212/types.ts`

### To modify API client:
- All Trading 212 API methods follow the same pattern: fetch, error handling, return typed response
- Always return `Data | Trading212ApiError` union types
- Use `Trading212ApiClient.isError()` for type-safe error checking
- Don't make any additional .md files except updating README.md or CLAUDE.md
- Never run build command