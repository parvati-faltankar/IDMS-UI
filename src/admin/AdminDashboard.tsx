import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  LayoutGrid,
  Search,
  Star,
  TrendingUp,
  X,
} from 'lucide-react';
import AdminShell from './AdminShell';
import { adminNavGroups, allAdminMasters } from './adminNavConfig';
import {
  loadAdminFavorites,
  loadRecentAdminMasters,
  recordRecentAdminMaster,
  toggleAdminFavorite,
} from './adminStorage';
import { navigateToHash } from '../components/common/appShellShared';
import { cn } from '../utils/classNames';

const TOTAL_MASTERS = allAdminMasters.length;
const TOTAL_GROUPS = adminNavGroups.length;
const MOCK_SETUP_PERCENT = 72;
const MOCK_CONFIGURED = Math.round(TOTAL_MASTERS * (MOCK_SETUP_PERCENT / 100));

const PENDING_ALERTS = [
  { id: 1, message: 'Organisation Master is not fully configured', severity: 'warning' as const },
  { id: 2, message: 'No approval workflow defined for Finance documents', severity: 'error' as const },
  { id: 3, message: 'Warehouse zone mapping is incomplete', severity: 'warning' as const },
];

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [heroSearch, setHeroSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => loadAdminFavorites());
  const [recentMasters] = useState(() => loadRecentAdminMasters());
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([]);

  const visibleAlerts = PENDING_ALERTS.filter((a) => !dismissedAlerts.includes(a.id));

  const heroSearchLower = heroSearch.toLowerCase().trim();
  const heroResults = heroSearchLower
    ? allAdminMasters.filter(
        (m) =>
          m.label.toLowerCase().includes(heroSearchLower) ||
          m.description.toLowerCase().includes(heroSearchLower) ||
          m.groupLabel.toLowerCase().includes(heroSearchLower)
      )
    : [];

  const handleMasterNavigate = (masterKey: string, label: string, path: string, groupLabel: string, groupIconBg: string, groupIconColor: string) => {
    recordRecentAdminMaster({ key: masterKey, label, path, groupLabel, groupIconBg, groupIconColor });
    navigate(path);
  };

  const handleFavoriteToggle = (e: React.MouseEvent, masterKey: string) => {
    e.stopPropagation();
    setFavorites(toggleAdminFavorite(masterKey));
  };

  const favoritedMasters = favorites
    .map((key) => allAdminMasters.find((m) => m.key === key))
    .filter(Boolean) as typeof allAdminMasters;

  return (
    <AdminShell>
      <div className="min-h-full" style={{ background: 'var(--color-surface-subtle)' }}>

        {/* ── Hero Banner ───────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)',
          }}
        >
          {/* Background decoration */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
                radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
          <div className="relative px-6 pt-8 pb-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-2">
                <LayoutGrid size={16} className="text-indigo-300" />
                <span className="text-xs font-semibold uppercase tracking-widest text-indigo-300">Admin Panel</span>
              </div>
              <div role="heading" aria-level={1} className="text-xl font-bold text-white mb-1">System Configuration</div>
              <p className="text-sm text-indigo-200 mb-6">
                Configure and manage all master data, access controls, and business rules for your organisation.
              </p>

              {/* Hero Search */}
              <div className="relative max-w-xl">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="Search any master, e.g. Customer, Service, Invoice…"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    color: 'var(--color-text)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                  }}
                  aria-label="Search admin masters"
                  autoComplete="off"
                />
                {heroSearch && (
                  <button
                    type="button"
                    onClick={() => setHeroSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}

                {/* Hero search dropdown */}
                {heroResults.length > 0 && (
                  <div
                    className="absolute left-0 right-0 top-full mt-1.5 rounded-xl shadow-2xl border overflow-hidden z-50"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                  >
                    <div className="max-h-72 overflow-y-auto">
                      {heroResults.slice(0, 8).map((master) => {
                        const GroupIcon = master.groupIcon;
                        return (
                          <button
                            key={master.key}
                            type="button"
                            onClick={() => {
                              handleMasterNavigate(master.key, master.label, master.path, master.groupLabel, master.groupIconBg, master.groupIconColor);
                              setHeroSearch('');
                            }}
                            className="flex items-center w-full gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                          >
                            <span
                              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: master.groupIconBg }}
                            >
                              <GroupIcon size={14} style={{ color: master.groupIconColor }} />
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                                {master.label}
                              </div>
                              <div className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                                {master.groupLabel}
                              </div>
                            </div>
                            <ArrowRight size={13} style={{ color: 'var(--color-text-muted)' }} />
                          </button>
                        );
                      })}
                    </div>
                    {heroResults.length > 8 && (
                      <div className="px-4 py-2 border-t text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                        +{heroResults.length - 8} more results — refine your search
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div
            className="px-6 pb-0 grid grid-cols-2 sm:grid-cols-4 gap-3"
            style={{ marginBottom: '-20px' }}
          >
            {[
              { label: 'Total Masters', value: TOTAL_MASTERS, icon: LayoutGrid, color: '#6366F1' },
              { label: 'Groups', value: TOTAL_GROUPS, icon: TrendingUp, color: '#10B981' },
              { label: 'Configured', value: `${MOCK_CONFIGURED} / ${TOTAL_MASTERS}`, icon: CheckCircle2, color: '#F59E0B' },
              { label: 'Pending Alerts', value: visibleAlerts.length, icon: AlertCircle, color: visibleAlerts.length > 0 ? '#EF4444' : '#10B981' },
            ].map((stat) => {
              const StatIcon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-xl p-4 shadow-lg"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <StatIcon size={14} style={{ color: stat.color }} />
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{stat.label}</span>
                  </div>
                  <div className="text-base font-bold" style={{ color: 'var(--color-text)' }}>{stat.value}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Main Content ──────────────────────────────────────────── */}
        <div className="px-6 pt-10 pb-8 max-w-[1400px]">

          {/* Setup Progress */}
          <div
            className="mb-6 p-4 rounded-xl border"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>Setup Completion</span>
                <span className="ml-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {MOCK_CONFIGURED} of {TOTAL_MASTERS} masters configured
                </span>
              </div>
              <span className="text-base font-bold" style={{ color: 'var(--color-primary)' }}>{MOCK_SETUP_PERCENT}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${MOCK_SETUP_PERCENT}%`, background: 'var(--color-primary)' }}
              />
            </div>
          </div>

          {/* Alerts */}
          {visibleAlerts.length > 0 && (
            <div className="mb-6 space-y-2">
              {visibleAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl border"
                  style={{
                    background: alert.severity === 'error' ? '#FEF2F2' : '#FFFBEB',
                    borderColor: alert.severity === 'error' ? '#FECACA' : '#FDE68A',
                  }}
                >
                  <AlertCircle
                    size={15}
                    className="flex-shrink-0 mt-0.5"
                    style={{ color: alert.severity === 'error' ? '#DC2626' : '#D97706' }}
                  />
                  <span className="flex-1 text-sm" style={{ color: alert.severity === 'error' ? '#991B1B' : '#92400E' }}>
                    {alert.message}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDismissedAlerts((prev) => [...prev, alert.id])}
                    className="flex-shrink-0 opacity-60 hover:opacity-100"
                    aria-label="Dismiss alert"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Favorites + Recent row */}
          {(favoritedMasters.length > 0 || recentMasters.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {favoritedMasters.length > 0 && (
                <QuickAccessCard
                  title="Favourites"
                  icon={<Star size={14} className="text-amber-500" />}
                  items={favoritedMasters.slice(0, 5)}
                  favorites={favorites}
                  onNavigate={handleMasterNavigate}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              )}
              {recentMasters.length > 0 && (
                <QuickAccessCard
                  title="Recently Visited"
                  icon={<Clock size={14} style={{ color: 'var(--color-text-muted)' }} />}
                  items={recentMasters.slice(0, 5).map((r) => {
                    const found = allAdminMasters.find((m) => m.key === r.key);
                    return found ?? null;
                  }).filter(Boolean) as typeof allAdminMasters}
                  favorites={favorites}
                  onNavigate={handleMasterNavigate}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              )}
            </div>
          )}

          {/* Module Groups Grid */}
          <div className="mb-4">
            <div role="heading" aria-level={2} className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              All Modules
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {adminNavGroups.map((group) => {
                const GroupIcon = group.icon;
                const topMasters = group.masters.slice(0, 3);
                return (
                  <div
                    key={group.key}
                    className="rounded-xl border p-4 hover:shadow-md transition-all duration-200 group cursor-pointer"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                    onClick={() => navigate(`${group.masters[0].path}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') navigate(`${group.masters[0].path}`); }}
                  >
                    {/* Card Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <span
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: group.iconBg }}
                      >
                        <GroupIcon size={18} style={{ color: group.iconColor }} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold leading-tight" style={{ color: 'var(--color-text)' }}>
                          {group.label}
                        </div>
                        <div
                          className="text-xs mt-0.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
                          style={{ background: group.iconBg, color: group.iconColor }}
                        >
                          {group.masters.length} masters
                        </div>
                      </div>
                    </div>

                    {/* Top masters */}
                    <div className="space-y-1 mb-3">
                      {topMasters.map((master) => (
                        <button
                          key={master.key}
                          type="button"
                          className="flex items-center w-full gap-1.5 text-left px-1 py-0.5 rounded hover:bg-gray-50 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMasterNavigate(master.key, master.label, master.path, group.label, group.iconBg, group.iconColor);
                          }}
                        >
                          <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: group.iconColor }} />
                          <span className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{master.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* View all link */}
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs font-medium transition-colors hover:underline"
                      style={{ color: group.iconColor }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(group.masters[0].path);
                      }}
                    >
                      View all {group.masters.length} masters
                      <ArrowRight size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

// ─── Quick Access Card ────────────────────────────────────────────────────────

interface QuickAccessCardProps {
  title: string;
  icon: React.ReactNode;
  items: typeof allAdminMasters;
  favorites: string[];
  onNavigate: (key: string, label: string, path: string, groupLabel: string, groupIconBg: string, groupIconColor: string) => void;
  onFavoriteToggle: (e: React.MouseEvent, key: string) => void;
}

const QuickAccessCard: React.FC<QuickAccessCardProps> = ({ title, icon, items, favorites, onNavigate, onFavoriteToggle }) => (
  <div
    className="rounded-xl border p-4"
    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
  >
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>{title}</span>
    </div>
    <div className="space-y-0.5">
      {items.map((master) => {
        const GroupIcon = master.groupIcon;
        const isFav = favorites.includes(master.key);
        return (
          <div
            key={master.key}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer group transition-colors"
            onClick={() => onNavigate(master.key, master.label, master.path, master.groupLabel, master.groupIconBg, master.groupIconColor)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onNavigate(master.key, master.label, master.path, master.groupLabel, master.groupIconBg, master.groupIconColor); }}
          >
            <span className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: master.groupIconBg }}>
              <GroupIcon size={12} style={{ color: master.groupIconColor }} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate" style={{ color: 'var(--color-text)' }}>{master.label}</div>
              <div className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{master.groupLabel}</div>
            </div>
            <button
              type="button"
              onClick={(e) => onFavoriteToggle(e, master.key)}
              className={cn('p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity', isFav && 'opacity-100')}
              aria-label={isFav ? 'Remove favourite' : 'Add favourite'}
            >
              <Star size={11} fill={isFav ? '#F59E0B' : 'none'} stroke={isFav ? '#F59E0B' : 'currentColor'} style={{ color: isFav ? '#F59E0B' : 'var(--color-text-muted)' }} />
            </button>
          </div>
        );
      })}
    </div>
  </div>
);

export default AdminDashboard;
