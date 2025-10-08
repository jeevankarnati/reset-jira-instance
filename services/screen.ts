import { DefaultJiraClientType } from "@narthia/jira-client";

export const resetScreens = async (jiraClient: DefaultJiraClientType) => {
  console.log("Deleting screens...");
  const maxResults = 100;
  const startAt = 0;

  const firstPage = await jiraClient.screens.getScreens({
    maxResults,
    startAt,
  });

  if (!firstPage.success) {
    return firstPage;
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allScreens = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
    const pageIndexes = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
    const pagePromises = pageIndexes.map((pageIndex) =>
      jiraClient.screens.getScreens({
        maxResults,
        startAt: pageIndex * maxResults,
      })
    );
    const pages = await Promise.all(pagePromises);
    for (const page of pages) {
      if (!page.success) {
        return page;
      }
      allScreens = allScreens.concat(page.data?.values ?? []);
    }
  }
  console.log("Screens fetched:", allScreens.length);
  for (const [index, screen] of allScreens.entries()) {
    console.log(`Deleting screen ${index + 1}:`, screen.name);
    const deleteScreen = await jiraClient.screens.deleteScreen({
      screenId: screen.id!,
    });
    if (deleteScreen.success) {
      console.log(`Screen ${index + 1} deleted:`, screen.name);
    } else {
      console.error("Failed to delete screen:", deleteScreen.error);
    }
  }
  console.log("Screens deleted");
};
