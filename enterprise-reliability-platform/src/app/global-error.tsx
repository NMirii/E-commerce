'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="az">
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#090d16',
          color: '#f3f4f6',
          fontFamily: 'system-ui, sans-serif',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '500px',
            backgroundColor: '#111827',
            border: '1px solid #ef4444',
            borderRadius: '12px',
            padding: '2.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#fca5a5' }}>
              Gözlənilməz bir xəta baş verdi!
            </h2>
            <p style={{ color: '#9ca3af', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Mühəndis komandamız bu barədə məlumatlandırıldı. Platformanın dayanıqlığını təmin etmək üçün xəta qeydə alındı.
            </p>
            <button
              onClick={() => reset()}
              style={{
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
            >
              Yenidən cəhd et
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
