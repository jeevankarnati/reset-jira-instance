import { DefaultJiraClientType } from "@narthia/jira-client";

export const resetIssueTypeSchemes = async (
  jiraClient: DefaultJiraClientType
) => {
  console.log("Deleting issue type schemes...");
  const maxResults = 100;
  const startAt = 0;

  const firstPage = await jiraClient.issueTypeSchemes.getAllIssueTypeSchemes({
    maxResults,
    startAt,
  });

  if (!firstPage.success) {
    return firstPage;
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allIssueTypeSchemes = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
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
        return page;
      }
      allIssueTypeSchemes = allIssueTypeSchemes.concat(page.data?.values ?? []);
    }
  }
  console.log("Issue type schemes fetched:", allIssueTypeSchemes.length);
  for (const [index, issueTypeScheme] of allIssueTypeSchemes.entries()) {
    console.log(
      `Deleting issue type scheme ${index + 1}:`,
      issueTypeScheme.name
    );
    const deleteIssueTypeScheme =
      await jiraClient.issueTypeSchemes.deleteIssueTypeScheme({
        issueTypeSchemeId: Number(issueTypeScheme.id!),
      });
    if (deleteIssueTypeScheme.success) {
      console.log(
        `Issue type scheme ${index + 1} deleted:`,
        issueTypeScheme.name
      );
    } else {
      console.error(
        "Failed to delete issue type scheme:",
        deleteIssueTypeScheme.error
      );
    }
  }

  console.log("Issue type schemes deleted");
};
