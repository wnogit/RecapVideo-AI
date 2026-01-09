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
      <div className="dark min-h-screen bg-background text-foreground antialiased selection:bg-purple-500/30">
        <Sidebar />
        <div className="lg:pl-60">
          <Header />
          <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
