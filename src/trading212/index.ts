#!/usr/bin/env node

import "../shared/env.js"
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { Trading212ApiClient } from "./api-client.js"

// Initialize Trading 212 API client
const apiClient = new Trading212ApiClient(
	process.env.TRADING212_API_KEY || "",
	process.env.TRADING212_API_SECRET || "",
)

// Create MCP server with tools capability
const server = new Server(
	{
		name: "trading212-mcp-server",
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
				name: "get_portfolio",
				description:
					"Get complete portfolio overview including cash, invested amount, total value, and all positions",
				inputSchema: {
					type: "object",
					properties: {},
				},
			},
			{
				name: "get_account_cash",
				description:
					"Get account cash information including free cash, total cash, and blocked amounts",
				inputSchema: {
					type: "object",
					properties: {},
				},
			},
			{
				name: "get_orders_history",
				description:
					"Get historical orders with optional filtering by ticker and pagination",
				inputSchema: {
					type: "object",
					properties: {
						limit: {
							type: "number",
							description: "Maximum number of orders to return (default: 50)",
						},
						ticker: {
							type: "string",
							description:
								"Filter orders by specific ticker symbol (e.g., AAPL)",
						},
						cursor: {
							type: "number",
							description: "Pagination cursor for fetching more results",
						},
					},
				},
			},
			{
				name: "get_account_metadata",
				description: "Get account metadata including currency and account ID",
				inputSchema: {
					type: "object",
					properties: {},
				},
			},
		],
	}
})

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { name, arguments: args } = request.params

	try {
		switch (name) {
			case "get_portfolio": {
				const portfolio = await apiClient.getPortfolio()

				if (Trading212ApiClient.isError(portfolio)) {
					return {
						content: [
							{
								type: "text",
								text: `Error fetching portfolio: ${portfolio.message}`,
							},
						],
					}
				}

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(portfolio, null, 2),
						},
					],
				}
			}

			case "get_account_cash": {
				const cash = await apiClient.getAccountCash()

				if (Trading212ApiClient.isError(cash)) {
					return {
						content: [
							{
								type: "text",
								text: `Error fetching account cash: ${cash.message}`,
							},
						],
					}
				}

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(cash, null, 2),
						},
					],
				}
			}

			case "get_orders_history": {
				const params: {
					limit?: number
					ticker?: string
					cursor?: number
				} = {}

				if (args && typeof args === "object") {
					if ("limit" in args && typeof args.limit === "number") {
						params.limit = args.limit
					}
					if ("ticker" in args && typeof args.ticker === "string") {
						params.ticker = args.ticker
					}
					if ("cursor" in args && typeof args.cursor === "number") {
						params.cursor = args.cursor
					}
				}

				const orders = await apiClient.getOrdersHistory(params)

				if (Trading212ApiClient.isError(orders)) {
					return {
						content: [
							{
								type: "text",
								text: `Error fetching orders history: ${orders.message}`,
							},
						],
					}
				}

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(orders, null, 2),
						},
					],
				}
			}

			case "get_account_metadata": {
				const metadata = await apiClient.getAccountMetadata()

				if (Trading212ApiClient.isError(metadata)) {
					return {
						content: [
							{
								type: "text",
								text: `Error fetching account metadata: ${metadata.message}`,
							},
						],
					}
				}

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(metadata, null, 2),
						},
					],
				}
			}

			default:
				return {
					content: [
						{
							type: "text",
							text: `Unknown tool: ${name}`,
						},
					],
					isError: true,
				}
		}
	} catch (error) {
		return {
			content: [
				{
					type: "text",
					text: `Error executing tool: ${error instanceof Error ? error.message : String(error)}`,
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
