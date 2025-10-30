#!/usr/bin/env node

import "../shared/env.js"

// CRITICAL: Suppress ALL console output before importing Telegram library
// This prevents any colored logs from polluting stdout and breaking MCP protocol
const originalConsoleLog = console.log
const originalConsoleWarn = console.warn
const originalConsoleInfo = console.info
const originalConsoleDebug = console.debug

// Override console methods to suppress Telegram library output
console.log = () => {}
console.warn = () => {}
console.info = () => {}
console.debug = () => {}
// Keep console.error for debugging but redirect to stderr
console.error = (...args: any[]) => {
	process.stderr.write(args.join(" ") + "\n")
}

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { TelegramClient } from "telegram"
import { StringSession } from "telegram/sessions/index.js"

// Create a no-op logger to completely suppress all Telegram library output
class SilentLogger {
	log() {}
	warn() {}
	error() {}
	info() {}
	debug() {}
	canSend() {
		return false
	}
	setLevel() {}
}

// Initialize Telegram client
let telegramClient: TelegramClient | null = null
const apiId = parseInt(process.env.TELEGRAM_API_ID || "0")
const apiHash = process.env.TELEGRAM_API_HASH || ""

async function initTelegramClient() {
	if (telegramClient) return telegramClient

	const session = new StringSession(process.env.TELEGRAM_SESSION || "")

	telegramClient = new TelegramClient(session, apiId, apiHash, {
		connectionRetries: 5,
		// @ts-ignore - Pass custom silent logger
		baseLogger: new SilentLogger(),
	})

	// Also set log level as backup
	// @ts-ignore - setLogLevel accepts "none" as a valid level
	telegramClient.setLogLevel("none")

	await telegramClient.connect()
	return telegramClient
}

// Create MCP server
const server = new Server(
	{
		name: "telegram-stock-helper",
		version: "1.0.0",
	},
	{
		capabilities: {
			tools: {},
		},
	},
)

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
	return {
		tools: [
			{
				name: "get_telegram_messages",
				description:
					"Fetch recent messages from a Telegram channel or chat. Useful for getting stock tips, tax discussions, or trading insights.",
				inputSchema: {
					type: "object",
					properties: {
						channel: {
							type: "string",
							description: "Channel username (e.g., 'channelname') or ID",
						},
						limit: {
							type: "number",
							description:
								"Number of messages to fetch (default: 50, max: 100)",
							default: 50,
						},
					},
					required: ["channel"],
				},
			},
			{
				name: "search_telegram_messages",
				description:
					"Search for specific keywords in a Telegram channel's message history",
				inputSchema: {
					type: "object",
					properties: {
						channel: {
							type: "string",
							description: "Channel username or ID",
						},
						query: {
							type: "string",
							description: "Search query/keywords",
						},
						limit: {
							type: "number",
							description: "Max number of results (default: 20)",
							default: 20,
						},
					},
					required: ["channel", "query"],
				},
			},
		],
	}
})

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { name, arguments: args } = request.params

	try {
		const client = await initTelegramClient()

		if (name === "get_telegram_messages") {
			const { channel, limit = 50 } = args as {
				channel: string
				limit?: number
			}

			const messages = await client.getMessages(channel, {
				limit: Math.min(limit, 100),
			})

			const formattedMessages = messages.map((msg) => ({
				id: msg.id,
				date: msg.date,
				text: msg.message || "[Media/Non-text content]",
				sender: msg.senderId?.toString() || "Unknown",
			}))

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(formattedMessages, null, 2),
					},
				],
			}
		}

		if (name === "search_telegram_messages") {
			const {
				channel,
				query,
				limit = 20,
			} = args as {
				channel: string
				query: string
				limit?: number
			}

			const messages = await client.getMessages(channel, {
				limit: 100, // Search through more messages
				search: query,
			})

			const results = messages.slice(0, limit).map((msg) => ({
				id: msg.id,
				date: msg.date,
				text: msg.message || "[Media/Non-text content]",
				sender: msg.senderId?.toString() || "Unknown",
			}))

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(results, null, 2),
					},
				],
			}
		}

		throw new Error(`Unknown tool: ${name}`)
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Error: ${error instanceof Error ? error.message : String(error)}`,
				},
			],
			isError: true,
		}
	}
})

// Start server
async function main() {
	const transport = new StdioServerTransport()
	await server.connect(transport)
	// Server is now running and communicating via stdio
}

// Handle uncaught errors to prevent crashes
process.on("uncaughtException", (error) => {
	// Only log to stderr on fatal errors, avoid polluting stdout
	if (error.message !== "write EPIPE") {
		process.stderr.write(`Uncaught exception: ${error.message}\n`)
	}
})

process.on("unhandledRejection", (reason) => {
	process.stderr.write(`Unhandled rejection: ${reason}\n`)
})

main().catch((error) => {
	process.stderr.write(`Fatal error: ${error.message}\n`)
	process.exit(1)
})
