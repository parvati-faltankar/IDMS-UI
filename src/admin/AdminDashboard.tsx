import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Clock, Search, Star, X } from 'lucide-react';
import AdminShell from './AdminShell';
import { adminNavGroups, allAdminMasters } from './adminNavConfig';
import {
  loadAdminFavorites,
  loadRecentAdminMasters,
  recordRecentAdminMaster,
  toggleAdminFavorite,
} from './adminStorage';
import { cn } from '../utils/classNames';
import { PageHeader } from '../experience/components/PageHeader';
import { HelpDrawer } from '../experience/components/HelpDrawer';
import { AdminSetupAssistant } from '../experience/components/AdminSetupAssistant';
import type { AdminSetupItem } from '../experience/components/AdminSetupAssistant';
import { getHelpTopic } from '../experience/help/helpTopics';

const TOTAL_MASTERS = allAdminMasters.length;
const TOTAL_GROUPS = adminNavGroups.length;

const PENDING_ALERTS = [
  { id: 1, message: 'Organisation Master is not fully configured — tax identifiers are missing', severity: 'warning' as const },
  { id: 2, message: 'No active KYC rules found — party verification will fail for new records', severity: 'error' as const },
  { id: 3, message: 'Picklist values for Delivery Mode and Payment Terms are not yet defined', severity: 'warning' as const },
];

const SETUP_ITEMS: AdminSetupItem[] = [
  {
    id: 'organisation',
    label: 'Organisation Setup',
    description: 'Configure legal entity, branches, contact details, and tax identifiers.',
    status: 'needs-attention',
    path: '/admin/master/organisation-master',
  },
  {
    id: 'numbering',
    label: 'Numbering & Codes',
    description: 'Set number prefixes and sequence policies before creating documents.',
    status: 'not-started',
    path: '/admin/master/numbering-code-setup',
  },
  {
    id: 'picklists',
    label: 'Picklist Configuration',
    description: 'Define dropdown values used across forms and transaction documents.',
    status: 'not-started',
    path: '/admin/master/picklist-master',
  },
  {
    id: 'kyc',
    label: 'KYC Rules',
    description: 'Define proof requirements for customers, suppliers, and partners.',
    status: 'not-started',
    path: '/admin/master/kyc-setup',
  },
  {
    id: 'roles',
    label: 'Roles & Access',
    description: 'Set up user roles and access controls for your team.',
    status: 'not-started',
    path: '/admin/master/role-master',
  },
];

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [heroSearch, setHeroSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => loadAdminFavorites());
  const [recentMasters] = useState(() => loadRecentAdminMasters());
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpTopicId, setHelpTopicId] = useState<string | undefined>();

  const visibleAlerts = PENDING_ALERTS.filter((a) => !dismissedAlerts.includes(a.id));
  const helpTopic = getHelpTopic(helpTopicId);

  const heroSearchLower = heroSearch.toLowerCase().trim();
  const heroResults = heroSearchLower
    ? allAdminMasters.filter(
        (m) =>
          m.label.toLowerCase().includes(heroSearchLower) ||
          m.description.toLowerCase().includes(heroSearchLower) ||
          m.groupLabel.toLowerCase().includes(heroSearchLower),
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

  const handleHelpClick = (topicId: string) => {
    setHelpTopicId(topicId);
    setHelpOpen(true);
  };

  const favoritedMasters = favorites
    .map((key) => allAdminMasters.find((m) => m.key === key))
    .filter(Boolean) as typeof allAdminMasters;

  return (
    <AdminShell>
      <div className="min-h-full" style={{ background: 'var(--color-surface-subtle)' }}>

        {/* ── Page Header ──────────────────────────────────────────── */}
        <div
          className="px-6 pt-6"
          style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
        >
          <PageHeader
            title="System Configuration"
            description={`Configure master data, access controls, and business rules for your organisation. ${TOTAL_MASTERS} masters across ${TOTAL_GROUPS} modules.`}
            breadcrumbs={['Admin']}
            helpTopicId="admin-dashboard"
            onHelpClick={handleHelpClick}
          />

          {/* Search ───────────────────────────────────────────────── */}
          <div className="pb-5 max-w-xl relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              value={heroSearch}
              onChange={(e) => setHeroSearch(e.target.value)}
              placeholder="Search any master, e.g. Customer, Service, Invoice…"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none border"
              style={{
                background: 'var(--color-surface-subtle)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
              aria-label="Search admin masters"
              autoComplete="off"
            />
            {heroSearch && (
              <button
                type="button"
                onClick={() => setHeroSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                aria-label="Clear search"
                style={{ color: 'var(--color-text-muted)' }}>
                <X size={14} />
              </button>
            )}
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
                        className="flex items-center w-full gap-3 px-4 py-2.5 hover:bg-[var(--color-surface-subtle)] transition-colors text-left"
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
                  <div
                    className="px-4 py-2 border-t text-xs"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                  >
                    +{heroResults.length - 8} more results — refine your search
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Main Content ──────────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-8 max-w-[1400px]">

          {/* Setup Assistant */}
          <div className="mb-6">
            <AdminSetupAssistant
              title="Setup Assistant"
              description="Complete these areas before your team starts working with transactions."
              items={SETUP_ITEMS}
              onOpenItem={(item) => item.path && navigate(item.path)}
            />
          </div>

          {/* Alerts */}
          {visibleAlerts.length > 0 && (
            <div className="mb-6 space-y-2">
              {visibleAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl border"
                  style={{
                    background: alert.severity === 'error'
                      ? 'color-mix(in srgb, var(--color-danger) 10%, var(--color-surface))'
                      : 'color-mix(in srgb, #f59e0b 10%, var(--color-surface))',
                    borderColor: alert.severity === 'error'
                      ? 'color-mix(in srgb, var(--color-danger) 30%, var(--color-border))'
                      : 'color-mix(in srgb, #f59e0b 30%, var(--color-border))',
                  }}
                >
                  <AlertCircle
                    size={15}
                    className="flex-shrink-0 mt-0.5"
                    style={{ color: alert.severity === 'error' ? 'var(--color-danger)' : 'color-mix(in srgb, #f59e0b 80%, var(--color-text))' }}
                  />
                  <span className="flex-1 text-sm" style={{ color: alert.severity === 'error' ? 'var(--color-danger)' : 'color-mix(in srgb, #f59e0b 75%, var(--color-text))' }}>
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

                    <div className="space-y-1 mb-3">
                      {topMasters.map((master) => (
                        <button
                          key={master.key}
                          type="button"
                          className="flex items-center w-full gap-1.5 text-left px-1 py-0.5 rounded hover:bg-[var(--color-surface-subtle)] transition-colors"
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

        {/* ── Help Drawer ───────────────────────────────────────────── */}
        <HelpDrawer
          open={helpOpen}
          topic={helpTopic}
          onClose={() => setHelpOpen(false)}
          onTopicChange={(id) => setHelpTopicId(id)}
        />
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
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[var(--color-surface-subtle)] cursor-pointer group transition-colors"
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
