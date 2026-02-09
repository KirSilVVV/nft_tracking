// AIInsights - AI-powered analytics and predictive signals (ATLAS Design)

import React, { useState, useEffect, useRef } from 'react';
import '../styles/ai-insights.css';

interface ChatMessage {
  type: 'ai' | 'user';
  text: string;
}

const AIInsights: React.FC = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      type: 'ai',
      text: "Hi! I'm your AI analytics assistant. I can answer questions about whale behavior, price trends, and collection metrics. What would you like to know about <span class='hl'>MAYC</span>?"
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [aiInput, setAiInput] = useState('');
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  const sendChat = () => {
    if (!chatInput.trim()) return;

    setChatMessages(prev => [...prev, { type: 'user', text: chatInput }]);
    setChatInput('');

    // Simulate AI response
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          type: 'ai',
          text: "Based on my analysis of on-chain data, <strong>whale accumulation is accelerating</strong>. In the last 7 days, the top 10 holders collectively added <span class='hl'>+47 MAYC</span> to their positions."
        }
      ]);
    }, 1500);
  };

  const fillQuestion = (question: string) => {
    setAiInput(question);
  };

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Generate mini bar charts
  useEffect(() => {
    const generateBars = (id: string, values: number[], color: string) => {
      const container = document.getElementById(id);
      if (!container) return;

      container.innerHTML = '';
      const max = Math.max(...values);
      values.forEach(v => {
        const bar = document.createElement('div');
        bar.className = 'mini-bar';
        bar.style.height = (v / max * 100) + '%';
        bar.style.background = color;
        bar.style.opacity = String(0.4 + (v / max) * 0.6);
        container.appendChild(bar);
      });
    };

    generateBars('accBars', [32, 28, 35, 41, 38, 45, 52, 48, 55, 60, 58, 65, 70, 72], 'var(--ok)');
    generateBars('convBars', [80, 82, 79, 83, 81, 82, 84, 80, 82, 83, 81, 82, 83, 82], 'var(--gold)');
    generateBars('liqBars', [90, 88, 85, 82, 78, 75, 80, 77, 73, 70, 72, 68, 65, 63], 'var(--no)');
  }, []);

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>AI-Powered Insights</h1>
          <div className="page-header-sub">Natural language analytics, trend detection, and predictive signals for your tracked collections</div>
        </div>
        <div className="ai-powered-badge">
          <span className="pulse"></span> AI Engine Active
        </div>
      </div>

      {/* AI Ask Bar */}
      <div className="ai-ask ai-glow">
        <div className="ai-ask-label">🤖 Ask AI anything about your collections</div>
        <div className="ai-ask-row">
          <input
            className="ai-ask-input"
            type="text"
            placeholder="e.g., Are whales accumulating MAYC this week? What's the sentiment?"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && aiInput.trim()) {
                setChatMessages(prev => [...prev, { type: 'user', text: aiInput }]);
                setAiInput('');
              }
            }}
          />
          <button className="ai-ask-btn" onClick={() => {
            if (aiInput.trim()) {
              setChatMessages(prev => [...prev, { type: 'user', text: aiInput }]);
              setAiInput('');
            }
          }}>
            ✨ Ask AI
          </button>
        </div>
        <div className="ai-ask-suggestions">
          <button className="ai-suggest" onClick={() => fillQuestion('Who are the top accumulators this week?')}>
            Who are the top accumulators this week?
          </button>
          <button className="ai-suggest" onClick={() => fillQuestion('Is MAYC floor likely to rise?')}>
            Is MAYC floor likely to rise?
          </button>
          <button className="ai-suggest" onClick={() => fillQuestion('Summarize whale behavior last 7 days')}>
            Summarize whale behavior last 7 days
          </button>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="insights-grid">
        {/* Daily Brief */}
        <div className="daily-brief">
          <div className="brief-header">
            <h3>📋 Daily Intelligence Brief</h3>
            <div className="brief-time">🕐 Updated 12 min ago · Feb 9, 2026</div>
          </div>
          <div className="brief-body">
            <div className="brief-text">
              <p style={{ marginBottom: '12px' }}>
                <strong>MAYC Market Overview:</strong> The collection is experiencing a <span className="positive">moderately bullish</span> phase. Floor price is at <span className="highlight">4.12 ETH</span> (+3.2% in 24h), with volume reaching <span className="highlight">89.4 ETH</span>.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>Key Whale Activity:</strong> Three major whales have been accumulating aggressively. <code>whalemaster.eth</code> added <span className="highlight">8 NFTs</span> today.
              </p>
              <p>
                <strong>⚡ Recommended Action:</strong> Set a floor price alert at 3.8 ETH (support level) and monitor whale activity.
              </p>
            </div>
            <div className="brief-actions">
              <button className="brief-btn">🔔 Set Suggested Alert</button>
              <button className="brief-btn">🐋 View Key Whales</button>
            </div>
          </div>
        </div>

        {/* Signal Cards */}
        <div className="signals-panel">
          <div className="signal-card signal-bullish">
            <div className="signal-header">
              <span className="signal-type">🟢 Bullish</span>
              <span className="signal-confidence">89% confidence</span>
            </div>
            <div className="signal-title">Whale Accumulation Wave</div>
            <div className="signal-desc">3 of 5 top holders increased positions in last 24h. Net whale inflow: +23 NFTs.</div>
          </div>

          <div className="signal-card signal-bearish">
            <div className="signal-header">
              <span className="signal-type">🔴 Bearish</span>
              <span className="signal-confidence">62% confidence</span>
            </div>
            <div className="signal-title">Large Holder Distribution</div>
            <div className="signal-desc">megawhale.eth listed 30% of holdings. Watch for price impact.</div>
          </div>

          <div className="signal-card signal-neutral">
            <div className="signal-header">
              <span className="signal-type">🟡 Watch</span>
              <span className="signal-confidence">73% confidence</span>
            </div>
            <div className="signal-title">Volume Anomaly Detected</div>
            <div className="signal-desc">Trading volume at 342% of 7-day average.</div>
          </div>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="trend-row">
        <div className="trend-card">
          <div className="trend-card-header">
            <h4>📈 Accumulation Score</h4>
            <span className="trend-badge trend-up">↑ Rising</span>
          </div>
          <div className="mini-bars" id="accBars"></div>
          <div className="trend-summary">
            Net whale accumulation has been <strong>increasing for 5 consecutive days</strong>. Current score: <strong style={{ color: 'var(--ok)' }}>78/100</strong>.
          </div>
        </div>

        <div className="trend-card">
          <div className="trend-card-header">
            <h4>💎 Holder Conviction</h4>
            <span className="trend-badge trend-stable">→ Stable</span>
          </div>
          <div className="mini-bars" id="convBars"></div>
          <div className="trend-summary">
            Average hold time among whales is <strong>47 days</strong>. Diamond hands ratio at <strong style={{ color: 'var(--gold)' }}>82%</strong>.
          </div>
        </div>

        <div className="trend-card">
          <div className="trend-card-header">
            <h4>🔄 Liquidity Flow</h4>
            <span className="trend-badge trend-down">↓ Declining</span>
          </div>
          <div className="mini-bars" id="liqBars"></div>
          <div className="trend-summary">
            Listed supply decreased <strong>12% this week</strong>. Tighter supply = <strong style={{ color: 'var(--ok)' }}>bullish</strong> signal.
          </div>
        </div>
      </div>

      {/* Whale Behavior Analysis */}
      <div className="whale-behavior">
        <div className="wb-header">
          <h3>🧠 Whale Behavior Analysis</h3>
          <div style={{ fontSize: '12px', color: 'var(--t3)' }}>AI-generated profiles based on on-chain activity</div>
        </div>
        <div className="wb-grid">
          <div className="wb-item">
            <div className="wb-item-header">
              <div className="wb-avatar" style={{ background: 'var(--gold-d)' }}>🐋</div>
              <div>
                <div className="wb-name">whalemaster.eth</div>
                <div className="wb-address">0x1f9b...7a3e · 47 NFTs</div>
              </div>
            </div>
            <div className="wb-insight">
              "Aggressive accumulator — has been consistently buying 2-5 NFTs daily for the past week. Pattern suggests building a large position."
            </div>
            <div className="wb-tags">
              <span className="wb-tag" style={{ background: 'var(--ok-d)', color: 'var(--ok)' }}>Accumulating</span>
              <span className="wb-tag" style={{ background: 'var(--gold-d)', color: 'var(--gold)' }}>Smart Money</span>
            </div>
          </div>

          <div className="wb-item">
            <div className="wb-item-header">
              <div className="wb-avatar" style={{ background: 'var(--no-d)' }}>🦈</div>
              <div>
                <div className="wb-name">megawhale.eth</div>
                <div className="wb-address">0x7b3e...2d9f · 50 NFTs</div>
              </div>
            </div>
            <div className="wb-insight">
              "Profit-taker — listed 15 NFTs (30% of position) after 18% rally. Historical pattern: sells on rallies, re-buys on dips."
            </div>
            <div className="wb-tags">
              <span className="wb-tag" style={{ background: 'var(--no-d)', color: 'var(--no)' }}>Distributing</span>
              <span className="wb-tag" style={{ background: 'var(--warn-d)', color: 'var(--warn)' }}>Swing Trader</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat */}
      <div className="ai-chat">
        <div className="ai-chat-header">
          <h3>💬 AI Chat Assistant</h3>
          <div style={{ fontSize: '12px', color: 'var(--t3)' }}>Ask follow-up questions about any insight</div>
        </div>
        <div className="chat-messages" ref={chatMessagesRef}>
          {chatMessages.map((msg, i) => (
            <div key={i} className={`chat-msg ${msg.type}`}>
              <div className={`chat-avatar ${msg.type === 'ai' ? 'ai' : 'human'}`}>
                {msg.type === 'ai' ? '🤖' : '👤'}
              </div>
              <div className="chat-bubble" dangerouslySetInnerHTML={{ __html: msg.text }} />
            </div>
          ))}
        </div>
        <div className="chat-input-row">
          <input
            className="chat-input"
            type="text"
            placeholder="Ask a follow-up question..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendChat()}
          />
          <button className="chat-send" onClick={sendChat}>Send</button>
        </div>
      </div>

      {/* Predictions */}
      <div className="pred-section">
        <h2>🔮 Predictive Signals</h2>
        <div className="pred-grid">
          <div className="pred-card">
            <div className="pred-icon">📈</div>
            <div className="pred-title">Floor Price in 48h</div>
            <div className="pred-desc">Based on accumulation patterns and volume spike. Model predicts 5-8% upward movement.</div>
            <div className="pred-confidence-bar">
              <div className="pred-confidence-fill" style={{ width: '76%', background: 'var(--ok)' }}></div>
            </div>
            <div className="pred-meta">
              <span>Prediction: <strong style={{ color: 'var(--ok)' }}>4.3–4.45 ETH</strong></span>
              <span className="conf-value" style={{ color: 'var(--ok)' }}>76%</span>
            </div>
          </div>

          <div className="pred-card">
            <div className="pred-icon">🐋</div>
            <div className="pred-title">Whale Activity Next 7d</div>
            <div className="pred-desc">Expect continued accumulation with possible profit-taking from 2 holders.</div>
            <div className="pred-confidence-bar">
              <div className="pred-confidence-fill" style={{ width: '68%', background: 'var(--gold)' }}></div>
            </div>
            <div className="pred-meta">
              <span>Prediction: <strong style={{ color: 'var(--gold)' }}>Net +15 to +25 NFTs</strong></span>
              <span className="conf-value" style={{ color: 'var(--gold)' }}>68%</span>
            </div>
          </div>

          <div className="pred-card">
            <div className="pred-icon">💰</div>
            <div className="pred-title">Listings Absorption</div>
            <div className="pred-desc">Current listings will likely be absorbed within 8-12 hours based on buying velocity.</div>
            <div className="pred-confidence-bar">
              <div className="pred-confidence-fill" style={{ width: '83%', background: 'var(--ok)' }}></div>
            </div>
            <div className="pred-meta">
              <span>Prediction: <strong style={{ color: 'var(--ok)' }}>Absorbed in &lt;12h</strong></span>
              <span className="conf-value" style={{ color: 'var(--ok)' }}>83%</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIInsights;
