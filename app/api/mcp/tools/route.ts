/**
 * MCP 도구 API
 * GET /api/mcp/tools - 도구 목록 조회
 * POST /api/mcp/tools - 도구 실행
 */

import { NextRequest, NextResponse } from 'next/server';
import { mcpClientManager } from '@/lib/mcp/client-manager';
import {
  isBuiltinServer,
  getBuiltinTools,
  executeBuiltinTool,
} from '@/lib/mcp';
import type {
  ListToolsRequest,
  ListToolsResponse,
  CallToolRequest,
  CallToolResponse,
} from '@/lib/mcp';

export const runtime = 'nodejs';

// 도구 목록 조회
export async function GET(req: NextRequest): Promise<NextResponse<ListToolsResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    const serverId = searchParams.get('serverId');

    if (!serverId) {
      return NextResponse.json(
        { tools: [], error: 'serverId가 필요합니다.' },
        { status: 400 }
      );
    }

    // 내장 도구 서버인 경우
    if (isBuiltinServer(serverId)) {
      const tools = getBuiltinTools();
      return NextResponse.json({ tools });
    }

    const tools = await mcpClientManager.listTools(serverId);

    return NextResponse.json({ tools });
  } catch (error) {
    console.error('도구 목록 조회 오류:', error);
    return NextResponse.json(
      {
        tools: [],
        error: error instanceof Error ? error.message : '도구 목록 조회에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}

// 도구 실행
export async function POST(req: NextRequest): Promise<NextResponse<CallToolResponse>> {
  try {
    const body: CallToolRequest = await req.json();
    const { serverId, toolName, arguments: args } = body;

    if (!serverId || !toolName) {
      return NextResponse.json(
        { error: 'serverId와 toolName이 필요합니다.' },
        { status: 400 }
      );
    }

    // 내장 도구 서버인 경우
    if (isBuiltinServer(serverId)) {
      const result = await executeBuiltinTool(toolName, args);
      return NextResponse.json({ result });
    }

    const result = await mcpClientManager.callTool(serverId, toolName, args);

    return NextResponse.json({ result });
  } catch (error) {
    console.error('도구 실행 오류:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '도구 실행에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}
