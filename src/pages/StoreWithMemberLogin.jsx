import { LogIn, LogOut, PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import Store from './Store';

export default function StoreWithMemberLogin() {
  const { member, loginWithDiscord, logoutMember } = useAuth();

  return (
    <>
      <div className="px-4 pt-24">
        <div className="max-w-6xl mx-auto relative z-20">
          <div
            className="flex flex-col gap-4 rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between"
            style={{
              background: 'rgba(88,101,242,0.08)',
              border: '1px solid rgba(88,101,242,0.35)',
              boxShadow: '0 0 24px rgba(88,101,242,0.08)',
            }}
          >
            {member ? (
              <>
                <div className="flex items-center gap-3">
                  {member.avatar ? (
                    <img src={member.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                  ) : (
                    <div className="h-11 w-11 rounded-full bg-indigo-500/20" />
                  )}
                  <div>
                    <div className="text-xs font-bold tracking-[0.16em] text-indigo-300">MEMBER ACCOUNT</div>
                    <div className="font-bold text-white">{member.displayName || member.username}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/inventory"
                    className="inline-flex items-center gap-2 rounded px-4 py-2 text-xs font-bold tracking-wider text-emerald-glow"
                    style={{ border: '1px solid rgba(16,255,139,0.4)', background: 'rgba(16,255,139,0.08)' }}
                  >
                    <PackageOpen size={15} /> MY ITEMS
                  </Link>
                  <button
                    onClick={logoutMember}
                    className="inline-flex items-center gap-2 rounded px-4 py-2 text-xs font-bold tracking-wider text-gray-300"
                    style={{ border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.04)' }}
                  >
                    <LogOut size={15} /> SIGN OUT
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="text-xs font-bold tracking-[0.16em] text-indigo-300">APEXORDER MEMBERS</div>
                  <div className="mt-1 font-bold text-white">Sign in with Discord to purchase items and view your inventory.</div>
                </div>
                <button
                  onClick={() => loginWithDiscord('/store')}
                  className="inline-flex items-center justify-center gap-2 rounded px-5 py-3 text-xs font-bold tracking-[0.16em] text-indigo-100"
                  style={{ border: '1px solid rgba(88,101,242,0.75)', background: 'rgba(88,101,242,0.18)' }}
                >
                  <LogIn size={16} /> SIGN IN WITH DISCORD
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="-mt-20">
        <Store />
      </div>
    </>
  );
}
