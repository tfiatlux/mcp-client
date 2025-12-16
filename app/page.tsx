"use client";

import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import {
  AppBar,
  Toolbar,
  TextField,
  Button,
  List,
  ListItem,
  Divider,
  Window,
  WindowHeader,
  WindowContent,
  ScrollView,
  Avatar,
  Frame
} from "react95";

// Icons (using lucide because React95 icons are limited or require another package)
import { Send, Trash2, Bot, User, X, Minus, Square, History, Plus, MessageSquare, Settings, Eye, Type, Server } from "lucide-react";
import Link from "next/link";

import { MarkdownRenderer } from "@/components/markdown-renderer";
import { useMCP } from "@/contexts/mcp-context";

interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
}

interface Message {
  role: "user" | "model";
  content: string;
}

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
}

const Wrapper = styled.div<{ $highContrast?: boolean; $largeText?: boolean }>`
  padding: ${props => props.$largeText ? '2.5rem' : '2rem'};
  padding-top: calc(${props => props.$largeText ? '2.5rem' : '2rem'} + 50px);
  background: ${props => props.$highContrast ? '#000000' : 'teal'};
  min-height: 100vh;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: stretch;
  gap: ${props => props.$largeText ? '1.5rem' : '1rem'};
  font-size: ${props => props.$largeText ? '1.25rem' : '1rem'};

  @media (max-width: 768px) {
    padding: ${props => props.$largeText ? '1.5rem' : '1rem'};
    padding-top: calc(${props => props.$largeText ? '1.5rem' : '1rem'} + 50px);
    flex-direction: column;
  }
`;

const SidebarContainer = styled(Window)<{ $highContrast?: boolean; $largeText?: boolean }>`
  width: ${props => props.$largeText ? '350px' : '300px'};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 80vh;
  min-height: 500px;
  border: ${props => props.$highContrast ? '3px solid #FFFF00' : 'none'};

  @media (max-width: 768px) {
    width: 100%;
    height: 300px;
    min-height: auto;
    margin-bottom: 1rem;
  }
`;

const ChatWindow = styled(Window)<{ $highContrast?: boolean; $largeText?: boolean }>`
  flex: 1;
  max-width: 100%;
  height: 80vh;
  min-height: 500px;
  display: flex;
  flex-direction: column;
  border: ${props => props.$highContrast ? '3px solid #FFFF00' : 'none'};
`;

const ChatContent = styled(WindowContent)`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0.25rem;
  gap: 1rem;
  height: 100%;
`;

const MessageList = styled(ScrollView)`
  flex: 1;
  background: white;
  padding: 1rem;
  margin-bottom: 1rem;
  /* box-shadow removed to avoid visual glitches with scrolling */
  overflow-y: auto;

  &:before {
    border-width: 0 !important;
  }
`;

