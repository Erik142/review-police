import { DiscordBot } from '../core/DiscordBot'
import { CommandInteraction } from 'discord.js'
import { SlashCommandBuilder, } from '@discordjs/builders'

/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 * Represents the method used to handle a Discord slash command
 */
export interface CommandExecutor {
    (client: DiscordBot, interaction: CommandInteraction): Promise<void>
}

/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 * Represents a complete Discord slash command
 */
export interface Command {
    name: String,
    builder: SlashCommandBuilder,
    executor: CommandExecutor
}