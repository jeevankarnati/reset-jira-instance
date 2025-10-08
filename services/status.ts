import { DefaultJiraClientType } from "@narthia/jira-client";
import { createSpinner } from "../utils/spinner";

export const resetStatuses = async (jiraClient: DefaultJiraClientType) => {
  const spinner = createSpinner();

  spinner.start("Starting status reset process...");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  spinner.success("Status reset process started");

  const maxResults = 100;
  const startAt = 0;

  spinner.start("Fetching statuses (first page)...");
  const firstPage = await jiraClient.status.search({
    maxResults,
    startAt,
  });

  if (!firstPage.success) {
    spinner.error(
      `Failed to fetch statuses: ${JSON.stringify(firstPage.error)}`
    );
    return firstPage;
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allStatuses = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
    spinner.start(`Fetching remaining ${totalPages - 1} pages of statuses...`);

    const pageIndexes = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
    const pagePromises = pageIndexes.map((pageIndex) =>
      jiraClient.status.search({
        maxResults,
        startAt: pageIndex * maxResults,
      })
    );
    const pages = await Promise.all(pagePromises);
    for (const page of pages) {
      if (!page.success) {
        spinner.error(
          `Failed to fetch status page: ${JSON.stringify(page.error)}`
        );
        return page;
      }
      allStatuses = allStatuses.concat(page.data?.values ?? []);
    }
  }

  spinner.success(
    `Statuses fetched successfully (${allStatuses.length} statuses found)`
  );

  if (allStatuses.length === 0) {
    spinner.info("No statuses found to delete");
    return;
  }

  console.log("Starting status deletion process...");
  let successCount = 0;
  let errorCount = 0;

  for (const [index, status] of allStatuses.entries()) {
    spinner.start(
      `Deleting status ${index + 1}/${allStatuses.length}: ${status.name}`
    );
    const deleteStatus = await jiraClient.status.deleteStatusesById({
      id: [status.id!],
    });
    if (deleteStatus.success) {
      spinner.successDeletion(
        `Status ${index + 1} deleted successfully: ${status.name}`
      );
      successCount++;
    } else {
      spinner.error(
        `Failed to delete status ${index + 1}: ${
          status.name
        } - ${JSON.stringify(deleteStatus.error)}`
      );
      errorCount++;
    }
  }

  console.log(
    `📊 SUMMARY: Status deletion completed - ${successCount} successful, ${errorCount} failed`
  );
  if (errorCount === 0) {
    console.log("🎉 SUCCESS: All statuses deleted successfully!");
  } else {
    console.warn(`⚠️  WARNING: ${errorCount} statuses failed to delete`);
  }
};
