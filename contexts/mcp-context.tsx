"use client";

/**
 * MCP 연결 상태 전역 Context Provider
 * 앱 전체에서 MCP 서버 연결 상태를 공유합니다.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type {
  StoredServerConfig,
  ConnectionStatus,
  ExportedConfig,
  MCPTool,
  MCPResource,
  MCPResourceTemplate,
  MCPPrompt,
} from '@/lib/mcp/types';
import { BUILTIN_SERVER_ID, builtinTools } from '@/lib/mcp/builtin-tools';

interface MCPContextValue {
  // 서버 목록
  servers: StoredServerConfig[];
  // 연결 상태
  connectionStatus: Record<string, ConnectionStatus>;
  // 서버별 데이터 캐시
  serverData: Record<string, {
    tools?: MCPTool[];
    resources?: MCPResource[];
    resourceTemplates?: MCPResourceTemplate[];
    prompts?: MCPPrompt[];
  }>;
  // 로딩 상태
  isLoading: boolean;
  // 에러 메시지
  error: string | null;
  // 서버 관리
  addServer: (config: StoredServerConfig) => void;
  updateServer: (config: StoredServerConfig) => void;
  removeServer: (serverId: string) => void;
  // 연결 관리
  connect: (serverId: string) => Promise<void>;
  disconnect: (serverId: string) => Promise<void>;
  // 데이터 조회
  refreshServerData: (serverId: string) => Promise<void>;
  // 설정 가져오기/내보내기
  exportConfig: () => string;
  importConfig: (json: string) => boolean;
  // 에러 초기화
  clearError: () => void;
}

const MCPContext = createContext<MCPContextValue | null>(null);

const STORAGE_KEY = 'mcp_servers';
const CONFIG_VERSION = '1.0';

// 내장 도구 서버 설정 (항상 포함)
const BUILTIN_SERVER_CONFIG: StoredServerConfig = {
  id: BUILTIN_SERVER_ID,
  name: '내장 도구 (Builtin Tools)',
  type: 'stdio',
};

export function MCPProvider({ children }: { children: React.ReactNode }) {
  const [servers, setServers] = useState<StoredServerConfig[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, ConnectionStatus>>({});
  const [serverData, setServerData] = useState<MCPContextValue['serverData']>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  // localStorage에서 서버 목록 로드
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? (JSON.parse(stored) as StoredServerConfig[]) : [];
      
      // 내장 서버가 목록에 없으면 추가
      const hasBuiltin = parsed.some((s) => s.id === BUILTIN_SERVER_ID);
      const allServers = hasBuiltin ? parsed : [BUILTIN_SERVER_CONFIG, ...parsed];
      
      setServers(allServers);
      
      // 초기 상태 설정 (내장 서버는 항상 connected)
      const initialStatus: Record<string, ConnectionStatus> = {
        [BUILTIN_SERVER_ID]: 'connected',
      };
      allServers.forEach((s) => {
        if (s.id !== BUILTIN_SERVER_ID) {
          initialStatus[s.id] = 'disconnected';
        }
      });
      setConnectionStatus(initialStatus);
      
      // 내장 도구 데이터 설정
      setServerData({
        [BUILTIN_SERVER_ID]: {
          tools: builtinTools,
          resources: [],
          resourceTemplates: [],
          prompts: [],
        },
      });
    } catch (e) {
      console.error('MCP 서버 설정 로드 실패:', e);
    }

    // 서버에서 현재 연결 상태 동기화
    syncConnectionStatus();
  }, []);

  // 서버 연결 상태 동기화
  const syncConnectionStatus = async () => {
    try {
      const res = await fetch('/api/mcp/connect');
      if (res.ok) {
        const data = await res.json();
        if (data.connectedServers) {
          setConnectionStatus((prev) => {
            const newStatus = { ...prev };
            data.connectedServers.forEach((id: string) => {
              newStatus[id] = 'connected';
            });
            return newStatus;
          });
        }
      }
    } catch (e) {
      console.error('연결 상태 동기화 실패:', e);
    }
  };

  // 서버 목록 저장 (내장 서버 제외하고 저장)
  const saveServers = useCallback((newServers: StoredServerConfig[]) => {
    const serversToSave = newServers.filter((s) => s.id !== BUILTIN_SERVER_ID);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serversToSave));
    // 내장 서버 포함하여 상태 업데이트
    const hasBuiltin = newServers.some((s) => s.id === BUILTIN_SERVER_ID);
    setServers(hasBuiltin ? newServers : [BUILTIN_SERVER_CONFIG, ...newServers]);
  }, []);

  // 서버 추가
  const addServer = useCallback((config: StoredServerConfig) => {
    setServers((prev) => {
      const newServers = [...prev, config];
      // 내장 서버 제외하고 저장
      const serversToSave = newServers.filter((s) => s.id !== BUILTIN_SERVER_ID);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serversToSave));
      return newServers;
    });
    setConnectionStatus((prev) => ({
      ...prev,
      [config.id]: 'disconnected',
    }));
  }, []);

  // 서버 수정
  const updateServer = useCallback((config: StoredServerConfig) => {
    // 내장 서버는 수정 불가
    if (config.id === BUILTIN_SERVER_ID) {
      return;
    }
    
    setServers((prev) => {
      const newServers = prev.map((s) => (s.id === config.id ? config : s));
      // 내장 서버 제외하고 저장
      const serversToSave = newServers.filter((s) => s.id !== BUILTIN_SERVER_ID);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serversToSave));
      return newServers;
    });
  }, []);

  // 서버 삭제
  const removeServer = useCallback(async (serverId: string) => {
    // 내장 서버는 삭제 불가
    if (serverId === BUILTIN_SERVER_ID) {
      setError('내장 도구 서버는 삭제할 수 없습니다.');
      return;
    }
    
    // 연결 해제 먼저
    if (connectionStatus[serverId] === 'connected') {
      await disconnect(serverId);
    }
    setServers((prev) => {
      const newServers = prev.filter((s) => s.id !== serverId);
      // 내장 서버 제외하고 저장
      const serversToSave = newServers.filter((s) => s.id !== BUILTIN_SERVER_ID);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serversToSave));
      return newServers;
    });
    setConnectionStatus((prev) => {
      const newStatus = { ...prev };
      delete newStatus[serverId];
      return newStatus;
    });
    setServerData((prev) => {
      const newData = { ...prev };
      delete newData[serverId];
      return newData;
    });
  }, [connectionStatus]);

  // 서버 연결
  const connect = useCallback(async (serverId: string) => {
    // 내장 서버는 항상 연결된 상태
    if (serverId === BUILTIN_SERVER_ID) {
      return;
    }
    
    const server = servers.find((s) => s.id === serverId);
    if (!server) {
      setError('서버를 찾을 수 없습니다.');
      return;
    }

    setConnectionStatus((prev) => ({ ...prev, [serverId]: 'connecting' }));
    setError(null);

    try {
      const res = await fetch('/api/mcp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: server }),
      });

      const data = await res.json();

      if (data.success) {
        setConnectionStatus((prev) => ({ ...prev, [serverId]: 'connected' }));
        // 연결 후 데이터 조회
        await refreshServerData(serverId);
      } else {
        setConnectionStatus((prev) => ({ ...prev, [serverId]: 'error' }));
        setError(data.error || '연결에 실패했습니다.');
      }
    } catch (e) {
      setConnectionStatus((prev) => ({ ...prev, [serverId]: 'error' }));
      setError(e instanceof Error ? e.message : '연결에 실패했습니다.');
    }
  }, [servers]);

  // 서버 연결 해제
  const disconnect = useCallback(async (serverId: string) => {
    // 내장 서버는 연결 해제 불가
    if (serverId === BUILTIN_SERVER_ID) {
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/mcp/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId }),
      });

      const data = await res.json();

      if (data.success) {
        setConnectionStatus((prev) => ({ ...prev, [serverId]: 'disconnected' }));
        setServerData((prev) => {
          const newData = { ...prev };
          delete newData[serverId];
          return newData;
        });
      } else {
        setError(data.error || '연결 해제에 실패했습니다.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '연결 해제에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 서버 데이터 새로고침
  const refreshServerData = useCallback(async (serverId: string) => {
    // 내장 서버는 데이터가 이미 설정되어 있음
    if (serverId === BUILTIN_SERVER_ID) {
      setServerData((prev) => ({
        ...prev,
        [BUILTIN_SERVER_ID]: {
          tools: builtinTools,
          resources: [],
          resourceTemplates: [],
          prompts: [],
        },
      }));
      return;
    }
    
    if (connectionStatus[serverId] !== 'connected') {
      return;
    }

    setIsLoading(true);

    try {
      const [toolsRes, resourcesRes, promptsRes] = await Promise.all([
        fetch(`/api/mcp/tools?serverId=${serverId}`),
        fetch(`/api/mcp/resources?serverId=${serverId}`),
        fetch(`/api/mcp/prompts?serverId=${serverId}`),
      ]);

      const [toolsData, resourcesData, promptsData] = await Promise.all([
        toolsRes.json(),
        resourcesRes.json(),
        promptsRes.json(),
      ]);

      setServerData((prev) => ({
        ...prev,
        [serverId]: {
          tools: toolsData.tools || [],
          resources: resourcesData.resources || [],
          resourceTemplates: resourcesData.resourceTemplates || [],
          prompts: promptsData.prompts || [],
        },
      }));
    } catch (e) {
      console.error('서버 데이터 조회 실패:', e);
    } finally {
      setIsLoading(false);
    }
  }, [connectionStatus]);

  // 설정 내보내기
  const exportConfig = useCallback((): string => {
    const config: ExportedConfig = {
      version: CONFIG_VERSION,
      servers,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(config, null, 2);
  }, [servers]);

  // 설정 가져오기
  const importConfig = useCallback((json: string): boolean => {
    try {
      const config = JSON.parse(json) as ExportedConfig;

      if (!config.version || !Array.isArray(config.servers)) {
        setError('유효하지 않은 설정 파일입니다.');
        return false;
      }

      // 기존 서버 연결 해제
      Object.keys(connectionStatus).forEach((id) => {
        if (connectionStatus[id] === 'connected') {
          disconnect(id);
        }
      });

      // 새 서버 목록으로 대체
      saveServers(config.servers);

      // 연결 상태 초기화
      const initialStatus: Record<string, ConnectionStatus> = {};
      config.servers.forEach((s) => {
        initialStatus[s.id] = 'disconnected';
      });
      setConnectionStatus(initialStatus);
      setServerData({});

      return true;
    } catch (e) {
      setError('설정 파일 파싱에 실패했습니다.');
      return false;
    }
  }, [connectionStatus, disconnect, saveServers]);

  // 에러 초기화
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: MCPContextValue = {
    servers,
    connectionStatus,
    serverData,
    isLoading,
    error,
    addServer,
    updateServer,
    removeServer,
    connect,
    disconnect,
    refreshServerData,
    exportConfig,
    importConfig,
    clearError,
  };

  return <MCPContext.Provider value={value}>{children}</MCPContext.Provider>;
}

export function useMCP(): MCPContextValue {
  const context = useContext(MCPContext);
  if (!context) {
    throw new Error('useMCP must be used within MCPProvider');
  }
  return context;
}

export default MCPContext;
