import { DefaultJiraClientType } from "@narthia/jira-client";

export const resetAllProjects = async (jiraClient: DefaultJiraClientType) => {
  console.log("Deleting projects...");
  const getAllProjects = await jiraClient.projects.getAllProjects();

  if (getAllProjects.error) {
    console.error(
      "Failed to fetch projects:",
      getAllProjects.error ?? "Unknown error"
    );
    return;
  }

  if (getAllProjects.success) {
    console.log("Projects fetched:", getAllProjects.data.length);
    for (const [index, project] of getAllProjects.data.entries()) {
      console.log(`Deleting project ${index + 1}:`, project.name);
      const deleteProject = await jiraClient.projects.deleteProject({
        projectIdOrKey: project.id!,
        enableUndo: false,
      });
      if (deleteProject.success) {
        console.log(`Project ${index + 1} deleted:`, project.name);
      } else {
        console.error("Failed to delete project:", deleteProject.error);
      }
    }
  }
  console.log("Projects deleted");
};
