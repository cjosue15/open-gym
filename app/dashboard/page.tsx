import DashboardGuard from "@/components/dashboard-guard";
import GymDashboard from "@/components/gym-dashboard";

export default function DashboardPage() {
  return (
    <DashboardGuard>
      <GymDashboard />
    </DashboardGuard>
  );
}
