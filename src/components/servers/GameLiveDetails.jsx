import React from 'react';
import { Activity, Building2, CalendarDays, Clock3, Gauge, Hash, Timer, Users } from 'lucide-react';

function formatUptime(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value < 0) return '—';
  const days = Math.floor(value / 86400);
  const hours = Math.floor((value % 86400) / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-sky-400/15 bg-sky-400/[0.04] p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-mono tracking-wider text-sky-300/70">
        <Icon size={12} /> {label}
      </div>
      <div className="truncate text-sm font-bold text-sky-100">{value ?? '—'}</div>
    </div>
  );
}

export default function GameLiveDetails({ server }) {
  const live = server?.live;
  if (!live?.available) return null;

  if (live.queryType === 'palworld-rest') {
    const metrics = live.metrics || {};
    return (
      <section className="mt-5 rounded-xl border border-sky-400/20 bg-sky-400/[0.035] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-300">
              <Activity size={14} /> Palworld live telemetry
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Live data from the Palworld REST API.</p>
          </div>
          <span className="rounded border border-sky-400/20 bg-sky-400/5 px-2 py-1 text-[10px] font-mono text-sky-300">REST LIVE</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Detail icon={Gauge} label="SERVER FPS" value={metrics.serverFps == null ? '—' : `${Math.round(metrics.serverFps)} FPS`} />
          <Detail icon={Activity} label="AVERAGE FPS" value={metrics.serverFpsAverage == null ? '—' : `${Number(metrics.serverFpsAverage).toFixed(1)} FPS`} />
          <Detail icon={Timer} label="FRAME TIME" value={metrics.serverFrameTime == null ? '—' : `${Number(metrics.serverFrameTime).toFixed(2)} ms`} />
          <Detail icon={CalendarDays} label="WORLD DAY" value={metrics.worldDays == null ? '—' : String(metrics.worldDays)} />
          <Detail icon={Clock3} label="UPTIME" value={formatUptime(metrics.uptimeSeconds)} />
          <Detail icon={Building2} label="BASE CAMPS" value={metrics.baseCampCount == null ? '—' : String(metrics.baseCampCount)} />
          <Detail icon={Users} label="PLAYERS" value={`${live.playersCurrent ?? 0}/${live.playersMax ?? server?.players?.max ?? 32}`} />
          <Detail icon={Hash} label="WORLD GUID" value={live.worldGuid || '—'} />
        </div>
      </section>
    );
  }

  return null;
}
