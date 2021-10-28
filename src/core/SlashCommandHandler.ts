import { Collection, CommandInteraction } from "discord.js";
import { Command } from "../interfaces/Command";
import { DiscordBot } from "./DiscordBot";

/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 * A class used for handling the slash commands in Discord
 */
export class SlashCommandHandler {
    private interactions: Collection<String, Command> = new Collection();

    /**
     * Creates a new SlashCommandHandler using the specified interactions as haandlers for the slash commands
     * @param interactions The handlers for the slash commands
     */
    public constructor(interactions: Collection<String, Command>) {
        this.interactions = interactions;
    }

    /**
     * Executes the correct command handler for the specified slash command
     * @param client The Discord bot to use
     * @param interaction The interaction (slash command) to handle
     */
    public handle(client: DiscordBot, interaction: CommandInteraction) {
        const command: Command = this.interactions.get(interaction.commandName) as Command;
        command.executor(client, interaction)
    }
}