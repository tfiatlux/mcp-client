"use client";

/**
 * MCP 서버 관리 페이지
 */

import { useState } from 'react';
import styled from 'styled-components';
import {
  AppBar,
  Toolbar,
  Button,
  Window,
  WindowHeader,
  WindowContent,
  ScrollView,
  Tabs,
  Tab,
  TabBody,
  Frame,
} from 'react95';
import { Plus, X, Minus, Square, Home, Server, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useMCP } from '@/contexts/mcp-context';
import {
  ServerList,
  ServerForm,
  ToolsPanel,
  ResourcesPanel,
  PromptsPanel,
  ImportExport,
} from '@/components/mcp';

const Wrapper = styled.div`
  padding: 2rem;
  padding-top: calc(2rem + 50px);
  background: teal;
  min-height: 100vh;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: stretch;
  gap: 1rem;

  @media (max-width: 1024px) {
    flex-direction: column;
    padding: 1rem;
    padding-top: calc(1rem + 50px);
  }
`;

const SidebarWindow = styled(Window)`
  width: 320px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 80vh;
  min-height: 500px;

  @media (max-width: 1024px) {
    width: 100%;
    height: auto;
    min-height: 300px;
  }
`;

const MainWindow = styled(Window)`
  flex: 1;
  max-width: 100%;
  height: 80vh;
  min-height: 500px;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled(WindowContent)`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  gap: 0.5rem;
  height: 100%;
  overflow: hidden;
`;

const ErrorBanner = styled(Frame)`
  padding: 8px 12px;
  background-color: #ffeeee;
  color: #cc0000;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

export default function MCPPage() {
  const { servers, connectionStatus, error, clearError, isLoading } = useMCP();
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const selectedServer = servers.find((s) => s.id === selectedServerId);
  const isConnected = selectedServerId ? connectionStatus[selectedServerId] === 'connected' : false;

  const handleTabChange = (value: number) => {
    setActiveTab(value);
  };

  return (
    <Wrapper>
      <AppBar style={{ position: 'fixed', top: 0, zIndex: 50 }}>
        <Toolbar style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Button>
                <Home size={16} style={{ marginRight: '4px' }} />
                Chat
              </Button>
            </Link>
            <div style={{ marginLeft: '10px', fontWeight: 'bold' }}>
              <Server size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              MCP Server Manager
            </div>
          </div>
          <ImportExport />
        </Toolbar>
      </AppBar>

      {/* 사이드바: 서버 목록 */}
      <SidebarWindow>
        <WindowHeader style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Servers</span>
        </WindowHeader>
        <WindowContent style={{ flex: 1, padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Button fullWidth onClick={() => setShowForm(true)}>
            <Plus size={16} style={{ marginRight: 8 }} />
            서버 추가
          </Button>

          {showForm && (
            <ServerForm onClose={() => setShowForm(false)} />
          )}

          <ScrollView style={{ flex: 1, background: 'white' }}>
            <ServerList
              selectedServerId={selectedServerId}
              onSelectServer={setSelectedServerId}
            />
          </ScrollView>

          <div style={{ fontSize: '0.75rem', color: '#666', padding: '4px' }}>
            {servers.length}개 서버 · {Object.values(connectionStatus).filter(s => s === 'connected').length}개 연결됨
          </div>
        </WindowContent>
      </SidebarWindow>

      {/* 메인: 서버 상세 */}
      <MainWindow>
        <WindowHeader style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>
            {selectedServer ? selectedServer.name : 'MCP Server Details'}
          </span>
          <div style={{ display: 'flex' }}>
            <Button size="sm" square>
              <Minus size={12} />
            </Button>
            <Button size="sm" square>
              <Square size={10} />
            </Button>
            <Button size="sm" square>
              <X size={12} />
            </Button>
          </div>
        </WindowHeader>

        <MainContent>
          {error && (
            <ErrorBanner variant="well">
              <AlertCircle size={16} />
              {error}
              <Button size="sm" onClick={clearError} style={{ marginLeft: 'auto' }}>
                닫기
              </Button>
            </ErrorBanner>
          )}

          {!selectedServerId ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
              왼쪽에서 서버를 선택하거나 새 서버를 추가하세요.
            </div>
          ) : (
            <>
              <Frame variant="well" style={{ padding: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <strong>타입:</strong> {selectedServer?.type.toUpperCase()}
                  </div>
                  {selectedServer?.type === 'stdio' && (
                    <div>
                      <strong>명령어:</strong> {selectedServer.command} {selectedServer.args?.join(' ')}
                    </div>
                  )}
                  {selectedServer?.type === 'http' && (
                    <div>
                      <strong>URL:</strong> {selectedServer.url}
                    </div>
                  )}
                  <div style={{ marginLeft: 'auto' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: isConnected ? '#00AA00' : '#888888',
                        marginRight: '4px',
                      }}
                    />
                    {isConnected ? '연결됨' : '연결 안됨'}
                  </div>
                </div>
              </Frame>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                  <Tab value={0}>Tools</Tab>
                  <Tab value={1}>Resources</Tab>
                  <Tab value={2}>Prompts</Tab>
                </Tabs>
                <TabBody style={{ flex: 1, overflow: 'hidden' }}>
                  {activeTab === 0 && <ToolsPanel serverId={selectedServerId} />}
                  {activeTab === 1 && <ResourcesPanel serverId={selectedServerId} />}
                  {activeTab === 2 && <PromptsPanel serverId={selectedServerId} />}
                </TabBody>
              </div>
            </>
          )}
        </MainContent>

        <div style={{ padding: '0.25rem', borderTop: '2px solid #dfdfdf', fontSize: '0.8rem', display: 'flex', gap: '1rem' }}>
          <span>MCP Client v1.0</span>
          <span>{isLoading ? '로딩 중...' : 'Ready'}</span>
        </div>
      </MainWindow>
    </Wrapper>
  );
}
