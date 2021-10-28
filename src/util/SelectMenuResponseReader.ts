import { Collection } from "discord.js"
import glob from "glob"
import { promisify } from "util"
import { SelectMenuResponse } from "../interfaces/SelectMenuResponse"

const globPromise = promisify(glob)

/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 * Class used to read and retrieve all SelectMenu response handlers
 */
export class SelectMenuResponseReader {
    private selectMenuResponses: Collection<String, SelectMenuResponse> = new Collection()

    /**
     * Initializes the object, needs to be done once for every instance of the class
     */
    async setupSelectMenuResponses(): Promise<void> {
        const commandFiles: string[] = await globPromise(`${__dirname}/../selectmenuresponses/**/*{.ts,.js}`)

        await Promise.all(commandFiles.map(async (value: string) => {
            const file: SelectMenuResponse = await import(value);
            this.selectMenuResponses.set(file.name, file);
        }))
    }

    /**
     * Retrieves all SelectMenu response handlers
     * @returns The SelectMenu response handlers as a Collection object
     */
    getCommands(): Collection<String, SelectMenuResponse> {
        return this.selectMenuResponses;
    }
}