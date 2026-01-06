import { AuthGuard } from '@/components/auth/auth-guard';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-muted/30">
        <Sidebar />
        <div className="lg:pl-64">
          <Header />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