const MessageBubble = styled.div<{ $isUser: boolean; $largeText?: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: ${props => props.$largeText ? '1.5rem' : '1rem'};
  width: 100%;
  gap: ${props => props.$largeText ? '1rem' : '0.75rem'};
`;

const BubbleContent = styled.div<{ $isUser: boolean; $highContrast?: boolean; $largeText?: boolean }>`
  background: ${props => {
    if (props.$highContrast) {
      return props.$isUser ? '#FFFF00' : '#000000';
    }
    return props.$isUser ? '#000080' : '#c0c0c0';
  }};
  color: ${props => {
    if (props.$highContrast) {
      return props.$isUser ? '#000000' : '#FFFF00';
    }
    return props.$isUser ? 'white' : 'black';
  }};
  padding: ${props => props.$largeText ? '12px 16px' : '8px 12px'};
  border-radius: 0;
  max-width: 80%;
  border: ${props => props.$highContrast ? '2px solid' : 'none'};
  border-color: ${props => props.$highContrast 
    ? (props.$isUser ? '#000000' : '#FFFF00')
    : 'transparent'};
  box-shadow: ${props => props.$isUser 
    ? 'inset -1px -1px 0px 0px #ffffff, inset 1px 1px 0px 0px #808080' 
    : 'inset -1px -1px 0px 0px #ffffff, inset 1px 1px 0px 0px #808080'};
  word-break: break-word;
  font-size: ${props => props.$largeText ? '1.125rem' : '1rem'};
  line-height: ${props => props.$largeText ? '1.75' : '1.5'};
`;

const Footer = styled.div<{ $largeText?: boolean }>`
  display: flex;
  gap: ${props => props.$largeText ? '1.5rem' : '1rem'};
  padding-top: ${props => props.$largeText ? '1rem' : '0.5rem'};
`;

const SettingsWindow = styled(Window)<{ $highContrast?: boolean; $largeText?: boolean }>`
  position: fixed;
  top: 60px;
  right: 20px;
  width: ${props => props.$largeText ? '350px' : '300px'};
  z-index: 100;
  border: ${props => props.$highContrast ? '3px solid #FFFF00' : 'none'};
`;

const SettingsContent = styled(WindowContent)<{ $largeText?: boolean }>`
  padding: ${props => props.$largeText ? '1.5rem' : '1rem'};
  font-size: ${props => props.$largeText ? '1.125rem' : '1rem'};
`;

const SettingRow = styled.div<{ $largeText?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.$largeText ? '1.5rem' : '1rem'};
  padding: ${props => props.$largeText ? '0.75rem' : '0.5rem'} 0;
`;

const AvatarImage = styled.img`
  width: ${props => props.width || '32px'};
  height: ${props => props.height || '32px'};
  object-fit: contain;
  flex-shrink: 0;
  border-radius: 4px;
`;

const AvatarSVG = styled.div<{ $width?: string; $height?: string }>`
  width: ${props => props.$width || '32px'};
  height: ${props => props.$height || '32px'};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MessageContentWrapper = styled.div<{ $isUser: boolean }>`
  display: flex;
  flex-direction: column;
  max-width: 75%;
  order: ${props => props.$isUser ? -1 : 1};
`;

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // MCP 연결 상태
  const { connectionStatus } = useMCP();
  const connectedServersCount = Object.values(connectionStatus).filter(s => s === 'connected').length;

  // Load Sessions and Current Chat
  useEffect(() => {
    const savedSessions = localStorage.getItem("chat_sessions");
    let loadedSessions: ChatSession[] = [];
    if (savedSessions) {
      try {
        loadedSessions = JSON.parse(savedSessions);
        setSessions(loadedSessions);
      } catch (e) {
        console.error("Failed to parse chat sessions", e);
      }
    }

    if (loadedSessions.length > 0) {
      // Load most recent session
      const mostRecent = loadedSessions.sort((a, b) => b.createdAt - a.createdAt)[0];
      setCurrentSessionId(mostRecent.id);
      loadSessionMessages(mostRecent.id);
    } else {
      // Create new session if none exist
      createNewSession();
    }

    // Load accessibility settings
    const savedSettings = localStorage.getItem("accessibility_settings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setAccessibilitySettings(settings);
      } catch (e) {
        console.error("Failed to parse accessibility settings", e);
      }
    }
  }, []);

  // Save Messages to Current Session
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      localStorage.setItem(`chat_session_${currentSessionId}`, JSON.stringify(messages));
      
      // Update session title if it's "New Chat" and we have a user message
      setSessions(prev => {
        const sessionIndex = prev.findIndex(s => s.id === currentSessionId);
        if (sessionIndex !== -1 && prev[sessionIndex].title === "New Chat" && messages.length > 0 && messages[messages.length - 1].role === "user") {
          // Find first user message for title
          const firstUserMsg = messages.find(m => m.role === "user");
          if (firstUserMsg) {
             const newSessions = [...prev];
             newSessions[sessionIndex] = {
               ...newSessions[sessionIndex],
               title: firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? "..." : "")
             };
             localStorage.setItem("chat_sessions", JSON.stringify(newSessions));
             return newSessions;
          }
        }
        return prev;
      });
    }
  }, [messages, currentSessionId]);

  const loadSessionMessages = (sessionId: string) => {
    const savedMessages = localStorage.getItem(`chat_session_${sessionId}`);
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Failed to parse messages", e);
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  };

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: "New Chat",
      createdAt: Date.now()
    };
    
    setSessions(prev => {
      const updated = [newSession, ...prev];
      localStorage.setItem("chat_sessions", JSON.stringify(updated));
      return updated;
    });
    
    setCurrentSessionId(newId);
    setMessages([]);
    setIsHistoryOpen(false);
  };
  
  const switchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    loadSessionMessages(sessionId);
    setIsHistoryOpen(false);
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this chat?")) {
      const newSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(newSessions);
      localStorage.setItem("chat_sessions", JSON.stringify(newSessions));
      localStorage.removeItem(`chat_session_${sessionId}`);

      if (currentSessionId === sessionId) {
        if (newSessions.length > 0) {
            switchSession(newSessions[0].id);
        } else {
            createNewSession();
        }
      }
    }
  };

  // Auto-scroll logic
  const scrollToBottom = () => {
    if (scrollRef.current) {
      // react95 ScrollView might render a nested div for scrolling
      // We try to find the scrollable element or default to the ref itself
      const scrollableElement = scrollRef.current.querySelector('div') || scrollRef.current;
      
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        scrollableElement.scrollTop = scrollableElement.scrollHeight;
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // 연결된 서버 ID 목록 추출
    const connectedServerIds = Object.entries(connectionStatus)
      .filter(([_, status]) => status === 'connected')
      .map(([id, _]) => id);

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          connectedServerIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Network response was not ok");
      }
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage: Message = { role: "model", content: "" };

      setMessages((prev) => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        assistantMessage.content += text;

        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { ...assistantMessage };
          
          // Auto-scroll on each token update
          scrollToBottom();
          
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = error instanceof Error ? error.message : "Error sending message";
      setMessages((prev) => [
        ...prev,
        { role: "model", content: `Error: ${errorMessage}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    if (confirm("Clear all chat history?")) {
      setMessages([]);
      localStorage.removeItem("chat_history");
    }
  };

  const toggleHighContrast = () => {
    const newSettings = {
      ...accessibilitySettings,
      highContrast: !accessibilitySettings.highContrast,
    };
    setAccessibilitySettings(newSettings);
    localStorage.setItem("accessibility_settings", JSON.stringify(newSettings));
  };

  const toggleLargeText = () => {
    const newSettings = {
      ...accessibilitySettings,
      largeText: !accessibilitySettings.largeText,
    };
    setAccessibilitySettings(newSettings);
    localStorage.setItem("accessibility_settings", JSON.stringify(newSettings));
  };

  return (
    <Wrapper $highContrast={accessibilitySettings.highContrast} $largeText={accessibilitySettings.largeText}>
      <AppBar style={{ position: "fixed", top: 0, zIndex: 50, border: accessibilitySettings.highContrast ? '3px solid #FFFF00' : 'none', backgroundColor: accessibilitySettings.highContrast ? '#000000' : undefined, color: accessibilitySettings.highContrast ? '#FFFF00' : undefined }}>
        <Toolbar style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ marginLeft: "10px", fontWeight: "bold", fontSize: accessibilitySettings.largeText ? '1.125rem' : '1rem' }}>Misty</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link href="/mcp" style={{ textDecoration: 'none' }}>
              <Button style={{ display: 'flex', alignItems: 'center' }}>
                <Server size={16} style={{ marginRight: 4 }} />
                MCP
                {connectedServersCount > 0 && (
                  <span style={{ 
                    marginLeft: '4px', 
                    backgroundColor: '#00AA00', 
                    color: 'white', 
                    borderRadius: '50%', 
                    width: '16px', 
                    height: '16px', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '0.7rem'
                  }}>
                    {connectedServersCount}
                  </span>
                )}
              </Button>
            </Link>
            <Button onClick={() => setIsSettingsOpen(!isSettingsOpen)} style={{ display: 'flex', alignItems: 'center' }}>
              <Settings size={16} style={{ marginRight: 4 }} />
              접근성
            </Button>
          </div>
        </Toolbar>
      </AppBar>

      {isSettingsOpen && (
        <SettingsWindow $highContrast={accessibilitySettings.highContrast} $largeText={accessibilitySettings.largeText}>
          <WindowHeader style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>접근성 설정</span>
            <Button size="sm" square onClick={() => setIsSettingsOpen(false)}>
              <X size={12} />
            </Button>
          </WindowHeader>
          <SettingsContent $largeText={accessibilitySettings.largeText}>
            <SettingRow $largeText={accessibilitySettings.largeText}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Eye size={20} />
                <span>고대비 모드</span>
              </div>
              <Button 
                onClick={toggleHighContrast}
                active={accessibilitySettings.highContrast}
              >
                {accessibilitySettings.highContrast ? "켜짐" : "꺼짐"}
              </Button>
            </SettingRow>
            <SettingRow $largeText={accessibilitySettings.largeText}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Type size={20} />
                <span>큰글씨 모드</span>
              </div>
              <Button 
                onClick={toggleLargeText}
                active={accessibilitySettings.largeText}
              >
                {accessibilitySettings.largeText ? "켜짐" : "꺼짐"}
              </Button>
            </SettingRow>
            <Divider style={{ margin: "1rem 0" }} />
            <div style={{ fontSize: accessibilitySettings.largeText ? '0.875rem' : '0.75rem', color: '#666', lineHeight: '1.5' }}>
              <p>• 고대비 모드: 색상 대비를 높여 가독성을 향상시킵니다.</p>
              <p>• 큰글씨 모드: 텍스트 크기와 간격을 늘려 읽기 편하게 합니다.</p>
            </div>
          </SettingsContent>
        </SettingsWindow>
      )}

      <SidebarContainer className="window" $highContrast={accessibilitySettings.highContrast} $largeText={accessibilitySettings.largeText}>
        <WindowHeader className="window-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>History</span>
        </WindowHeader>
        <WindowContent style={{ flex: 1, padding: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Button fullWidth onClick={createNewSession} style={{ marginBottom: "0.5rem" }}>
                <Plus size={16} style={{ marginRight: 8 }} />
                New Chat
            </Button>
            <ScrollView style={{ flex: 1, background: "white", overflowX: "hidden" }}>
                {sessions.length === 0 ? (
                    <div style={{ padding: "1rem", textAlign: "center", color: "#888" }}>No history</div>
                ) : (
                    <List>
                        {sessions.map(session => (
                            <ListItem 
                                key={session.id} 
                                style={{ 
                                    cursor: "pointer", 
                                    backgroundColor: currentSessionId === session.id ? "#000080" : "transparent",
                                    color: currentSessionId === session.id ? "white" : "black",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}
                                onClick={() => switchSession(session.id)}
                            >
                                <div style={{ display: "flex", alignItems: "center", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", flex: 1, minWidth: 0 }}>
                                    <MessageSquare size={14} style={{ marginRight: "8px", flexShrink: 0 }} />
                                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{session.title}</span>
                                </div>
                                <Button 
                                    size="sm" 
                                    square 
                                    onClick={(e) => deleteSession(session.id, e)}
                                    style={{ marginLeft: "8px", flexShrink: 0 }}
                                >
                                    <Trash2 size={12} />
                                </Button>
                            </ListItem>
                        ))}
                    </List>
                )}
            </ScrollView>
        </WindowContent>
      </SidebarContainer>

      <ChatWindow className="window" $highContrast={accessibilitySettings.highContrast} $largeText={accessibilitySettings.largeText}>
        <WindowHeader className="window-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AvatarImage 
              src="/ktng-logo.png" 
              alt="KT&G" 
              width="16" 
              height="16"
            />
            <span>AI Chat.exe</span>
          </div>
          <div style={{ display: "flex" }}>
            <Button size="sm" square>
              <Minus size={12} />
            </Button>
            <Button size="sm" square>
              <Square size={10} />
            </Button>
            <Button size="sm" square onClick={handleClear}>
              <X size={12} />
            </Button>
          </div>
        </WindowHeader>
        
        <ChatContent>
          <MessageList ref={scrollRef} style={{ height: "100%", maxHeight: "500px" }}>
            {messages.length === 0 && (
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%', 
                    opacity: 0.5 
                }}>
                    <AvatarImage 
                      src="/ktng-logo.png" 
                      alt="KT&G" 
                      width="48" 
                      height="48"
                      style={{ marginBottom: '1rem' }}
                    />
                    <p>Welcome to Misty</p>
                    <p>Type a message to start...</p>
                </div>
            )}
            
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} $isUser={msg.role === "user"} $largeText={accessibilitySettings.largeText}>
                {msg.role === "user" ? (
                  <>
                    <MessageContentWrapper $isUser={true}>
                      <BubbleContent $isUser={true} $highContrast={accessibilitySettings.highContrast} $largeText={accessibilitySettings.largeText}>
                        {msg.content}
                      </BubbleContent>
                    </MessageContentWrapper>
                    <AvatarSVG $width="32px" $height="32px">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                        <path d="M12 8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </AvatarSVG>
                  </>
                ) : (
                  <>
                    <AvatarImage 
                      src="/ktng-logo.png" 
                      alt="KT&G" 
                      width="32" 
                      height="32"
                    />
                    <MessageContentWrapper $isUser={false}>
                      <BubbleContent $isUser={false} $highContrast={accessibilitySettings.highContrast} $largeText={accessibilitySettings.largeText}>
                        <MarkdownRenderer 
                          content={msg.content} 
                          highContrast={accessibilitySettings.highContrast}
                          largeText={accessibilitySettings.largeText}
                        />
                      </BubbleContent>
                    </MessageContentWrapper>
                  </>
                )}
              </MessageBubble>
            ))}
            
            {isLoading && messages[messages.length - 1]?.role !== "model" && (
                <div style={{ padding: '1rem', textAlign: 'center' }}>
                    Processing...
                </div>
            )}
          </MessageList>
          
          <Footer $largeText={accessibilitySettings.largeText}>
            <TextField 
                fullWidth
                placeholder="Type your message here..."
                value={input}
                onChange={(e: any) => setInput(e.target.value)}
                onKeyDown={(e: any) => {
                    if (e.key === 'Enter') handleSend();
                }}
                disabled={isLoading}
                style={{ fontSize: accessibilitySettings.largeText ? '1.125rem' : '1rem' }}
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()} style={{ minWidth: accessibilitySettings.largeText ? '100px' : '80px', fontSize: accessibilitySettings.largeText ? '1.125rem' : '1rem' }}>
                Send <Send size={accessibilitySettings.largeText ? 18 : 14} style={{ marginLeft: '4px' }} />
            </Button>
          </Footer>
        </ChatContent>
        
        <div style={{ padding: '0.25rem', borderTop: '2px solid #dfdfdf', fontSize: '0.8rem', display: 'flex', gap: '1rem' }}>
            <span>Powered by Gemini 2.5 Flash</span>
            <Divider orientation="vertical" size="16px" />
            <span>Ready</span>
        </div>
      </ChatWindow>
    </Wrapper>
  );
}
