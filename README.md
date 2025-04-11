# Tusky MCP Server 🚀

A Model Context Protocol (MCP) server for the [Tusky API](https://docs.tusky.io/http-api) that enables AI assistants like Claude to interact with the Tusky social media platform.

## What is MCP?

The Model Context Protocol (MCP) is an open standard developed by Anthropic that enables AI systems like Claude to interact seamlessly with various data sources and tools, facilitating secure, two-way connections.

This MCP server allows Claude and other MCP clients to access Tusky's functionality directly.

## Tusky API Integration Features

This MCP server provides the following Tusky API capabilities:

- Retrieving posts with filtering by author, hashtags, or keywords
- Creating new posts with customizable visibility settings
- Searching for users by username or display name
- Getting detailed user profile information

## Prerequisites 🔧

Before you begin, ensure you have:

- A Tusky API key (get one from [Tusky's developer portal](https://docs.tusky.io/http-api))
- Node.js (v20 or higher)
- An MCP client like Claude Desktop or Cursor

## Installation ⚡

1. Clone this repository:
```shell
git clone https://github.com/yourusername/tusky-mcp-server.git
cd tusky-mcp-server
```

2. Install dependencies:
```shell
npm install
# or if you prefer pnpm
pnpm install
```

3. Create a `.env` file in the root directory with your Tusky API key:
```
TUSKY_API_KEY=your-api-key-here
```

4. Build the project:
```shell
npm run build
```

## Available Tools

This MCP server provides the following tools for interacting with Tusky:

### tusky_get_posts
Retrieves posts from Tusky with optional filtering by author, hashtag, or keyword.

### tusky_create_post
Creates a new post on Tusky with customizable visibility settings.

### tusky_search_users
Searches for Tusky users by username or display name.

### tusky_get_user_profile
Gets detailed information about a Tusky user profile.

## Running Your Server 🖥️

You can run your server directly with:

```shell
npm run build
node build/index.js
```

For development with automatic rebuilding:
```shell
npm run watch
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
    "tusky": {
      "command": "node",
      "args": ["/path/to/your/build/index.js"],
      "env": {
        "TUSKY_API_KEY": "your-tusky-api-key-here"
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
   - Name: Enter a nickname for the server (e.g., "tusky")
   - Type: Select "command" as the type
   - Command: Enter the command to run the server:
     ```
     env TUSKY_API_KEY=your-tusky-api-key node /path/to/your/build/index.js
     ```

## Testing the Server

You can test the server using the included test client:

```shell
npm run test-client
```

## Contributing

Contributions to improve this Tusky MCP server are welcome! Please feel free to submit issues or pull requests.

## Acknowledgments ✨

- [Model Context Protocol](https://docs.anthropic.com/claude/docs/model-context-protocol) for the MCP specification
- Anthropic for Claude Desktop
- [Tusky](https://docs.tusky.io/http-api) for their API
- [Tavily MCP Server](https://github.com/tavily-ai/tavily-mcp) for inspiration