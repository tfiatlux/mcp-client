"use client";

/**
 * MCP Tools 패널 컴포넌트
 */

import { useState } from 'react';
import { useMCP } from '@/contexts/mcp-context';
import {
  Button,
  TextField,
  ScrollView,
  GroupBox,
  Fieldset,
  Frame,
} from 'react95';
import { Play, Wrench } from 'lucide-react';
import type { MCPTool, MCPToolResult } from '@/lib/mcp/types';

interface ToolsPanelProps {
  serverId: string;
}

export function ToolsPanel({ serverId }: ToolsPanelProps) {
  const { serverData, connectionStatus } = useMCP();
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
  const [args, setArgs] = useState('{}');
  const [result, setResult] = useState<MCPToolResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const tools = serverData[serverId]?.tools || [];
  const isConnected = connectionStatus[serverId] === 'connected';

  const handleSelectTool = (tool: MCPTool) => {
    setSelectedTool(tool);
    setArgs(JSON.stringify(tool.inputSchema || {}, null, 2));
    setResult(null);
    setError(null);
  };

  const handleExecute = async () => {
    if (!selectedTool) return;

    setIsExecuting(true);
    setResult(null);
    setError(null);

    try {
      let parsedArgs = {};
      if (args.trim()) {
        parsedArgs = JSON.parse(args);
      }

      const res = await fetch('/api/mcp/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId,
          toolName: selectedTool.name,
          arguments: parsedArgs,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data.result);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '도구 실행에 실패했습니다.');
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isConnected) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>
        서버에 연결되어 있지 않습니다.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', gap: '8px' }}>
      {/* 도구 목록 */}
      <div style={{ width: '200px', flexShrink: 0 }}>
        <GroupBox label="Tools" style={{ height: '100%' }}>
          <ScrollView style={{ height: 'calc(100% - 30px)', background: 'white' }}>
            {tools.length === 0 ? (
              <div style={{ padding: '8px', color: '#888', fontSize: '0.875rem' }}>
                도구가 없습니다.
              </div>
            ) : (
              tools.map((tool) => (
                <div
                  key={tool.name}
                  onClick={() => handleSelectTool(tool)}
                  style={{
                    padding: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedTool?.name === tool.name ? '#000080' : 'transparent',
                    color: selectedTool?.name === tool.name ? 'white' : 'black',
                    borderBottom: '1px solid #dfdfdf',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Wrench size={12} />
                    <span style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>{tool.name}</span>
                  </div>
                  {tool.description && (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        opacity: 0.8,
                        marginTop: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tool.description}
                    </div>
                  )}
                </div>
              ))
            )}
          </ScrollView>
        </GroupBox>
      </div>

      {/* 도구 상세 및 실행 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {selectedTool ? (
          <>
            <GroupBox label={`${selectedTool.name} 실행`}>
              <div style={{ padding: '8px' }}>
                {selectedTool.description && (
                  <p style={{ marginBottom: '8px', fontSize: '0.875rem' }}>
                    {selectedTool.description}
                  </p>
                )}
                <Fieldset label="Arguments (JSON)" style={{ marginBottom: '8px' }}>
                  <textarea
                    value={args}
                    onChange={(e) => setArgs(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      padding: '4px',
                      border: '2px inset #dfdfdf',
                    }}
                  />
                </Fieldset>
                <Button onClick={handleExecute} disabled={isExecuting}>
                  <Play size={14} style={{ marginRight: '4px' }} />
                  {isExecuting ? '실행 중...' : '실행'}
                </Button>
              </div>
            </GroupBox>

            {/* 결과 */}
            <GroupBox label="결과" style={{ flex: 1 }}>
              <ScrollView style={{ height: 'calc(100% - 30px)', background: 'white' }}>
                <div style={{ padding: '8px' }}>
                  {error && (
                    <Frame
                      variant="well"
                      style={{ padding: '8px', backgroundColor: '#ffeeee', color: '#cc0000' }}
                    >
                      {error}
                    </Frame>
                  )}
                  {result && (
                    <pre
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                      }}
                    >
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  )}
                  {!error && !result && (
                    <span style={{ color: '#888' }}>도구를 실행하면 결과가 여기에 표시됩니다.</span>
                  )}
                </div>
              </ScrollView>
            </GroupBox>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
            왼쪽에서 도구를 선택하세요.
          </div>
        )}
      </div>
    </div>
  );
}
