import { GitHubWebHookMode } from "../core/GitHubWebHooks";

/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 * An interface representing the app configuration. 
 * Stores all necessary configuration parameters.
 */
export interface Config {
    discordToken: string,
    discordChannelId: string,
    discordClientId: string,
    discordGuildId: string,
    gitHubPrivateRSAKey: string,
    gitHubInstallationId: string,
    gitHubSecret: string,
    gitHubProductOwner: string,
    smeeIoUrl: string,
    appMode: GitHubWebHookMode
}