import { Metadata } from 'next';
import { MyJoinRequestsClient } from './_components/my-join-requests-client';

export const metadata: Metadata = {
  title: 'Moje prośby | Miglee',
  description: 'Zarządzaj swoimi prośbami o dołączenie do wydarzeń',
};

export default function MyJoinRequestsPage() {
  return <MyJoinRequestsClient />;
}
