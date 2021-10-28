import EventSource from "eventsource";
import { Webhooks, createNodeMiddleware } from '@octokit/webhooks'
import { Config } from "../interfaces/Config";
import { promisify } from 'util'
import glob from 'glob'
import { Collection } from "discord.js";
import { GitHubEvent } from "../interfaces/GitHubEvent";
import { DiscordBot } from "./DiscordBot";

const globPromise = promisify(glob)

/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 * An enumeration specifying the current running mode for the GitHub webhooks service. Dev uses smee.io, and Prod uses the integrated http server
 */
export enum GitHubWebHookMode {
    Dev = "Development",
    Prod = "Release"
}

/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 * A class representing the GitHub webhooks service
 */
export class GitHubWebHooks {
    private config: Config
    private webhooks: Webhooks
    private bot: DiscordBot
    private eventHandlers: Collection<String, GitHubEvent> = new Collection()

    /**
     * Creates a new instance of the GitHubWebHooks class, using the specified configuration and DiscordBot object
     * @param config The configuration file
     * @param bot The Discord bot used to send messages whenever a webhook event has been handled
     */
    public constructor(config: Config, bot: DiscordBot) {
        this.config = config
        this.bot = bot

        this.webhooks = new Webhooks({
            secret: config.gitHubSecret
        })
    }

    /**
     * Starts to listen for webhook events, using smee.io for dev environments, and http server for production mode
     */
    async listen(): Promise<void> {
        this.setupEventHandlers()

        if (this.config.appMode == GitHubWebHookMode.Dev) {
            console.log("Development mode")
            await this.setupDevServer()
        }

        if (this.config.appMode == GitHubWebHookMode.Prod) {
            console.log("Release mode")
            await this.setupProdServer()
        }
    }

    /**
     * Sets up a development server using smee.io
     */
    private async setupDevServer() {
        const webhookProxyUrl = this.config.smeeIoUrl; // replace with your own Webhook Proxy URL
        const source = new EventSource(webhookProxyUrl);
        source.onmessage = (event) => {
            const webhookEvent = JSON.parse(event.data);
            this.webhooks
                .verifyAndReceive({
                    id: webhookEvent["x-request-id"],
                    name: webhookEvent["x-github-event"],
                    signature: webhookEvent["x-hub-signature"],
                    payload: webhookEvent.body,
                })
                .catch(console.error);

            const eventHandler: GitHubEvent = this.eventHandlers.get(webhookEvent['x-github-event'])
            eventHandler.executor(this.bot, webhookEvent['body'])
        };
    }

    /**
     * Sets up a production http server on port 3000
     */
    private async setupProdServer() {
        this.webhooks.onAny(({ id, name, payload }) => {
            console.log(name, "event received");
            const eventHandler: GitHubEvent = this.eventHandlers.get(name)
            eventHandler.executor(this.bot, payload)
        });

        require("http").createServer(createNodeMiddleware(this.webhooks)).listen(3000);
    }

    /**
     * Loads all event handlers
     */
    private async setupEventHandlers(): Promise<void> {
        const eventFiles: string[] = await globPromise(`${__dirname}/../githubevents/**/*{.ts,.js}`)

        await Promise.all(eventFiles.map(async (value: string) => {
            const file: GitHubEvent = await import(value)
            this.eventHandlers.set(file.name, file)
        }))
    }
}