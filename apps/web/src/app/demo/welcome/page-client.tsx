'use client';

import { useGetEventsQuery } from '@/hooks/useEvents';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export const WelcomePage = () => {
  const { data, isLoading, error } = useGetEventsQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">
          Error loading events: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sports Events
          </h1>
          <p className="text-xl text-gray-600">
            Latest sports events and competitions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {event.title}
              </h2>
              <div className="text-sm text-gray-500">
                <time dateTime={event.createdAt}>
                  {formatDate(event.createdAt)}
                </time>
              </div>
            </div>
          ))}
        </div>

        {data?.events.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No events found</p>
          </div>
        )}
      </div>
    </div>
  );
};
