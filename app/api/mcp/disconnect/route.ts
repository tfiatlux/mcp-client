/**
 * MCP 서버 연결 해제 API
 * POST /api/mcp/disconnect
 */

import { NextRequest, NextResponse } from 'next/server';
import { mcpClientManager } from '@/lib/mcp/client-manager';
import type { DisconnectRequest, DisconnectResponse } from '@/lib/mcp';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse<DisconnectResponse>> {
  try {
    const body: DisconnectRequest = await req.json();
    const { serverId } = body;

    if (!serverId) {
      return NextResponse.json(
        { success: false, error: 'serverId가 필요합니다.' },
        { status: 400 }
      );
    }

    await mcpClientManager.disconnect(serverId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('MCP 서버 연결 해제 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '서버 연결 해제에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}
