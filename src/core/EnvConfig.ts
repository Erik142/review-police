require('dotenv').config()
import { Config } from "../interfaces/Config";
import { GitHubWebHookMode } from "./GitHubWebHooks";

/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 * A class used to load the app configuration from environment variables, or a .env file
 */
export abstract class EnvConfig {
    static getConfig(): Config {
        const appmode = process.env.APP_MODE as string
        const gitHubWebHookMode: GitHubWebHookMode = GitHubWebHookMode[appmode as keyof typeof GitHubWebHookMode]

        const config: Config = {
            discordClientId: process.env.DISCORD_CLIENT_ID,
            discordGuildId: process.env.DISCORD_GUILD_ID,
            discordToken: process.env.DISCORD_TOKEN,
            discordChannelId: process.env.DISCORD_CHANNEL_ID,
            gitHubInstallationId: process.env.GH_INSTALLATION_ID,
            gitHubPrivateRSAKey: process.env.GH_PRIVATE_KEY,
            gitHubSecret: process.env.GH_SECRET,
            gitHubProductOwner: process.env.GH_PRODUCT_OWNER,
            smeeIoUrl: process.env.SMEE_IO_URL,
            appMode: gitHubWebHookMode
        }

        return config;
    }
}