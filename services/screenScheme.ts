import { DefaultJiraClientType } from "@narthia/jira-client";

export const resetScreenSchemes = async (jiraClient: DefaultJiraClientType) => {
  console.log("Deleting screen schemes...");
  const maxResults = 100;
  const startAt = 0;

  const firstPage = await jiraClient.screenSchemes.getScreenSchemes({
    maxResults,
    startAt,
  });

  if (!firstPage.success) {
    return firstPage;
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allScreenSchemes = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
    const pageIndexes = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
    const pagePromises = pageIndexes.map((pageIndex) =>
      jiraClient.screenSchemes.getScreenSchemes({
        maxResults,
        startAt: pageIndex * maxResults,
      })
    );
    const pages = await Promise.all(pagePromises);
    for (const page of pages) {
      if (!page.success) {
        return page;
      }
      allScreenSchemes = allScreenSchemes.concat(page.data?.values ?? []);
    }
  }
  console.log("Screen schemes fetched:", allScreenSchemes.length);
  for (const [index, screenScheme] of allScreenSchemes.entries()) {
    console.log(`Deleting screen scheme ${index + 1}:`, screenScheme.name);
    const deleteScreenScheme =
      await jiraClient.screenSchemes.deleteScreenScheme({
        screenSchemeId: screenScheme.id?.toString()!,
      });
    if (deleteScreenScheme.success) {
      console.log(`Screen scheme ${index + 1} deleted:`, screenScheme.name);
    } else {
      console.error(
        "Failed to delete screen scheme:",
        deleteScreenScheme.error
      );
    }
  }
  console.log("Screen schemes deleted");
};
