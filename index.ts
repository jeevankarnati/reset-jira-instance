import { JiraClient } from "@narthia/jira-client";
import credentials from "./credentials.json";
import {
  resetAllProjects,
  resetWorkflowSchemes,
  resetWorkflows,
  resetIssueTypeSchemes,
  resetIssueTypeScreenSchemes,
  resetScreenSchemes,
  resetScreens,
  resetCustomFields,
} from "./services";

const jiraClient = new JiraClient({
  type: "default",
  auth: {
    email: credentials.email,
    apiToken: credentials.apiToken,
    baseUrl: credentials.baseUrl,
  },
});

const resetJiraInstance = async () => {
  await resetAllProjects(jiraClient);
  await resetWorkflowSchemes(jiraClient);
  await resetWorkflows(jiraClient);
  await resetIssueTypeSchemes(jiraClient);
  await resetIssueTypeScreenSchemes(jiraClient);
  await resetScreenSchemes(jiraClient);
  await resetScreens(jiraClient);
  await resetCustomFields(jiraClient);
};

resetJiraInstance();
