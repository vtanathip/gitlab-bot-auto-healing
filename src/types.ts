export interface BotConfig {
    targetFile: string;
    updateMessage: string;
}

export interface GitLabFileFn {
    file_path: string;
    branch: string;
}
