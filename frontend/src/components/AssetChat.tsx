'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle, Activity, BarChart2 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { OnChainAsset } from '@/types/asset';

interface ChartDataPoint {
  name: string;
  value: number;
}

interface ChartData {
  type: 'bar' | 'line' | 'none';
  title: string;
  data: ChartDataPoint[];
  x_key: string;
  y_key: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  chart?: ChartData;
  isError?: boolean;
  suggestions?: string[];
}

const SUGGESTED_PROMPTS = [
  "Graph power consumption over time",
  "Why did the net yield drop recently?",
  "Show me the temperature trends",
  "Is this asset operating normally?"
];

export function AssetChat({ asset }: { asset: OnChainAsset | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (asset) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hi! I am the Veridian AI Intelligence for ${asset.name}. I am connected directly to this asset's live telemetry stream and historical yield data on the blockchain. How can I help you analyze its performance today?`,
          suggestions: SUGGESTED_PROMPTS
        }
      ]);
    } else {
      setMessages([]);
    }
  }, [asset?.address]);

  const handleSend = async (forcedInput?: string) => {
    const textToSend = forcedInput || input;
    if (!textToSend.trim() || !asset) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!forcedInput) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`http://127.0.0.1:8000/chat/${asset.address}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userMessage.content })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to get response from AI');
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        chart: data.chart?.type !== 'none' ? data.chart : undefined,
        suggestions: data.suggestions
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev, 
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: err.message || 'Connection to AI Intelligence core lost. Please verify backend connectivity.',
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChart = (chart: ChartData) => {
    if (!chart || chart.type === 'none' || !chart.data || chart.data.length === 0) return null;

    return (
      <div className="chat-msg" style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: 'inset 0 2px 20px rgba(255,255,255,0.02)' }}>
        <div style={{ marginBottom: '1.5rem', fontSize: '0.95rem', color: '#ffffff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          <BarChart2 size={18} color="var(--color-primary)" />
          {chart.title}
        </div>
        <div style={{ width: '100%', height: 260, minHeight: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            {chart.type === 'bar' ? (
              <BarChart data={chart.data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: 'rgba(15,15,15,0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(118,185,0,0.3)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', color: '#fff' }}
                  itemStyle={{ color: 'var(--color-primary)', fontWeight: 600 }}
                />
                <Bar dataKey="value" fill="url(#colorUv)" radius={[6, 6, 0, 0]} maxBarSize={45}>
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={1}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                    </linearGradient>
                  </defs>
                </Bar>
              </BarChart>
            ) : (
              <LineChart data={chart.data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(15,15,15,0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(118,185,0,0.3)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', color: '#fff' }}
                  itemStyle={{ color: 'var(--color-primary)', fontWeight: 600 }}
                />
                <Line type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={4} dot={{ r: 5, fill: '#1a1a1a', strokeWidth: 2, stroke: 'var(--color-primary)' }} activeDot={{ r: 8, fill: 'var(--color-primary)', stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  if (!asset) {
    return (
      <div style={{ padding: '2rem', height: '650px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} /> Select an asset to initialize Intelligence Core.
        </p>
      </div>
    );
  }

  return (
    <div
      className="glass-card chat-card"
      style={{
        borderRadius: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >


      {/* ── HEADER (fixed height, never shrinks) ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flexShrink: 0,
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,128,128,0.15)', border: '1px solid rgba(118,185,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Activity size={24} color="var(--color-primary)" />
        </div>
        <div>
          <h3 style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.15rem', letterSpacing: '0.5px', margin: 0 }}>{asset.name} Intelligence</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Live Telemetry Sync Active</span>
          </div>
        </div>
      </div>

      {/* ── MESSAGES (scrollable, takes all remaining space) ── */}
      <div
        className="chat-scrollbar chat-messages-area"
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        {messages.map((msg, idx) => (
          <div key={msg.id} className="chat-msg" style={{ display: 'flex', gap: '16px', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
            {msg.role === 'assistant' && (
              <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(118,185,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
                <Bot size={18} color="var(--color-primary)" />
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '60ch' }}>
              <div style={{ 
                padding: '1.25rem', 
                borderRadius: '16px',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                background: msg.role === 'user' ? 'var(--color-primary)' : msg.isError ? 'rgba(255, 50, 50, 0.1)' : 'rgba(255, 255, 255, 0.08)',
                border: msg.role === 'assistant' ? ('1px solid ' + (msg.isError ? 'rgba(255, 50, 50, 0.3)' : 'rgba(255, 255, 255, 0.15)')) : 'none',
                boxShadow: msg.role === 'user' ? 'none' : '0 4px 15px rgba(0,0,0,0.2)',
                color: msg.role === 'user' ? '#ffffff' : 'rgba(255,255,255,0.9)',
                fontWeight: msg.role === 'user' ? 500 : 400,
                backdropFilter: 'blur(10px)',
                lineHeight: 1.6,
                fontSize: '0.95rem',
                letterSpacing: '0.2px'
              }}>
                {msg.isError && <AlertCircle size={18} color="#ff4444" style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }}/>}
                {msg.content}
              </div>
              
              {msg.chart && renderChart(msg.chart)}
            </div>
            
            {msg.role === 'user' && (
              <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
                <User size={18} color="#ffffff" />
              </div>
            )}
          </div>
        ))}

        {!isLoading && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].suggestions && (
          <div className="chat-msg" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', animationDelay: '0.4s', justifyContent: 'flex-start' }}>
            {messages[messages.length - 1].suggestions?.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '100px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(10px)',
                  fontWeight: 500
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(118, 185, 0, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(118, 185, 0, 0.4)';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(118, 185, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="chat-msg" style={{ display: 'flex', gap: '16px', alignSelf: 'flex-start' }}>
            <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(118,185,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
              <Bot size={18} color="var(--color-primary)" />
            </div>
            <div style={{ padding: '1.25rem', borderRadius: '16px', borderTopLeftRadius: '4px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '12px', backdropFilter: 'blur(10px)' }}>
              <Loader2 size={18} className="animate-spin" color="var(--color-primary)" /> 
              <span style={{ fontSize: '0.95rem', letterSpacing: '0.5px' }}>Analyzing telemetry nodes...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── INPUT FOOTER (fixed height, pinned to bottom, never shrinks) ── */}
      <div
        className="chat-input-footer"
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '16px 24px',
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          style={{ display: 'flex', gap: '12px', margin: 0 }}
        >
          <input 
            type="text"
            className="neon-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about yield performance, telemetry trends..."
            style={{ 
              flex: 1, 
              padding: '1rem 1.5rem', 
              borderRadius: '100px', 
              backgroundColor: 'rgba(255, 255, 255, 0.1)', 
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'all 0.3s ease',
              fontSize: '0.95rem',
              letterSpacing: '0.3px'
            }}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            style={{ 
              borderRadius: '100px', 
              width: 52, 
              height: 52, 
              padding: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: (!input.trim() || isLoading) ? 'rgba(255,255,255,0.15)' : 'var(--color-primary)',
              color: (!input.trim() || isLoading) ? 'rgba(255,255,255,0.5)' : '#ffffff',
              border: 'none',
              cursor: (!input.trim() || isLoading) ? 'not-allowed' : 'pointer',
              boxShadow: 'none',
              transition: 'all 0.3s ease',
              flexShrink: 0
            }}
          >
            <Send size={20} style={{ marginLeft: '2px' }} />
          </button>
        </form>
      </div>
    </div>
  );
}
