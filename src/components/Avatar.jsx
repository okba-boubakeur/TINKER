export default function Avatar({ state, onClick }) {
  // state can be 'idle', 'listening', 'speaking'
  const stateClass = `orb-${state}`;
  
  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        cursor: 'pointer'
      }}
      onClick={onClick}
    >
      <div 
        style={{
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, var(--accent-bright), var(--bg-card))',
          border: '2px solid var(--accent)',
          animation: `${stateClass} ${state === 'idle' ? '4s' : '1.5s'} infinite ease-in-out`,
          boxShadow: '0 0 30px var(--accent-glow)',
          transition: 'all 0.3s'
        }}
      />
      <div style={{
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        color: state === 'listening' ? 'var(--accent-bright)' : 'var(--text-muted)',
        fontFamily: 'var(--font-display)',
        transition: 'color 0.3s'
      }}>
        {state === 'idle' && 'System Ready'}
        {state === 'listening' && 'Listening...'}
        {state === 'speaking' && 'Synthesizing...'}
      </div>
    </div>
  );
}
