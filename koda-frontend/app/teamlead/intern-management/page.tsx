import InternManagementView from '@/components/intern-management-view';

export default function TeamLeadInternManagementPage() {
  return (
    <InternManagementView
      profileBasePath="/teamlead/intern"
      title="Team Management"
      subtitle="Manage and monitor team progress and performance"
      showAssignedPeriod={false}
      showReportStatus={false}
    />
  );
}
