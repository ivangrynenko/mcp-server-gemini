// Base MCP types - re-export from types/index.ts
export { 
  ConnectionState, 
  MCPRequest, 
  MCPResponse, 
  NotificationMessage
} from './types/index.js';

// Import NotificationMessage for local use
import { NotificationMessage as NotificationMessageType } from './types/index.js';

export {
  MCPMessage,
  MCPError,
  StreamRequest,
  StreamResponse,
  GenerateRequest,
  GenerateResponse,
  CancelRequest,
  ConfigureRequest
} from './types/protocols.js';

// Additional protocol types
export interface ServerCapabilities {
  experimental?: Record<string, any>;
  prompts?: {
    listChanged?: boolean;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
  tools?: {
    listChanged?: boolean;
  };
  logging?: Record<string, any>;
}

export interface ServerInfo {
  name: string;
  version: string;
}

export interface InitializeResult {
  protocolVersion: string;
  serverInfo: ServerInfo;
  capabilities: ServerCapabilities;
}

export interface ProgressParams {
  progressToken: string | number;
  progress: number;
  total?: number;
}


export interface ErrorNotification extends NotificationMessageType {
  method: 'notifications/error';
  params: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface ProgressNotification extends NotificationMessageType {
  method: 'notifications/progress';
  params: ProgressParams;
}

export interface ShutdownRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: 'shutdown';
  params?: any;
}

export interface ExitNotification extends NotificationMessageType {
  method: 'exit';
}
