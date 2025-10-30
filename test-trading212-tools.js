#!/usr/bin/env node

/**
 * Test script to verify Trading 212 MCP server with tools (not resources)
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverProcess = spawn('node', [join(__dirname, 'dist/trading212/index.js')], {
  env: {
    ...process.env,
    TRADING212_API_KEY: process.env.TRADING212_API_KEY || '34362852ZqNIiiCMIlUPWKegLMAPMFjVEvZVN',
    TRADING212_API_SECRET: process.env.TRADING212_API_SECRET || 'JbkBo41FDFRjFlylVhVqEltPvmnbamLFawluaZBnU-8',
  }
});

let responseBuffer = '';

serverProcess.stdout.on('data', (data) => {
  responseBuffer += data.toString();

  // Try to parse complete JSON-RPC messages
  const lines = responseBuffer.split('\n');
  responseBuffer = lines.pop() || ''; // Keep incomplete line in buffer

  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log('Server response:', JSON.stringify(response, null, 2));
      } catch (e) {
        console.log('Raw output:', line);
      }
    }
  }
});

serverProcess.stderr.on('data', (data) => {
  console.error('Server stderr:', data.toString());
});

// Send initialize request
const initMessage = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  }
};

console.log('Sending initialize request...');
serverProcess.stdin.write(JSON.stringify(initMessage) + '\n');

// Wait for initialize response, then request tools
setTimeout(() => {
  const listToolsMessage = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  };

  console.log('\nSending tools/list request...');
  serverProcess.stdin.write(JSON.stringify(listToolsMessage) + '\n');
}, 1000);

// Wait for tools list, then call a tool
setTimeout(() => {
  const callToolMessage = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'get_account_metadata',
      arguments: {}
    }
  };

  console.log('\nSending tools/call request for get_account_metadata...');
  serverProcess.stdin.write(JSON.stringify(callToolMessage) + '\n');
}, 2000);

// Test another tool with parameters
setTimeout(() => {
  const callToolMessage = {
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'get_orders_history',
      arguments: {
        limit: 5
      }
    }
  };

  console.log('\nSending tools/call request for get_orders_history with limit=5...');
  serverProcess.stdin.write(JSON.stringify(callToolMessage) + '\n');
}, 3000);

// Cleanup after 6 seconds
setTimeout(() => {
  console.log('\nTest complete!');
  serverProcess.kill();
  process.exit(0);
}, 6000);
