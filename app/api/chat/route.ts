import { GoogleGenAI, mcpToTool } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { mcpClientManager } from "@/lib/mcp/client-manager";
export const runtime = "nodejs"; // mcp 연동을 위해 nodejs 런타임 사용 권장 (또는 edge 호환성 확인 필요하지만 안전하게 nodejs로 시작)

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not defined" },
        { status: 500 }
      );
    }

    const { messages, connectedServerIds } = await req.json();

    // Last message is the user's prompt
    const userMessage = messages[messages.length - 1];
    if (!userMessage || !userMessage.content) {
      return NextResponse.json(
        { error: "No message content provided" },
        { status: 400 }
      );
    }

    // Convert history to Gemini format
    // @google/genai SDK uses specific format, but typically follows role/parts structure
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // 현재 시간 정보 생성
    const now = new Date();
    const utcTime = now.toISOString();
    const koreaTime = now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'full', timeStyle: 'long' });

    const systemInstruction = `You are an AI assistant. Maintain the context of the conversation.

## Current Time Information
- UTC: ${utcTime}
- Korea (KST): ${koreaTime}
- Use these timestamps to calculate current time in any timezone when asked.

## Response Format
Always structure your responses with a clear 'Subject' (using Markdown Header 1) and 'Detail' sections. Use formal document formatting. Keep the subject concise. In the Detail section, use paragraphs, lists, and other markdown features to organize information clearly.`;

    // Initialize Gemini API (New SDK)
    const ai = new GoogleGenAI({ apiKey });

    // Collect MCP tools
    const tools: any[] = [];
    if (Array.isArray(connectedServerIds) && connectedServerIds.length > 0) {
      for (const serverId of connectedServerIds) {
        const client = mcpClientManager.getClientInstance(serverId);
        if (client) {
          tools.push(mcpToTool(client));
        }
      }
    }

    // Prepare contents
    const contents = [
      ...history,
      {
        role: "user",
        parts: [{ text: userMessage.content }],
      },
    ];

    // Generate content stream
    console.log("Generating content stream...");
    const result = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        tools: tools.length > 0 ? tools : undefined,
      },
    });

    let streamSource: AsyncIterable<any> | undefined;

    // @ts-expect-error - GoogleGenAI SDK typing issue
    if (result && result.stream && typeof result.stream[Symbol.asyncIterator] === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        streamSource = (result as any).stream;
    } else if (result && typeof result[Symbol.asyncIterator] === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        streamSource = result as any;
    }

    if (!streamSource) {
        console.error("Invalid result structure:", result);
        throw new Error("Response from Gemini is not an async iterable stream");
    }

    // Create a ReadableStream from the Gemini stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of streamSource!) {
            let chunkText = '';
            
            // chunk 구조 로깅 (디버깅용, 추후 제거)
            // console.log("Chunk keys:", Object.keys(chunk)); 

            if (typeof chunk.text === 'function') {
              chunkText = chunk.text();
            } else if (typeof chunk.text === 'string') {
              chunkText = chunk.text;
            } else if (chunk.candidates && chunk.candidates[0]?.content?.parts?.[0]?.text) {
              chunkText = chunk.candidates[0].content.parts[0].text;
            }

            if (chunkText) {
              controller.enqueue(encoder.encode(chunkText));
            }
          }
          controller.close();
        } catch (error: any) {
          console.error("Stream error:", error);
          // 스트림 도중 에러 발생 시 클라이언트에 에러 메시지 전송
          const errorMessage = error.status === 429 || (error.message && error.message.includes('429'))
            ? "\n\n**[시스템 알림] Gemini API 요청 제한(Quota)을 초과했습니다. 잠시 후 다시 시도해주세요.**"
            : `\n\n**[시스템 알림] 스트리밍 중 에러 발생: ${error.message}**`;
          
          try {
            controller.enqueue(encoder.encode(errorMessage));
          } catch (e) {
            // 이미 닫힌 경우 무시
          }
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error in chat route:", error);
    
    // 429 에러 처리
    if (error.status === 429 || (error.message && error.message.includes('429'))) {
       return NextResponse.json(
        { error: "Gemini API 요청 제한을 초과했습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
