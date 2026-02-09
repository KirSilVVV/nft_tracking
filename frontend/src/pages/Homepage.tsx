import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import AuthManager from '../components/AuthManager';
import '../styles/homepage.css'; // ✨ Стили для landing page

interface HomepageProps {
  onNavigate?: (page: 'whales' | 'dashboard') => void;
}

const Homepage: React.FC<HomepageProps> = ({ onNavigate }) => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('[data-anim]').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="homepage">
      {/* ═══════════════════════════════════════════════════════════
       * NAVIGATION (Новый дизайн из homepage-redesign.html)
       * ═══════════════════════════════════════════════════════ */}
      <nav className="nav-landing">
        <div className="nav-inner-landing">
          {/* Logo */}
          <div className="logo-landing">
            <div className="logo-icon-landing">🐋</div>
            <span>
              NFT-Tracker<span style={{ color: 'var(--gold)' }}>.ai</span>
            </span>
          </div>

          {/* Navigation Links (desktop) */}
          <div className="nav-links-landing">
            <a href="#features">Features</a>
            <a href="#dashboard">Dashboard</a>
            <a href="#whales">Whales</a>
            <a href="#pricing">Pricing</a>
          </div>

          {/* Right Side Actions */}
          <div className="nav-right-landing">
            {/* Live Indicator */}
            <div className="live-indicator-badge">
              <div className="live-dot-landing"></div>
              Live
            </div>

            {/* CTA Buttons */}
            <Button variant="outline" size="sm" className="hidden md:inline-flex" onClick={() => setIsAuthOpen(true)}>
              Sign In
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsAuthOpen(true)}>
              Start Free →
            </Button>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════
       * HERO SECTION (Grid Layout с анимацией #4)
       * ═══════════════════════════════════════════════════════ */}
      <section className="hero-landing">
        <div className="hero-grid-landing">
          {/* ─────────────────────────────────────────────────────
           * LEFT: Hero Content
           * ───────────────────────────────────────────────────── */}
          <div className="hero-left-landing">
            {/* Badge */}
            <div className="hero-badge-landing">
              <div className="live-dot-landing"></div>
              Tracking 10,000 wallets in real-time
            </div>

            {/* Heading */}
            <h1 className="hero-title-landing">
              Know <span className="highlight-landing">Everything</span> About NFT Whales —{' '}
              <span className="highlight-landing">Before</span> Everyone Else
            </h1>

            {/* Description */}
            <p className="hero-description-landing">
              AI-powered whale tracking, real-time alerts, and deep analytics for NFT collections. See
              who's buying, selling, and accumulating — before the market reacts.
            </p>

            {/* CTA Buttons */}
            <div className="hero-actions-landing">
              <Button
                variant="primary"
                size="lg"
                onClick={() => onNavigate?.('whales')}
                className="hero-cta-primary"
              >
                Start Tracking Free →
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onNavigate?.('dashboard')}
                className="hero-cta-secondary"
              >
                View Demo Dashboard
              </Button>
            </div>

            {/* Stats */}
            <div className="hero-stats-landing" data-anim>
              <div className="hero-stat-landing">
                <div className="hero-stat-num">
                  10<span>,</span>000<span>+</span>
                </div>
                <div className="hero-stat-label">Wallets Tracked</div>
              </div>
              <div className="hero-stat-landing">
                <div className="hero-stat-num">
                  <span>$</span>2.4<span>B</span>
                </div>
                <div className="hero-stat-label">Assets Monitored</div>
              </div>
              <div className="hero-stat-landing">
                <div className="hero-stat-num">
                  50<span>ms</span>
                </div>
                <div className="hero-stat-label">Alert Latency</div>
              </div>
              <div className="hero-stat-landing">
                <div className="hero-stat-num">
                  24<span>/</span>7
                </div>
                <div className="hero-stat-label">Real-time Monitoring</div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────
           * RIGHT: Live Activity Feed Animation (#4)
           * (скрывается на mobile для performance)
           * ───────────────────────────────────────────────────── */}
          <div className="hero-right-landing">
            <div className="activity-feed-hero">
              {/* Header */}
              <div className="feed-header-hero">
                <div className="feed-title-hero">Whale Activity</div>
                <div className="live-badge-hero">
                  <div className="live-dot-hero"></div>
                  LIVE
                </div>
              </div>

              {/* Activity List */}
              <div className="activity-list-hero">
                <div className="activity-item-hero" style={{ animationDelay: '0.1s' }}>
                  <div className="activity-icon-hero icon-buy-hero">💰</div>
                  <div className="activity-content-hero">
                    <div className="activity-title-hero">Whale Buy Alert</div>
                    <div className="activity-detail-hero">BAYC #2847 • 2 min ago</div>
                  </div>
                  <div className="activity-amount-hero">45.8 ETH</div>
                </div>

                <div className="activity-item-hero" style={{ animationDelay: '0.2s' }}>
                  <div className="activity-icon-hero icon-sell-hero">📤</div>
                  <div className="activity-content-hero">
                    <div className="activity-title-hero">Whale Sell</div>
                    <div className="activity-detail-hero">Azuki #1205 • 5 min ago</div>
                  </div>
                  <div className="activity-amount-hero">18.2 ETH</div>
                </div>

                <div className="activity-item-hero" style={{ animationDelay: '0.3s' }}>
                  <div className="activity-icon-hero icon-transfer-hero">🔄</div>
                  <div className="activity-content-hero">
                    <div className="activity-title-hero">Transfer Detected</div>
                    <div className="activity-detail-hero">Punk #7804 • 8 min ago</div>
                  </div>
                  <div className="activity-amount-hero">125 ETH</div>
                </div>

                <div className="activity-item-hero" style={{ animationDelay: '0.4s' }}>
                  <div className="activity-icon-hero icon-buy-hero">💰</div>
                  <div className="activity-content-hero">
                    <div className="activity-title-hero">Whale Buy Alert</div>
                    <div className="activity-detail-hero">Doodles #9421 • 12 min ago</div>
                  </div>
                  <div className="activity-amount-hero">8.5 ETH</div>
                </div>

                <div className="activity-item-hero" style={{ animationDelay: '0.5s' }}>
                  <div className="activity-icon-hero icon-buy-hero">💰</div>
                  <div className="activity-content-hero">
                    <div className="activity-title-hero">Floor Sweep</div>
                    <div className="activity-detail-hero">CloneX x15 • 15 min ago</div>
                  </div>
                  <div className="activity-amount-hero">92.3 ETH</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero background glow effect */}
        <div className="hero-glow-landing"></div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
       * LIVE TICKER (Scrolling Transactions)
       * ═══════════════════════════════════════════════════════ */}
      <div className="ticker-wrap">
        <div className="ticker">
          <div className="ticker-item">
            <span className="tag tag-whale">🐋 WHALE</span>{' '}
            <span className="addr">vitalik.eth</span> bought <strong>3 BAYC</strong> for{' '}
            <strong style={{ color: 'var(--ok)' }}>142.5 ETH</strong>
          </div>
          <div className="ticker-item">
            <span className="tag tag-sell">SELL</span> <span className="addr">0x7a2...f4e</span> sold{' '}
            <strong>MAYC #4521</strong> for <strong style={{ color: 'var(--no)' }}>8.2 ETH</strong>
          </div>
          <div className="ticker-item">
            <span className="tag tag-mint">MINT</span> <span className="addr">punk6529.eth</span> minted{' '}
            <strong>5 Azuki</strong>
          </div>
          <div className="ticker-item">
            <span className="tag tag-buy">BUY</span> <span className="addr">0x1d3...8bc</span> bought{' '}
            <strong>MAYC #1023</strong> for <strong style={{ color: 'var(--ok)' }}>12.8 ETH</strong>
          </div>
          <div className="ticker-item">
            <span className="tag tag-whale">🐋 ALERT</span> <strong>New Whale Detected</strong> —{' '}
            <span className="addr">0xf4a...92c</span> accumulated <strong>15 MAYC</strong>
          </div>
          <div className="ticker-item">
            <span className="tag tag-sell">SELL</span> <span className="addr">mooncat.eth</span> sold{' '}
            <strong>CryptoPunk #8877</strong> for <strong style={{ color: 'var(--no)' }}>89.5 ETH</strong>
          </div>
          {/* Duplicate items for seamless infinite scroll */}
          <div className="ticker-item">
            <span className="tag tag-whale">🐋 WHALE</span>{' '}
            <span className="addr">vitalik.eth</span> bought <strong>3 BAYC</strong> for{' '}
            <strong style={{ color: 'var(--ok)' }}>142.5 ETH</strong>
          </div>
          <div className="ticker-item">
            <span className="tag tag-sell">SELL</span> <span className="addr">0x7a2...f4e</span> sold{' '}
            <strong>MAYC #4521</strong> for <strong style={{ color: 'var(--no)' }}>8.2 ETH</strong>
          </div>
          <div className="ticker-item">
            <span className="tag tag-mint">MINT</span> <span className="addr">punk6529.eth</span> minted{' '}
            <strong>5 Azuki</strong>
          </div>
          <div className="ticker-item">
            <span className="tag tag-buy">BUY</span> <span className="addr">0x1d3...8bc</span> bought{' '}
            <strong>MAYC #1023</strong> for <strong style={{ color: 'var(--ok)' }}>12.8 ETH</strong>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
       * FEATURES GRID (6 Feature Cards)
       * ═══════════════════════════════════════════════════════ */}
      <section className="section" id="features">
        <div className="section-label" data-anim>
          ⚡ Platform Features
        </div>
        <h2 className="section-title" data-anim>
          Every tool you need to
          <br />
          track NFT whales
        </h2>
        <p className="section-sub" data-anim>
          From real-time alerts to deep on-chain analytics — everything in one platform, powered by AI.
        </p>
        <div className="features-grid">
          <div className="feature-card" data-anim>
            <div className="feature-icon fi-gold">🐋</div>
            <h3>Whale Tracking</h3>
            <p>
              Monitor the top holders of any NFT collection. See who's accumulating, selling, and
              transferring in real-time.
            </p>
          </div>
          <div className="feature-card" data-anim>
            <div className="feature-icon fi-green">⚡</div>
            <h3>Real-Time Alerts</h3>
            <p>
              Get instant WebSocket notifications for large trades, whale movements, and significant
              market events.
            </p>
          </div>
          <div className="feature-card" data-anim>
            <div className="feature-icon fi-blue">📊</div>
            <h3>Analytics Dashboard</h3>
            <p>
              Distribution charts, concentration metrics, P/L tracking, and historical trends — all in
              beautiful visualizations.
            </p>
          </div>
          <div className="feature-card" data-anim>
            <div className="feature-icon fi-purple">🤖</div>
            <h3>AI Insights</h3>
            <p>
              AI-generated summaries and predictions. Understand whale behavior patterns without reading
              thousands of transactions.
            </p>
          </div>
          <div className="feature-card" data-anim>
            <div className="feature-icon fi-cyan">🖼️</div>
            <h3>Image Search</h3>
            <p>
              Upload any NFT image and instantly find its owner, token ID, rarity score, and transaction
              history.
            </p>
          </div>
          <div className="feature-card" data-anim>
            <div className="feature-icon fi-red">🏷️</div>
            <h3>ENS Resolution</h3>
            <p>
              See real identities behind wallet addresses. ENS names, avatars, and social profiles of top
              holders.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
       * DASHBOARD PREVIEW (Browser Mockup)
       * ═══════════════════════════════════════════════════════ */}
      <section className="preview-section" id="dashboard">
        <div className="preview-wrap">
          <div className="section-label" data-anim>
            📊 Live Dashboard
          </div>
          <h2 className="section-title" data-anim>
            Your command center for
            <br />
            NFT intelligence
          </h2>
          <p className="section-sub" data-anim>
            A real-time analytics dashboard that shows everything about your tracked collections.
          </p>
          <div className="preview-frame" data-anim>
            <div className="preview-bar">
              <div className="preview-dot d-r"></div>
              <div className="preview-dot d-y"></div>
              <div className="preview-dot d-g"></div>
              <div className="preview-url">app.nft-tracker.ai/dashboard</div>
            </div>
            <div className="preview-content">
              <div className="preview-sidebar">
                <div className="preview-nav-item active">📊 Dashboard</div>
                <div className="preview-nav-item">🐋 Whales</div>
                <div className="preview-nav-item">💱 Transactions</div>
                <div className="preview-nav-item">🔔 Alerts</div>
                <div className="preview-nav-item">🖼️ Image Search</div>
                <div className="preview-nav-item">⚙️ Settings</div>
              </div>
              <div className="preview-main">
                <div className="preview-stat-row">
                  <div className="preview-stat">
                    <div className="lbl">Total Holders</div>
                    <div className="val">6,241</div>
                    <div className="trend trend-up">↑ +124 (24h)</div>
                  </div>
                  <div className="preview-stat">
                    <div className="lbl">Floor Price</div>
                    <div className="val">4.82 ETH</div>
                    <div className="trend trend-up">↑ +5.2%</div>
                  </div>
                  <div className="preview-stat">
                    <div className="lbl">Volume (24h)</div>
                    <div className="val">342 ETH</div>
                    <div className="trend trend-down">↓ -12%</div>
                  </div>
                  <div className="preview-stat">
                    <div className="lbl">Whale Count</div>
                    <div className="val">47</div>
                    <div className="trend trend-up">↑ +3 new</div>
                  </div>
                </div>
                <div className="preview-chart">
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
                    Holder Distribution (Last 30 Days)
                  </div>
                  <div className="chart-line">
                    <svg viewBox="0 0 600 120" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--gold)" stopOpacity=".3" />
                          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,100 Q30,95 60,85 T120,70 T180,75 T240,55 T300,45 T360,50 T420,30 T480,25 T540,20 T600,10"
                        fill="none"
                        stroke="var(--gold)"
                        strokeWidth="2.5"
                      />
                      <path
                        d="M0,100 Q30,95 60,85 T120,70 T180,75 T240,55 T300,45 T360,50 T420,30 T480,25 T540,20 T600,10 L600,120 L0,120 Z"
                        fill="url(#g1)"
                      />
                      <circle cx="600" cy="10" r="4" fill="var(--gold)">
                        <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
                      </circle>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
       * WHALE LEADERBOARD (Top 3 Whales)
       * ═══════════════════════════════════════════════════════ */}
      <section className="section" id="whales">
        <div className="section-label" data-anim>
          🐋 Top Whales
        </div>
        <h2 className="section-title" data-anim>
          Follow the biggest holders
          <br />
          of any collection
        </h2>
        <p className="section-sub" data-anim>
          Real-time leaderboard of whale wallets with ENS names, holdings, and profit/loss tracking.
        </p>
        <div className="whale-cards" data-anim>
          <div className="whale-card rank-1">
            <div className="whale-top">
              <div className="whale-rank r1">#1</div>
              <div>
                <div className="whale-ens">pranksy.eth</div>
                <div className="whale-addr">0x3b4...f2e</div>
              </div>
            </div>
            <div className="whale-body">
              <div className="whale-metric">
                <div className="v">142</div>
                <div className="l">NFTs Held</div>
              </div>
              <div className="whale-metric">
                <div className="v" style={{ color: 'var(--ok)' }}>
                  +$2.4M
                </div>
                <div className="l">Total P/L</div>
              </div>
              <div className="whale-bar">
                <div className="whale-bar-fill" style={{ width: '92%' }}></div>
              </div>
            </div>
          </div>
          <div className="whale-card rank-2">
            <div className="whale-top">
              <div className="whale-rank r2">#2</div>
              <div>
                <div className="whale-ens">0xfrozen.eth</div>
                <div className="whale-addr">0x8a1...c7d</div>
              </div>
            </div>
            <div className="whale-body">
              <div className="whale-metric">
                <div className="v">98</div>
                <div className="l">NFTs Held</div>
              </div>
              <div className="whale-metric">
                <div className="v" style={{ color: 'var(--ok)' }}>
                  +$1.8M
                </div>
                <div className="l">Total P/L</div>
              </div>
              <div className="whale-bar">
                <div className="whale-bar-fill" style={{ width: '74%' }}></div>
              </div>
            </div>
          </div>
          <div className="whale-card rank-3">
            <div className="whale-top">
              <div className="whale-rank r3">#3</div>
              <div>
                <div className="whale-ens">wilcox.eth</div>
                <div className="whale-addr">0x2c9...a1b</div>
              </div>
            </div>
            <div className="whale-body">
              <div className="whale-metric">
                <div className="v">67</div>
                <div className="l">NFTs Held</div>
              </div>
              <div className="whale-metric">
                <div className="v" style={{ color: 'var(--no)' }}>
                  -$340K
                </div>
                <div className="l">Total P/L</div>
              </div>
              <div className="whale-bar">
                <div className="whale-bar-fill" style={{ width: '51%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
       * PRICING (3 Price Tiers)
       * ═══════════════════════════════════════════════════════ */}
      <section className="section" id="pricing" style={{ paddingTop: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="section-label" data-anim>
            💎 Pricing
          </div>
          <h2 className="section-title" data-anim>
            Start tracking for free,
            <br />
            scale as you grow
          </h2>
          <p className="section-sub" data-anim style={{ margin: '0 auto 48px' }}>
            No credit card required. Cancel anytime.
          </p>
        </div>
        <div className="pricing-grid" data-anim>
          <div className="price-card">
            <div className="price-name">Free</div>
            <div className="price-desc">For curious collectors</div>
            <div className="price-amount">
              $0<span>/mo</span>
            </div>
            <div className="price-period">Forever free</div>
            <ul className="price-features">
              <li>1 collection tracked</li>
              <li>Top 10 whales</li>
              <li>Basic dashboard</li>
              <li>24h transaction history</li>
              <li>Email alerts (daily digest)</li>
            </ul>
            <Button variant="outline" className="w-full justify-center">
              Get Started
            </Button>
          </div>
          <div className="price-card popular">
            <div className="price-name">Pro</div>
            <div className="price-desc">For serious traders</div>
            <div className="price-amount">
              $29<span>/mo</span>
            </div>
            <div className="price-period">Billed monthly</div>
            <ul className="price-features">
              <li>5 collections tracked</li>
              <li>Unlimited whale tracking</li>
              <li>Full analytics dashboard</li>
              <li>Real-time WebSocket alerts</li>
              <li>AI insights & predictions</li>
              <li>Image search</li>
              <li>ENS resolution</li>
              <li>Export to CSV</li>
            </ul>
            <Button variant="primary" className="w-full justify-center">
              Start Pro Trial →
            </Button>
          </div>
          <div className="price-card">
            <div className="price-name">Enterprise</div>
            <div className="price-desc">For funds & DAOs</div>
            <div className="price-amount">
              $199<span>/mo</span>
            </div>
            <div className="price-period">Custom billing</div>
            <ul className="price-features">
              <li>Unlimited collections</li>
              <li>API access</li>
              <li>Custom alerts & webhooks</li>
              <li>Priority support</li>
              <li>White-label dashboard</li>
              <li>Team collaboration</li>
              <li>Custom AI models</li>
              <li>SLA guarantee</li>
            </ul>
            <Button variant="outline" className="w-full justify-center">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
       * CTA (Final Call-to-Action)
       * ═══════════════════════════════════════════════════════ */}
      <section className="cta">
        <h2 data-anim>
          Ready to track NFT whales
          <br />
          like a <span style={{ color: 'var(--gold)' }}>pro</span>?
        </h2>
        <p data-anim>Join 10,000+ traders who use AI NFT-Tracker to stay ahead of the market.</p>
        <Button variant="primary" data-anim className="cta-btn">
          Start Free — No Credit Card →
        </Button>
      </section>

      {/* ═══════════════════════════════════════════════════════════
       * FOOTER (Links + Stats)
       * ═══════════════════════════════════════════════════════ */}
      <footer className="footer">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">🐋 NFT-Tracker.ai</div>
            <div className="footer-brand-desc">
              AI-powered NFT whale tracking and analytics platform. Know everything before everyone.
            </div>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <a href="#dashboard">Dashboard</a>
            <a href="#whales">Whale Tracker</a>
            <a href="#">Alerts</a>
            <a href="#">Image Search</a>
            <a href="#">API</a>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <a href="#">Documentation</a>
            <a href="#">Blog</a>
            <a href="#">Changelog</a>
            <a href="#">Status Page</a>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Careers</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
        <div className="footer-bottom">
          <div>© 2025 NFT-Tracker.ai — All rights reserved</div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href="#">Twitter</a>
            <a href="#">Discord</a>
            <a href="#">Telegram</a>
          </div>
        </div>
      </footer>

      {/* Auth Modals */}
      <AuthManager
        isOpen={isAuthOpen}
        initialModal="login"
        onClose={() => setIsAuthOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
};

export default Homepage;
