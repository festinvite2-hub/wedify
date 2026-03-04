'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1410 0%, #2a2218 100%)',
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    padding: '20px',
  };

  const cardStyle = {
    maxWidth: '440px',
    width: '100%',
    background: '#2a2218',
    borderRadius: '16px',
    border: '1px solid #3d3428',
    padding: '48px 32px',
    textAlign: 'center',
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    background: '#1a1410',
    border: '1px solid #3d3428',
    borderRadius: '10px',
    color: '#b8a88a',
    fontSize: '14px',
    marginBottom: '12px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const btnStyle = {
    width: '100%',
    padding: '14px',
    background: loading ? '#6b5d4d' : 'linear-gradient(135deg, #c9a96e, #b8943d)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 600,
    fontSize: '15px',
    cursor: loading ? 'not-allowed' : 'pointer',
    marginTop: '8px',
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId;
    let subscription;

    const initSession = async () => {
      try {
        const { createBrowserClient } = await import('@supabase/ssr');
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            if (mounted) setError('Link invalid sau expirat. Cere un nou email de resetare.');
            if (mounted) setReady(true);
            return;
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (mounted) setReady(true);
          return;
        }

        const authState = supabase.auth.onAuthStateChange((event, authSession) => {
          if ((event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && authSession)) && mounted) {
            setReady(true);
          }
        });
        subscription = authState.data.subscription;

        timeoutId = setTimeout(() => {
          if (mounted) setReady(true);
        }, 2000);
      } catch (err) {
        console.error('Init session error:', err);
        if (mounted) setReady(true);
      }
    };

    initSession();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (subscription) subscription.unsubscribe();
    };
  }, [code]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Parola trebuie sa aiba minim 6 caractere.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Parolele nu se potrivesc.');
      return;
    }

    setLoading(true);

    try {
      const { createBrowserClient } = await import('@supabase/ssr');
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setDone(true);
      }
    } catch {
      setError('A aparut o eroare. Incearca din nou.');
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <p style={{ color: '#b8a88a', fontSize: '14px' }}>Se incarca...</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
          <h1 style={{ color: '#c9a96e', fontSize: '24px', fontWeight: 500, margin: '0 0 12px' }}>
            Parola schimbata!
          </h1>
          <p style={{ color: '#b8a88a', fontSize: '14px', lineHeight: 1.6, margin: '0 0 28px' }}>
            Parola ta a fost actualizata cu succes.
          </p>
          <a href="/" style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #c9a96e, #b8943d)',
            color: '#fff',
            padding: '14px 36px',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '15px',
            textDecoration: 'none',
          }}>
            Mergi la aplicatie
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ color: '#c9a96e', fontSize: '24px', fontWeight: 500, margin: '0 0 12px' }}>
          Parola noua
        </h1>
        <p style={{ color: '#b8a88a', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px' }}>
          Introdu noua parola pentru contul tau Wedify.
        </p>

        {error && (
          <p style={{ color: '#e74c3c', fontSize: '13px', margin: '0 0 16px', padding: '10px', background: 'rgba(231,76,60,0.1)', borderRadius: '8px' }}>
            {error}
          </p>
        )}

        <input
          type="password"
          placeholder="Parola noua"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Confirma parola"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={inputStyle}
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={btnStyle}
        >
          {loading ? 'Se salveaza...' : 'Schimba parola'}
        </button>

        <p style={{ color: '#6b5d4d', fontSize: '11px', marginTop: '32px' }}>
          Wedify · Wedding Organizer
        </p>
      </div>
    </div>
  );
}
