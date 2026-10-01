import { Suspense } from 'react';
import TodayView from '@/components/dashboard/today/today-view';

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <TodayView />
    </Suspense>
  );
}
