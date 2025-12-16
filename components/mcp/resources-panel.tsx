"use client";

/**
 * MCP Resources 패널 컴포넌트
 */

import { useState } from 'react';
import { useMCP } from '@/contexts/mcp-context';
import { Button, ScrollView, GroupBox, Frame } from 'react95';
import { FileText, FolderOpen } from 'lucide-react';
import type { MCPResource, MCPResourceContent } from '@/lib/mcp/types';

interface ResourcesPanelProps {
  serverId: string;
}

export function ResourcesPanel({ serverId }: ResourcesPanelProps) {
  const { serverData, connectionStatus } = useMCP();
  const [selectedResource, setSelectedResource] = useState<MCPResource | null>(null);
  const [content, setContent] = useState<MCPResourceContent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resources = serverData[serverId]?.resources || [];
  const resourceTemplates = serverData[serverId]?.resourceTemplates || [];
  const isConnected = connectionStatus[serverId] === 'connected';

  const handleSelectResource = (resource: MCPResource) => {
    setSelectedResource(resource);
    setContent(null);
    setError(null);
  };

  const handleRead = async () => {
    if (!selectedResource) return;

    setIsLoading(true);
    setContent(null);
    setError(null);

    try {
      const res = await fetch('/api/mcp/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId,
          uri: selectedResource.uri,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setContent(data.contents);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '리소스 읽기에 실패했습니다.');
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
      {/* 리소스 목록 */}
      <div style={{ width: '250px', flexShrink: 0 }}>
        <GroupBox label="Resources" style={{ height: '100%' }}>
          <ScrollView style={{ height: 'calc(100% - 30px)', background: 'white' }}>
            {resources.length === 0 && resourceTemplates.length === 0 ? (
              <div style={{ padding: '8px', color: '#888', fontSize: '0.875rem' }}>
                리소스가 없습니다.
              </div>
            ) : (
              <>
                {resources.map((resource) => (
                  <div
                    key={resource.uri}
                    onClick={() => handleSelectResource(resource)}
                    style={{
                      padding: '8px',
                      cursor: 'pointer',
                      backgroundColor: selectedResource?.uri === resource.uri ? '#000080' : 'transparent',
                      color: selectedResource?.uri === resource.uri ? 'white' : 'black',
                      borderBottom: '1px solid #dfdfdf',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FileText size={12} />
                      <span style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>{resource.name}</span>
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        opacity: 0.8,
                        marginTop: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {resource.uri}
                    </div>
                    {resource.description && (
                      <div
                        style={{
                          fontSize: '0.75rem',
                          opacity: 0.7,
                          marginTop: '2px',
                        }}
                      >
                        {resource.description}
                      </div>
                    )}
                  </div>
                ))}
                {resourceTemplates.length > 0 && (
                  <div style={{ padding: '8px', borderTop: '2px solid #dfdfdf' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#666', marginBottom: '4px' }}>
                      Templates
                    </div>
                    {resourceTemplates.map((template) => (
                      <div
                        key={template.uriTemplate}
                        style={{
                          padding: '4px',
                          fontSize: '0.75rem',
                          color: '#666',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FolderOpen size={10} />
                          {template.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                          {template.uriTemplate}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </ScrollView>
        </GroupBox>
      </div>

      {/* 리소스 내용 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {selectedResource ? (
          <>
            <GroupBox label={selectedResource.name}>
              <div style={{ padding: '8px' }}>
                <p style={{ fontSize: '0.875rem', marginBottom: '8px' }}>
                  <strong>URI:</strong> {selectedResource.uri}
                </p>
                {selectedResource.mimeType && (
                  <p style={{ fontSize: '0.875rem', marginBottom: '8px' }}>
                    <strong>MIME:</strong> {selectedResource.mimeType}
                  </p>
                )}
                <Button onClick={handleRead} disabled={isLoading}>
                  {isLoading ? '읽는 중...' : '리소스 읽기'}
                </Button>
              </div>
            </GroupBox>

            <GroupBox label="내용" style={{ flex: 1 }}>
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
                  {content && content.map((c, idx) => (
                    <div key={idx} style={{ marginBottom: '8px' }}>
                      {c.text && (
                        <pre
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                            background: '#f5f5f5',
                            padding: '8px',
                            border: '1px solid #dfdfdf',
                          }}
                        >
                          {c.text}
                        </pre>
                      )}
                      {c.blob && (
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                          [Binary data: {c.mimeType || 'unknown type'}]
                        </div>
                      )}
                    </div>
                  ))}
                  {!error && !content && (
                    <span style={{ color: '#888' }}>리소스 읽기 버튼을 클릭하세요.</span>
                  )}
                </div>
              </ScrollView>
            </GroupBox>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
            왼쪽에서 리소스를 선택하세요.
          </div>
        )}
      </div>
    </div>
  );
}
