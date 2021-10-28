import fs from 'fs'
import path from 'path'

/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 * A key-value pair for Discord ids and GitHub usernames
 */
interface UserMap {
    discordId: string,
    githubId: string
}

/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 * A class used to convert from Discord id numbers to 
 * GitHub usernames and vice versa
 */
export abstract class UserMapper {
    private static usermaps: Array<UserMap> = new Array()

    /**
     * Converts a discord id number to a GitHub username string
     * @param discordId The discord id number
     * @returns The Github username as a string
     */
    static getGithubUsername(discordId: string): string {
        let returnVal: string = "";

        UserMapper.usermaps.forEach((mapping: UserMap) => {
            if (mapping.discordId.trim() == discordId.trim()) {
                returnVal = mapping.githubId
            }
        })

        return returnVal
    }

    /**
     * Converts a GitHub username to a Discord id number
     * @param gitHubUsername The GitHub username
     * @returns The Discord id number as a string
     */
    static getDiscordId(gitHubUsername: string): string {
        let returnVal: string = ""

        UserMapper.usermaps.forEach((mapping: UserMap) => {
            if (mapping.githubId == gitHubUsername) {
                returnVal = mapping.discordId
            }
        })

        return returnVal
    }

    /**
     * Reads all the mappings from the "account-mappings.json" file
     */
    static readMaps(): void {
        let maps: Array<UserMap> = JSON.parse(fs.readFileSync(path.join(__dirname, '../../account-mappings.json'), 'utf-8')).mappings

        UserMapper.usermaps = maps
    }
}