import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, LogIn, ShieldCheck } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import { useAuth } from '@/lib/AuthContext';

const GOOGLE_SCRIPT_ID = 'google-identity-services';

function loadGoogleIdentityServices() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google);
      return;
    }

    const existing = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Could not load Google Sign-In.'));
    document.head.appendChild(script);
  });
}

export default function Login() {
  const googleButtonRef = useRef(null);
  const [searchParams] = useSearchParams();
  const { loginWithGoogle, isAuthenticated } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const returnUrl = searchParams.get('returnUrl') || '/admin';

  useEffect(() => {
    if (isAuthenticated) {
      window.location.replace(returnUrl);
      return undefined;
    }

    let cancelled = false;

    async function initialiseGoogle() {
      try {
        const response = await fetch('/api/auth/config', { credentials: 'include' });
        const config = await response.json();

        if (!response.ok || !config.enabled || !config.googleClientId) {
          throw new Error('Google admin login has not been configured on the server.');
        }

        const google = await loadGoogleIdentityServices();
        if (cancelled || !googleButtonRef.current) return;

        google.accounts.id.initialize({
          client_id: config.googleClientId,
          callback: async ({ credential }) => {
            setError('');
            setLoading(true);
            try {
              await loginWithGoogle(credential);
              window.location.replace(returnUrl);
            } catch (loginError) {
              setError(loginError.message || 'Google sign-in failed.');
              setLoading(false);
            }
          },
        });

        google.accounts.id.renderButton(googleButtonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: 320,
        });
        setLoading(false);
      } catch (initialiseError) {
        if (!cancelled) {
          setError(initialiseError.message || 'Google sign-in is unavailable.');
          setLoading(false);
        }
      }
    }

    initialiseGoogle();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, loginWithGoogle, returnUrl]);

  return (
    <AuthLayout
      icon={LogIn}
      title="Admin sign in"
      subtitle="Use an authorised Google account to continue"
      footer={
        <Link to="/" className="text-primary font-medium hover:underline">
          Return to ApexOrder
        </Link>
      }
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>Only Google accounts approved by ApexOrder can access the administration panel.</p>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex min-h-12 justify-center">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading secure sign-in…
            </div>
          )}
          <div ref={googleButtonRef} className={loading ? 'hidden' : ''} />
        </div>
      </div>
    </AuthLayout>
  );
}
