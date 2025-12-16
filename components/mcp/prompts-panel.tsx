"use client";

/**
 * MCP Prompts 패널 컴포넌트
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
import { MessageSquare, Play } from 'lucide-react';
import type { MCPPrompt, MCPPromptMessage } from '@/lib/mcp/types';

interface PromptsPanelProps {
  serverId: string;
}

export function PromptsPanel({ serverId }: PromptsPanelProps) {
  const { serverData, connectionStatus } = useMCP();
  const [selectedPrompt, setSelectedPrompt] = useState<MCPPrompt | null>(null);
  const [args, setArgs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ description?: string; messages: MCPPromptMessage[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const prompts = serverData[serverId]?.prompts || [];
  const isConnected = connectionStatus[serverId] === 'connected';

  const handleSelectPrompt = (prompt: MCPPrompt) => {
    setSelectedPrompt(prompt);
    // 인자 초기화
    const initialArgs: Record<string, string> = {};
    prompt.arguments?.forEach((arg) => {
      initialArgs[arg.name] = '';
    });
    setArgs(initialArgs);
    setResult(null);
    setError(null);
  };

  const handleArgChange = (name: string, value: string) => {
    setArgs((prev) => ({ ...prev, [name]: value }));
  };

  const handleGet = async () => {
    if (!selectedPrompt) return;

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/mcp/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId,
          promptName: selectedPrompt.name,
          arguments: args,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult({
          description: data.description,
          messages: data.messages || [],
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '프롬프트 가져오기에 실패했습니다.');
    } finally {
      setIsLoading(false);
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
      {/* 프롬프트 목록 */}
      <div style={{ width: '200px', flexShrink: 0 }}>
        <GroupBox label="Prompts" style={{ height: '100%' }}>
          <ScrollView style={{ height: 'calc(100% - 30px)', background: 'white' }}>
            {prompts.length === 0 ? (
              <div style={{ padding: '8px', color: '#888', fontSize: '0.875rem' }}>
                프롬프트가 없습니다.
              </div>
            ) : (
              prompts.map((prompt) => (
                <div
                  key={prompt.name}
                  onClick={() => handleSelectPrompt(prompt)}
                  style={{
                    padding: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedPrompt?.name === prompt.name ? '#000080' : 'transparent',
                    color: selectedPrompt?.name === prompt.name ? 'white' : 'black',
                    borderBottom: '1px solid #dfdfdf',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MessageSquare size={12} />
                    <span style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>{prompt.name}</span>
                  </div>
                  {prompt.description && (
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
                      {prompt.description}
                    </div>
                  )}
                </div>
              ))
            )}
          </ScrollView>
        </GroupBox>
      </div>

      {/* 프롬프트 상세 및 실행 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {selectedPrompt ? (
          <>
            <GroupBox label={selectedPrompt.name}>
              <div style={{ padding: '8px' }}>
                {selectedPrompt.description && (
                  <p style={{ marginBottom: '8px', fontSize: '0.875rem' }}>
                    {selectedPrompt.description}
                  </p>
                )}

                {selectedPrompt.arguments && selectedPrompt.arguments.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    {selectedPrompt.arguments.map((arg) => (
                      <Fieldset
                        key={arg.name}
                        label={`${arg.name}${arg.required ? ' *' : ''}`}
                        style={{ marginBottom: '8px' }}
                      >
                        <TextField
                          fullWidth
                          value={args[arg.name] || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleArgChange(arg.name, e.target.value)
                          }
                          placeholder={arg.description || arg.name}
                        />
                      </Fieldset>
                    ))}
                  </div>
                )}

                <Button onClick={handleGet} disabled={isLoading}>
                  <Play size={14} style={{ marginRight: '4px' }} />
                  {isLoading ? '가져오는 중...' : '프롬프트 가져오기'}
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
                    <div>
                      {result.description && (
                        <p style={{ marginBottom: '8px', fontStyle: 'italic' }}>
                          {result.description}
                        </p>
                      )}
                      {result.messages.map((msg, idx) => (
                        <div
                          key={idx}
                          style={{
                            marginBottom: '8px',
                            padding: '8px',
                            background: msg.role === 'user' ? '#e8e8ff' : '#f0f0f0',
                            borderRadius: '4px',
                          }}
                        >
                          <div style={{ fontWeight: 'bold', fontSize: '0.75rem', marginBottom: '4px' }}>
                            {msg.role === 'user' ? 'User' : 'Assistant'}
                          </div>
                          <div style={{ fontSize: '0.875rem' }}>
                            {msg.content.text || JSON.stringify(msg.content)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!error && !result && (
                    <span style={{ color: '#888' }}>프롬프트를 가져오면 결과가 여기에 표시됩니다.</span>
                  )}
                </div>
              </ScrollView>
            </GroupBox>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
            왼쪽에서 프롬프트를 선택하세요.
          </div>
        )}
      </div>
    </div>
  );
}
