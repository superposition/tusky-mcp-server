# Tusky MCP Server 🦣

A Model Context Protocol (MCP) server for integrating Tusky with Claude and other MCP-compatible AI systems.

## What is Tusky MCP Server?

The Tusky MCP Server provides a bridge between Tusky storage/Mastodon integration and AI assistants using the [Model Context Protocol (MCP)](https://docs.anthropic.com/claude/docs/model-context-protocol). This allows Claude and other compatible AIs to securely access and manipulate data in Tusky through a standardized interface.

## Features

- Authentication with the Tusky API
- File and folder management in Tusky vaults
- User profile and storage management
- **Search functionality** across vaults, folders, and files
- **File uploads using TUS protocol** for reliable, resumable file transfers
- Seamless integration with Claude Desktop and other MCP clients

## Prerequisites 🛠

Before you begin, ensure you have:

- A Tusky API key (obtained from your Tusky account)
- Node.js (v20 or higher)
- An MCP client like Claude Desktop or Cursor

## Installation 🚀

1. Clone this repository:
```shell
git clone https://github.com/superposition/tusky-mcp-server.git
cd tusky-mcp-server
```

2. Install dependencies:
```shell
npm install
```

3. Create a `.env` file (copying from `.env.example`):
```shell
cp .env.example .env
```

4. Edit the `.env` file with your Tusky API credentials:
```
TUSKY_API_KEY=your_api_key_here
TUSKY_API_URL=https://api.tusky.io/v1
```

5. Build the project:
```shell
npm run build
```

## Running the Server 🖥️

Start the server with:

```shell
npm start
```

For development with auto-reload:

```shell
npm run watch
```

## Feature Documentation

The Tusky MCP Server provides several tools that can be used through compatible MCP clients:

- **Authentication**: Connect to your Tusky account
- **Vault Management**: Create, list, and modify storage vaults
- **Folder Management**: Organize your content with folders
- **File Management**: Upload, download, and manage files
- **Search**: Find content across all your vaults and folders. [See search documentation](docs/search.md)
- **File Uploads**: Upload files using the TUS protocol for reliable and resumable file transfers. [See upload documentation](docs/file-uploads.md)
- **User Profile**: Manage your Tusky profile and settings

## Integrating with MCP Clients

### Configuring Claude Desktop

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
    "tusky-mcp": {
      "command": "node",
      "args": ["/path/to/your/build/index.js"],
      "env": {
        "TUSKY_API_KEY": "your-api-key-here",
        "TUSKY_API_URL": "https://api.tusky.io/v1"
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
   - Name: Enter a nickname for the server (e.g., "tusky-mcp")
   - Type: Select "command" as the type
   - Command: Enter the command to run the server:
     ```
     env TUSKY_API_KEY=your-api-key TUSKY_API_URL=https://api.tusky.io/v1 node /path/to/your/build/index.js
     ```

## Development Roadmap

The development is organized in tiers:

1. **Tier 1 - Foundation**: Basic MCP server structure
2. **Tier 2 - Authentication**: Auth challenge and API key management
3. **Tier 3 - Core Listing/Retrieval**: Vault and folder listing
4. **Tier 4 - Core Creation/Modification**: Create and modify vaults, folders, files
5. **Tier 5 - Advanced Features**: File uploads, vault sharing, search functionality
6. **Tier 6 - Infrastructure**: Error handling, response formatting, tests

See the Issues tab for detailed task breakdown.

## Contributing

We welcome contributions to the Tusky MCP Server! Please see our [contributing guidelines](CONTRIBUTING.md) for more information.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- [Model Context Protocol](https://docs.anthropic.com/claude/docs/model-context-protocol) for the MCP specification
- Anthropic for Claude Desktop
- The Tusky team for the wonderful storage and Mastodon integration platform
