import { useState } from 'react';

export default function SettingsModal({ onClose, theme, onThemeChange, settings, onSettingsChange }) {
  const [activeTab, setActiveTab] = useState('general');
  const [showKeys, setShowKeys] = useState(false);

  const updateSetting = (key, value) => {
    onSettingsChange(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="font-display" style={{ fontSize: '16px' }}>System Configuration</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="tab-bar" style={{ padding: '0 24px' }}>
          <button className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>General</button>
          <button className={`tab-btn ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>AI Provider</button>
          <button className={`tab-btn ${activeTab === 'voice' ? 'active' : ''}`} onClick={() => setActiveTab('voice')}>Voice & TTS</button>
          <button className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>About</button>
        </div>

        <div style={{ padding: '24px' }}>
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>Appearance</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className={`btn ${theme === 'dark' ? 'btn-primary' : ''}`} onClick={() => onThemeChange('dark')}>Dark / SCIFI</button>
                  <button className={`btn ${theme === 'light' ? 'btn-primary' : ''}`} onClick={() => onThemeChange('light')}>Light / Clean</button>
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>Winutil Directory Path</label>
                <input type="text" className="input" value={settings.winutilPath} onChange={(e) => updateSetting('winutilPath', e.target.value)} />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Path to the winutil-main repository on your system. Currently pointing to the copy at d:\tinker-ai\winutil in backend, this config sets custom path.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>AI Provider</label>
                <select className="input" value={settings.provider} onChange={(e) => updateSetting('provider', e.target.value)}>
                  <option value="google">Google Gemini</option>
                  <option value="openrouter">OpenRouter</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button className="btn btn-ghost" style={{ fontSize: '11px', gap: '6px' }} onClick={() => setShowKeys(v => !v)}>
                  {showKeys ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  )}
                  {showKeys ? 'Hide API Keys' : 'Show API Keys'}
                </button>
              </div>
              {settings.provider === 'openrouter' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>OpenRouter API Key</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showKeys ? 'text' : 'password'} className="input" style={{ paddingRight: '40px' }} placeholder="sk-or-v1-..." value={settings.openRouterKey} onChange={(e) => updateSetting('openRouterKey', e.target.value)} />
                    <button className="btn btn-ghost btn-icon" style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px' }} onClick={() => setShowKeys(v => !v)} title={showKeys ? 'Hide' : 'Show'}>
                      {showKeys ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
              {settings.provider === 'google' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>Google Gemini API Key</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showKeys ? 'text' : 'password'} className="input" style={{ paddingRight: '40px' }} placeholder="AIzaSy..." value={settings.geminiKey} onChange={(e) => updateSetting('geminiKey', e.target.value)} />
                    <button className="btn btn-ghost btn-icon" style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px' }} onClick={() => setShowKeys(v => !v)} title={showKeys ? 'Hide' : 'Show'}>
                      {showKeys ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>Default Model</label>
                <input type="text" className="input" placeholder="e.g. gemini-2.5-flash, gpt-4o..." value={settings.defaultModel} onChange={(e) => updateSetting('defaultModel', e.target.value)} />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Enter any model name supported by your provider.
                </div>
              </div>

              <div style={{ marginTop: '10px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                <h3 className="font-display" style={{ fontSize: '13px', marginBottom: '16px' }}>Web Search APIs (BYOK)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>Tavily API Key (Primary)</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showKeys ? 'text' : 'password'} className="input" style={{ paddingRight: '40px' }} placeholder="tvly-..." value={settings.tavilyKey} onChange={(e) => updateSetting('tavilyKey', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>Brave Search API Key (Fallback)</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showKeys ? 'text' : 'password'} className="input" style={{ paddingRight: '40px' }} placeholder="BSA..." value={settings.braveKey} onChange={(e) => updateSetting('braveKey', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>TTS Engine</label>
                <select className="input" value={settings.ttsEngine} onChange={(e) => updateSetting('ttsEngine', e.target.value)}>
                  <option value="Edge TTS">Microsoft Edge TTS (Free)</option>
                  <option value="OpenRouter TTS">OpenRouter TTS (Paid)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>Edge Voice</label>
                <select className="input" value={settings.edgeVoice} onChange={(e) => updateSetting('edgeVoice', e.target.value)}>
                  <option value="en-US-ChristopherNeural">en-US-ChristopherNeural (Male)</option>
                  <option value="en-US-AriaNeural">en-US-AriaNeural (Female)</option>
                  <option value="en-GB-SoniaNeural">en-GB-SoniaNeural (Female)</option>
                  <option value="en-US-GuyNeural">en-US-GuyNeural (Male)</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center' }}>
              <img src="/favicon.svg" alt="TINKER" style={{ width: '64px', height: '64px', borderRadius: '14px' }} />
              <div>
                <h3 className="font-display" style={{ fontSize: '18px', marginBottom: '4px' }}>TINKER</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>AI-Powered Windows System Assistant</p>
              </div>
              <div style={{ width: '100%', height: '1px', background: 'var(--border)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Developer</strong>
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0, fontWeight: 500 }}>Boubakeur Okba</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Full Stack Developer</p>
                <a
                  href="https://github.com/okba-boubakeur"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '12px', color: 'var(--accent-bright)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  github.com/okba-boubakeur
                </a>
              </div>
              <div style={{ width: '100%', height: '1px', background: 'var(--border)' }} />
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Version 0.1.0</p>
            </div>
          )}
        </div>

        {/* Footer with Save button */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
