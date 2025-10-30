// Helper to load .env file for local development
// When running via Claude desktop, env vars come from claude_desktop_config.json
// This only loads .env when running locally (npm run dev:*)

import dotenv from "dotenv"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Only load .env if we're in development mode (using tsx)
// Claude desktop won't have this process property
if (
	process.env.NODE_ENV !== "production" &&
	!process.argv[0]?.includes("node")
) {
	dotenv.config({ path: join(__dirname, "../../.env") })
}
