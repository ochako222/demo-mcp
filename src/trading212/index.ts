#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
	ListResourcesRequestSchema,
	ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { Trading212ApiClient } from "./api-client.js"

// Initialize Trading 212 API client
const apiClient = new Trading212ApiClient(
	process.env.TRADING212_API_KEY || "",
	process.env.TRADING212_API_SECRET || "",
)

// Create MCP server
const server = new Server(
	{
		name: "trading212-mcp-server",
		version: "1.0.0",
	},
	{
		capabilities: {
			resources: {},
		},
	},
)

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
	return {
		resources: [
			{
				uri: "trading212://portfolio",
				name: "Portfolio Overview",
				description:
					"Get complete portfolio overview including cash, invested amount, total value, and all positions",
				mimeType: "application/json",
			},
			{
				uri: "trading212://account/cash",
				name: "Account Cash",
				description:
					"Get account cash information including free cash, total cash, and blocked amounts",
				mimeType: "application/json",
			},
			{
				uri: "trading212://orders/history",
				name: "Orders History",
				description:
					"Get historical orders. Supports query parameters: ?limit=50&ticker=AAPL",
				mimeType: "application/json",
			},
			{
				uri: "trading212://account/metadata",
				name: "Account Metadata",
				description: "Get account metadata including currency and account ID",
				mimeType: "application/json",
			},
		],
	}
})

// Handle resource reads
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
	const { uri } = request.params

	try {
		const url = new URL(uri)

		if (url.protocol !== "trading212:") {
			throw new Error(`Unsupported protocol: ${url.protocol}`)
		}

		const path = url.pathname.replace(/^\/\//, "")

		switch (path) {
			case "portfolio": {
				const portfolio = await apiClient.getPortfolio()

				if (Trading212ApiClient.isError(portfolio)) {
					return {
						contents: [
							{
								uri,
								mimeType: "application/json",
								text: JSON.stringify({ error: portfolio.message }, null, 2),
							},
						],
					}
				}

				return {
					contents: [
						{
							uri,
							mimeType: "application/json",
							text: JSON.stringify(portfolio, null, 2),
						},
					],
				}
			}

			case "account/cash": {
				const cash = await apiClient.getAccountCash()

				if (Trading212ApiClient.isError(cash)) {
					return {
						contents: [
							{
								uri,
								mimeType: "application/json",
								text: JSON.stringify({ error: cash.message }, null, 2),
							},
						],
					}
				}

				return {
					contents: [
						{
							uri,
							mimeType: "application/json",
							text: JSON.stringify(cash, null, 2),
						},
					],
				}
			}

			case "orders/history": {
				// Parse query parameters
				const limit = url.searchParams.get("limit")
				const ticker = url.searchParams.get("ticker")
				const cursor = url.searchParams.get("cursor")

				const params: {
					limit?: number
					ticker?: string
					cursor?: number
				} = {}

				if (limit) params.limit = Number.parseInt(limit)
				if (ticker) params.ticker = ticker
				if (cursor) params.cursor = Number.parseInt(cursor)

				const orders = await apiClient.getOrdersHistory(params)

				if (Trading212ApiClient.isError(orders)) {
					return {
						contents: [
							{
								uri,
								mimeType: "application/json",
								text: JSON.stringify({ error: orders.message }, null, 2),
							},
						],
					}
				}

				return {
					contents: [
						{
							uri,
							mimeType: "application/json",
							text: JSON.stringify(orders, null, 2),
						},
					],
				}
			}

			case "account/metadata": {
				const metadata = await apiClient.getAccountMetadata()

				if (Trading212ApiClient.isError(metadata)) {
					return {
						contents: [
							{
								uri,
								mimeType: "application/json",
								text: JSON.stringify({ error: metadata.message }, null, 2),
							},
						],
					}
				}

				return {
					contents: [
						{
							uri,
							mimeType: "application/json",
							text: JSON.stringify(metadata, null, 2),
						},
					],
				}
			}

			default:
				throw new Error(`Unknown resource path: ${path}`)
		}
	} catch (error) {
		return {
			contents: [
				{
					uri,
					mimeType: "application/json",
					text: JSON.stringify(
						{
							error: `Failed to read resource: ${error instanceof Error ? error.message : String(error)}`,
						},
						null,
						2,
					),
				},
			],
		}
	}
})

// Start server
async function main() {
	const transport = new StdioServerTransport()
	await server.connect(transport)
	console.error("Trading 212 MCP Server running on stdio")
}

main().catch((error) => {
	console.error("Fatal error:", error)
	process.exit(1)
})
