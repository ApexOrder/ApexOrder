import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function DynamicPage() {
  const { slug } = useParams();
  const [page,setPage] = useState(null);
  const [loading,setLoading] = useState(true);
  useEffect(() => { let active = true; base44.entities.PageContent.filter({ slug }).then((rows) => { if (active) setPage((rows || []).find((item) => item.published !== false) || null); }).catch(() => {}).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; },[slug]);
  if (loading) return <div className="min-h-screen px-4 pt-32 text-center text-sm text-white/40">Loading page…</div>;
  if (!page) return <div className="mx-auto min-h-screen max-w-4xl px-4 pt-32"><div className="rounded-xl border border-white/10 bg-black/30 p-8 text-center"><h1 className="text-2xl font-black text-white">Page not found</h1><p className="mt-2 text-sm text-white/40">This page is unpublished or has not been created yet.</p><Link to="/" className="mt-5 inline-block text-sm font-bold text-emerald-glow">Return home</Link></div></div>;
  return <div className="mx-auto min-h-screen max-w-5xl px-4 pb-20 pt-28 sm:px-6"><section className="rounded-2xl border border-emerald-glow/15 bg-black/40 p-6 md:p-10"><div className="text-[10px] font-mono uppercase tracking-[.28em] text-emerald-glow/70">{page.subtitle || 'APEXORDER'}</div><h1 className="mt-2 text-4xl font-black text-white">{page.title}</h1>{page.summary && <p className="mt-4 max-w-3xl text-base leading-7 text-white/55">{page.summary}</p>}<div className="mt-8 whitespace-pre-wrap text-sm leading-7 text-white/70">{page.content}</div></section></div>;
}
