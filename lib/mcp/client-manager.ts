/**
 * MCP Client 싱글톤 매니저
 * 서버 측에서 MCP 클라이언트 연결을 관리합니다.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type {
  MCPServerConfig,
  ConnectionStatus,
  MCPTool,
  MCPResource,
  MCPResourceTemplate,
  MCPPrompt,
  MCPToolResult,
  MCPResourceContent,
  MCPPromptMessage,
} from './types';

interface ClientEntry {
  client: Client;
  transport: StdioClientTransport | StreamableHTTPClientTransport;
  config: MCPServerConfig;
  status: ConnectionStatus;
}

// 전역 객체에 클라이언트 맵을 저장하기 위한 타입 선언
declare global {
  var _mcpClients: Map<string, ClientEntry> | undefined;
}

class MCPClientManager {
  private static instance: MCPClientManager;

  private constructor() {}

  // globalThis를 사용하여 클라이언트 맵 접근 (HMR/서버리스 환경 대응)
  private get clients(): Map<string, ClientEntry> {
    if (!globalThis._mcpClients) {
      globalThis._mcpClients = new Map();
    }
    return globalThis._mcpClients;
  }

  static getInstance(): MCPClientManager {
    if (!MCPClientManager.instance) {
      MCPClientManager.instance = new MCPClientManager();
    }
    return MCPClientManager.instance;
  }

  /**
   * MCP 서버에 연결
   */
  async connect(config: MCPServerConfig): Promise<void> {
    // 이미 연결된 경우 기존 연결 해제
    if (this.clients.has(config.id)) {
      await this.disconnect(config.id);
    }

    const client = new Client({
      name: 'mcp-client-app',
      version: '1.0.0',
    });

    let transport: StdioClientTransport | StreamableHTTPClientTransport;

    if (config.type === 'stdio') {
      if (!config.command) {
        throw new Error('STDIO 연결에는 command가 필요합니다.');
      }

      transport = new StdioClientTransport({
        command: config.command,
        args: config.args || [],
        env: config.env,
      });
    } else if (config.type === 'http') {
      if (!config.url) {
        throw new Error('HTTP 연결에는 URL이 필요합니다.');
      }

      transport = new StreamableHTTPClientTransport(new URL(config.url));
    } else {
      throw new Error(`지원하지 않는 transport 타입: ${config.type}`);
    }

    // 연결 시도
    await client.connect(transport);

    this.clients.set(config.id, {
      client,
      transport,
      config,
      status: 'connected',
    });
  }

  /**
   * MCP 서버 연결 해제
   */
  async disconnect(serverId: string): Promise<void> {
    const entry = this.clients.get(serverId);
    if (!entry) {
      return;
    }

    try {
      await entry.client.close();
    } catch (error) {
      console.error(`서버 ${serverId} 연결 해제 중 오류:`, error);
    }

    this.clients.delete(serverId);
  }

  /**
   * 연결 상태 확인
   */
  getStatus(serverId: string): ConnectionStatus {
    const entry = this.clients.get(serverId);
    return entry?.status || 'disconnected';
  }

  /**
   * 연결된 모든 서버 ID 조회
   */
  getConnectedServerIds(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * 클라이언트 가져오기 (내부용)
   */
  private getClient(serverId: string): Client {
    const entry = this.clients.get(serverId);
    if (!entry) {
      throw new Error(`서버 ${serverId}가 연결되어 있지 않습니다.`);
    }
    return entry.client;
  }

  /**
   * 클라이언트 인스턴스 직접 가져오기 (외부 API용)
   */
  getClientInstance(serverId: string): Client | undefined {
    return this.clients.get(serverId)?.client;
  }

  /**
   * 도구 목록 조회
   */
  async listTools(serverId: string): Promise<MCPTool[]> {
    const client = this.getClient(serverId);
    const result = await client.listTools();

    return result.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema as Record<string, unknown> | undefined,
    }));
  }

  /**
   * 도구 실행
   */
  async callTool(
    serverId: string,
    toolName: string,
    args?: Record<string, unknown>
  ): Promise<MCPToolResult> {
    const client = this.getClient(serverId);
    const result = await client.callTool({
      name: toolName,
      arguments: args || {},
    });

    return {
      content: (result.content as MCPToolResult['content']) || [],
      isError: result.isError as boolean | undefined,
    };
  }

  /**
   * 리소스 목록 조회
   */
  async listResources(
    serverId: string
  ): Promise<{ resources: MCPResource[]; resourceTemplates: MCPResourceTemplate[] }> {
    const client = this.getClient(serverId);
    const result = await client.listResources();

    const resources: MCPResource[] = (result.resources || []).map((r) => ({
      uri: r.uri,
      name: r.name,
      description: r.description,
      mimeType: r.mimeType,
    }));

    const resourceTemplates: MCPResourceTemplate[] = ((result.resourceTemplates as any[]) || []).map((rt) => ({
      uriTemplate: rt.uriTemplate,
      name: rt.name,
      description: rt.description,
      mimeType: rt.mimeType,
    }));

    return { resources, resourceTemplates };
  }

  /**
   * 리소스 읽기
   */
  async readResource(serverId: string, uri: string): Promise<MCPResourceContent[]> {
    const client = this.getClient(serverId);
    const result = await client.readResource({ uri });

    return (result.contents || []).map((c) => ({
      uri: c.uri,
      mimeType: c.mimeType,
      text: 'text' in c ? c.text : undefined,
      blob: 'blob' in c ? c.blob : undefined,
    }));
  }

  /**
   * 프롬프트 목록 조회
   */
  async listPrompts(serverId: string): Promise<MCPPrompt[]> {
    const client = this.getClient(serverId);
    const result = await client.listPrompts();

    return (result.prompts || []).map((p) => ({
      name: p.name,
      description: p.description,
      arguments: p.arguments?.map((a) => ({
        name: a.name,
        description: a.description,
        required: a.required,
      })),
    }));
  }

  /**
   * 프롬프트 가져오기
   */
  async getPrompt(
    serverId: string,
    promptName: string,
    args?: Record<string, string>
  ): Promise<{ description?: string; messages: MCPPromptMessage[] }> {
    const client = this.getClient(serverId);
    const result = await client.getPrompt({
      name: promptName,
      arguments: args,
    });

    const messages: MCPPromptMessage[] = (result.messages || []).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content as MCPPromptMessage['content'],
    }));

    return {
      description: result.description,
      messages,
    };
  }

  /**
   * 모든 연결 해제
   */
  async disconnectAll(): Promise<void> {
    const serverIds = Array.from(this.clients.keys());
    await Promise.all(serverIds.map((id) => this.disconnect(id)));
  }
}

// 싱글톤 인스턴스 export
export const mcpClientManager = MCPClientManager.getInstance();
export default mcpClientManager;
