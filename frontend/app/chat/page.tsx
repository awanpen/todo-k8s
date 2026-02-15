"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { betterAuthWrapper } from "@/lib/auth-wrapper";
import { api } from '@/lib/api';
import Navigation from "@/components/Navigation";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { prepareForSpeech } from "@/lib/text-utils";

interface Message {
  id?: number;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

interface Conversation {
  id: number;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export default function ChatPage() {
  const router = useRouter();
  const { data: session, isPending } = betterAuthWrapper.useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);

  // Fix hydration issues by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Voice recognition hook
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported: isVoiceSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition({
    continuous: false,
    interimResults: true,
    onResult: (text, isFinal) => {
      if (isFinal) {
        setInputMessage(text);
        // Automatically stop after getting final result
        stopListening();
      }
    },
    onError: (error) => {
      console.error('Voice recognition error:', error);
      // Only show alert for actual errors (not aborted)
      if (error && !error.includes('aborted')) {
        alert(error);
      }
    },
  });

  // Text-to-speech hook
  const { speak, cancel: cancelSpeech, isSpeaking, isSupported: isTTSSupported } = useTextToSpeech();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      loadConversations();
    }
  }, [session]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Smooth scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadConversation = async (convId: number) => {
    try {
      setLoading(true);
      const data = await api.getConversation(convId);
      setMessages(data.messages as Message[]);
      setConversationId(convId);
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setInputMessage("");
  };

  const deleteConversation = async (convId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent loading the conversation when clicking delete
    
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      await api.deleteConversation(convId);
      
      // If the deleted conversation is currently open, start a new one
      if (conversationId === convId) {
        startNewConversation();
      }
      
      // Reload conversations list
      loadConversations();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      // Clear any previous transcript and start fresh
      setInputMessage('');
      resetTranscript();
      startListening();
    }
  };

  const toggleTextToSpeech = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
    if (isSpeaking) {
      cancelSpeech();
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: inputMessage,
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = inputMessage;
    setInputMessage("");
    setLoading(true);
    resetTranscript();

    // Don't minimize - it causes scroll issues
    // Keep input expanded for better UX
    /* 
    // Minimize input after sending
    setIsInputMinimized(true);
    
    // Auto-expand after 3 seconds
    if (minimizeTimeoutRef.current) {
      clearTimeout(minimizeTimeoutRef.current);
    }
    minimizeTimeoutRef.current = setTimeout(() => {
      setIsInputMinimized(false);
    }, 3000);
    */

    try {
      const data = await api.sendChatMessage(messageToSend, conversationId || undefined);

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setConversationId(data.conversation_id);

      // Speak the response if voice is enabled
      if (isVoiceEnabled && isTTSSupported) {
        // Clean the text by removing emojis, icons, and markdown before speaking
        const cleanText = prepareForSpeech(data.message);
        speak(cleanText);
      }

      // Reload conversations to update the list
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted || isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-terminal-bg">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded border-2 border-neon-cyan mb-4 animate-pulse-glow bg-terminal-bgLight">
            <svg
              className="animate-spin h-8 w-8 text-neon-cyan"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <p className="text-neon-green font-mono">{'>'} Initializing Chatbot...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-terminal-bg relative overflow-hidden">
      {/* Matrix-style background effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-neon-green to-transparent animate-matrix-rain" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-neon-cyan to-transparent animate-matrix-rain" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-neon-green to-transparent animate-matrix-rain" style={{ animationDelay: '4s' }}></div>
      </div>

      <Navigation />

      <div className="container mx-auto px-4 py-6 h-[calc(100vh-5rem)] relative z-10">
        <div className="flex gap-4 h-full">
          {/* Sidebar */}
          <div
            className={`${
              showSidebar ? "w-80" : "w-0"
            } transition-all duration-300 overflow-hidden`}
          >
            <div className="bg-terminal-bgLight/80 backdrop-blur-xl rounded-lg shadow-[0_0_15px_rgba(0,255,65,0.3)] h-full flex flex-col border border-neon-green/30">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-neon-green/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-neon-green font-terminal flex items-center gap-2">
                    <span className="animate-pulse">{'>'}</span>
                    <span className="font-mono">SESSIONS</span>
                  </h2>
                  <button
                    onClick={startNewConversation}
                    className="p-2 bg-neon-green/10 text-neon-green rounded border border-neon-green/50 hover:bg-neon-green/20 hover:shadow-[0_0_10px_rgba(0,255,65,0.5)] transition-all transform hover:scale-105"
                    title="New Session"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto p-4">
                {loadingConversations ? (
                  <div className="text-center text-neon-cyan py-8">
                    <div className="animate-spin mx-auto w-8 h-8 border-4 border-neon-cyan border-t-transparent rounded-full shadow-[0_0_10px_rgba(0,255,255,0.5)]"></div>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center text-neon-green/60 py-8 font-mono">
                    <p className="text-sm">[NO SESSIONS FOUND]</p>
                    <p className="text-xs mt-2">{'> '} Initialize new session...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`relative group rounded border transition-all ${
                          conversationId === conv.id
                            ? "bg-neon-green/20 border-neon-green text-neon-green shadow-[0_0_15px_rgba(0,255,65,0.3)]"
                            : "bg-terminal-border/30 border-neon-green/20 text-neon-green/80 hover:bg-neon-green/10 hover:border-neon-green/40"
                        }`}
                      >
                        <button
                          onClick={() => loadConversation(conv.id)}
                          className="w-full text-left p-3 font-mono"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">
                              {'> '} SESSION_{conv.id.toString().padStart(3, '0')}
                            </div>
                            <div className="text-xs opacity-75">
                              [{conv.message_count}]
                            </div>
                          </div>
                          <div className="text-xs opacity-60 mt-1">
                            {new Date(conv.updated_at).toLocaleString()}
                          </div>
                        </button>
                        <button
                          onClick={(e) => deleteConversation(conv.id, e)}
                          className={`absolute top-2 right-2 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                            conversationId === conv.id
                              ? "bg-neon-pink/20 hover:bg-neon-pink/30 text-neon-pink border border-neon-pink/50"
                              : "bg-neon-pink/10 hover:bg-neon-pink/20 text-neon-pink border border-neon-pink/30"
                          }`}
                          title="Delete session"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 bg-terminal-bgLight/80 backdrop-blur-xl rounded-lg shadow-[0_0_20px_rgba(0,255,65,0.2)] flex flex-col border border-neon-cyan/30">
            {/* Chat Header */}
            <div className="p-4 border-b border-neon-cyan/30 bg-gradient-to-r from-neon-green/10 to-neon-cyan/10 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="p-2 bg-neon-green/10 hover:bg-neon-green/20 rounded border border-neon-green/50 transition-all hover:shadow-[0_0_10px_rgba(0,255,65,0.5)]"
                  >
                    <svg className="w-5 h-5 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <div>
                    <h1 className="text-xl font-bold text-neon-cyan flex items-center gap-2 font-terminal">
                      <span className="text-2xl">⚡</span>
                      <span className="font-mono">CHATBOT</span>
                    </h1>
                    <p className="text-sm text-neon-green/70 font-mono">
                      {'>'} Powered by Llama-3.3-70B
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-neon-green/10 border border-neon-green/50 rounded px-3 py-1">
                    <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse shadow-[0_0_5px_rgba(0,255,65,0.8)]"></div>
                    <span className="text-sm text-neon-green font-mono font-medium">ONLINE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-terminal-bg/50">
              {messages.length === 0 ? (
                <div className="text-center py-12 animate-fadeIn">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded border-2 border-neon-cyan mb-6 shadow-[0_0_20px_rgba(0,255,255,0.5)] bg-terminal-bgLight animate-pulse-glow">
                    <span className="text-4xl">⚡</span>
                  </div>
                  <h2 className="text-2xl font-bold text-neon-cyan mb-4 font-terminal">
                    {'>'} SYSTEM READY
                  </h2>
                  <p className="text-neon-green/70 mb-6 max-w-md mx-auto font-mono text-sm">
                    [AI AGENT INITIALIZED] - Enter command or select option:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {[
                      { icon: "📋", text: "list tasks", cmd: "LIST_TASKS" },
                      { icon: "➕", text: "create new task", cmd: "CREATE_TASK" },
                      { icon: "✏️", text: "update task", cmd: "UPDATE_TASK" },
                      { icon: "🗑️", text: "delete task", cmd: "DELETE_TASK" },
                    ].map((example, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInputMessage(example.text)}
                        className="p-4 bg-terminal-bgLight/80 rounded border border-neon-green/30 hover:border-neon-green hover:shadow-[0_0_15px_rgba(0,255,65,0.4)] transition-all transform hover:scale-105 text-left group"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{example.icon}</span>
                          <span className="text-xs text-neon-cyan/70 font-mono">[{example.cmd}]</span>
                        </div>
                        <span className="text-sm font-mono text-neon-green group-hover:text-neon-cyan transition-colors">
                          {'> '}{example.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    } animate-fadeIn`}
                  >
                    <div
                      className={`max-w-[75%] rounded border px-5 py-3 font-mono text-sm ${
                        msg.role === "user"
                          ? "bg-neon-cyan/10 border-neon-cyan text-neon-cyan shadow-[0_0_10px_rgba(0,255,255,0.3)]"
                          : "bg-terminal-bgLight/80 backdrop-blur-sm border-neon-green/40 text-neon-green shadow-[0_0_10px_rgba(0,255,65,0.2)]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {msg.role === "assistant" && (
                          <div className="flex-shrink-0 w-8 h-8 rounded border border-neon-green flex items-center justify-center text-neon-green font-bold bg-neon-green/10 shadow-[0_0_5px_rgba(0,255,65,0.5)]">
                            AI
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="whitespace-pre-wrap break-words leading-relaxed">
                            {msg.role === "assistant" && <span className="text-neon-green/70">{'> '}</span>}
                            {msg.content}
                          </p>
                        </div>
                        {msg.role === "user" && (
                          <div className="flex-shrink-0 w-8 h-8 rounded border border-neon-cyan flex items-center justify-center text-neon-cyan font-bold bg-neon-cyan/10 shadow-[0_0_5px_rgba(0,255,255,0.5)]">
                            {session.user.name?.[0]?.toUpperCase() || "U"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {loading && (
                <div className="flex justify-start animate-fadeIn">
                  <div className="bg-terminal-bgLight/80 backdrop-blur-sm rounded border border-neon-green/40 px-5 py-3 shadow-[0_0_10px_rgba(0,255,65,0.2)]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded border border-neon-green flex items-center justify-center text-neon-green font-bold bg-neon-green/10 shadow-[0_0_5px_rgba(0,255,65,0.5)] font-mono">
                        AI
                      </div>
                      <div className="flex space-x-2 font-mono text-neon-green">
                        <span className="animate-pulse">{'>'}</span>
                        <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>Processing</span>
                        <div className="flex space-x-1">
                          <span className="animate-bounce">.</span>
                          <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>.</span>
                          <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Fixed at bottom */}
            <div 
              ref={inputAreaRef}
              className="p-4 border-t border-neon-cyan/30 bg-terminal-bgLight/90 backdrop-blur-sm"
            >
              <form onSubmit={sendMessage} className="flex flex-col gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-3 text-neon-green font-mono text-sm">{'>'}</span>
                  <textarea
                    value={inputMessage || interimTranscript}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e);
                      }
                    }}
                    onFocus={(e) => e.target.rows = 4}
                    onBlur={(e) => !e.target.value && (e.target.rows = 1)}
                    placeholder={isListening ? "Listening..." : "Enter command... (Shift+Enter for new line)"}
                    rows={1}
                    className="w-full pl-8 pr-4 py-3 bg-terminal-bg/50 border border-neon-green/30 rounded text-neon-green font-mono focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_15px_rgba(0,255,65,0.3)] resize-none placeholder-neon-green/30 transition-all focus:min-h-[100px]"
                    disabled={loading || isListening}
                  />
                  {isListening && (
                    <div className="absolute right-3 top-3 flex items-center gap-2">
                      <span className="text-neon-pink text-xs font-mono animate-pulse">Recording...</span>
                      <div className="w-2 h-2 bg-neon-pink rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>

                {/* Action Buttons Row */}
                <div className="flex gap-2">
                  {/* Voice Input Button */}
                  {isVoiceSupported && (
                    <button
                      type="button"
                      onClick={toggleVoiceInput}
                      disabled={loading}
                      className={`px-3 py-2 border rounded transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-mono font-semibold flex items-center gap-2 text-sm ${
                        isListening
                          ? 'bg-neon-pink/20 text-neon-pink border-neon-pink shadow-[0_0_20px_rgba(255,20,147,0.5)] animate-pulse'
                          : 'bg-neon-green/20 text-neon-green border-neon-green hover:bg-neon-green/30 hover:shadow-[0_0_20px_rgba(0,255,65,0.5)]'
                      }`}
                      title={isListening ? "Stop recording" : "Start voice input"}
                    >
                      {isListening ? (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="6" width="12" height="12" rx="1" />
                          </svg>
                          <span className="hidden sm:inline">STOP</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                          <span className="hidden sm:inline">MIC</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Text-to-Speech Toggle */}
                  {isTTSSupported && (
                    <button
                      type="button"
                      onClick={toggleTextToSpeech}
                      disabled={loading}
                      className={`px-3 py-2 border rounded transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-mono font-semibold flex items-center gap-2 text-sm ${
                        isVoiceEnabled
                          ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan shadow-[0_0_20px_rgba(0,255,255,0.5)]'
                          : 'bg-terminal-border/20 text-neon-green/50 border-terminal-border hover:bg-neon-cyan/10 hover:border-neon-cyan/50'
                      }`}
                      title={isVoiceEnabled ? "Disable voice responses" : "Enable voice responses"}
                    >
                      {isSpeaking ? (
                        <>
                          <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                          </svg>
                          <span className="hidden sm:inline">SPEAKING</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d={isVoiceEnabled 
                              ? "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
                              : "M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"
                            }/>
                          </svg>
                          <span className="hidden sm:inline">{isVoiceEnabled ? 'TTS' : 'TTS'}</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Execute Button */}
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || loading}
                    className="flex-1 px-4 py-2 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan rounded hover:bg-neon-cyan/30 hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] disabled:bg-terminal-border/20 disabled:border-terminal-border disabled:text-neon-green/30 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 disabled:transform-none font-mono font-semibold flex items-center gap-2 justify-center text-sm"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>SENDING</span>
                      </>
                    ) : (
                      <>
                        <span>EXECUTE</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
              <p className="text-xs text-neon-green/50 mt-2 text-center font-mono">
                {isVoiceSupported && '[MIC] for voice input • '}[ENTER] to execute • [SHIFT+ENTER] for new line
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
