import { DefaultJiraClientType } from "@narthia/jira-client";
import { createSpinner } from "../utils/spinner";

export const resetCustomFields = async (jiraClient: DefaultJiraClientType) => {
  const spinner = createSpinner();

  spinner.start("Starting custom field reset process...");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  spinner.success("Custom field reset process started");

  const maxResults = 50;
  const startAt = 0;

  spinner.start("Fetching custom fields (first page)...");
  const firstPage = await jiraClient.issueFields.getFieldsPaginated({
    type: ["custom"],
    maxResults,
    startAt,
  });

  if (!firstPage.success) {
    spinner.error(
      `Failed to fetch custom fields: ${JSON.stringify(firstPage.error)}`
    );
    return firstPage;
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allCustomFields = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
    spinner.start(
      `Fetching remaining ${totalPages - 1} pages of custom fields...`
    );

    const pageIndexes = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
    const pagePromises = pageIndexes.map((pageIndex) =>
      jiraClient.issueFields.getFieldsPaginated({
        type: ["custom"],
        maxResults,
        startAt: pageIndex * maxResults,
      })
    );
    const pages = await Promise.all(pagePromises);
    for (const page of pages) {
      if (!page.success) {
        spinner.error(
          `Failed to fetch custom field page: ${JSON.stringify(page.error)}`
        );
        return page;
      }
      allCustomFields = allCustomFields.concat(page.data?.values ?? []);
    }
  }

  spinner.success(
    `Custom fields fetched successfully (${allCustomFields.length} custom fields found)`
  );

  if (allCustomFields.length === 0) {
    spinner.info("No custom fields found to delete");
    return;
  }

  console.log("Starting custom field deletion process...");
  let successCount = 0;
  let errorCount = 0;

  for (const [index, customField] of allCustomFields.entries()) {
    spinner.start(
      `Deleting custom field ${index + 1}/${allCustomFields.length}: ${
        customField.name
      }`
    );
    const deleteCustomField = await jiraClient.issueFields.deleteCustomField({
      id: customField.id!,
    });
    if (deleteCustomField.success) {
      spinner.success(
        `Custom field ${index + 1} deleted successfully: ${customField.name}`
      );
      successCount++;
    } else {
      spinner.error(
        `Failed to delete custom field ${index + 1}: ${
          customField.name
        } - ${JSON.stringify(deleteCustomField.error)}`
      );
      errorCount++;
    }
  }

  console.log(
    `📊 SUMMARY: Custom field deletion completed - ${successCount} successful, ${errorCount} failed`
  );
  if (errorCount === 0) {
    console.log("🎉 SUCCESS: All custom fields deleted successfully!");
  } else {
    console.warn(`⚠️  WARNING: ${errorCount} custom fields failed to delete`);
  }
};
