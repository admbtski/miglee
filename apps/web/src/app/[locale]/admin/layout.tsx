import { AdminSidebar } from '@/features/admin';
import { AdminHeader } from '@/features/admin';
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
      <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto max-w-6xl px-4 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export const metadata = {
  title: 'Panel Administratora | Appname',
  description: 'Panel zarządzania platformą',
};
