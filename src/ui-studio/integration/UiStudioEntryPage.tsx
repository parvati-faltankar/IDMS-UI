import UiStudioRenderer from '../renderer/UiStudioRenderer';
import { sampleCreateEditView } from '../metadata/sampleCreateEditView';
import { previewContexts } from '../preview/contexts';

export default function UiStudioEntryPage() {
  const previewContext = previewContexts[0];

  if (!previewContext) {
    return null;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 12 }}>UI Studio (Hidden Flag Route)</h1>
      <p style={{ marginBottom: 16 }}>
        This route is intentionally hidden from existing navigation and controlled by build-time feature flag.
      </p>
      <UiStudioRenderer view={sampleCreateEditView} context={previewContext} />
    </div>
  );
}

