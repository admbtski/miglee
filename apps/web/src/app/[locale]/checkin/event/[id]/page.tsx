/**
 * Event QR Check-in Page
 * Users scan the event QR code and land here for automatic check-in
 */

import { EventQRCheckinClient } from './_components/event-qr-checkin-client';

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
  searchParams: Promise<{
    token?: string;
  }>;
}

export default async function EventQRCheckinPage({
  params,
  searchParams,
}: PageProps) {
  const { id: eventId } = await params;
  const { token } = await searchParams;

  return <EventQRCheckinClient eventId={eventId} token={token} />;
}
