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

**Important:** Uses triple-layer stdout suppression:
1. Overrides all `console.*` methods before importing Telegram library
2. Passes custom `SilentLogger` to TelegramClient constructor
3. Calls `client.setLogLevel("none")` before connecting

This prevents any colored ANSI logs from breaking the MCP stdio protocol.

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

## Important: MCP stdio Protocol

MCP servers communicate via stdio using JSON-RPC. **Any output to stdout breaks the protocol.**

### Telegram Server - Triple-Layer Protection:
1. ✅ **Console override** - All `console.*` methods replaced with no-ops BEFORE importing Telegram library
2. ✅ **Custom logger** - `SilentLogger` class passed as `baseLogger` to TelegramClient
3. ✅ **Client config** - `client.setLogLevel("none")` called before connecting

This nuclear approach ensures NO colored ANSI logs (`\x1B[33m...`) can escape and pollute stdout.

### Both Servers:
- ✅ No `console.log()` or `console.error()` in normal execution
- ✅ Smart `.env` loading only in development mode (see `src/shared/env.ts`)
- ✅ Global error handlers catch uncaught exceptions and EPIPE errors
- ✅ All error logging uses `process.stderr.write()` instead of `console.error()`

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

## Using with Claude Code Desktop

### Setup

Configure in `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "telegram-stock-helper": {
      "command": "node",
      "args": ["/absolute/path/to/demo-mcp/dist/telegram/index.js"],
      "env": {
        "TELEGRAM_API_ID": "your_id",
        "TELEGRAM_API_HASH": "your_hash",
        "TELEGRAM_SESSION": "your_session"
      }
    },
    "trading212-mcp-server": {
      "command": "node",
      "args": ["/absolute/path/to/demo-mcp/dist/trading212/index.js"],
      "env": {
        "TRADING212_API_KEY": "your_key",
        "TRADING212_API_SECRET": "your_secret"
      }
    }
  }
}
```

After configuration:
1. Run `npm run build` in this directory
2. Restart Claude Code desktop
3. Servers will start automatically when needed

### How to Access Trading 212 Resources in Claude Desktop

The Trading 212 MCP server exposes **resources** (not tools), which means Claude won't automatically load them into context. You need to explicitly request them using natural language:

**Examples:**
- "Can you read the trading212://portfolio resource and show me my positions?"
- "Please access my Trading 212 portfolio data"
- "Show me the trading212://account/cash resource"
- "What resources are available from the Trading 212 MCP server?"

Claude will then fetch the resource data from your Trading 212 account and present it to you

## Development

To add new features:

1. **Telegram**: Add new tools in `src/telegram/index.ts`
2. **Trading 212**: Add new resources or tools in `src/trading212/index.ts`
3. Rebuild: `npm run build`
4. Test locally before deploying with Docker


### Example Prompts

Once configured, you can use natural language to interact with your MCP servers in Claude Code desktop:

#### Telegram MCP Examples

**Fetch recent messages:**
```
Get the last 10 messages from the Telegram channel @batkoinvestor
```

```
Fetch recent messages from @cryptonews, limit to 5
```

**Search for specific content:**
```
Search for messages about "dividend" in the channel @batkoinvestor
```

```
Find all messages mentioning "Apple" or "AAPL" in @stocktips
```

**Analysis combinations:**
```
Search for "earnings" in @stocktips and create a list of all mentioned companies
```

```
Fetch the latest 15 messages from @cryptonews and identify any mentions of regulatory changes
```

#### Trading 212 MCP Examples

**Portfolio overview:**
```
Show me my Trading 212 portfolio
```

```
What's my current portfolio value in Trading 212?
```

```
Give me a complete overview of all my positions
```

**Cash balance:**
```
What's my cash balance in Trading 212?
```

```
Show me my account cash information
```

**Order history:**
```
Show my last 20 orders from Trading 212
```

```
Show me my order history for the last 50 trades
```

**Specific ticker history:**
```
What's my order history for Tesla stock?
```

**Account information:**
```
Show me my Trading 212 account metadata
```

```
What currency is my Trading 212 account in?
```

#### Combined Analysis Examples

**Cross-platform insights:**
```
Get the last 20 messages from @batkoinvestor, then check if I own any of the mentioned stocks in my Trading 212 portfolio
```

```
Search for "dividend stocks" in @stocktips and compare with my current Trading 212 positions
```

```
Show my Trading 212 portfolio and fetch recent messages from @batkoinvestor to see if there are any recommendations about my holdings
```

**Investment tracking:**
```
Check my Trading 212 cash balance and then search @batkoinvestor for recent stock recommendations under $50
```

```
Show my recent Trading 212 orders and search @cryptonews for any news about those companies
```

**Performance analysis:**
```
Get my Trading 212 portfolio, then search @batkoinvestor for messages about these tickers from the last month
```

```
Show my AAPL order history and search @stocktips for "Apple" to see current sentiment
```
