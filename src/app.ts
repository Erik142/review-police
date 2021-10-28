import { DiscordBot } from './core/DiscordBot'
import { Config } from './interfaces/Config'
import { UserMapper } from './util/UserMapper'
import { GitHubApi } from './core/GitHubApi'
import { GitHubWebHooks } from './core/GitHubWebHooks'
import { EnvConfig } from './core/EnvConfig'

/**
 * @author: Erik Wahlberger
 * @version: 2021-10-01
 * App entrypoint: Loads the config from environment variables (or .env file), 
 * reads the user mappings in "account-mappings.json", starts a Discord bot,
 * and connects to the GitHub webhook service.
 */
class App {
    async start() {
        let config: Config = EnvConfig.getConfig()
        GitHubApi.setConfig(config)
        UserMapper.readMaps()

        const bot: DiscordBot = new DiscordBot(config)
        await bot.start()
        const githubWebHooks = new GitHubWebHooks(config, bot)
        await githubWebHooks.listen()
    }
}

new App().start()