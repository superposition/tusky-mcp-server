declare module '@modelcontextprotocol/sdk' {
  export interface MCPHandler {
    handleQuery(request: QueryRequestBody): Promise<any>;
    handleObserve(request: ObserveRequestBody): Promise<any>;
  }

  export interface QueryRequestBody {
    id: string;
    model: string;
    messages: any[];
    [key: string]: any;
  }

  export interface ObserveRequestBody {
    id: string;
    [key: string]: any;
  }

  export class JsonlFileLogger {
    constructor(filePath: string);
  }

  export class MCP {
    constructor(options: {
      logger?: JsonlFileLogger;
      handler?: MCPHandler;
    });

    query(body: any): Promise<any>;
    observe(body: any): Promise<any>;
  }
}

declare module '@modelcontextprotocol/sdk/server/mcp.js' {
  export class McpServer {
    constructor(options: { name: string; version: string });
    
    resource(name: string, uri: string, handler: () => Promise<any>): void;
    
    tool(
      name: string, 
      options: { 
        description: string; 
        parameters: any 
      }, 
      handler: (params: any) => Promise<any>
    ): void;
    
    connect(transport: any): Promise<void>;
  }
}

declare module '@modelcontextprotocol/sdk/server/sse.js' {
  export class SSEServerTransport {
    constructor(options?: { send?: (data: any) => void });
    
    disconnect(): Promise<void>;
    receiveMessage(message: any): Promise<void>;
  }
}