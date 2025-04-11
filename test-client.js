#!/usr/bin/env node

import { spawn } from 'child_process';
import { createInterface } from 'readline';

const serverProcess = spawn('node', ['build/index.js'], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: process.env
});

const rl = createInterface({
  input: serverProcess.stdout,
  crlfDelay: Infinity
});

// Listen for responses
rl.on('line', line => {
  console.log('Server response:', line);
  try {
    const response = JSON.parse(line);
    
    // If we get an initialize response, send a listTools request
    if (response.id === 1 && response.result) {
      console.log('\nSending listTools request...');
      const listToolsRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'listTools'
      };
      serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');
    }
    
    // If we get a tools list, check if it has our example tools
    if (response.id === 2 && response.result && response.result.tools) {
      console.log('\nReceived tools list:', JSON.stringify(response.result.tools, null, 2));
      
      // Try calling the first tool
      if (response.result.tools.length > 0) {
        const tool = response.result.tools[0];
        console.log(`\nCalling tool: ${tool.name}...`);
        
        const callToolRequest = {
          jsonrpc: '2.0',
          id: 3,
          method: 'callTool',
          params: {
            name: tool.name,
            arguments: {
              parameter1: 'test value'
            }
          }
        };
        
        serverProcess.stdin.write(JSON.stringify(callToolRequest) + '\n');
      } else {
        console.log('No tools available');
        cleanup();
      }
    }
    
    // If we get a tool response, clean up
    if (response.id === 3) {
      console.log('\nTest completed successfully!');
      cleanup();
    }
  } catch (error) {
    console.error('Error parsing response:', error);
  }
});

// Send initialize request
console.log('Sending initialize request...');
const initializeRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {
      roots: {
        listChanged: true
      },
      sampling: {}
    },
    clientInfo: {
      name: 'TestClient',
      version: '1.0.0'
    }
  }
};

serverProcess.stdin.write(JSON.stringify(initializeRequest) + '\n');

function cleanup() {
  console.log('\nShutting down...');
  setTimeout(() => {
    serverProcess.kill();
    process.exit(0);
  }, 500);
}

// Handle process termination
process.on('SIGINT', () => {
  cleanup();
});