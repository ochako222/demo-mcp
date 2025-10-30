# MCP Servers - Telegram & Trading 212

Two separate MCP servers for Telegram message fetching and Trading 212 portfolio management.

## Project Structure

```
demo-mcp/
├── src/
│   ├── telegram/          # Telegram MCP Server
│   │   ├── index.ts       # Server implementation
│   │   └── config.ts      # Telegram configuration
│   ├── trading212/        # Trading 212 MCP Server
│   │   ├── index.ts       # Server implementation
│   │   ├── api-client.ts  # API client with rate limiting
│   │   ├── config.ts      # Trading 212 configuration
│   │   └── types.ts       # TypeScript types
│   └── shared/            # Shared utilities (optional)
├── Dockerfile.telegram    # Telegram server Docker image
├── Dockerfile.trading212  # Trading 212 server Docker image
└── docker-compose.yml     # Orchestration for both servers
```

## Setup

### 1. Configure Environment Variables

Edit `.env` file with your credentials:

```bash
# Telegram Configuration
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_SESSION=your_session_string

# Trading 212 Configuration
TRADING212_API_KEY=your_trading212_api_key
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Project

```bash
npm run build
```

## Running Locally

### Run Telegram MCP Server

```bash
npm run dev:telegram
# or after build:
npm run start:telegram
```

### Run Trading 212 MCP Server

```bash
npm run dev:trading212
# or after build:
npm run start:trading212
```

## Running with Docker Compose

### Build and Start Both Servers

```bash
# Build images
npm run docker:build

# Start both servers
npm run docker:up

# Or in one command:
docker-compose up --build
```

### View Logs

```bash
npm run docker:logs
```

### Stop Servers

```bash
npm run docker:down
```

## MCP Resources & Tools

### Telegram MCP Server

**Tools:**
- `get_telegram_messages` - Fetch recent messages from a channel
- `search_telegram_messages` - Search messages by keyword

### Trading 212 MCP Server

**Resources (Read-only):**
- `trading212://portfolio` - Complete portfolio overview with all positions
- `trading212://account/cash` - Account cash information
- `trading212://orders/history` - Historical orders (supports query params)
- `trading212://account/metadata` - Account metadata

**Example Resource URIs:**
```
trading212://portfolio
trading212://account/cash
trading212://orders/history?limit=50&ticker=AAPL
trading212://account/metadata
```

## Trading 212 API Features

- **Rate Limiting**: 1 request per second to respect API limits
- **Caching**: 30-second cache for portfolio and account data
- **Error Handling**: Comprehensive error handling with retry logic
- **Type Safety**: Full TypeScript type definitions

## Docker Architecture

Both servers:
- Use multi-stage builds for optimized images
- Run as non-root users for security
- Share the same `.env` file
- Are connected via a bridge network
- Support `stdin_open` and `tty` for MCP stdio communication

## Available NPM Scripts

```bash
npm run build              # Build both servers
npm run build:telegram     # Build only Telegram server
npm run build:trading212   # Build only Trading 212 server

npm run dev:telegram       # Run Telegram server in dev mode
npm run dev:trading212     # Run Trading 212 server in dev mode

npm run start:telegram     # Run built Telegram server
npm run start:trading212   # Run built Trading 212 server

npm run docker:build       # Build Docker images
npm run docker:up          # Start Docker containers
npm run docker:down        # Stop Docker containers
npm run docker:logs        # View container logs
```

## Security Notes

- Never commit `.env` file with real credentials
- Trading 212 API keys should be kept secure
- Both servers run as non-root users in Docker
- Use environment variables for all sensitive data

## Troubleshooting

### Port Conflicts

If you're running both servers and experiencing issues, check that no other services are using the required ports.

### API Rate Limits

Trading 212 API client includes rate limiting (1 req/sec). If you need faster access, modify the `minInterval` in `src/trading212/api-client.ts`.

### Docker Logs

Check individual container logs:
```bash
docker logs telegram-mcp-server
docker logs trading212-mcp-server
```

## Development

To add new features:

1. **Telegram**: Add new tools in `src/telegram/index.ts`
2. **Trading 212**: Add new resources or tools in `src/trading212/index.ts`
3. Rebuild: `npm run build`
4. Test locally before deploying with Docker
