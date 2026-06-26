import { useState, useMemo } from 'react';

export function AppIcon({ link, category }) {
  const [failed, setFailed] = useState(false);
  const iconUrl = getAppIconUrl(link);
  if (!iconUrl || failed) {
    return (
      <span style={{ color: 'var(--accent-bright)', flexShrink: 0, display: 'flex' }}>
        {getCategoryIcon(category)}
      </span>
    );
  }
  return (
    <img
      src={iconUrl}
      alt=""
      style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'contain', flexShrink: 0, background: 'rgba(255,255,255,0.08)', padding: '3px' }}
      onError={() => setFailed(true)}
    />
  );
}

export function getAppIconUrl(link) {
  if (!link) return null;
  try {
    const url = new URL(link);
    const domain = url.hostname.replace(/^www\./, '');
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
}

export function getCategoryIcon(category) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('multimedia')) return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
  );
  if (cat.includes('pro') || cat.includes('tools')) return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
  );
  if (cat.includes('microsoft')) return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
  );
  if (cat.includes('utility')) return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  );
  if (cat.includes('browser') || cat.includes('web')) return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  );
  if (cat.includes('dev') || cat.includes('code')) return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
  );
  if (cat.includes('game')) return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M12 18h.01"/></svg>
  );
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>
  );
}

