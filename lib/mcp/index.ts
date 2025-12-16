/**
 * MCP 모듈 exports
 */

export * from './types';
// client-manager는 서버 전용이므로 클라이언트 번들에 포함되지 않도록 index.ts에서 제외
// export { mcpClientManager, default as MCPClientManager } from './client-manager';
export {
  BUILTIN_SERVER_ID,
  builtinTools,
  executeBuiltinTool,
  isBuiltinServer,
  getBuiltinTools,
} from './builtin-tools';
