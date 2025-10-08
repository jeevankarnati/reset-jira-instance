import { DefaultJiraClientType } from "@narthia/jira-client";
import { createSpinner } from "../utils/spinner";

export const resetIssueTypeScreenSchemes = async (
  jiraClient: DefaultJiraClientType
) => {
  const spinner = createSpinner();

  spinner.start("Starting issue type screen scheme reset process...");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  spinner.success("Issue type screen scheme reset process started");

  const maxResults = 100;
  const startAt = 0;

  spinner.start("Fetching issue type screen schemes (first page)...");
  const firstPage =
    await jiraClient.issueTypeScreenSchemes.getIssueTypeScreenSchemes({
      maxResults,
      startAt,
    });

  if (!firstPage.success) {
    spinner.error(
      `Failed to fetch issue type screen schemes: ${firstPage.error}`
    );
    return firstPage;
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allIssueTypeScreenSchemes = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
    console.log(
      `🔄 LOADING: Fetching remaining ${
        totalPages - 1
      } pages of issue type screen schemes...`
    );

    const pageIndexes = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
    const pagePromises = pageIndexes.map((pageIndex) =>
      jiraClient.issueTypeScreenSchemes.getIssueTypeScreenSchemes({
        maxResults,
        startAt: pageIndex * maxResults,
      })
    );
    const pages = await Promise.all(pagePromises);
    for (const page of pages) {
      if (!page.success) {
        console.error(
          "❌ ERROR: Failed to fetch issue type screen scheme page:",
          page.error
        );
        return page;
      }
      allIssueTypeScreenSchemes = allIssueTypeScreenSchemes.concat(
        page.data?.values ?? []
      );
    }
  }

  console.log(
    `✅ SUCCESS: Issue type screen schemes fetched successfully (${allIssueTypeScreenSchemes.length} issue type screen schemes found)`
  );

  if (allIssueTypeScreenSchemes.length === 0) {
    console.log("ℹ️  INFO: No issue type screen schemes found to delete");
    return;
  }

  console.log(
    "🔄 LOADING: Starting issue type screen scheme deletion process..."
  );
  let successCount = 0;
  let errorCount = 0;

  for (const [
    index,
    issueTypeScreenScheme,
  ] of allIssueTypeScreenSchemes.entries()) {
    console.log(
      `🔄 LOADING: Deleting issue type screen scheme ${index + 1}/${
        allIssueTypeScreenSchemes.length
      }: ${issueTypeScreenScheme.name}`
    );
    const deleteIssueTypeScreenScheme =
      await jiraClient.issueTypeScreenSchemes.deleteIssueTypeScreenScheme({
        issueTypeScreenSchemeId: issueTypeScreenScheme.id!,
      });
    if (deleteIssueTypeScreenScheme.success) {
      console.log(
        `✅ SUCCESS: Issue type screen scheme ${
          index + 1
        } deleted successfully: ${issueTypeScreenScheme.name}`
      );
      successCount++;
    } else {
      console.error(
        `❌ ERROR: Failed to delete issue type screen scheme ${index + 1}: ${
          issueTypeScreenScheme.name
        } - ${deleteIssueTypeScreenScheme.error}`
      );
      errorCount++;
    }
  }

  console.log(
    `📊 SUMMARY: Issue type screen scheme deletion completed - ${successCount} successful, ${errorCount} failed`
  );
  if (errorCount === 0) {
    console.log(
      "🎉 SUCCESS: All issue type screen schemes deleted successfully!"
    );
  } else {
    console.warn(
      `⚠️  WARNING: ${errorCount} issue type screen schemes failed to delete`
    );
  }
};
