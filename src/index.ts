import { Gitlab } from '@gitbeaker/rest';
import dotenv from 'dotenv';
import { BotConfig } from './types';

dotenv.config();

const GITLAB_TOKEN = process.env.GITLAB_TOKEN;
const GITLAB_URL = process.env.GITLAB_URL || 'https://gitlab.com';
const PROJECT_ID = process.env.PROJECT_ID;

if (!GITLAB_TOKEN || !PROJECT_ID) {
    console.error('Missing GITLAB_TOKEN or PROJECT_ID in .env file');
    process.exit(1);
}

const api = new Gitlab({
    token: GITLAB_TOKEN,
    host: GITLAB_URL,
});

async function main() {
    try {
        console.log('Starting GitLab Bot...');

        // 1. Read Configuration
        console.log('Fetching configuration...');
        // In a real scenario, you might read this from the repo.
        // For simplicity, we'll hardcode/mock it here as if we read it.
        const config: BotConfig = {
            targetFile: 'README.md',
            updateMessage: 'Updated by GitLab Bot at ' + new Date().toISOString(),
        };

        console.log(`Targeting file: ${config.targetFile}`);

        // 2. Create a new branch
        const defaultBranch = 'main'; // Assume main, or fetch project info to get it
        const newBranch = `bot-update-${Date.now()}`;

        console.log(`Creating branch: ${newBranch} from ${defaultBranch}`);
        await api.Branches.create(PROJECT_ID!, newBranch, defaultBranch);

        // 3. Read current file content (optional, if we need to append)
        // const currentFile = await api.RepositoryFiles.show(PROJECT_ID!, config.targetFile, defaultBranch);

        // 4. Commit a change
        console.log('Committing changes...');
        await api.Commits.create(PROJECT_ID!, newBranch, 'Bot update code', [
            {
                action: 'update',
                filePath: config.targetFile, // Assuming the file exists
                content: `# Bot Update\n\n${config.updateMessage}`,
            },
        ]);

        // 5. Create Merge Request
        console.log('Creating Merge Request...');
        const mr = await api.MergeRequests.create(PROJECT_ID!, newBranch, defaultBranch, 'Bot Auto-Update', {
            description: 'This MR was automatically created by the GitLab Bot.',
            removeSourceBranch: true,
        });

        console.log(`Merge Request created: ${mr.web_url}`);

    } catch (error) {
        console.error('Error running bot:', error);
    }
}

main();
