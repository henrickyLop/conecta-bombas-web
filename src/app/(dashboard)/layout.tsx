import Sidebar from '@/components/Sidebar';
import AuthGuard from '@/components/AuthGuard';
import OnboardingModal from '@/components/OnboardingModal';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard type="auth">
      <OnboardingModal />
      <div className="min-h-screen bg-[#FAFAFA]">
        <Sidebar />
        <div className="lg:ml-64 pt-14 lg:pt-0">
          <main className="p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
