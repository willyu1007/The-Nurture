import { Scene } from "@willyu1007/web-workbench";

// Placeholder so the queue's rows and drawers have a destination until P6
// builds the record.
export default async function JourneyRecordPage({
  params,
}: {
  readonly params: Promise<{ readonly ref: string }>;
}) {
  const { ref } = await params;
  return (
    <Scene>
      <p className="mt-body">流程详情将在此处呈现（{decodeURIComponent(ref)}）。</p>
    </Scene>
  );
}
