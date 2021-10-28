import { DiscordBot } from "../core/DiscordBot";

/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 * Represents the method used to handle a GitHub webhook event
 */
export interface GitHubEventExecutor {
    (client: DiscordBot, payload: any): Promise<void>
}

/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 * Represents a complete GitHub webhook event
 */
export interface GitHubEvent {
    name: string,
    executor: GitHubEventExecutor
}