export default function SystemStatusCards({ stats, topApps }) {
  return (
    <>
      <div className="card" style={{ padding: '16px' }}>
        <h3 className="font-display" style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--accent-bright)' }}>System Core</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span>CPU</span>
              <span className="font-mono">{stats.cpu}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${stats.cpu}%` }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span>RAM</span>
              <span className="font-mono">{stats.ram}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${stats.ram}%`, background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', boxShadow: '0 0 8px rgba(59, 130, 246, 0.4)' }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span>DISK</span>
              <span className="font-mono">{stats.disk}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${stats.disk}%`, background: 'linear-gradient(90deg, #10b981, #34d399)', boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)' }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '16px', flex: 1 }}>
        <h3 className="font-display" style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--text-secondary)' }}>Resource Drainers</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {topApps.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Monitoring...</div>
          ) : (
            topApps.map((app, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '6px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                <span className="truncate" style={{ maxWidth: '120px' }}>{app.name}</span>
                <span className="font-mono" style={{ color: 'var(--warning)' }}>{app.cpu}%</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
