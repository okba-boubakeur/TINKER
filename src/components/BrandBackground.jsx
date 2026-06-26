export function BrandBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -10,
        overflow: 'hidden',
        pointerEvents: 'none',
        background: 'linear-gradient(to bottom, #000, #200D42 40%, #4F21A1 74%, #A46EDB 120%)',
      }}
    >
      {/* Dark planet / horizon */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 'calc(100% - 90px)',
          width: '700px',
          height: '500px',
          transform: 'translateX(-50%)',
          borderRadius: '100%',
          border: '1px solid rgba(164,110,219,0.15)',
          background: 'black radial-gradient(closest-side, #000 82%, #9560EB)',
        }}
      />

      {/* Vertical grid borders */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          gridTemplateColumns: 'clamp(28px, 10vw, 120px) auto clamp(28px, 10vw, 120px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div />
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)' }} />
        <div />
      </div>

      {/* Glow blobs */}
      <figure
        style={{
          position: 'absolute',
          bottom: '-40%',
          left: '50%',
          width: '520px',
          aspectRatio: '1',
          transform: 'translateX(-50%)',
          borderRadius: '50%',
          background: 'rgba(164,110,219,0.40)',
          filter: 'blur(200px)',
        }}
      />
      <figure
        style={{
          position: 'absolute',
          top: '64px',
          left: '4vw',
          width: '32vw',
          aspectRatio: '1',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          filter: 'blur(100px)',
          opacity: 0.6,
        }}
      />
      <figure
        style={{
          position: 'absolute',
          bottom: '-50px',
          right: '7vw',
          width: '30vw',
          aspectRatio: '1',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          filter: 'blur(100px)',
          opacity: 0.6,
        }}
      />
    </div>
  );
}
