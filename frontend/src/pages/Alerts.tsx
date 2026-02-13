// Alerts - AI-powered customizable alerts page (ATLAS Design)
// Modal functionality: Click "+ New Rule" to open create alert modal

import React, { useState, useEffect } from 'react';
import {
  useAlertRules,
  useAlertStats,
  useAlertHistory,
  useCreateAlert,
  useToggleAlert,
  useDeleteAlert,
} from '../hooks/useAlerts';
import { CreateAlertRequest, AlertType, AlertCondition, AlertChannel, AlertHistory } from '../types/alert.types';
import { Spinner } from '../components/loading';
import { useWebSocket } from '../hooks/useWebSocket';
import { useToast } from '../contexts/ToastContext';
import '../styles/alerts.css';

const Alerts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'history' | 'rules' | 'channels'>('history');
  const [showModal, setShowModal] = useState(false);

  // Debug: Log modal state changes
  useEffect(() => {
    console.log('🔍 [Alerts Debug] showModal state:', showModal);
  }, [showModal]);

  // Fetch data
  const { data: rules = [], isLoading: rulesLoading } = useAlertRules();
  const { data: stats, isLoading: statsLoading } = useAlertStats();
  const { data: history = [], isLoading: historyLoading } = useAlertHistory(50);

  // Mutations
  const { mutate: createAlert } = useCreateAlert();
  const { mutate: toggleAlert } = useToggleAlert();
  const { mutate: deleteAlert } = useDeleteAlert();

  // WebSocket for live alerts
  const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:6255';
  const { isConnected, lastEvent } = useWebSocket(WS_URL);

  // Toast notifications
  const { showToast } = useToast();

  // Listen for incoming alert events from WebSocket
  useEffect(() => {
    if (lastEvent && lastEvent.type === 'alert' && lastEvent.data) {
      // Add new alert to history at the top
      const newAlert: AlertHistory = {
        id: lastEvent.data.id || `ws_${Date.now()}`,
        ruleId: lastEvent.data.ruleId || '',
        ruleName: lastEvent.data.ruleName || 'New Alert',
        type: lastEvent.data.alertType || 'whale',
        message: lastEvent.data.message || '',
        value: lastEvent.data.value || 0,
        threshold: lastEvent.data.threshold || 0,
        triggeredAt: lastEvent.data.triggeredAt || new Date().toISOString(),
        acknowledged: false,
      };

      // Update local history state (prepend new alert)
      // Note: This will be overwritten by next query refetch, but provides instant feedback
      console.log('🔔 Live alert received:', newAlert);

      // Show toast notification for live alert
      showToast(`🔔 ${newAlert.ruleName}: ${newAlert.message}`, 'warning', 8000);
    }
  }, [lastEvent, showToast]);

  // Modal form state
  const [newAlert, setNewAlert] = useState<CreateAlertRequest>({
    name: '',
    type: 'price',
    condition: 'below',
    threshold: 0,
    channels: ['telegram'],
  });

  const handleCreateAlert = () => {
    if (!newAlert.name || newAlert.threshold <= 0) {
      showToast('Please fill all required fields', 'warning');
      return;
    }

    createAlert(newAlert, {
      onSuccess: () => {
        setShowModal(false);
        setNewAlert({
          name: '',
          type: 'price',
          condition: 'below',
          threshold: 0,
          channels: ['telegram'],
        });
        showToast('Alert rule created successfully', 'success');
      },
      onError: (error) => {
        console.error('Failed to create alert:', error);
        showToast('Failed to create alert. Please try again.', 'error');
      },
    });
  };

  const handleToggleRule = (id: string) => {
    toggleAlert(id);
  };

  const handleDeleteRule = (id: string) => {
    if (window.confirm('Are you sure you want to delete this alert rule?')) {
      deleteAlert(id, {
        onSuccess: () => {
          showToast('Alert rule deleted', 'success');
        },
        onError: (error) => {
          console.error('Failed to delete alert:', error);
          showToast('Failed to delete alert rule', 'error');
        },
      });
    }
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  if (statsLoading || rulesLoading || historyLoading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <Spinner variant="ring" size="lg" />
        <p style={{ marginTop: '20px', color: 'var(--t3)' }}>Loading alerts...</p>
      </div>
    );
  }

  const unreadCount = history.filter(h => !h.acknowledged).length;
  const activeRulesCount = rules.filter(r => r.status === 'active').length;
  const pausedRulesCount = rules.filter(r => r.status === 'paused').length;

  return (
    <>
      {/* Alert Stats */}
      <div className="alerts-stats">
        <div className="alert-stat">
          <div className="label">🔔 Total Rules</div>
          <div className="value">{stats?.totalRules || 0}</div>
          <div className="sub">{activeRulesCount} enabled · {pausedRulesCount} paused</div>
        </div>
        <div className="alert-stat">
          <div className="label">⚡ Triggered Today</div>
          <div className="value" style={{ color: 'var(--warn)' }}>{stats?.triggeredToday || 0}</div>
          <div className="sub">{stats?.triggeredThisWeek || 0} this week</div>
        </div>
        <div className="alert-stat">
          <div className="label">📬 Unread</div>
          <div className="value" style={{ color: 'var(--no)' }}>{unreadCount}</div>
          <div className="sub">{history.length} total alerts</div>
        </div>
        <div className="alert-stat">
          <div className="label">📊 Collections Monitored</div>
          <div className="value">1</div>
          <div className="sub">
            MAYC · <span style={{ color: isConnected ? 'var(--ok)' : 'var(--t3)' }}>
              {isConnected ? '🟢 Live' : '🔴 Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📥 Alert History <span className="count">{history.length}</span>
        </button>
        <button
          className={`tab ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          ⚙️ Alert Rules <span className="count">{rules.length}</span>
        </button>
        <button
          className={`tab ${activeTab === 'channels' ? 'active' : ''}`}
          onClick={() => setActiveTab('channels')}
        >
          📡 Channels
        </button>
      </div>

      {/* Tab: Alert History */}
      {activeTab === 'history' && (
        <div>
          <div className="toolbar">
            <div className="search-box">
              <span className="s-icon">🔍</span>
              <input type="text" placeholder="Search alerts..." />
            </div>
            <select className="filter-select">
              <option>All Severity</option>
              <option>🔴 High</option>
              <option>🟡 Medium</option>
              <option>🟢 Low</option>
            </select>
            <select className="filter-select">
              <option>All Types</option>
              <option>🐋 Whale Activity</option>
              <option>💰 Price Change</option>
              <option>📊 Volume Spike</option>
            </select>
            <div style={{ marginLeft: 'auto' }}>
              <button className="btn btn-ghost btn-sm">Mark All Read</button>
            </div>
          </div>

          <div className="history-list">
            {history.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--t3)' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>📭</div>
                No alert history yet
              </div>
            ) : (
              history.map((alert) => {
                const typeIcons: Record<AlertType, string> = {
                  price: '💰',
                  whale: '🐋',
                  volume: '📊',
                  listing: '📝',
                };

                return (
                  <div key={alert.id} className={`history-item ${!alert.acknowledged ? 'unread' : ''}`}>
                    <div className={`history-icon hi-${alert.type}`}>
                      {typeIcons[alert.type]}
                    </div>
                    <div className="history-content">
                      <div className="history-title">
                        {alert.ruleName} <span className="time">{formatDate(alert.triggeredAt)}</span>
                      </div>
                      <div className="history-body">
                        {alert.message}
                      </div>
                      <div className="history-tags">
                        <span className="ht ht-collection">🦍 MAYC</span>
                        <span className="ht ht-action">{alert.type}</span>
                      </div>
                    </div>
                    <div className="history-right">
                      <span className="severity sev-medium">
                        {alert.value > alert.threshold * 1.5 ? '🔴' : '🟡'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab: Rules */}
      {activeTab === 'rules' && (
        <div>
          <div className="toolbar">
            <div className="search-box">
              <span className="s-icon">🔍</span>
              <input type="text" placeholder="Search rules..." />
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('🔴 [Alerts Debug] Button clicked! Setting showModal to true...');
                  setShowModal(true);
                }}
              >
                + New Rule
              </button>
            </div>
          </div>

          <div className="rules-card">
            <div className="rules-header">
              <h3>⚙️ Alert Rules <span style={{fontSize: '12px', fontWeight: 400, color: 'var(--t3)'}}>· {rules.length} rules</span></h3>
            </div>

            {rules.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--t3)' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔔</div>
                No alert rules yet. Click "+ New Rule" to create one.
              </div>
            ) : (
              rules.map((rule) => {
                const typeIcons: Record<AlertType, string> = {
                  price: '💰',
                  whale: '🐋',
                  volume: '📊',
                  listing: '📝',
                };

                const channelIcons: Record<AlertChannel, string> = {
                  telegram: '📱',
                  email: '📧',
                  webhook: '🔗',
                  push: '🔔',
                };

                return (
                  <div key={rule.id} className="rule-row">
                    <div className="rule-status">
                      <button
                        className={`toggle ${rule.status === 'active' ? 'on' : ''}`}
                        onClick={() => handleToggleRule(rule.id)}
                      ></button>
                    </div>
                    <div className={`rule-icon ri-${rule.type}`}>{typeIcons[rule.type]}</div>
                    <div className="rule-info">
                      <div className="rule-name">
                        {rule.name} <span className={`rule-tag rt-${rule.type}`}>{rule.type}</span>
                      </div>
                      <div className="rule-desc">
                        Alert when {rule.condition} {rule.threshold}
                        {rule.type === 'price' && ' ETH'}
                        {rule.type === 'whale' && ' NFTs'}
                        {rule.type === 'volume' && ' ETH'}
                      </div>
                    </div>
                    <div className="rule-meta">
                      <div className="rule-collection">🦍 MAYC</div>
                      <div className="rule-channels">
                        {rule.channels.map((ch) => (
                          <span key={ch} className="channel-badge">
                            {channelIcons[ch]} {ch}
                          </span>
                        ))}
                      </div>
                      <div className="rule-triggered">
                        Triggered {rule.triggerCount}x {rule.lastTriggered && `· Last: ${formatDate(rule.lastTriggered)}`}
                      </div>
                    </div>
                    <div className="rule-actions">
                      <button
                        className="btn-icon"
                        title="Delete"
                        style={{ color: 'var(--no)' }}
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab: Channels */}
      {activeTab === 'channels' && (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px'}}>
          <div className="rules-card" style={{margin: 0}}>
            <div style={{padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--brd)'}}>
              <div style={{width: '48px', height: '48px', borderRadius: '12px', background: 'var(--ok-d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'}}>📧</div>
              <div style={{flex: 1}}>
                <div style={{fontWeight: 600, fontSize: '15px'}}>Email</div>
                <div style={{fontSize: '12px', color: 'var(--ok)'}}>✓ Connected</div>
              </div>
              <button className="toggle on"></button>
            </div>
            <div style={{padding: '16px 24px', fontSize: '13px', color: 'var(--t2)'}}>
              <div style={{marginBottom: '8px'}}><strong style={{color: 'var(--t1)'}}>Recipient:</strong> user@example.com</div>
              <div style={{marginBottom: '8px'}}><strong style={{color: 'var(--t1)'}}>Frequency:</strong> Instant</div>
              <div><strong style={{color: 'var(--t1)'}}>Rules using:</strong> 6 of 8</div>
            </div>
          </div>

          <div className="rules-card" style={{margin: 0}}>
            <div style={{padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--brd)'}}>
              <div style={{width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(88,101,242,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'}}>💬</div>
              <div style={{flex: 1}}>
                <div style={{fontWeight: 600, fontSize: '15px'}}>Discord</div>
                <div style={{fontSize: '12px', color: 'var(--ok)'}}>✓ Connected</div>
              </div>
              <button className="toggle on"></button>
            </div>
            <div style={{padding: '16px 24px', fontSize: '13px', color: 'var(--t2)'}}>
              <div style={{marginBottom: '8px'}}><strong style={{color: 'var(--t1)'}}>Server:</strong> My NFT Tracking</div>
              <div style={{marginBottom: '8px'}}><strong style={{color: 'var(--t1)'}}>Channel:</strong> #whale-alerts</div>
              <div><strong style={{color: 'var(--t1)'}}>Rules using:</strong> 4 of 8</div>
            </div>
          </div>
        </div>
      )}

      {/* Create Alert Modal */}
      <div
        className={`modal-overlay ${showModal ? 'show' : ''}`}
        onClick={() => {
          console.log('🔍 [Alerts Debug] Modal overlay clicked, closing modal');
          setShowModal(false);
        }}
      >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔔 Create New Alert</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <div className="form-label">Alert Name <span className="required">*</span></div>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Whale Accumulation Alert"
                  value={newAlert.name}
                  onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <div className="form-label">Alert Type <span className="required">*</span></div>
                <select
                  className="form-input"
                  value={newAlert.type}
                  onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value as AlertType })}
                >
                  <option value="price">💰 Price Alert</option>
                  <option value="whale">🐋 Whale Activity</option>
                  <option value="volume">📊 Volume Alert</option>
                  <option value="listing">📝 Listing Alert</option>
                </select>
              </div>

              <div className="form-group">
                <div className="form-label">Condition <span className="required">*</span></div>
                <select
                  className="form-input"
                  value={newAlert.condition}
                  onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value as AlertCondition })}
                >
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                  <option value="equals">Equals</option>
                  <option value="change">Change by %</option>
                </select>
              </div>

              <div className="form-group">
                <div className="form-label">Threshold <span className="required">*</span></div>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 4.5"
                  value={newAlert.threshold || ''}
                  onChange={(e) => setNewAlert({ ...newAlert, threshold: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="form-group">
                <div className="form-label">Notification Channels <span className="required">*</span></div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(['telegram', 'email', 'webhook', 'push'] as AlertChannel[]).map((channel) => (
                    <label key={channel} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newAlert.channels.includes(channel)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewAlert({ ...newAlert, channels: [...newAlert.channels, channel] });
                          } else {
                            setNewAlert({ ...newAlert, channels: newAlert.channels.filter(c => c !== channel) });
                          }
                        }}
                      />
                      <span style={{ textTransform: 'capitalize' }}>{channel}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <div className="modal-footer-left">All fields with <span style={{color: 'var(--no)'}}>*</span> are required</div>
              <div style={{display: 'flex', gap: '10px'}}>
                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreateAlert}>Create Alert Rule →</button>
              </div>
            </div>
          </div>
        </div>
    </>
  );
};

export default Alerts;
