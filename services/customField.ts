import { DefaultJiraClientType } from "@narthia/jira-client";

export const resetCustomFields = async (jiraClient: DefaultJiraClientType) => {
  console.log("Deleting custom fields...");
  const maxResults = 50;
  const startAt = 0;

  const firstPage = await jiraClient.issueFields.getFieldsPaginated({
    type: ["custom"],
    maxResults,
    startAt,
  });

  if (!firstPage.success) {
    return firstPage;
  }

  const firstValues = firstPage.data?.values ?? [];
  const total = firstPage.data?.total ?? firstValues.length;

  let allCustomFields = firstValues;

  if (total > firstValues.length) {
    const totalPages = Math.ceil(total / maxResults);
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
        return page;
      }
      allCustomFields = allCustomFields.concat(page.data?.values ?? []);
    }
  }
  console.log("Custom fields fetched:", allCustomFields.length);
  for (const [index, customField] of allCustomFields.entries()) {
    console.log(`Deleting custom field ${index + 1}:`, customField.name);
    const deleteCustomField = await jiraClient.issueFields.deleteCustomField({
      id: customField.id!,
    });
    if (deleteCustomField.success) {
      console.log(`Custom field ${index + 1} deleted:`, customField.name);
    } else {
      console.error("Failed to delete custom field:", deleteCustomField.error);
    }
  }
  console.log("Custom fields deleted");
};
