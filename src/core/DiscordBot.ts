import { Channel, Client, Collection, Guild, GuildMember, Intents, Message, MessageEmbed, TextChannel } from "discord.js";
import { promisify } from "util";
import { Command } from "../interfaces/Command";
import { Config } from "../interfaces/Config";
import glob from 'glob'
import { Event } from "../interfaces/Event";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/rest/v9";

const globPromise = promisify(glob)
/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 * A class representing the Discord bot. Extends the discord.js Client class
 */
export class DiscordBot extends Client {
    private config: Config;
    private events: Collection<String, Event> = new Collection()

    /**
     * Creates a new instance of the DiscordBot class with the specified configuration
     * @param config The configuration for the bot
     */
    public constructor(config: Config) {
        super({ intents: [Intents.FLAGS.GUILDS] });

        this.config = config;
    }

    /**
     * Sets up commands, event handlers and lets the bot login to Discord
     */
    public async start(): Promise<void> {
        await this.setupCommands();
        await this.initEventHandlers();
        await this.login(this.config.discordToken);
    }

    /**
     * Sends a message to the specified channel in the configuration as MessageEmbeds
     * @param embeds The MessageEmbeds to send
     * @returns The message that was sent, as a Message object
     */
    public async sendMessage(embeds: Array<MessageEmbed>): Promise<Message> {
        const channel: Channel = await this.channels.fetch(this.config.discordChannelId)

        if (channel.isText()) {
            const textChannel = channel as TextChannel
            const message: Message = await textChannel.send({ embeds: embeds })
            return message;
        }

        return null;
    }

    public async getUser(userId: string): Promise<GuildMember> {
        const guild: Guild = await this.guilds.fetch(this.config.discordGuildId)
        return await guild.members.fetch(userId)
    }

    /**
     * Loads all the event handlers and sets up the event hooks for each event handler
     */
    private async initEventHandlers(): Promise<void> {
        const eventFiles: string[] = await globPromise(`${__dirname}/../events/**/*{.ts,.js}`)
        await Promise.all(eventFiles.map(async (value: string) => {
            const file: Event = await import(value)
            this.events.set(file.name, file)
            this.on(file.name, file.executor.bind(null, this))
        }))
    }

    /**
     * Loads all the slash commands and registers them in Discord
     */
    private async setupCommands(): Promise<void> {
        const commandFiles: string[] = await globPromise(`${__dirname}/../commands/**/*{.ts,.js}`)
        const jsonCommands: Array<any> = new Array()

        await Promise.all(commandFiles.map(async (value: string) => {
            const file: Command = await import(value)
            jsonCommands.push(file.builder.toJSON())
        }))

        await this.registerSlashCommands(jsonCommands)
    }

    /**
     * Registers the specified slash commands in Discord
     * @param commands The commands to register, specified as JSON objects
     */
    private async registerSlashCommands(commands: Array<string>): Promise<void> {
        const rest = new REST({ version: '9' }).setToken(this.config.discordToken);
        try {
            await rest.put(Routes.applicationGuildCommands(this.config.discordClientId, this.config.discordGuildId), { body: commands })
            console.log('Successfully registered application commands.')
        } catch (e) {
            console.error(e);
        }
    }
}
