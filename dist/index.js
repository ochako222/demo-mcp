#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { config } from "./config.js";
// Initialize Telegram client
let telegramClient = null;
async function initTelegramClient() {
    if (telegramClient)
        return telegramClient;
    const session = new StringSession(config.telegram.sessionString);
    telegramClient = new TelegramClient(session, config.telegram.apiId, config.telegram.apiHash, {
        connectionRetries: 5,
    });
    await telegramClient.connect();
    return telegramClient;
}
// Create MCP server
const server = new Server({
    name: "telegram-stock-helper",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_telegram_messages",
                description: "Fetch recent messages from a Telegram channel or chat. Useful for getting stock tips, tax discussions, or trading insights.",
                inputSchema: {
                    type: "object",
                    properties: {
                        channel: {
                            type: "string",
                            description: "Channel username (e.g., 'channelname') or ID",
                        },
                        limit: {
                            type: "number",
                            description: "Number of messages to fetch (default: 50, max: 100)",
                            default: 50,
                        },
                    },
                    required: ["channel"],
                },
            },
            {
                name: "search_telegram_messages",
                description: "Search for specific keywords in a Telegram channel's message history",
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
    };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        const client = await initTelegramClient();
        if (name === "get_telegram_messages") {
            const { channel, limit = 50 } = args;
            const messages = await client.getMessages(channel, {
                limit: Math.min(limit, 100),
            });
            const formattedMessages = messages.map((msg) => ({
                id: msg.id,
                date: msg.date,
                text: msg.message || "[Media/Non-text content]",
                sender: msg.senderId?.toString() || "Unknown",
            }));
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(formattedMessages, null, 2),
                    },
                ],
            };
        }
        if (name === "search_telegram_messages") {
            const { channel, query, limit = 20, } = args;
            const messages = await client.getMessages(channel, {
                limit: 100, // Search through more messages
                search: query,
            });
            const results = messages.slice(0, limit).map((msg) => ({
                id: msg.id,
                date: msg.date,
                text: msg.message || "[Media/Non-text content]",
                sender: msg.senderId?.toString() || "Unknown",
            }));
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(results, null, 2),
                    },
                ],
            };
        }
        throw new Error(`Unknown tool: ${name}`);
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
});
// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Telegram MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map