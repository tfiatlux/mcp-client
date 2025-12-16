/**
 * MCP 서버 연결 API
 * POST /api/mcp/connect
 */

import { NextRequest, NextResponse } from 'next/server';
import { mcpClientManager } from '@/lib/mcp/client-manager';
import type { ConnectRequest, ConnectResponse, MCPServerConfig } from '@/lib/mcp';

// STDIO는 spawn이 필요하므로 Node.js runtime 필수
export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse<ConnectResponse>> {
  try {
    const body: ConnectRequest = await req.json();
    const { config } = body;

    if (!config || !config.id || !config.name || !config.type) {
      return NextResponse.json(
        { success: false, serverId: '', error: '유효하지 않은 서버 설정입니다.' },
        { status: 400 }
      );
    }

    // STDIO 연결 시 환경 변수 처리 (서버 측 .env에서 가져오기)
    const finalConfig: MCPServerConfig = { ...config };
    if (config.type === 'stdio' && config.env) {
      // 환경 변수 값이 '$ENV_VAR' 형식이면 실제 환경 변수로 대체
      const resolvedEnv: Record<string, string> = {};
      for (const [key, value] of Object.entries(config.env)) {
        if (typeof value === 'string' && value.startsWith('$')) {
          const envKey = value.slice(1);
          resolvedEnv[key] = process.env[envKey] || '';
        } else {
          resolvedEnv[key] = value;
        }
      }
      finalConfig.env = resolvedEnv;
    }

    await mcpClientManager.connect(finalConfig);

    return NextResponse.json({
      success: true,
      serverId: config.id,
    });
  } catch (error) {
    console.error('MCP 서버 연결 오류:', error);
    return NextResponse.json(
      {
        success: false,
        serverId: '',
        error: error instanceof Error ? error.message : '서버 연결에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}

// 연결 상태 확인
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const serverId = searchParams.get('serverId');

    if (serverId) {
      const status = mcpClientManager.getStatus(serverId);
      return NextResponse.json({ serverId, status });
    }

    // 모든 연결된 서버 ID 반환
    const connectedServers = mcpClientManager.getConnectedServerIds();
    return NextResponse.json({ connectedServers });
  } catch (error) {
    console.error('연결 상태 확인 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '상태 확인에 실패했습니다.' },
      { status: 500 }
    );
  }
}
