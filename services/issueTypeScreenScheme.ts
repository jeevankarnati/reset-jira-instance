import { DefaultJiraClientType } from "@narthia/jira-client";

export const resetIssueTypeScreenSchemes = async (
  jiraClient: DefaultJiraClientType
) => {
  console.log("Deleting issue type screen schemes...");
  const maxResults = 100;
  const startAt = 0;

  const firstPage =
    await jiraClient.issueTypeScreenSchemes.getIssueTypeScreenSchemes({
      maxResults,
      startAt,
    });

  if (!firstPage.success) {
    return firstPage;
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allIssueTypeScreenSchemes = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
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
        return page;
      }
      allIssueTypeScreenSchemes = allIssueTypeScreenSchemes.concat(
        page.data?.values ?? []
      );
    }
  }
  console.log(
    "Issue type screen schemes fetched:",
    allIssueTypeScreenSchemes.length
  );
  for (const [
    index,
    issueTypeScreenScheme,
  ] of allIssueTypeScreenSchemes.entries()) {
    console.log(
      `Deleting issue type screen scheme ${index + 1}:`,
      issueTypeScreenScheme.name
    );
    const deleteIssueTypeScreenScheme =
      await jiraClient.issueTypeScreenSchemes.deleteIssueTypeScreenScheme({
        issueTypeScreenSchemeId: issueTypeScreenScheme.id!,
      });
    if (deleteIssueTypeScreenScheme.success) {
      console.log(
        `Issue type screen scheme ${index + 1} deleted:`,
        issueTypeScreenScheme.name
      );
    } else {
      console.error(
        "Failed to delete issue type screen scheme:",
        deleteIssueTypeScreenScheme.error
      );
    }
  }
  console.log("Issue type screen schemes deleted");
};
