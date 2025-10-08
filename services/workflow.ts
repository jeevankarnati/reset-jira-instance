import { DefaultJiraClientType } from "@narthia/jira-client";

export const resetWorkflows = async (jiraClient: DefaultJiraClientType) => {
  console.log("Deleting workflows...");
  const maxResults = 100;
  const startAt = 0;

  const firstPage = await jiraClient.workflows.getWorkflowsPaginated({
    maxResults,
    startAt,
  });

  if (!firstPage.success) {
    return firstPage;
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allWorkflows = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
    const pageIndexes = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
    const pagePromises = pageIndexes.map((pageIndex) =>
      jiraClient.workflows.getWorkflowsPaginated({
        maxResults,
        startAt: pageIndex * maxResults,
      })
    );
    const pages = await Promise.all(pagePromises);
    for (const page of pages) {
      if (!page.success) {
        return page;
      }
      allWorkflows = allWorkflows.concat(page.data?.values ?? []);
    }
  }
  console.log("Workflows fetched:", allWorkflows.length);
  for (const [index, workflow] of allWorkflows.entries()) {
    console.log(`Deleting workflow ${index + 1}:`, workflow.id.name);
    const deleteWorkflow = await jiraClient.workflows.deleteInactiveWorkflow({
      entityId: workflow.id.entityId!,
    });
    if (deleteWorkflow.success) {
      console.log(`Workflow ${index + 1} deleted:`, workflow.id.name);
    } else {
      console.error("Failed to delete workflow:", deleteWorkflow.error);
    }
  }

  console.log("Workflows deleted");
};
