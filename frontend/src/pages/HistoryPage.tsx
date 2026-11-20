import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Minus, UserPlus } from 'lucide-react';
import { historyApi, VerificationLogItem } from '../api/historyApi';
import { usePrefs } from '../context/PrefsContext';
import type { Key } from '../lib/i18n';

type Filter = 'all' | 'ok' | 'spoof';

const FILTERS: { id: Filter; label: Key }[] = [
  { id: 'all', label: 'h_all' },
  { id: 'ok', label: 'h_ok' },
  { id: 'spoof', label: 'h_spoof' },
];

function describe(log: VerificationLogItem) {
  switch (log.status) {
    case 'VERIFIED':
      return { text: 's_verified' as Key, icon: <Check className="w-4 h-4" />, cls: 'bg-ok/10 text-ok' };
    case 'SPOOF_REJECTED':
      return { text: 's_spoof' as Key, icon: <X className="w-4 h-4" />, cls: 'bg-bad/10 text-bad' };
    case 'ENROLLED':
      return { text: 's_enrolled' as Key, icon: <UserPlus className="w-4 h-4" />, cls: 'bg-accent/10 text-accent' };
    case 'IDENTITY_MISMATCH':
      return { text: 's_mismatch' as Key, icon: <Minus className="w-4 h-4" />, cls: 'bg-warn/10 text-warn' };
    default:
      return { text: 's_other' as Key, icon: <Minus className="w-4 h-4" />, cls: 'bg-fill text-ink-3' };
  }
}

// SQLite drops the timezone, so the API sends UTC without "Z". Treat such values as UTC.
const toDate = (iso: string) => new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);

function ago(iso: string, lang: string) {
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  const s = (toDate(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(s);
  if (abs < 60) return rtf.format(Math.round(s), 'second');
  if (abs < 3600) return rtf.format(Math.round(s / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(s / 3600), 'hour');
  if (abs < 86400 * 7) return rtf.format(Math.round(s / 86400), 'day');
  return toDate(iso).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const HistoryPage: React.FC = () => {
  const { t, lang } = usePrefs();
  const [filter, setFilter] = useState<Filter>('all');
  const [logs, setLogs] = useState<VerificationLogItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLogs(null);
    setFailed(false);
    historyApi
      .getHistory({
        limit: 50,
        status: filter === 'ok' ? 'VERIFIED' : undefined,
        verdict: filter === 'spoof' ? 'SPOOF' : undefined,
      })
      .then((d) => setLogs(d.items.filter((l) => l.status !== 'TEMPLATE_PURGED')))
      .catch(() => setFailed(true));
  }, [filter]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-end justify-between gap-4 mb-5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('h_title')}</h1>
        <div className="relative flex p-1 rounded-full bg-fill" role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`relative h-9 px-4 rounded-full text-sm font-medium ${filter === f.id ? 'text-ink' : 'text-ink-3'}`}
            >
              {filter === f.id && (
                <motion.span layoutId="hist-seg" transition={{ type: 'spring', stiffness: 500, damping: 38 }} className="absolute inset-0 rounded-full bg-pill shadow-sm" />
              )}
              <span className="relative">{t(f.label)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-4xl overflow-hidden">
        {failed && <p className="p-8 text-center text-ink-3">{t('h_failed')}</p>}
        {!failed && logs === null && (
          <ul aria-busy className="divide-y divide-line">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="flex items-center gap-4 px-5 py-4">
                <span className="w-9 h-9 rounded-full bg-fill animate-pulse" />
                <span className="flex-1 h-4 rounded bg-fill animate-pulse" />
              </li>
            ))}
          </ul>
        )}
        {logs && logs.length === 0 && <p className="p-10 text-center text-ink-3">{t('h_empty')}</p>}
        {logs && logs.length > 0 && (
          <ul className="divide-y divide-line">
            {logs.map((log, i) => {
              const d = describe(log);
              const who = log.detected_identity || log.claimed_identifier || t('h_unknown');
              return (
                <motion.li
                  key={log.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 10) * 0.03 }}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <span className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${d.cls}`} aria-hidden>
                    {d.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{who}</div>
                    <div className="text-sm text-ink-3">{t(d.text)}</div>
                  </div>
                  <time className="text-sm text-ink-4 shrink-0" dateTime={log.timestamp}>
                    {ago(log.timestamp, lang)}
                  </time>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
