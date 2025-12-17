'use client';

import {
  Calendar,
  Flag,
  Star,
  Users,
  MessageSquare,
  DollarSign,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { KPICard } from '@/features/admin';
import { AlertCard } from '@/features/admin';

export default function AdminDashboard() {
  // TODO: Replace with real data from API
  const kpis = {
    activeEvents: 142,
    activeEVENTSend: '+12%',
    fullOrLocked: '23%',
    fullOrLockedTrend: '+5%',
    joinRequests: 34,
    joinRequestsTrend: '+8',
    openReports: 7,
    openReportsTrend: '+2',
    newReviews: 18,
    newReviewsTrend: '+6',
    unreadDM: 156,
    unreadDMTrend: '+23',
    activeSponsorships: 12,
    activeSponsorshipsTrend: '0',
  };

  const alerts = [
    {
      id: '1',
      type: 'warning' as const,
      title: 'Dużo oczekujących wniosków',
      description: '34 wniosków o dołączenie czeka na zatwierdzenie',
      action: 'Zobacz wnioski',
      href: '/admin/events?filter=pending',
    },
    {
      id: '2',
      type: 'error' as const,
      title: 'Otwarte raporty',
      description: '7 raportów wymaga przeglądu moderatora',
      action: 'Przejdź do raportów',
      href: '/admin/reports',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Przegląd aktywności platformy
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Aktywne wydarzenia"
          value={kpis.activeEvents}
          trend={kpis.activeEVENTSend}
          icon={Calendar}
          color="blue"
        />
        <KPICard
          title="Pełne/Zablokowane"
          value={kpis.fullOrLocked}
          trend={kpis.fullOrLockedTrend}
          icon={TrendingUp}
          color="amber"
        />
        <KPICard
          title="Wnioski o dołączenie"
          value={kpis.joinRequests}
          trend={kpis.joinRequestsTrend}
          icon={Users}
          color="green"
        />
        <KPICard
          title="Otwarte raporty"
          value={kpis.openReports}
          trend={kpis.openReportsTrend}
          icon={Flag}
          color="red"
        />
        <KPICard
          title="Nowe recenzje"
          value={kpis.newReviews}
          trend={kpis.newReviewsTrend}
          icon={Star}
          color="purple"
        />
        <KPICard
          title="Nieprzeczytane DM"
          value={kpis.unreadDM}
          trend={kpis.unreadDMTrend}
          icon={MessageSquare}
          color="indigo"
        />
        <KPICard
          title="Aktywne sponsorstwa"
          value={kpis.activeSponsorships}
          trend={kpis.activeSponsorshipsTrend}
          icon={DollarSign}
          color="emerald"
        />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Alerty
          </h2>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <AlertCard key={alert.id} {...alert} />
            ))}
          </div>
        </div>
      )}

      {/* TODO: Add charts section */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Wykresy i statystyki
        </h2>
        <div className="flex items-center justify-center py-12 text-zinc-500 dark:text-zinc-400">
          <div className="text-center">
            <BarChart3 className="mx-auto h-12 w-12 opacity-50" />
            <p className="mt-2 text-sm">Wykresy będą dostępne wkrótce</p>
            <p className="mt-1 text-xs">
              (Events per MeetingKind, heatmapa, rozkład Level, rating
              distribution)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
