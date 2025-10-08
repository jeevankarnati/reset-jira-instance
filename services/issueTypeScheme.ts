import { DefaultJiraClientType } from "@narthia/jira-client";
import { createSpinner } from "../utils/spinner";

export const resetIssueTypeSchemes = async (
  jiraClient: DefaultJiraClientType
) => {
  const spinner = createSpinner();

  spinner.start("Starting issue type scheme reset process...");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  spinner.success("Issue type scheme reset process started");

  const maxResults = 100;
  const startAt = 0;

  spinner.start("Fetching issue type schemes (first page)...");
  const firstPage = await jiraClient.issueTypeSchemes.getAllIssueTypeSchemes({
    maxResults,
    startAt,
  });

  if (!firstPage.success) {
    spinner.error(
      `Failed to fetch issue type schemes: ${JSON.stringify(firstPage.error)}`
    );
    return firstPage;
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allIssueTypeSchemes = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
    spinner.start(
      `Fetching remaining ${totalPages - 1} pages of issue type schemes...`
    );

    const pageIndexes = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
    const pagePromises = pageIndexes.map((pageIndex) =>
      jiraClient.issueTypeSchemes.getAllIssueTypeSchemes({
        maxResults,
        startAt: pageIndex * maxResults,
      })
    );
    const pages = await Promise.all(pagePromises);
    for (const page of pages) {
      if (!page.success) {
        spinner.error(
          `Failed to fetch issue type scheme page: ${JSON.stringify(
            page.error
          )}`
        );
        return page;
      }
      allIssueTypeSchemes = allIssueTypeSchemes.concat(page.data?.values ?? []);
    }
  }

  spinner.success(
    `Issue type schemes fetched successfully (${allIssueTypeSchemes.length} issue type schemes found)`
  );

  if (allIssueTypeSchemes.length === 0) {
    spinner.info("No issue type schemes found to delete");
    return;
  }

  console.log("Starting issue type scheme deletion process...");
  let successCount = 0;
  let errorCount = 0;

  for (const [index, issueTypeScheme] of allIssueTypeSchemes.entries()) {
    spinner.start(
      `Deleting issue type scheme ${index + 1}/${allIssueTypeSchemes.length}: ${
        issueTypeScheme.name
      }`
    );
    const deleteIssueTypeScheme =
      await jiraClient.issueTypeSchemes.deleteIssueTypeScheme({
        issueTypeSchemeId: Number(issueTypeScheme.id!),
      });
    if (deleteIssueTypeScheme.success) {
      spinner.successDeletion(
        `Issue type scheme ${index + 1} deleted successfully: ${
          issueTypeScheme.name
        }`
      );
      successCount++;
    } else {
      spinner.error(
        `Failed to delete issue type scheme ${index + 1}: ${
          issueTypeScheme.name
        } - ${JSON.stringify(deleteIssueTypeScheme.error)}`
      );
      errorCount++;
    }
  }

  console.log(
    `📊 SUMMARY: Issue type scheme deletion completed - ${successCount} successful, ${errorCount} failed`
  );
  if (errorCount === 0) {
    console.log("🎉 SUCCESS: All issue type schemes deleted successfully!");
  } else {
    console.warn(
      `⚠️  WARNING: ${errorCount} issue type schemes failed to delete`
    );
  }
};
