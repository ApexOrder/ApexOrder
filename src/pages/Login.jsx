import { Link } from 'react-router-dom';
import { LogIn, ShieldCheck } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';

export default function Login() {
  const continueToAdmin = () => {
    window.location.href = '/admin';
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Admin sign in"
      subtitle="Authentication is protected by Cloudflare Access"
      footer={
        <Link to="/" className="text-primary font-medium hover:underline">
          Return to ApexOrder
        </Link>
      }
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>Only accounts allowed by the ApexOrder Cloudflare Access policy can open the administration panel.</p>
        </div>

        <Button className="h-12 w-full font-medium" onClick={continueToAdmin}>
          Continue to secure admin login
        </Button>
      </div>
    </AuthLayout>
  );
}
