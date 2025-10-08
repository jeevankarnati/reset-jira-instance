import { DefaultJiraClientType } from "@narthia/jira-client";
import { createSpinner } from "../utils/spinner";

export const resetScreenSchemes = async (jiraClient: DefaultJiraClientType) => {
  const spinner = createSpinner();

  spinner.start("Starting screen scheme reset process...");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  spinner.success("Screen scheme reset process started");

  const maxResults = 100;
  const startAt = 0;

  spinner.start("Fetching screen schemes (first page)...");
  const firstPage = await jiraClient.screenSchemes.getScreenSchemes({
    maxResults,
    startAt,
  });

  if (!firstPage.success) {
    console.error("❌ ERROR: Failed to fetch screen schemes:", firstPage.error);
    return firstPage;
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allScreenSchemes = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
    console.log(
      `🔄 LOADING: Fetching remaining ${
        totalPages - 1
      } pages of screen schemes...`
    );

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
        console.error(
          "❌ ERROR: Failed to fetch screen scheme page:",
          page.error
        );
        return page;
      }
      allScreenSchemes = allScreenSchemes.concat(page.data?.values ?? []);
    }
  }

  console.log(
    `✅ SUCCESS: Screen schemes fetched successfully (${allScreenSchemes.length} screen schemes found)`
  );

  if (allScreenSchemes.length === 0) {
    console.log("ℹ️  INFO: No screen schemes found to delete");
    return;
  }

  console.log("🔄 LOADING: Starting screen scheme deletion process...");
  let successCount = 0;
  let errorCount = 0;

  for (const [index, screenScheme] of allScreenSchemes.entries()) {
    console.log(
      `🔄 LOADING: Deleting screen scheme ${index + 1}/${
        allScreenSchemes.length
      }: ${screenScheme.name}`
    );
    const deleteScreenScheme =
      await jiraClient.screenSchemes.deleteScreenScheme({
        screenSchemeId: screenScheme.id?.toString()!,
      });
    if (deleteScreenScheme.success) {
      console.log(
        `✅ SUCCESS: Screen scheme ${index + 1} deleted successfully: ${
          screenScheme.name
        }`
      );
      successCount++;
    } else {
      console.error(
        `❌ ERROR: Failed to delete screen scheme ${index + 1}: ${
          screenScheme.name
        } - ${deleteScreenScheme.error}`
      );
      errorCount++;
    }
  }

  console.log(
    `📊 SUMMARY: Screen scheme deletion completed - ${successCount} successful, ${errorCount} failed`
  );
  if (errorCount === 0) {
    console.log("🎉 SUCCESS: All screen schemes deleted successfully!");
  } else {
    console.warn(`⚠️  WARNING: ${errorCount} screen schemes failed to delete`);
  }
};
