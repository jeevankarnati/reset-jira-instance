import { DefaultJiraClientType } from "@narthia/jira-client";
import { createSpinner } from "../utils/spinner";

export const resetWorkflowSchemes = async (
  jiraClient: DefaultJiraClientType
) => {
  const spinner = createSpinner();

  spinner.start("Starting workflow scheme reset process...");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  spinner.success("Workflow scheme reset process started");

  const maxResults = 100;
  const startAt = 0;

  spinner.start("Fetching workflow schemes (first page)...");
  const firstPage = await jiraClient.workflowSchemes.getAllWorkflowSchemes({
    maxResults,
    startAt,
  });

  if (!firstPage.success) {
    spinner.error(
      `Failed to fetch workflow schemes: ${JSON.stringify(firstPage.error)}`
    );
    return firstPage;
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allWorkflowSchemes = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
    spinner.start(
      `Fetching remaining ${totalPages - 1} pages of workflow schemes...`
    );

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
        spinner.error(
          `Failed to fetch workflow scheme page: ${JSON.stringify(page.error)}`
        );
        return page;
      }
      allWorkflowSchemes = allWorkflowSchemes.concat(page.data?.values ?? []);
    }
  }

  spinner.success(
    `Workflow schemes fetched successfully (${allWorkflowSchemes.length} workflow schemes found)`
  );

  if (allWorkflowSchemes.length === 0) {
    spinner.info("No workflow schemes found to delete");
    return;
  }

  console.log("Starting workflow scheme deletion process...");
  let successCount = 0;
  let errorCount = 0;

  for (const [index, workflowScheme] of allWorkflowSchemes.entries()) {
    spinner.start(
      `Deleting workflow scheme ${index + 1}/${allWorkflowSchemes.length}: ${
        workflowScheme.name
      }`
    );
    const deleteWorkflowScheme =
      await jiraClient.workflowSchemes.deleteWorkflowScheme({
        id: workflowScheme.id!,
      });
    if (deleteWorkflowScheme.success) {
      spinner.success(
        `Workflow scheme ${index + 1} deleted successfully: ${
          workflowScheme.name
        }`
      );
      successCount++;
    } else {
      spinner.error(
        `Failed to delete workflow scheme ${index + 1}: ${
          workflowScheme.name
        } - ${JSON.stringify(deleteWorkflowScheme.error)}`
      );
      errorCount++;
    }
  }

  console.log(
    `📊 SUMMARY: Workflow scheme deletion completed - ${successCount} successful, ${errorCount} failed`
  );
  if (errorCount === 0) {
    console.log("🎉 SUCCESS: All workflow schemes deleted successfully!");
  } else {
    console.warn(
      `⚠️  WARNING: ${errorCount} workflow schemes failed to delete`
    );
  }
};
