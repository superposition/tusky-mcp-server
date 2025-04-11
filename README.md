# MCP Server Template 🚀

A clean template for building [Model Context Protocol (MCP)](https://docs.anthropic.com/claude/docs/model-context-protocol) servers.

## What is MCP?

The Model Context Protocol (MCP) is an open standard developed by Anthropic that enables AI systems like Claude to interact seamlessly with various data sources and tools, facilitating secure, two-way connections.

This template provides a starting point for building your own MCP server that can be used with Claude Desktop, Cursor, or any other MCP client.

## Template Features

This template includes:

- Basic server structure with the MCP SDK
- Example tool definitions with commented placeholders
- Error handling setup
- Environment variable configuration via dotenv

## Prerequisites 🔧

Before you begin, ensure you have:

- Your API key for whatever service you're wrapping (if applicable)
- Node.js (v20 or higher)
- An MCP client like Claude Desktop or Cursor

## Installation ⚡

1. Clone this template repository:
```shell
git clone https://github.com/yourusername/mcp-server-template.git
cd mcp-server-template
```

2. Install dependencies:
```shell
npm install
```

3. Build the project:
```shell
npm run build
```

## Customization Guide 🔧

To customize this template for your own MCP server:

1. Update `package.json` with your server name and details
2. Modify `src/index.ts` to:
   - Define your API response interface
   - Add your actual tools and their schemas
   - Implement the tool functionality
   - Update the formatting logic

### Key Files to Modify

- `src/index.ts`: The main server implementation
- `package.json`: Package metadata and dependencies
- `.env`: Create this file to store your API keys (make sure to add to .gitignore)

## Running Your Server 🖥️

You can run your server directly with:

```shell
npm run build
node build/index.js
```

## Integrating with MCP Clients

### Configuring the Claude Desktop app

For macOS:

```shell
# Create the config file if it doesn't exist
touch "$HOME/Library/Application Support/Claude/claude_desktop_config.json"

# Open the config file in TextEdit
open -e "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
```

For Windows:

```shell
code %APPDATA%\Claude\claude_desktop_config.json
```

Add your server configuration:

```json
{
  "mcpServers": {
    "your-server-name": {
      "command": "node",
      "args": ["/path/to/your/build/index.js"],
      "env": {
        "YOUR_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Configuring Cursor

1. Open Cursor Settings
2. Navigate to Features > MCP Servers
3. Click on the "+ Add New MCP Server" button
4. Fill out the following information:
   - Name: Enter a nickname for the server (e.g., "your-server-name")
   - Type: Select "command" as the type
   - Command: Enter the command to run the server:
     ```
     env YOUR_API_KEY=your-api-key node /path/to/your/build/index.js
     ```

## Template Structure Explained

- **Server Setup**: The template creates a basic MCP server with stdio transport
- **Tool Definitions**: Example tool schemas with commented placeholders
- **Error Handling**: Basic error handling setup with console logging
- **Request Handling**: Template for handling tool requests with switch/case structure

## Contributing

Feel free to use this template as a starting point for your own MCP server. If you improve the template, please consider contributing back via pull requests!

## Acknowledgments ✨

- [Model Context Protocol](https://docs.anthropic.com/claude/docs/model-context-protocol) for the MCP specification
- Anthropic for Claude Desktop
- [Tavily MCP Server](https://github.com/tavily-ai/tavily-mcp) which this template was based on