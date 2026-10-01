import DashboardGuard from '@/components/dashboard-guard';
import DashboardChrome from '@/components/dashboard/chrome';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardGuard>
      <DashboardChrome>{children}</DashboardChrome>
    </DashboardGuard>
  );
}
