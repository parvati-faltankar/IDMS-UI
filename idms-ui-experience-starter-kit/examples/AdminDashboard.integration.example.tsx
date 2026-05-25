import { useState } from "react";
import { PageHeader } from "../src/experience/components/PageHeader/PageHeader";
import { HelpDrawer } from "../src/experience/components/HelpDrawer/HelpDrawer";
import { AdminSetupAssistant } from "../src/experience/components/AdminSetupAssistant/AdminSetupAssistant";
import { adminSetupGuide } from "../src/experience/help/adminGuides";
import { getHelpTopic } from "../src/experience/help/helpTopics";

export function AdminDashboardIntegrationExample() {
  const [helpTopicId, setHelpTopicId] = useState<string | undefined>();

  const items = adminSetupGuide.map((item) => ({
    id: item.id,
    label: item.label,
    description: item.description,
    status: item.defaultStatus,
    path: item.targetPath,
  }));

  return (
    <div className="p-6">
      <PageHeader
        title="Admin Dashboard"
        description="Complete essential setup before transaction users begin work."
        breadcrumbs={["Admin"]}
        helpTopicId="admin-dashboard"
        onHelpClick={setHelpTopicId}
      />

      <AdminSetupAssistant
        items={items}
        onOpenItem={(item) => {
          if (item.path) window.location.hash = item.path;
        }}
      />

      <HelpDrawer
        open={Boolean(helpTopicId)}
        topic={getHelpTopic(helpTopicId)}
        onClose={() => setHelpTopicId(undefined)}
      />
    </div>
  );
}
