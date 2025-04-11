import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';
import mcpRoutes from './routes/mcp.routes.js';

// Get current module path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));  // Increased limit for larger payloads

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Register MCP routes
app.use('/mcp', mcpRoutes);

// Basic health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Tusky MCP server is running' });
});

// Documentation route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    name: "Tusky MCP Server",
    version: "1.0.0",
    description: "Model Context Protocol (MCP) server implementation",
    endpoints: {
      healthCheck: "/health",
      mcpEndpoints: {
        query: "/mcp/v1/query",
        observe: "/mcp/v1/observe",
        resources: "/mcp/v1/resources",
        tools: "/mcp/v1/tools"
      }
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Tusky MCP server running on port ${port}`);
  console.log(`Documentation available at: http://localhost:${port}/`);
  console.log(`Health check available at: http://localhost:${port}/health`);
  console.log(`MCP endpoints available at:`);
  console.log(`  - POST http://localhost:${port}/mcp/v1/query`);
  console.log(`  - POST http://localhost:${port}/mcp/v1/observe`);
  console.log(`  - GET  http://localhost:${port}/mcp/v1/resources`);
  console.log(`  - GET  http://localhost:${port}/mcp/v1/tools`);
});

export default app;