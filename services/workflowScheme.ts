import { DefaultJiraClientType } from "@narthia/jira-client";

export const resetWorkflowSchemes = async (
  jiraClient: DefaultJiraClientType
) => {
  console.log("Deleting workflow schemes...");
  const maxResults = 100;
  const startAt = 0;

  const firstPage = await jiraClient.workflowSchemes.getAllWorkflowSchemes({
    maxResults,
    startAt,
  });

  if (!firstPage.success) {
    return firstPage;
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allWorkflowSchemes = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
    const pageIndexes = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
    const pagePromises = pageIndexes.map((pageIndex) =>
      jiraClient.workflowSchemes.getAllWorkflowSchemes({
        maxResults,
        startAt: pageIndex * maxResults,
      })
    );
    const pages = await Promise.all(pagePromises);
    for (const page of pages) {
      if (!page.success) {
        return page;
      }
      allWorkflowSchemes = allWorkflowSchemes.concat(page.data?.values ?? []);
    }
  }
  console.log("Workflow schemes fetched:", allWorkflowSchemes.length);
  for (const [index, workflowScheme] of allWorkflowSchemes.entries()) {
    console.log(`Deleting workflow scheme ${index + 1}:`, workflowScheme.name);
    const deleteWorkflowScheme =
      await jiraClient.workflowSchemes.deleteWorkflowScheme({
        id: workflowScheme.id!,
      });
    if (deleteWorkflowScheme.success) {
      console.log(`Workflow scheme ${index + 1} deleted:`, workflowScheme.name);
    } else {
      console.error(
        "Failed to delete workflow scheme:",
        deleteWorkflowScheme.error
      );
    }
  }
  console.log("Workflow schemes deleted");
};
