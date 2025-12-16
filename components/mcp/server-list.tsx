"use client";

/**
 * MCP 서버 목록 컴포넌트
 */

import { useMCP } from '@/contexts/mcp-context';
import { Button, List, ListItem } from 'react95';
import { Plug, PlugZap, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import type { ConnectionStatus } from '@/lib/mcp/types';

interface ServerListProps {
  selectedServerId: string | null;
  onSelectServer: (serverId: string) => void;
}

const statusColors: Record<ConnectionStatus, string> = {
  connected: '#00AA00',
  disconnected: '#888888',
  connecting: '#FFAA00',
  error: '#FF0000',
};

const statusLabels: Record<ConnectionStatus, string> = {
  connected: '연결됨',
  disconnected: '연결 안됨',
  connecting: '연결 중...',
  error: '오류',
};

export function ServerList({ selectedServerId, onSelectServer }: ServerListProps) {
  const {
    servers,
    connectionStatus,
    connect,
    disconnect,
    removeServer,
    refreshServerData,
    isLoading,
  } = useMCP();

  const handleConnect = async (e: React.MouseEvent, serverId: string) => {
    e.stopPropagation();
    await connect(serverId);
  };

  const handleDisconnect = async (e: React.MouseEvent, serverId: string) => {
    e.stopPropagation();
    await disconnect(serverId);
  };

  const handleDelete = (e: React.MouseEvent, serverId: string) => {
    e.stopPropagation();
    if (confirm('이 서버를 삭제하시겠습니까?')) {
      removeServer(serverId);
    }
  };

  const handleRefresh = async (e: React.MouseEvent, serverId: string) => {
    e.stopPropagation();
    await refreshServerData(serverId);
  };

  if (servers.length === 0) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>
        등록된 서버가 없습니다.
        <br />
        서버를 추가해주세요.
      </div>
    );
  }

  return (
    <List>
      {servers.map((server) => {
        const status = connectionStatus[server.id] || 'disconnected';
        const isSelected = selectedServerId === server.id;
        const isConnected = status === 'connected';

        return (
          <ListItem
            key={server.id}
            onClick={() => onSelectServer(server.id)}
            style={{
              cursor: 'pointer',
              backgroundColor: isSelected ? '#000080' : 'transparent',
              color: isSelected ? 'white' : 'black',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: statusColors[status],
                }}
              />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {server.name}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                  {server.type.toUpperCase()} · {statusLabels[status]}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {isConnected ? (
                <>
                  <Button
                    size="sm"
                    square
                    onClick={(e) => handleRefresh(e, server.id)}
                    disabled={isLoading}
                    title="새로고침"
                  >
                    <RefreshCw size={12} />
                  </Button>
                  <Button
                    size="sm"
                    square
                    onClick={(e) => handleDisconnect(e, server.id)}
                    disabled={isLoading}
                    title="연결 해제"
                  >
                    <PlugZap size={12} />
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  square
                  onClick={(e) => handleConnect(e, server.id)}
                  disabled={isLoading || status === 'connecting'}
                  title="연결"
                >
                  <Plug size={12} />
                </Button>
              )}
              <Button
                size="sm"
                square
                onClick={(e) => handleDelete(e, server.id)}
                disabled={isLoading}
                title="삭제"
              >
                <Trash2 size={12} />
              </Button>
            </div>
          </ListItem>
        );
      })}
    </List>
  );
}
