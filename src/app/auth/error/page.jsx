export default function AuthErrorPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1410 0%, #2a2218 100%)',
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      padding: '20px',
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        background: '#2a2218',
        borderRadius: '16px',
        border: '1px solid #3d3428',
        padding: '48px 32px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h1 style={{
          color: '#e74c3c',
          fontSize: '24px',
          fontWeight: 500,
          margin: '0 0 12px',
        }}>
          Link expirat sau invalid
        </h1>
        <p style={{
          color: '#b8a88a',
          fontSize: '14px',
          lineHeight: 1.6,
          margin: '0 0 28px',
        }}>
          Link-ul de confirmare a expirat sau este invalid. Te rugam sa soliciti un nou email.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #c9a96e, #b8943d)',
            color: '#fff',
            padding: '14px 36px',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '15px',
            textDecoration: 'none',
          }}
        >
          Inapoi la Wedify
        </a>
        <p style={{
          color: '#6b5d4d',
          fontSize: '11px',
          marginTop: '32px',
        }}>
          Wedify · Wedding Organizer
        </p>
      </div>
    </div>
  );
}
