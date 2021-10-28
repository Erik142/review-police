import { Collection } from "discord.js"
import glob from "glob"
import { promisify } from "util"
import { Command } from "../interfaces/Command"

const globPromise = promisify(glob)

/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 * Class used to read and retrieve all slash commands used for this Discord bot
 */
export class CommandFileReader {
    private commands: Collection<String, Command> = new Collection()

    /**
     * Initializes the class, needs to be done once for every instance of the class
     */
    async setupCommands(): Promise<void> {
        const commandFiles: string[] = await globPromise(`${__dirname}/../commands/**/*{.ts,.js}`)

        await Promise.all(commandFiles.map(async (value: string) => {
            const file: Command = await import(value);
            this.commands.set(file.name, file);
        }))
    }

    /**
     * Retrieves all Discord slash commands used by this bot
     * @returns The slash commands as a Collection object
     */
    getCommands(): Collection<String, Command> {
        return this.commands;
    }
}