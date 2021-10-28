import { SelectMenuInteraction } from "discord.js";
import { DiscordBot } from "../core/DiscordBot";

/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 * Represents the method used to handle a response to a "SelectMenu event" in Discord
 */
export interface SelectMenuResponseExecutor {
    (client: DiscordBot, interaction: SelectMenuInteraction): Promise<void>
}

/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 * Represents a complete "SelectMenu event" in Discord
 */
export interface SelectMenuResponse {
    executor: SelectMenuResponseExecutor,
    name: string
}