import { DefaultJiraClientType } from "@narthia/jira-client";
import { createSpinner } from "../utils/spinner";

export const resetScreens = async (jiraClient: DefaultJiraClientType) => {
  const spinner = createSpinner();

  spinner.start("Starting screen reset process...");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  spinner.success("Screen reset process started");

  const maxResults = 100;
  const startAt = 0;

  spinner.start("Fetching screens (first page)...");
  const firstPage = await jiraClient.screens.getScreens({
    maxResults,
    startAt,
  });

  if (!firstPage.success) {
    spinner.error(`Failed to fetch screens: ${firstPage.error}`);
    return firstPage;
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allScreens = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
    spinner.start(`Fetching remaining ${totalPages - 1} pages of screens...`);

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
        spinner.error(`Failed to fetch screen page: ${page.error}`);
        return page;
      }
      allScreens = allScreens.concat(page.data?.values ?? []);
    }
  }

  spinner.success(
    `Screens fetched successfully (${allScreens.length} screens found)`
  );

  if (allScreens.length === 0) {
    spinner.info("No screens found to delete");
    return;
  }

  console.log("Starting screen deletion process...");
  let successCount = 0;
  let errorCount = 0;

  for (const [index, screen] of allScreens.entries()) {
    spinner.start(
      `Deleting screen ${index + 1}/${allScreens.length}: ${screen.name}`
    );
    const deleteScreen = await jiraClient.screens.deleteScreen({
      screenId: screen.id!,
    });
    if (deleteScreen.success) {
      spinner.success(
        `Screen ${index + 1} deleted successfully: ${screen.name}`
      );
      successCount++;
    } else {
      spinner.error(
        `Failed to delete screen ${index + 1}: ${screen.name} - ${
          deleteScreen.error
        }`
      );
      errorCount++;
    }
  }

  console.log(
    `📊 SUMMARY: Screen deletion completed - ${successCount} successful, ${errorCount} failed`
  );
  if (errorCount === 0) {
    console.log("🎉 SUCCESS: All screens deleted successfully!");
  } else {
    console.warn(`⚠️  WARNING: ${errorCount} screens failed to delete`);
  }
};
