// Example Node.js client for testing your MCP server
import { spawn } from 'child_process';
import readline from 'readline';

// Path to your MCP server build
const MCP_SERVER_PATH = '../build/index.js';

// Function to run the MCP server and interact with it
async function runMcpServer() {
  // Set environment variables needed by your server
  const env = {
    ...process.env,
    YOUR_API_KEY: 'your_api_key_here', // Replace with your actual API key
  };

  // Spawn the MCP server process
  const serverProcess = spawn('node', [MCP_SERVER_PATH], {
    env,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Set up readline interface for standard output
  const rl = readline.createInterface({
    input: serverProcess.stdout,
    crlfDelay: Infinity
  });

  // Handle standard error output (logging)
  serverProcess.stderr.on('data', (data) => {
    console.log(`Server log: ${data.toString()}`);
  });

  // Example initialize request
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

  // Send the initialize request
  serverProcess.stdin.write(JSON.stringify(initializeRequest) + '\n');

  // Listen for responses from the server
  rl.on('line', (line) => {
    try {
      const response = JSON.parse(line);
      console.log('Server response:', JSON.stringify(response, null, 2));

      // After initialization, send a request to list available tools
      if (response.id === 1 && response.result) {
        const listToolsRequest = {
          jsonrpc: '2.0',
          id: 2,
          method: 'listTools'
        };
        serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');
      }

      // After receiving tools list, try calling a tool
      if (response.id === 2 && response.result && response.result.tools) {
        // Using the first tool from the list as an example
        const tool = response.result.tools[0];
        const callToolRequest = {
          jsonrpc: '2.0',
          id: 3,
          method: 'callTool',
          params: {
            name: tool.name,
            arguments: {
              // Add appropriate arguments based on the tool's schema
              parameter1: 'test value',
            }
          }
        };
        serverProcess.stdin.write(JSON.stringify(callToolRequest) + '\n');
      }

      // After receiving tool response, clean up
      if (response.id === 3) {
        // Clean shutdown
        setTimeout(() => {
          serverProcess.kill();
          process.exit(0);
        }, 1000);
      }
    } catch (error) {
      console.error('Error parsing server response:', error);
    }
  });

  // Handle process termination
  process.on('SIGINT', () => {
    serverProcess.kill();
    process.exit(0);
  });
}

// Run the example
runMcpServer().catch(console.error);