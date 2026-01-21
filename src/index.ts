import { Gitlab } from '@gitbeaker/rest';
import dotenv from 'dotenv';
import { BotConfig } from './types';

dotenv.config();

// 1. Setup Client
const GITLAB_TOKEN = process.env.GITLAB_TOKEN;
const GITLAB_URL = process.env.GITLAB_URL || 'https://gitlab.com';

if (!GITLAB_TOKEN) {
    console.error('Missing GITLAB_TOKEN in .env file');
    process.exit(1);
}

const api = new Gitlab({
    token: GITLAB_TOKEN,
    host: GITLAB_URL,
});

/**
 * The "Brain" of the bot.
 * This function takes the original code, finds issues, and returns fixed code.
 */
function autoHealCode(originalContent: string): string {
    // TODO: Implement your real logic here (regex, locator updates, etc.)
    console.log('Analyzing code for broken locators...');

    // Example: Replace "old-locator-id" with "new-locator-id"
    if (originalContent.includes('old-locator-id')) {
        console.log('Fixing broken locator: old-locator-id -> new-locator-id');
        return originalContent.replace(/old-locator-id/g, 'new-locator-id');
    }

    // Return original if no changes needed
    return originalContent;
}

/**
 * Runs the bot against a specific repository.
 */
async function healRepository(projectId: string | number, config: BotConfig) {
    try {
        console.log(`\n--- Starting Healing Process for Project: ${projectId} ---`);

        // 1. Get Basic Info & Determine Branching
        const defaultBranch = 'main'; // You could also fetch this via api.Projects.show(projectId)
        const healingBranch = `healing-bot-${Date.now()}`;

        // 2. Fetch the Target File
        console.log(`Fetching file: ${config.targetFile}`);
        let fileData;
        try {
            fileData = await api.RepositoryFiles.show(projectId, config.targetFile, defaultBranch);
        } catch (e: any) {
            console.error(`File ${config.targetFile} not found in project ${projectId}. Skipping.`);
            return;
        }

        // 3. Decode Content (GitLab returns Base64)
        const originalContent = Buffer.from(fileData.content, 'base64').toString('utf-8');

        // 4. Run Healing Logic
        const healedContent = autoHealCode(originalContent);

        if (healedContent === originalContent) {
            console.log('No healing needed. File looks healthy.');
            return;
        }

        // 5. Create Branch
        console.log(`Issues found! Creating branch: ${healingBranch}`);
        await api.Branches.create(projectId, healingBranch, defaultBranch);

        // 6. Commit the Fix
        console.log('Committing fixes...');
        await api.Commits.create(projectId, healingBranch, 'fix: auto-heal broken locators', [
            {
                action: 'update',
                filePath: config.targetFile,
                content: healedContent,
            },
        ]);

        // 7. Open Merge Request
        console.log('Opening Merge Request...');
        const mr = await api.MergeRequests.create(projectId, healingBranch, defaultBranch, 'Fix: Auto-Healing Bot', {
            description: 'The bot detected broken locators and has automatically fixed them.',
            removeSourceBranch: true,
        });

        console.log(`SUCCESS: Merge Request created at ${mr.web_url}`);

    } catch (error) {
        console.error(`Error processing project ${projectId}:`, error);
    }
}

async function main() {
    // Define the repositories you want to check
    // In production, you might fetch this list from a group or a database
    const TARGET_REPOSITORIES = [
        process.env.PROJECT_ID!, // Your primary test repo
        // '12345678',           // Another repo ID
        // 'my-group/my-repo',   // Or "Namespaced" path
    ].filter(Boolean); // Filter out undefined

    // Configuration for what to look for
    const config: BotConfig = {
        targetFile: 'README.md', // Changed to README.md so we can test it immediately
        updateMessage: 'Fixed by Auto-Healing Bot',
    };

    if (TARGET_REPOSITORIES.length === 0) {
        console.error('No TARGET_REPOSITORIES defined. Check your .env PROJECT_ID.');
        return;
    }

    for (const projectId of TARGET_REPOSITORIES) {
        await healRepository(projectId, config);
    }
}

main();
