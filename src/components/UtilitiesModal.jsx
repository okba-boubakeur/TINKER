import { useState, useMemo } from 'react';

export default function UtilitiesModal({ tweaksCatalog, onClose, onLaunch }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [runningKey, setRunningKey] = useState(null);

  const categories = useMemo(() => {
    const cats = new Set(tweaksCatalog.map(t => t.category || 'General'));
    return ['All', ...Array.from(cats).sort()];
  }, [tweaksCatalog]);

  const filtered = useMemo(() => {
    return tweaksCatalog.filter(t => {
      const matchesSearch = !search ||
        t.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.key?.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'All' || (t.category || 'General') === filter;
      return matchesSearch && matchesFilter;
    });
  }, [tweaksCatalog, search, filter]);

  const handleLaunch = async (tweak) => {
    setRunningKey(tweak.key);
    try {
      await onLaunch(tweak.key);
    } catch (e) {
      console.error(e);
    } finally {
      setRunningKey(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px', width: '92%' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="font-display" style={{ fontSize: '14px', letterSpacing: '0.05em', marginBottom: '4px' }}>WinUtil Utilities</h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tweaksCatalog.length} tweaks available</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Search & Filter */}
        <div style={{ padding: '16px 24px', display: 'flex', gap: '10px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              className="input"
              placeholder="Search tweaks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '34px' }}
            />
          </div>
          <select
            className="input"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ width: '140px', flexShrink: 0 }}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Tweaks Grid */}
        <div style={{ padding: '16px 24px', maxHeight: '55vh', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              No tweaks found matching your search.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
              {filtered.map(tweak => (
                <div
                  key={tweak.key}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {tweak.name || tweak.key}
                    </div>
                    <span className="badge" style={{ fontSize: '9px', flexShrink: 0 }}>
                      {tweak.category || 'General'}
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                    {tweak.key}
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{
                      marginTop: 'auto',
                      fontSize: '11px',
                      padding: '6px 10px',
                      opacity: runningKey === tweak.key ? 0.7 : 1,
                    }}
                    disabled={runningKey === tweak.key}
                    onClick={() => handleLaunch(tweak)}
                  >
                    {runningKey === tweak.key ? (
                      <>
                        <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                        Running…
                      </>
                    ) : 'Launch'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
