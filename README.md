# Jira Instance Reset Tool

A command-line tool for resetting Jira instances by cleaning up projects, workflows, schemes, screens, and custom fields. This tool is useful for development environments, testing scenarios, or when you need to start fresh with a clean Jira instance.

## Features

This tool systematically removes all:

- **Projects** - All existing projects in the Jira instance
- **Workflows** - All inactive workflows
- **Workflow Schemes** - All workflow schemes
- **Issue Type Schemes** - All issue type schemes
- **Issue Type Screen Schemes** - All issue type screen schemes
- **Screen Schemes** - All screen schemes
- **Screens** - All screens
- **Custom Fields** - All custom fields

## Prerequisites

- Node.js (or Bun runtime)
- Access to a Jira instance with administrative privileges
- API token for Jira authentication

## Installation

1. Clone this repository or download the project files
2. Install dependencies:
   ```bash
   bun install
   ```
   or with npm:
   ```bash
   npm install
   ```

## Configuration

Create a `credentials.json` file in the project root with your Jira instance credentials:

```json
{
  "email": "your-email@domain.com",
  "apiToken": "your-jira-api-token",
  "baseUrl": "https://your-domain.atlassian.net"
}
```

### Obtaining Jira API Token

1. Log in to your Jira instance
2. Go to your profile settings (click your avatar → "Profile")
3. Navigate to "Security" → "Create and manage API tokens"
4. Create a new API token and copy it

## Usage

Run the reset tool:

```bash
bun run start
```

or with npm:

```bash
npm start
```

The tool will:

1. Connect to your Jira instance using the provided credentials
2. Systematically delete all projects, workflows, schemes, screens, and custom fields
3. Display progress and results in the console

## Important Notes

⚠️ **Warning**: This tool permanently deletes data from your Jira instance. Make sure you have:

- Proper backups if needed
- Authority to perform these operations
- Selected the correct Jira instance (not production if you don't intend to)

## Error Handling

The tool includes error handling for:

- Authentication failures
- Network connectivity issues
- API rate limiting
- Individual deletion failures (continues with remaining items)

Failed operations are logged to the console for review.

## Dependencies

- [@narthia/jira-client](https://www.npmjs.com/package/@narthia/jira-client) - Jira API client library

## Development

The project is structured with individual service modules for each type of Jira entity:

- `services/project.ts` - Project management
- `services/workflow.ts` - Workflow management
- `services/workflowScheme.ts` - Workflow scheme management
- `services/issueTypeScheme.ts` - Issue type scheme management
- `services/issueTypeScreenScheme.ts` - Issue type screen scheme management
- `services/screenScheme.ts` - Screen scheme management
- `services/screen.ts` - Screen management
- `services/customField.ts` - Custom field management

## License

This project is private and not licensed for public use.

## Support

For issues or questions regarding this tool, please contact the development team.
