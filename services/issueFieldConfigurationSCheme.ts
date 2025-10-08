import { DefaultJiraClientType } from "@narthia/jira-client";
import { createSpinner } from "../utils/spinner";

export const resetFieldConfigurationSchemes = async (
  jiraClient: DefaultJiraClientType
) => {
  const spinner = createSpinner();

  spinner.start("Starting field configuration scheme reset process...");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  spinner.success("Field configuration scheme reset process started");

  const maxResults = 50;
  const startAt = 0;

  spinner.start("Fetching field configuration schemes (first page)...");
  const firstPage =
    await jiraClient.issueFieldConfigurations.getAllFieldConfigurationSchemes({
      maxResults,
      startAt,
    });

  if (!firstPage.success) {
    spinner.error(
      `Failed to fetch field configuration schemes: ${JSON.stringify(
        firstPage.error
      )}`
    );
    return firstPage;
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allFieldConfigurationSchemes = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
    spinner.start(
      `Fetching remaining ${
        totalPages - 1
      } pages of field configuration schemes...`
    );

    const pageIndexes = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
    const pagePromises = pageIndexes.map((pageIndex) =>
      jiraClient.issueFieldConfigurations.getAllFieldConfigurationSchemes({
        maxResults,
        startAt: pageIndex * maxResults,
      })
    );
    const pages = await Promise.all(pagePromises);
    for (const page of pages) {
      if (!page.success) {
        spinner.error(
          `Failed to fetch field configuration scheme page: ${JSON.stringify(
            page.error
          )}`
        );
        return page;
      }
      allFieldConfigurationSchemes = allFieldConfigurationSchemes.concat(
        page.data?.values ?? []
      );
    }
  }

  spinner.success(
    `Field configuration schemes fetched successfully (${allFieldConfigurationSchemes.length} field configuration schemes found)`
  );

  if (allFieldConfigurationSchemes.length === 0) {
    spinner.info("No field configuration schemes found to delete");
    return;
  }

  console.log("Starting field configuration scheme deletion process...");
  let successCount = 0;
  let errorCount = 0;

  for (const [
    index,
    fieldConfigurationScheme,
  ] of allFieldConfigurationSchemes.entries()) {
    spinner.start(
      `Deleting field configuration scheme ${index + 1}/${
        allFieldConfigurationSchemes.length
      }: ${fieldConfigurationScheme.name}`
    );
    const deleteFieldConfigurationScheme =
      await jiraClient.issueFieldConfigurations.deleteFieldConfigurationScheme({
        id: parseInt(fieldConfigurationScheme.id!, 10),
      });
    if (deleteFieldConfigurationScheme.success) {
      spinner.successDeletion(
        `Field configuration scheme ${index + 1} deleted successfully: ${
          fieldConfigurationScheme.name
        }`
      );
      successCount++;
    } else {
      spinner.error(
        `Failed to delete field configuration scheme ${index + 1}: ${
          fieldConfigurationScheme.name
        } - ${JSON.stringify(deleteFieldConfigurationScheme.error)}`
      );
      errorCount++;
    }
  }

  console.log(
    `📊 SUMMARY: Field configuration scheme deletion completed - ${successCount} successful, ${errorCount} failed`
  );
  if (errorCount === 0) {
    console.log(
      "🎉 SUCCESS: All field configuration schemes deleted successfully!"
    );
  } else {
    console.warn(
      `⚠️  WARNING: ${errorCount} field configuration schemes failed to delete`
    );
  }
};
