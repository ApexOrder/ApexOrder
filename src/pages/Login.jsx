import { Link, useSearchParams } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';

export default function Login() {
  const [params] = useSearchParams();
  const { member, loginWithDiscord } = useAuth();
  const returnTo = params.get('returnUrl') || '/store';
  const error = params.get('error');

  return (
    <AuthLayout
      icon={LogIn}
      title="Sign in with Discord"
      subtitle="Use your Discord account for the ApexOrder store and member features"
      footer={<Link to="/" className="text-primary font-medium hover:underline">Return to ApexOrder</Link>}
    >
      <div className="space-y-5">
        {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
        {member ? (
          <div className="space-y-4 text-center">
            {member.avatar && <img src={member.avatar} alt="" className="mx-auto h-16 w-16 rounded-full" />}
            <p className="text-sm text-muted-foreground">Signed in as <strong className="text-foreground">{member.displayName}</strong></p>
            <Button className="h-12 w-full" onClick={() => { window.location.href = returnTo; }}>Continue</Button>
          </div>
        ) : (
          <Button className="h-12 w-full font-medium" onClick={() => loginWithDiscord(returnTo)}>
            Continue with Discord
          </Button>
        )}
      </div>
    </AuthLayout>
  );
}
