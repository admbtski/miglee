import { EventCard } from './event-card';

// ===== Demo Playground =====
export function EventCardPanel() {
  const base = {
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    organizerName: 'Jan Kowalski',
    description: 'Spotkanie biegowe – tempo rekreacyjne, 5–7 km.',
    location: 'Park Skaryszewski, Warszawa',
    min: 5,
    max: 12,
    tags: ['bieganie', 'outdoor', 'sport'],
  };

  const now = new Date();

  const startFuture = new Date(now.getTime() + 6 * 3600000);
  const endFuture = new Date(startFuture.getTime() + 2 * 3600000);
  const startSoon = new Date(now.getTime() + 30 * 60000);
  const endSoon = new Date(startSoon.getTime() + 2 * 3600000);
  const startPast = new Date(now.getTime() - 4 * 3600000);
  const endPast = new Date(startPast.getTime() + 2 * 3600000);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 p-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {/* Dostępne */}
        <EventCard
          {...base}
          joined={3}
          startISO={startFuture.toISOString()}
          endISO={endFuture.toISOString()}
        />
        {/* Prawie pełne */}
        <EventCard
          {...base}
          joined={11}
          startISO={startFuture.toISOString()}
          endISO={endFuture.toISOString()}
        />
        {/* Brak miejsc */}
        <EventCard
          {...base}
          joined={12}
          startISO={startFuture.toISOString()}
          endISO={endFuture.toISOString()}
        />
        {/* Blokada zapisów na 1h przed */}
        <EventCard
          {...base}
          joined={5}
          startISO={startSoon.toISOString()}
          endISO={endSoon.toISOString()}
          lockHoursBeforeStart={2}
        />
        {/* Trwa teraz */}
        <EventCard
          {...base}
          joined={7}
          startISO={startPast.toISOString()}
          endISO={endPast.toISOString()}
        />
        {/* Zakończone */}
        <EventCard
          {...base}
          joined={8}
          startISO={startPast.toISOString()}
          endISO={new Date(now.getTime() - 30 * 60000).toISOString()}
        />
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm">
        {/* Dostępne */}
        <EventCard
          {...base}
          joined={3}
          startISO={startFuture.toISOString()}
          endISO={endFuture.toISOString()}
          inline
        />
        {/* Prawie pełne */}
        <EventCard
          {...base}
          joined={11}
          startISO={startFuture.toISOString()}
          endISO={endFuture.toISOString()}
          inline
        />
        {/* Brak miejsc */}
        <EventCard
          {...base}
          joined={12}
          startISO={startFuture.toISOString()}
          endISO={endFuture.toISOString()}
          inline
        />
        {/* Blokada zapisów na 1h przed */}
        <EventCard
          {...base}
          joined={5}
          startISO={startSoon.toISOString()}
          endISO={endSoon.toISOString()}
          lockHoursBeforeStart={2}
          inline
        />
        {/* Trwa teraz */}
        <EventCard
          {...base}
          joined={7}
          startISO={startPast.toISOString()}
          endISO={endPast.toISOString()}
          inline
        />
        {/* Zakończone */}
        <EventCard
          {...base}
          joined={8}
          startISO={startPast.toISOString()}
          endISO={new Date(now.getTime() - 30 * 60000).toISOString()}
          inline
        />
      </div>
    </div>
  );
}
