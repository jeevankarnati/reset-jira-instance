import { DefaultJiraClientType } from "@narthia/jira-client";
import { createSpinner } from "../utils/spinner";

export const resetIssueTypes = async (jiraClient: DefaultJiraClientType) => {
  const spinner = createSpinner();

  spinner.start("Starting issue type reset process...");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  spinner.success("Issue type reset process started");

  spinner.start("Fetching issue types (first page)...");
  const firstPage = await jiraClient.issueTypes.getIssueAllTypes({});

  if (!firstPage.success) {
    spinner.error(
      `Failed to fetch issue types: ${JSON.stringify(firstPage.error)}`
    );
    return firstPage;
  }

  const allIssueTypes = firstPage.data ?? [];

  spinner.success(
    `Issue types fetched successfully (${allIssueTypes.length} issue types found)`
  );

  if (allIssueTypes.length === 0) {
    spinner.info("No issue types found to delete");
    return;
  }

  console.log("Starting issue type deletion process...");
  let successCount = 0;
  let errorCount = 0;

  for (const [index, issueType] of allIssueTypes.entries()) {
    spinner.start(
      `Deleting issue type ${index + 1}/${allIssueTypes.length}: ${
        issueType.name
      }`
    );
    const deleteIssueType = await jiraClient.issueTypes.deleteIssueType({
      id: issueType.id!,
    });
    if (deleteIssueType.success) {
      spinner.successDeletion(
        `Issue type ${index + 1} deleted successfully: ${issueType.name}`
      );
      successCount++;
    } else {
      spinner.error(
        `Failed to delete issue type ${index + 1}: ${
          issueType.name
        } - ${JSON.stringify(deleteIssueType.error)}`
      );
      errorCount++;
    }
  }

  console.log(
    `📊 SUMMARY: Issue type deletion completed - ${successCount} successful, ${errorCount} failed`
  );
  if (errorCount === 0) {
    console.log("🎉 SUCCESS: All issue types deleted successfully!");
  } else {
    console.warn(`⚠️  WARNING: ${errorCount} issue types failed to delete`);
  }
};
