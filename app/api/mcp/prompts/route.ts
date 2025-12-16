/**
 * MCP 프롬프트 API
 * GET /api/mcp/prompts - 프롬프트 목록 조회
 * POST /api/mcp/prompts - 프롬프트 가져오기
 */

import { NextRequest, NextResponse } from 'next/server';
import { mcpClientManager } from '@/lib/mcp/client-manager';
import type {
  ListPromptsResponse,
  GetPromptRequest,
  GetPromptResponse,
} from '@/lib/mcp';

export const runtime = 'nodejs';

// 프롬프트 목록 조회
export async function GET(req: NextRequest): Promise<NextResponse<ListPromptsResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    const serverId = searchParams.get('serverId');

    if (!serverId) {
      return NextResponse.json(
        { prompts: [], error: 'serverId가 필요합니다.' },
        { status: 400 }
      );
    }

    const prompts = await mcpClientManager.listPrompts(serverId);

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error('프롬프트 목록 조회 오류:', error);
    return NextResponse.json(
      {
        prompts: [],
        error: error instanceof Error ? error.message : '프롬프트 목록 조회에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}

// 프롬프트 가져오기
export async function POST(req: NextRequest): Promise<NextResponse<GetPromptResponse>> {
  try {
    const body: GetPromptRequest = await req.json();
    const { serverId, promptName, arguments: args } = body;

    if (!serverId || !promptName) {
      return NextResponse.json(
        { error: 'serverId와 promptName이 필요합니다.' },
        { status: 400 }
      );
    }

    const result = await mcpClientManager.getPrompt(serverId, promptName, args);

    return NextResponse.json({
      description: result.description,
      messages: result.messages,
    });
  } catch (error) {
    console.error('프롬프트 가져오기 오류:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '프롬프트 가져오기에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}
