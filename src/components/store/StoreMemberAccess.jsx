import { LogIn, LogOut, PackageOpen } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function StoreMemberAccess() {
  const { member, isLoading, loginWithDiscord, logoutMember } = useAuth();

  if (isLoading) {
    return (
      <div className="mx-auto mt-20 max-w-6xl px-4">
        <div className="h-16 animate-pulse rounded border border-indigo-400/20 bg-indigo-500/5" />
      </div>
    );
  }

  return (
    <div className="mx-auto mt-20 max-w-6xl px-4">
      <div
        className="flex flex-col gap-4 rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between"
        style={{
          background: 'linear-gradient(135deg, rgba(88,101,242,0.14), rgba(10,20,10,0.82))',
          border: '1px solid rgba(129,140,248,0.35)',
          boxShadow: '0 0 30px rgba(88,101,242,0.08)',
        }}
      >
        {member ? (
          <>
            <div className="flex items-center gap-3">
              {member.avatar ? (
                <img src={member.avatar} alt="" className="h-11 w-11 rounded-full border border-indigo-300/30 object-cover" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-200">
                  <PackageOpen size={20} />
                </div>
              )}
              <div>
                <div className="text-xs font-bold tracking-[0.16em] text-indigo-300">MEMBER ACCOUNT</div>
                <div className="font-bold text-white">{member.displayName || member.username}</div>
                <div className="text-xs text-gray-500">Signed in with Discord</div>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href="/inventory"
                className="inline-flex items-center justify-center gap-2 rounded px-4 py-2 text-xs font-bold tracking-wider text-emerald-glow"
                style={{ border: '1px solid rgba(16,255,139,0.35)', background: 'rgba(16,255,139,0.08)' }}
              >
                <PackageOpen size={15} /> MY ITEMS
              </a>
              <button
                onClick={logoutMember}
                className="inline-flex items-center justify-center gap-2 rounded px-4 py-2 text-xs font-bold tracking-wider text-gray-300"
                style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)' }}
              >
                <LogOut size={15} /> SIGN OUT
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <div className="text-xs font-bold tracking-[0.16em] text-indigo-300">APEXORDER MEMBERS</div>
              <div className="mt-1 font-bold text-white">Sign in to purchase items and view your inventory</div>
              <div className="mt-1 text-xs text-gray-500">Your store account is securely linked to your Discord profile.</div>
            </div>
            <button
              onClick={() => loginWithDiscord('/store')}
              className="inline-flex items-center justify-center gap-2 rounded px-5 py-3 text-xs font-bold tracking-[0.14em] text-indigo-100"
              style={{ border: '1px solid rgba(129,140,248,0.65)', background: 'rgba(88,101,242,0.18)' }}
            >
              <LogIn size={16} /> SIGN IN WITH DISCORD
            </button>
          </>
        )}
      </div>
    </div>
  );
}
