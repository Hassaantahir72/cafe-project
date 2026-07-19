'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Coffee, Minimize2, Bot, ChevronDown } from 'lucide-react';
import { chatAPI } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { label: '☕ Menu',        msg: 'What are your most popular items?' },
  { label: '📅 Book Table',  msg: 'I would like to book a table' },
  { label: '📦 Track Order', msg: 'I want to track my order' },
  { label: '⏰ Hours',       msg: 'What are your opening hours?' },
];

export default function Chatbot() {
  const [open, setOpen]           = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages]   = useState<Message[]>([{
    role: 'assistant',
    content: "☕ Welcome to Brewed Awakening! I'm your cafe assistant. I can help you explore our menu, book a table, track your order, or answer any questions. How can I help you today?",
    timestamp: new Date(),
  }]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId]           = useState(() => 'sess_' + Math.random().toString(36).slice(2));
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open && !minimized) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open, minimized]);

  // Lock body scroll on mobile when chat is open
  useEffect(() => {
    if (isMobile && open && !minimized) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, open, minimized]);

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content, timestamp: new Date() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const apiMsgs = updated.map(m => ({ role: m.role, content: m.content }));
      const { data } = await chatAPI.send(apiMsgs, sessionId);
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having a moment! Please try again or call us at +1 (555) 123-4567 ☕",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleClose = () => { setOpen(false); setMinimized(false); };
  const handleToggle = () => { setOpen(o => !o); setMinimized(false); };

  // ── Mobile: full-screen overlay ────────────────────────
  if (isMobile) {
    return (
      <>
        {/* Full-screen chat on mobile */}
        {open && (
          <div className="fixed inset-0 z-50 flex flex-col bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-warm-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-cafe-500 rounded-full flex items-center justify-center shrink-0">
                  <Coffee className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Cafe Assistant</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <p className="text-warm-400 text-xs">Online now</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-xl bg-warm-800 hover:bg-warm-700 text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 bg-cafe-100 rounded-full flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-3.5 h-3.5 text-cafe-600" />
                    </div>
                  )}
                  <div className={`max-w-[80%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-cafe-500 text-white rounded-tr-sm'
                        : 'bg-warm-50 text-warm-800 rounded-tl-sm border border-warm-100'
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-xs text-warm-400 px-1">{fmt(msg.timestamp)}</span>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-2 items-start">
                  <div className="w-7 h-7 bg-cafe-100 rounded-full flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-cafe-600" />
                  </div>
                  <div className="bg-warm-50 border border-warm-100 px-4 py-3 rounded-2xl rounded-tl-sm">
                    <div className="flex gap-1">
                      {[0,1,2].map(j => (
                        <span key={j} className="w-2 h-2 bg-cafe-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${j * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick actions */}
            {messages.length <= 2 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2 bg-white border-t border-warm-100 pt-3 shrink-0">
                {QUICK_ACTIONS.map(a => (
                  <button key={a.label} onClick={() => sendMessage(a.msg)}
                    className="text-xs bg-cafe-50 hover:bg-cafe-100 text-cafe-700 px-3 py-2 rounded-full border border-cafe-200 transition-colors font-medium active:scale-95">
                    {a.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-warm-100 bg-white shrink-0" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-3 rounded-xl border border-warm-200 focus:outline-none focus:ring-2 focus:ring-cafe-300 text-sm bg-warm-50"
                  disabled={loading}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="w-12 h-12 bg-cafe-500 hover:bg-cafe-600 disabled:opacity-40 text-white rounded-xl transition-colors flex items-center justify-center active:scale-95 shrink-0">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating button — only when chat is closed */}
        {!open && (
          <button
            onClick={handleToggle}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-warm-900 hover:bg-cafe-600 text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95">
            <MessageCircle className="w-6 h-6" />
          </button>
        )}
      </>
    );
  }

  // ── Desktop: floating window ────────────────────────────
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat window */}
      {open && (
        <div className={`mb-4 w-96 bg-white rounded-2xl shadow-2xl border border-warm-100 flex flex-col transition-all duration-300 origin-bottom-right ${
          minimized ? 'h-14' : 'h-[540px]'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-warm-900 rounded-t-2xl shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-cafe-500 rounded-full flex items-center justify-center">
                <Coffee className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Cafe Assistant</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-warm-400 text-xs">Online now</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMinimized(m => !m)}
                className="p-1.5 rounded-lg hover:bg-warm-800 text-warm-400 hover:text-white transition-colors">
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-warm-800 text-warm-400 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 bg-cafe-100 rounded-full flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-3.5 h-3.5 text-cafe-600" />
                      </div>
                    )}
                    <div className={`max-w-[75%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-cafe-500 text-white rounded-tr-sm'
                          : 'bg-warm-50 text-warm-800 rounded-tl-sm border border-warm-100'
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-xs text-warm-400 px-1">{fmt(msg.timestamp)}</span>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2 items-start">
                    <div className="w-7 h-7 bg-cafe-100 rounded-full flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-cafe-600" />
                    </div>
                    <div className="bg-warm-50 border border-warm-100 px-4 py-3 rounded-2xl rounded-tl-sm">
                      <div className="flex gap-1">
                        {[0,1,2].map(j => (
                          <span key={j} className="w-1.5 h-1.5 bg-cafe-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${j * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick actions */}
              {messages.length <= 2 && (
                <div className="px-4 pb-2 flex flex-wrap gap-2 shrink-0">
                  {QUICK_ACTIONS.map(a => (
                    <button key={a.label} onClick={() => sendMessage(a.msg)}
                      className="text-xs bg-cafe-50 hover:bg-cafe-100 text-cafe-700 px-3 py-1.5 rounded-full border border-cafe-200 transition-colors font-medium">
                      {a.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-warm-100 shrink-0">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Ask me anything..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-warm-200 focus:outline-none focus:ring-2 focus:ring-cafe-300 text-sm bg-warm-50"
                    disabled={loading}
                  />
                  <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                    className="p-2.5 bg-cafe-500 hover:bg-cafe-600 disabled:opacity-40 text-white rounded-xl transition-colors active:scale-95">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={handleToggle}
        className="w-14 h-14 bg-warm-900 hover:bg-cafe-600 text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95">
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
