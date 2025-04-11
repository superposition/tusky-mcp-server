import { Router, Request, Response } from 'express';

const router = Router();

// Basic MCP endpoints that follow the protocol specification

// Query endpoint
router.post('/v1/query', async (req: Request, res: Response) => {
  try {
    console.log('Received query request:', req.body);
    
    // Process the query and return a response
    // For this example, we'll just echo back a simple response
    const response = {
      id: req.body.id || 'unknown',
      model: req.body.model || 'tusky-model',
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "This is a response from the Tusky MCP server"
          }
        }
      ]
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
});

// Observe endpoint
router.post('/v1/observe', async (req: Request, res: Response) => {
  try {
    console.log('Received observe request:', req.body);
    
    // Process the observation
    // For this example, we'll just acknowledge receipt
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error processing observation:', error);
    res.status(500).json({ error: 'Failed to process observation' });
  }
});

// Resources endpoint
router.get('/v1/resources', async (req: Request, res: Response) => {
  try {
    // Return a list of available resources
    const resources = [
      {
        name: "info",
        uri: "info://server",
        description: "Information about the Tusky MCP server"
      }
    ];
    
    res.status(200).json({ resources });
  } catch (error) {
    console.error('Error listing resources:', error);
    res.status(500).json({ error: 'Failed to list resources' });
  }
});

// Resource content endpoint
router.get('/v1/resources/:uri', async (req: Request, res: Response) => {
  try {
    const uri = req.params.uri;
    
    if (uri === 'info://server') {
      res.status(200).json({
        name: "Tusky MCP Server",
        description: "An example MCP server implementation",
        version: "1.0.0"
      });
    } else {
      res.status(404).json({ error: `Resource '${uri}' not found` });
    }
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ error: 'Failed to fetch resource' });
  }
});

// Tools endpoint
router.get('/v1/tools', async (req: Request, res: Response) => {
  try {
    // Return a list of available tools
    const tools = [
      {
        name: "echo",
        description: "Echoes back the input message",
        parameters: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "The message to echo back"
            }
          },
          required: ["message"]
        }
      }
    ];
    
    res.status(200).json({ tools });
  } catch (error) {
    console.error('Error listing tools:', error);
    res.status(500).json({ error: 'Failed to list tools' });
  }
});

// Tool execution endpoint
router.post('/v1/tools/:name', async (req: Request, res: Response) => {
  try {
    const toolName = req.params.name;
    
    if (toolName === 'echo') {
      const message = req.body.message;
      res.status(200).json({ result: `Echo: ${message}` });
    } else {
      res.status(404).json({ error: `Tool '${toolName}' not found` });
    }
  } catch (error) {
    console.error('Error executing tool:', error);
    res.status(500).json({ error: 'Failed to execute tool' });
  }
});

export default router;