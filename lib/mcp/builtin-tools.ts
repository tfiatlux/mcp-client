/**
 * 내장 MCP 도구
 * 외부 MCP 서버 없이 바로 사용 가능한 도구들
 */

import type { MCPTool, MCPToolResult } from './types';

// Nominatim API 응답 타입
interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  class: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  boundingbox: string[];
}

// 내장 도구 서버 ID
export const BUILTIN_SERVER_ID = '__builtin__';

// 내장 도구 목록
export const builtinTools: MCPTool[] = [
  {
    name: 'geocode',
    description:
      '도시 이름이나 주소를 입력받아 위도와 경도 좌표를 반환합니다. (Nominatim OpenStreetMap API 사용)',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '검색할 도시 이름 또는 주소 (예: "서울", "Tokyo", "123 Main St, New York")',
        },
        limit: {
          type: 'number',
          description: '반환할 최대 결과 수 (기본값: 1, 최대: 10)',
          default: 1,
        },
      },
      required: ['query'],
    },
  },
];

/**
 * Geocode 도구 실행
 * Nominatim OpenStreetMap API를 사용하여 주소를 좌표로 변환
 */
async function executeGeocode(args: Record<string, unknown>): Promise<MCPToolResult> {
  const query = args.query as string;
  const limit = Math.min(Math.max(1, (args.limit as number) || 1), 10);

  if (!query || query.trim().length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: '오류: 검색어(query)를 입력해주세요.',
        },
      ],
      isError: true,
    };
  }

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query.trim());
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
      headers: {
        // Nominatim 정책: User-Agent 필수
        'User-Agent': 'MCP-Client-App/1.0 (https://github.com/mcp-client)',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API 요청 실패: ${response.status} ${response.statusText}`);
    }

    const results: NominatimResult[] = await response.json();

    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `"${query}"에 대한 검색 결과가 없습니다. 다른 검색어를 시도해보세요.`,
          },
        ],
        isError: false,
      };
    }

    // 결과 포맷팅
    const formattedResults = results.map((result, index) => ({
      index: index + 1,
      name: result.name || result.display_name.split(',')[0],
      display_name: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      type: result.type,
      importance: result.importance,
    }));

    const responseText =
      results.length === 1
        ? `📍 "${query}" 검색 결과:\n\n` +
          `장소: ${formattedResults[0].display_name}\n` +
          `위도: ${formattedResults[0].latitude}\n` +
          `경도: ${formattedResults[0].longitude}\n` +
          `유형: ${formattedResults[0].type}`
        : `📍 "${query}" 검색 결과 (${results.length}개):\n\n` +
          formattedResults
            .map(
              (r) =>
                `${r.index}. ${r.display_name}\n` +
                `   위도: ${r.latitude}, 경도: ${r.longitude}\n` +
                `   유형: ${r.type}`
            )
            .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: responseText,
        },
      ],
      isError: false,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return {
      content: [
        {
          type: 'text',
          text: `Geocode 오류: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * 내장 도구 실행
 */
export async function executeBuiltinTool(
  toolName: string,
  args?: Record<string, unknown>
): Promise<MCPToolResult> {
  switch (toolName) {
    case 'geocode':
      return executeGeocode(args || {});
    default:
      return {
        content: [
          {
            type: 'text',
            text: `알 수 없는 내장 도구: ${toolName}`,
          },
        ],
        isError: true,
      };
  }
}

/**
 * 내장 도구인지 확인
 */
export function isBuiltinServer(serverId: string): boolean {
  return serverId === BUILTIN_SERVER_ID;
}

/**
 * 내장 도구 목록 반환
 */
export function getBuiltinTools(): MCPTool[] {
  return builtinTools;
}
