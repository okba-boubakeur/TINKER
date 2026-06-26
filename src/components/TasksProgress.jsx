import { useRef, useEffect } from 'react';

export default function TasksProgress({ logs }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="font-display" style={{ fontSize: '11px', letterSpacing: '0.1em' }}>Execution Log</span>
        {logs.length > 0 && <span className="status-dot info animate-pulse" />}
      </div>
      
      <div 
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
          background: 'var(--bg-primary)',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          lineHeight: '1.6'
        }}
      >
        {logs.length === 0 ? (
          <div style={{ opacity: 0.5, fontStyle: 'italic' }}>No active tasks...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{ marginBottom: '4px', display: 'flex', gap: '8px' }}>
              <span style={{ color: 'var(--accent-dim)' }}>[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
              <span style={{ color: log.type === 'error' ? 'var(--error)' : 'var(--text-secondary)' }}>
                {log.text}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
