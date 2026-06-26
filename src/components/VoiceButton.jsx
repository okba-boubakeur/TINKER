/**
 * VoiceButton — State-driven voice control (Jahbaz-style)
 *
 * States:
 *   idle       → Mic icon, default color. Tap to start recording.
 *   listening  → Square icon, red glow. Recording with VAD auto-stop.
 *   processing → Loader icon, purple glow. AI is thinking.
 *   speaking   → VolumeX icon, amber glow. TTS playing. Tap to interrupt.
 *
 * Parent (App.jsx) manages the state machine and calls onTap.
 */

export default function VoiceButton({ state, onTap, disabled }) {
  // state: 'idle' | 'listening' | 'processing' | 'speaking'

  const getColors = () => {
    switch (state) {
      case 'listening':
        return {
          bg: 'var(--error)',
          glow: '0 0 0 4px rgba(239, 68, 68, 0.25), 0 0 24px rgba(239, 68, 68, 0.4)',
          labelColor: 'var(--error)',
        };
      case 'speaking':
        return {
          bg: 'var(--warning)',
          glow: '0 0 0 4px rgba(245, 158, 11, 0.25), 0 0 24px rgba(245, 158, 11, 0.4)',
          labelColor: 'var(--warning)',
        };
      case 'processing':
        return {
          bg: 'var(--accent)',
          glow: '0 0 0 4px rgba(139, 92, 246, 0.25), 0 0 24px rgba(139, 92, 246, 0.4)',
          labelColor: 'var(--accent-bright)',
        };
      default:
        return {
          bg: 'var(--bg-card)',
          glow: 'var(--shadow-sm)',
          labelColor: 'var(--text-muted)',
        };
    }
  };

  const colors = getColors();

  const getLabel = () => {
    switch (state) {
      case 'listening': return 'Listening… tap to stop';
      case 'processing': return 'Processing…';
      case 'speaking': return 'Speaking… tap to interrupt';
      default: return 'Voice Command';
    }
  };

  const getIcon = () => {
    switch (state) {
      case 'listening':
        // Square (stop recording)
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="6" y="6" width="12" height="12" rx="2" ry="2" fill="currentColor" stroke="none"/>
          </svg>
        );
      case 'speaking':
        // VolumeX (interrupt)
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <line x1="23" y1="9" x2="17" y2="15"/>
            <line x1="17" y1="9" x2="23" y2="15"/>
          </svg>
        );
      case 'processing':
        // Loader spinner
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        );
      default:
        // Mic
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        );
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      marginTop: '12px',
    }}>
      <button
        onClick={onTap}
        disabled={disabled || state === 'processing'}
        className="btn btn-icon"
        title={getLabel()}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: colors.bg,
          border: `2px solid ${state === 'idle' ? 'var(--border)' : 'transparent'}`,
          color: state === 'idle' ? 'var(--text-primary)' : '#fff',
          boxShadow: colors.glow,
          animation: state === 'listening' || state === 'speaking' ? 'pulse-glow 1.2s infinite ease-in-out' : 'none',
          transition: 'all 0.3s ease',
          cursor: (disabled || state === 'processing') ? 'not-allowed' : 'pointer',
          opacity: (disabled || state === 'processing') ? 0.5 : 1,
          position: 'relative',
          overflow: 'visible',
        }}
      >
        {(state === 'listening' || state === 'speaking') && (
          <>
            <span style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '50%',
              border: `2px solid ${state === 'listening' ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)'}`,
              animation: 'voice-ring 1.5s infinite ease-out',
            }}/>
            <span style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '50%',
              border: `2px solid ${state === 'listening' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
              animation: 'voice-ring 1.5s infinite ease-out 0.5s',
            }}/>
          </>
        )}
        <span style={{ position: 'relative', zIndex: 2 }}>
          {getIcon()}
        </span>
      </button>
      <span style={{
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        color: colors.labelColor,
        fontFamily: 'var(--font-display)',
        transition: 'color 0.3s',
        minHeight: '14px',
        textAlign: 'center',
        maxWidth: '140px',
      }}>
        {getLabel()}
      </span>
    </div>
  );
}
