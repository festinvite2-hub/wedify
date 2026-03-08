import { Buffer } from 'buffer';

function parseDebug(debugParam) {
  if (!debugParam) return null;
  try {
    const normalized = debugParam.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
    const json = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function AuthErrorPage({ searchParams }) {
  const message = searchParams?.message || 'Link-ul de confirmare a expirat sau este invalid. Te rugam sa soliciti un nou email.';
  const debug = parseDebug(searchParams?.debug);
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
        maxWidth: '560px',
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
          {message}
        </p>

        {debug && (
          <details style={{ textAlign: 'left', marginBottom: '22px', background: '#221a12', borderRadius: 10, border: '1px solid #3d3428', padding: '10px 12px' }}>
            <summary style={{ cursor: 'pointer', color: '#d7bf92', fontSize: 13 }}>Detalii tehnice (pentru suport)</summary>
            <pre style={{ whiteSpace: 'pre-wrap', margin: '10px 0 0', color: '#b8a88a', fontSize: 12, lineHeight: 1.45 }}>
              {JSON.stringify(debug, null, 2)}
            </pre>
          </details>
        )}

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
