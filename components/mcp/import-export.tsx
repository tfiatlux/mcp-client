"use client";

/**
 * MCP 설정 가져오기/내보내기 컴포넌트
 */

import { useRef } from 'react';
import { useMCP } from '@/contexts/mcp-context';
import { Button } from 'react95';
import { Download, Upload } from 'lucide-react';

export function ImportExport() {
  const { exportConfig, importConfig } = useMCP();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const config = exportConfig();
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcp-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const success = importConfig(text);
      if (success) {
        alert('설정을 성공적으로 가져왔습니다.');
      }
    } catch (err) {
      alert('파일을 읽는 데 실패했습니다.');
    }

    // 입력 초기화 (같은 파일 다시 선택 가능하도록)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Button onClick={handleExport} size="sm">
        <Download size={14} style={{ marginRight: '4px' }} />
        내보내기
      </Button>
      <Button onClick={handleImportClick} size="sm">
        <Upload size={14} style={{ marginRight: '4px' }} />
        가져오기
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
