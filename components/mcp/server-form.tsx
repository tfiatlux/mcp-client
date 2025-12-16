"use client";

/**
 * MCP 서버 등록/편집 폼 컴포넌트
 */

import { useState } from 'react';
import { useMCP } from '@/contexts/mcp-context';
import { Button, TextField, Select, GroupBox, Fieldset } from 'react95';
import type { StoredServerConfig, MCPTransportType } from '@/lib/mcp/types';

interface ServerFormProps {
  editServer?: StoredServerConfig;
  onClose: () => void;
}

export function ServerForm({ editServer, onClose }: ServerFormProps) {
  const { addServer, updateServer } = useMCP();
  const isEdit = !!editServer;

  const [name, setName] = useState(editServer?.name || '');
  const [type, setType] = useState<MCPTransportType>(editServer?.type || 'stdio');
  const [command, setCommand] = useState(editServer?.command || '');
  const [args, setArgs] = useState(editServer?.args?.join(' ') || '');
  const [url, setUrl] = useState(editServer?.url || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('서버 이름을 입력해주세요.');
      return;
    }

    if (type === 'stdio' && !command.trim()) {
      alert('명령어를 입력해주세요.');
      return;
    }

    if (type === 'http' && !url.trim()) {
      alert('URL을 입력해주세요.');
      return;
    }

    const config: StoredServerConfig = {
      id: editServer?.id || `server_${Date.now()}`,
      name: name.trim(),
      type,
      ...(type === 'stdio' && {
        command: command.trim(),
        args: args.trim() ? args.trim().split(/\s+/) : [],
      }),
      ...(type === 'http' && {
        url: url.trim(),
      }),
    };

    if (isEdit) {
      updateServer(config);
    } else {
      addServer(config);
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <GroupBox label={isEdit ? '서버 편집' : '새 서버 추가'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px' }}>
          <Fieldset label="서버 이름" style={{ padding: '8px' }}>
            <TextField
              fullWidth
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="My MCP Server"
            />
          </Fieldset>

          <Fieldset label="연결 타입" style={{ padding: '8px' }}>
            <Select
              value={type}
              onChange={(e) => setType(e.value as MCPTransportType)}
              options={[
                { label: 'STDIO (로컬 프로세스)', value: 'stdio' },
                { label: 'HTTP (원격 서버)', value: 'http' },
              ]}
              width="100%"
            />
          </Fieldset>

          {type === 'stdio' && (
            <>
              <Fieldset label="명령어" style={{ padding: '8px' }}>
                <TextField
                  fullWidth
                  value={command}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCommand(e.target.value)}
                  placeholder="node, npx, python 등"
                />
              </Fieldset>
              <Fieldset label="인자 (공백으로 구분)" style={{ padding: '8px' }}>
                <TextField
                  fullWidth
                  value={args}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setArgs(e.target.value)}
                  placeholder="server.js --port 3000"
                />
              </Fieldset>
              <div style={{ fontSize: '0.75rem', color: '#666', padding: '0 8px' }}>
                환경 변수는 서버의 .env.local에서 관리됩니다.
              </div>
            </>
          )}

          {type === 'http' && (
            <Fieldset label="서버 URL" style={{ padding: '8px' }}>
              <TextField
                fullWidth
                value={url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                placeholder="http://localhost:3000/mcp"
              />
            </Fieldset>
          )}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button type="button" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" primary>
              {isEdit ? '저장' : '추가'}
            </Button>
          </div>
        </div>
      </GroupBox>
    </form>
  );
}
