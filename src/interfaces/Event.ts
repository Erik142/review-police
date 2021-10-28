import { DiscordBot } from "../core/DiscordBot";

/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 * Represents the method used to handle a Discord event
 */
export interface EventExecutor {
    (bot: DiscordBot, ...args: any[]): Promise<void>
}

/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 * Represents a complete Discord event
 */
export interface Event {
    name: string,
    executor: EventExecutor
}