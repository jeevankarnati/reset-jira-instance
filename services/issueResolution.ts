import { DefaultJiraClientType } from "@narthia/jira-client";
import { createSpinner } from "../utils/spinner";

export const resetIssueResolutions = async (
  jiraClient: DefaultJiraClientType
) => {
  const spinner = createSpinner();

  spinner.start("Starting issue resolution reset process...");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  spinner.success("Issue resolution reset process started");

  const maxResults = 100;
  const startAt = 0;

  spinner.start("Fetching issue resolutions (first page)...");
  const firstPage = await jiraClient.issueResolutions.searchResolutions({
    maxResults: maxResults.toString(),
    startAt: startAt.toString(),
  });

  if (!firstPage.success) {
    spinner.error(
      `Failed to fetch issue resolutions: ${JSON.stringify(firstPage.error)}`
    );
    return firstPage;
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allResolutions = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
    spinner.start(
      `Fetching remaining ${totalPages - 1} pages of issue resolutions...`
    );

    const pageIndexes = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
    const pagePromises = pageIndexes.map((pageIndex) =>
      jiraClient.issueResolutions.searchResolutions({
        maxResults: maxResults.toString(),
        startAt: (pageIndex * maxResults).toString(),
      })
    );
    const pages = await Promise.all(pagePromises);
    for (const page of pages) {
      if (!page.success) {
        spinner.error(
          `Failed to fetch issue resolution page: ${JSON.stringify(page.error)}`
        );
        return page;
      }
      allResolutions = allResolutions.concat(page.data?.values ?? []);
    }
  }

  spinner.success(
    `Issue resolutions fetched successfully (${allResolutions.length} resolutions found)`
  );

  if (allResolutions.length === 0) {
    spinner.info("No issue resolutions found to delete");
    return;
  }

  console.log("Starting issue resolution deletion process...");
  let successCount = 0;
  let errorCount = 0;

  for (const [index, resolution] of allResolutions.entries()) {
    spinner.start(
      `Deleting issue resolution ${index + 1}/${allResolutions.length}: ${
        resolution.name
      }`
    );

    // When deleting resolutions, we need to specify a replacement resolution
    // Since we're deleting all, we'll use an empty string or null replacement
    const deleteResolution = await jiraClient.issueResolutions.deleteResolution(
      {
        id: resolution.id!,
        replaceWith: "", // Empty string means no replacement
      }
    );

    if (deleteResolution.success) {
      spinner.successDeletion(
        `Issue resolution ${index + 1} deleted successfully: ${resolution.name}`
      );
      successCount++;
    } else {
      spinner.error(
        `Failed to delete issue resolution ${index + 1}: ${
          resolution.name
        } - ${JSON.stringify(deleteResolution.error)}`
      );
      errorCount++;
    }
  }

  console.log(
    `📊 SUMMARY: Issue resolution deletion completed - ${successCount} successful, ${errorCount} failed`
  );
  if (errorCount === 0) {
    console.log("🎉 SUCCESS: All issue resolutions deleted successfully!");
  } else {
    console.warn(
      `⚠️  WARNING: ${errorCount} issue resolutions failed to delete`
    );
  }
};
