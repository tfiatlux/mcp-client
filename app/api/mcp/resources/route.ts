/**
 * MCP 리소스 API
 * GET /api/mcp/resources - 리소스 목록 조회
 * POST /api/mcp/resources - 리소스 읽기
 */

import { NextRequest, NextResponse } from 'next/server';
import { mcpClientManager } from '@/lib/mcp/client-manager';
import type {
  ListResourcesResponse,
  ReadResourceRequest,
  ReadResourceResponse,
} from '@/lib/mcp';

export const runtime = 'nodejs';

// 리소스 목록 조회
export async function GET(req: NextRequest): Promise<NextResponse<ListResourcesResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    const serverId = searchParams.get('serverId');

    if (!serverId) {
      return NextResponse.json(
        { resources: [], error: 'serverId가 필요합니다.' },
        { status: 400 }
      );
    }

    const { resources, resourceTemplates } = await mcpClientManager.listResources(serverId);

    return NextResponse.json({ resources, resourceTemplates });
  } catch (error) {
    console.error('리소스 목록 조회 오류:', error);
    return NextResponse.json(
      {
        resources: [],
        error: error instanceof Error ? error.message : '리소스 목록 조회에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}

// 리소스 읽기
export async function POST(req: NextRequest): Promise<NextResponse<ReadResourceResponse>> {
  try {
    const body: ReadResourceRequest = await req.json();
    const { serverId, uri } = body;

    if (!serverId || !uri) {
      return NextResponse.json(
        { error: 'serverId와 uri가 필요합니다.' },
        { status: 400 }
      );
    }

    const contents = await mcpClientManager.readResource(serverId, uri);

    return NextResponse.json({ contents });
  } catch (error) {
    console.error('리소스 읽기 오류:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '리소스 읽기에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}
