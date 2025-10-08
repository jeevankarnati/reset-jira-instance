import { DefaultJiraClientType } from "@narthia/jira-client";
import { createSpinner } from "../utils/spinner";

export const resetAllProjects = async (jiraClient: DefaultJiraClientType) => {
  const spinner = createSpinner();

  spinner.start("Starting project reset process...");
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Brief pause for visual effect
  spinner.success("Project reset process started");

  spinner.start("Fetching all projects...");
  const getAllProjects = await jiraClient.projects.getAllProjects();

  if (getAllProjects.error) {
    spinner.error(
      `Failed to fetch projects: ${getAllProjects.error ?? "Unknown error"}`
    );
    return;
  }

  if (getAllProjects.success) {
    spinner.success(
      `Projects fetched successfully (${getAllProjects.data.length} projects found)`
    );

    if (getAllProjects.data.length === 0) {
      spinner.info("No projects found to delete");
      return;
    }

    console.log("Starting project deletion process...");
    let successCount = 0;
    let errorCount = 0;

    for (const [index, project] of getAllProjects.data.entries()) {
      spinner.start(
        `Deleting project ${index + 1}/${getAllProjects.data.length}: ${
          project.name
        } (${project.key})`
      );
      const deleteProject = await jiraClient.projects.deleteProject({
        projectIdOrKey: project.id!,
        enableUndo: false,
      });
      if (deleteProject.success) {
        spinner.success(
          `Project ${index + 1} deleted successfully: ${project.name} (${
            project.key
          })`
        );
        successCount++;
      } else {
        spinner.error(
          `Failed to delete project ${index + 1}: ${project.name} (${
            project.key
          }) - ${deleteProject.error}`
        );
        errorCount++;
      }
    }

    console.log(
      `📊 SUMMARY: Project deletion completed - ${successCount} successful, ${errorCount} failed`
    );
    if (errorCount === 0) {
      console.log("🎉 SUCCESS: All projects deleted successfully!");
    } else {
      console.warn(`⚠️  WARNING: ${errorCount} projects failed to delete`);
    }
  }
};
