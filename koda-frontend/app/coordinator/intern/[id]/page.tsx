import InternProfileView from '@/components/InternProfileView';

export default function InternProfilePage({ params }: { params: { id: string } }) {
  return (
    <InternProfileView
      internId={params.id}
      canManageReports={false}
      canReviewReports={true}
    />
  );
}
