import { Collection, Interaction } from "discord.js";
import { DiscordBot } from "../../core/DiscordBot";
import { SlashCommandHandler } from "../../core/SlashCommandHandler";
import { Command } from "../../interfaces/Command";
import { EventExecutor } from "../../interfaces/Event";
import { SelectMenuResponse } from "../../interfaces/SelectMenuResponse";
import { CommandFileReader } from "../../util/CommandFileReader";
import { SelectMenuResponseReader } from "../../util/SelectMenuResponseReader";

let commands: Collection<String, Command>
let selectMenuResponders: Collection<String, SelectMenuResponse>
let slashCommandHandler: SlashCommandHandler

/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 * Event handler for the 'interactionCreate' event
 */

/**
 * EventExecutor for the event. If the interaction was an command, the corresponding command is handled in the SlashCommandHandler. If the interaction instead was a SelectMenu, the interaction is handled in the corresponding SelectMenuResponse.
 * @param client The Discord bot to be used for sending replies
 * @param interaction The interaction to be handled
 * @returns void
 */

export const executor: EventExecutor = async (client: DiscordBot, interaction: Interaction) => {
    if (!interaction.isCommand() && !interaction.isSelectMenu()) {
        return;
    }

    if (interaction.isCommand()) {
        if (!commands) {
            const commandFileReader = new CommandFileReader()
            await commandFileReader.setupCommands()
            commands = commandFileReader.getCommands()
        }

        if (!slashCommandHandler) {
            slashCommandHandler = new SlashCommandHandler(commands)
        }

        slashCommandHandler.handle(client, interaction)
    } else if (interaction.isSelectMenu()) {
        if (!selectMenuResponders) {
            const selectMenuResponseReader = new SelectMenuResponseReader()
            await selectMenuResponseReader.setupSelectMenuResponses()
            selectMenuResponders = selectMenuResponseReader.getCommands()
        }

        const selectMenuResponse: SelectMenuResponse = selectMenuResponders.get(interaction.customId)
        selectMenuResponse.executor(client, interaction);
    }
}

/**
 * The event name: 'interactionCreate'
 */
export const name: string = 'interactionCreate'