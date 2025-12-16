/**
 * MCP 관련 타입 정의
 */

// MCP 서버 연결 타입
export type MCPTransportType = 'stdio' | 'http';

// MCP 서버 설정 인터페이스
export interface MCPServerConfig {
  id: string;
  name: string;
  type: MCPTransportType;
  // STDIO 전용
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  // HTTP 전용
  url?: string;
}

// 연결 상태
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

// 서버 연결 상태
export interface MCPServerState {
  config: MCPServerConfig;
  status: ConnectionStatus;
  error?: string;
}

// Tool 정보
export interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

// Resource 정보
export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

// Resource Template 정보
export interface MCPResourceTemplate {
  uriTemplate: string;
  name: string;
  description?: string;
  mimeType?: string;
}

// Prompt 정보
export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: MCPPromptArgument[];
}

export interface MCPPromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

// Tool 실행 결과
export interface MCPToolResult {
  content: MCPContent[];
  isError?: boolean;
}

// Content 타입
export interface MCPContent {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string;
  mimeType?: string;
  uri?: string;
}

// Resource 읽기 결과
export interface MCPResourceContent {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
}

// Prompt 메시지
export interface MCPPromptMessage {
  role: 'user' | 'assistant';
  content: MCPContent;
}

// API 요청/응답 타입
export interface ConnectRequest {
  config: MCPServerConfig;
}

export interface ConnectResponse {
  success: boolean;
  serverId: string;
  error?: string;
}

export interface DisconnectRequest {
  serverId: string;
}

export interface DisconnectResponse {
  success: boolean;
  error?: string;
}

export interface ListToolsRequest {
  serverId: string;
}

export interface ListToolsResponse {
  tools: MCPTool[];
  error?: string;
}

export interface CallToolRequest {
  serverId: string;
  toolName: string;
  arguments?: Record<string, unknown>;
}

export interface CallToolResponse {
  result?: MCPToolResult;
  error?: string;
}

export interface ListResourcesRequest {
  serverId: string;
}

export interface ListResourcesResponse {
  resources: MCPResource[];
  resourceTemplates?: MCPResourceTemplate[];
  error?: string;
}

export interface ReadResourceRequest {
  serverId: string;
  uri: string;
}

export interface ReadResourceResponse {
  contents?: MCPResourceContent[];
  error?: string;
}

export interface ListPromptsRequest {
  serverId: string;
}

export interface ListPromptsResponse {
  prompts: MCPPrompt[];
  error?: string;
}

export interface GetPromptRequest {
  serverId: string;
  promptName: string;
  arguments?: Record<string, string>;
}

export interface GetPromptResponse {
  description?: string;
  messages?: MCPPromptMessage[];
  error?: string;
}

// localStorage에 저장되는 서버 설정 (민감정보 제외)
export interface StoredServerConfig {
  id: string;
  name: string;
  type: MCPTransportType;
  command?: string;
  args?: string[];
  url?: string;
  // env는 저장하지 않음 (보안)
}

// 설정 내보내기/가져오기용
export interface ExportedConfig {
  version: string;
  servers: StoredServerConfig[];
  exportedAt: string;
}
