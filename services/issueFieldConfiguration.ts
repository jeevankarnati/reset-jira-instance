import { DefaultJiraClientType } from "@narthia/jira-client";
import { createSpinner } from "../utils/spinner";

export const resetFieldConfigurations = async (
  jiraClient: DefaultJiraClientType
) => {
  const spinner = createSpinner();

  spinner.start("Starting field configuration reset process...");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  spinner.success("Field configuration reset process started");

  const maxResults = 50;
  const startAt = 0;

  spinner.start("Fetching field configurations (first page)...");
  const firstPage =
    await jiraClient.issueFieldConfigurations.getAllFieldConfigurations({
      maxResults,
      startAt,
    });

  if (!firstPage.success) {
    spinner.error(
      `Failed to fetch field configurations: ${JSON.stringify(firstPage.error)}`
    );
    return firstPage;
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allFieldConfigurations = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
    spinner.start(
      `Fetching remaining ${totalPages - 1} pages of field configurations...`
    );

    const pageIndexes = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
    const pagePromises = pageIndexes.map((pageIndex) =>
      jiraClient.issueFieldConfigurations.getAllFieldConfigurations({
        maxResults,
        startAt: pageIndex * maxResults,
      })
    );
    const pages = await Promise.all(pagePromises);
    for (const page of pages) {
      if (!page.success) {
        spinner.error(
          `Failed to fetch field configuration page: ${JSON.stringify(
            page.error
          )}`
        );
        return page;
      }
      allFieldConfigurations = allFieldConfigurations.concat(
        page.data?.values ?? []
      );
    }
  }

  spinner.success(
    `Field configurations fetched successfully (${allFieldConfigurations.length} field configurations found)`
  );

  if (allFieldConfigurations.length === 0) {
    spinner.info("No field configurations found to delete");
    return;
  }

  console.log("Starting field configuration deletion process...");
  let successCount = 0;
  let errorCount = 0;

  for (const [index, fieldConfiguration] of allFieldConfigurations.entries()) {
    spinner.start(
      `Deleting field configuration ${index + 1}/${
        allFieldConfigurations.length
      }: ${fieldConfiguration.name}`
    );
    const deleteFieldConfiguration =
      await jiraClient.issueFieldConfigurations.deleteFieldConfiguration({
        id: parseInt((fieldConfiguration as any).id, 10),
      });
    if (deleteFieldConfiguration.success) {
      spinner.successDeletion(
        `Field configuration ${index + 1} deleted successfully: ${
          fieldConfiguration.name
        }`
      );
      successCount++;
    } else {
      spinner.error(
        `Failed to delete field configuration ${index + 1}: ${
          fieldConfiguration.name
        } - ${JSON.stringify(deleteFieldConfiguration.error)}`
      );
      errorCount++;
    }
  }

  console.log(
    `📊 SUMMARY: Field configuration deletion completed - ${successCount} successful, ${errorCount} failed`
  );
  if (errorCount === 0) {
    console.log("🎉 SUCCESS: All field configurations deleted successfully!");
  } else {
    console.warn(
      `⚠️  WARNING: ${errorCount} field configurations failed to delete`
    );
  }
};