export default function UtilitiesPanel({ tweaksCatalog, appsCatalog, onLaunch, onInstall, onUninstall, onBack }) {
  const [activeTab, setActiveTab] = useState('tweaks');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  
  // Selection and execution state
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [runningKey, setRunningKey] = useState(null);
  const [isBulkRunning, setIsBulkRunning] = useState(false);

  const currentCatalog = activeTab === 'tweaks' ? tweaksCatalog : appsCatalog;

  const categories = useMemo(() => {
    const cats = new Set(currentCatalog.map(t => t.category || 'General'));
    return ['All', ...Array.from(cats).sort()];
  }, [currentCatalog]);

  const filtered = useMemo(() => {
    return currentCatalog.filter(t => {
      const matchesSearch = !search ||
        t.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.key?.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'All' || (t.category || 'General') === filter;
      return matchesSearch && matchesFilter;
    });
  }, [currentCatalog, search, filter]);

  const toggleSelection = (key) => {
    if (isBulkRunning) return; // Prevent selection changes while running
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearSelection = () => {
    if (!isBulkRunning) setSelectedKeys(new Set());
  };

  const handleTabChange = (tab) => {
    if (isBulkRunning) return;
    setActiveTab(tab);
    setSearch('');
    setFilter('All');
    clearSelection();
  };

  const runBulkAction = async (actionFn, prefix = '') => {
    if (selectedKeys.size === 0 || isBulkRunning) return;
    setIsBulkRunning(true);
    
    // Convert Set to Array to process sequentially
    const keysToProcess = Array.from(selectedKeys);
    
    for (const key of keysToProcess) {
      setRunningKey(prefix + key);
      try {
        await actionFn(key);
      } catch (e) {
        console.error(`Error processing ${key}:`, e);
        // Optionally halt or continue on error. We continue to process the rest.
      }
    }
    
    setRunningKey(null);
    setIsBulkRunning(false);
    setSelectedKeys(new Set()); // Clear selection after successful bulk run
  };

  const handleBulkLaunch = () => runBulkAction(onLaunch);
  const handleBulkInstall = () => runBulkAction(onInstall, 'install-');
  const handleBulkUninstall = () => runBulkAction(onUninstall, 'uninstall-');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        flexShrink: 0,
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h2 className="font-display" style={{ fontSize: '13px', letterSpacing: '0.05em', marginBottom: '2px' }}>
            WinUtil Utilities
          </h2>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            {tweaksCatalog.length} tweaks &middot; {appsCatalog.length} apps
          </p>
        </div>

        {/* Bulk actions — slide in when items are selected */}
        {selectedKeys.size > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <span style={{
              fontSize: '11px', fontWeight: 600,
              color: 'var(--accent-bright)',
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px 8px',
            }}>
              {selectedKeys.size} selected
            </span>
            <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '5px 10px' }} onClick={clearSelection} disabled={isBulkRunning}>
              Clear
            </button>
            {activeTab === 'tweaks' ? (
              <button className="btn btn-primary" style={{ fontSize: '11px', gap: '6px' }} onClick={handleBulkLaunch} disabled={isBulkRunning}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Launch All
              </button>
            ) : (
              <>
                <button className="btn btn-primary" style={{ fontSize: '11px', gap: '6px' }} onClick={handleBulkInstall} disabled={isBulkRunning}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Install All
                </button>
                <button className="btn btn-ghost" style={{ fontSize: '11px', gap: '6px', border: '1px solid var(--border)' }} onClick={handleBulkUninstall} disabled={isBulkRunning}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  Uninstall
                </button>
              </>
            )}
            <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 2px' }} />
          </div>
        )}

        <button
          className="btn btn-ghost"
          style={{ fontSize: '11px', gap: '6px', flexShrink: 0 }}
          onClick={onBack}
          disabled={isBulkRunning}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <button
          className="btn btn-ghost"
          style={{
            flex: 1,
            fontSize: '12px',
            borderRadius: 0,
            borderBottom: activeTab === 'tweaks' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'tweaks' ? 'var(--text-primary)' : 'var(--text-muted)',
            padding: '10px',
            gap: '6px',
          }}
          onClick={() => handleTabChange('tweaks')}
          disabled={isBulkRunning}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          Tweaks
        </button>
        <button
          className="btn btn-ghost"
          style={{
            flex: 1,
            fontSize: '12px',
            borderRadius: 0,
            borderBottom: activeTab === 'apps' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'apps' ? 'var(--text-primary)' : 'var(--text-muted)',
            padding: '10px',
            gap: '6px',
          }}
          onClick={() => handleTabChange('apps')}
          disabled={isBulkRunning}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Apps
        </button>
      </div>

      {/* Search & Filter */}
      <div style={{
        padding: '12px 20px',
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '140px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="input"
            placeholder={`Search ${activeTab}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '30px', fontSize: '12px' }}
            disabled={isBulkRunning}
          />
        </div>
        <select
          className="input"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ width: '130px', flexShrink: 0, fontSize: '12px' }}
          disabled={isBulkRunning}
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Tweaks Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', minHeight: 0 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
            No {activeTab} found matching your search.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
            {filtered.map(tweak => {
              const isSelected = selectedKeys.has(tweak.key);
              const isRunning = runningKey === tweak.key || runningKey === 'install-' + tweak.key || runningKey === 'uninstall-' + tweak.key;
              
              return (
                <div
                  key={tweak.key}
                  onClick={() => toggleSelection(tweak.key)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: isSelected ? 'rgba(var(--accent-rgb), 0.05)' : 'var(--bg-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.2s',
                    cursor: isBulkRunning ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    opacity: isBulkRunning && !isRunning && !isSelected ? 0.6 : 1,
                  }}
                  onMouseEnter={e => {
                    if (isBulkRunning) return;
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--border-hover)';
                      e.currentTarget.style.background = 'var(--bg-card)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (isBulkRunning) return;
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.background = 'var(--bg-primary)';
                    }
                  }}
                >
                  {/* Checkbox Icon */}
                  <div style={{ position: 'absolute', top: '12px', right: '12px', color: isSelected ? 'var(--accent-bright)' : 'var(--text-muted)' }}>
                    {isSelected ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px', paddingRight: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, minWidth: 0, overflowWrap: 'break-word' }}>
                      <AppIcon link={activeTab === 'apps' ? tweak.link : null} category={tweak.category} />
                      {tweak.name || tweak.key}
                    </div>
                  </div>
                  
                  <span style={{
                    fontSize: '9px',
                    alignSelf: 'flex-start',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-subtle)',
                    color: 'var(--accent-bright)',
                    border: '1px solid var(--accent-border)',
                  }}>
                    {tweak.category || 'General'}
                  </span>
                  
                  {tweak.description && (
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginTop: '4px' }}>
                      {tweak.description}
                    </div>
                  )}
                  
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono, monospace)', opacity: 0.7, wordBreak: 'break-all', marginTop: 'auto', paddingTop: '6px' }}>
                    {tweak.key}
                  </div>

                  {/* Running Overlay */}
                  {isRunning && (
                    <div style={{
                      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)',
                      borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexDirection: 'column', gap: '8px', color: 'var(--accent-bright)', fontSize: '11px', fontWeight: 600
                    }}>
                      <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      {runningKey.startsWith('install-') ? 'Installing...' : runningKey.startsWith('uninstall-') ? 'Uninstalling...' : 'Launching...'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>


    </div>
  );
}
