import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Maintenance - RecapVideo.AI',
  description: 'We are working on something amazing!',
};

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout is minimal - no header/footer
  return <>{children}</>;
}
