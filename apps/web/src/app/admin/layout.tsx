import { AdminSidebar } from './_components/admin-sidebar';
import { AdminHeader } from './_components/admin-header';
import { QueryClientProvider } from '@/lib/config/query-client-provider';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Add proper authentication check
  // const session = await getServerSession();
  // if (!session || session.user.role !== 'ADMIN') {
  //   redirect('/');
  // }

  return (
    <QueryClientProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export const metadata = {
  title: 'Panel Administratora | Miglee',
  description: 'Panel zarządzania platformą',
};
