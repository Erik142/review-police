import { EventExecutor } from '../../interfaces/Event'

/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 * Event handler for the 'ready' event
 */

/**
 * The EventExecutor for this event. Simply prints out the discord bot username whenever the 'ready' event has been triggered
 * @param client 
 */
export const executor: EventExecutor = async (client) => {
    if (client.user != null) {
        console.log(`Logged in as ${client.user.username}!`);
    }
}

/**
 * The event name: 'ready'
 */
export const name: string = 'ready'