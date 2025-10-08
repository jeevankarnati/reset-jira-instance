import { DefaultJiraClientType } from "@narthia/jira-client";
import { createSpinner } from "../utils/spinner";

export const resetWorkflows = async (jiraClient: DefaultJiraClientType) => {
  const spinner = createSpinner();

  spinner.start("Starting workflow reset process...");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  spinner.success("Workflow reset process started");

  const maxResults = 100;
  const startAt = 0;

  spinner.start("Fetching workflows (first page)...");
  const firstPage = await jiraClient.workflows.getWorkflowsPaginated({
    maxResults,
    startAt,
  });

  if (!firstPage.success) {
    spinner.error(`Failed to fetch workflows: ${firstPage.error}`);
    return firstPage;
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allWorkflows = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
    spinner.start(`Fetching remaining ${totalPages - 1} pages of workflows...`);

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
        spinner.error(`Failed to fetch workflow page: ${page.error}`);
        return page;
      }
      allWorkflows = allWorkflows.concat(page.data?.values ?? []);
    }
  }

  spinner.success(
    `Workflows fetched successfully (${allWorkflows.length} workflows found)`
  );

  if (allWorkflows.length === 0) {
    spinner.info("No workflows found to delete");
    return;
  }

  console.log("Starting workflow deletion process...");
  let successCount = 0;
  let errorCount = 0;

  for (const [index, workflow] of allWorkflows.entries()) {
    spinner.start(
      `Deleting workflow ${index + 1}/${allWorkflows.length}: ${
        workflow.id.name
      }`
    );
    const deleteWorkflow = await jiraClient.workflows.deleteInactiveWorkflow({
      entityId: workflow.id.entityId!,
    });
    if (deleteWorkflow.success) {
      spinner.success(
        `Workflow ${index + 1} deleted successfully: ${workflow.id.name}`
      );
      successCount++;
    } else {
      spinner.error(
        `Failed to delete workflow ${index + 1}: ${workflow.id.name} - ${
          deleteWorkflow.error
        }`
      );
      errorCount++;
    }
  }

  console.log(
    `📊 SUMMARY: Workflow deletion completed - ${successCount} successful, ${errorCount} failed`
  );
  if (errorCount === 0) {
    console.log("🎉 SUCCESS: All workflows deleted successfully!");
  } else {
    console.warn(`⚠️  WARNING: ${errorCount} workflows failed to delete`);
  }
};
