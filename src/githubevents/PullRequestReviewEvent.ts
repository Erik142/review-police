import { PullRequestReviewEvent, PullRequestReviewSubmittedEvent } from "@octokit/webhooks-types";
import { MessageEmbed } from "discord.js";
import { DiscordBot } from "../core/DiscordBot";
import { EnvConfig } from "../core/EnvConfig";
import { Config } from "../interfaces/Config";
import { GitHubEventExecutor } from "../interfaces/GitHubEvent";
import { UserMapper } from "../util/UserMapper";
import { hyperlink } from '@discordjs/builders'

const config: Config = EnvConfig.getConfig()

/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 * GitHubEvent handler for the 'pull_request_review' event 
 */

/**
 * Called whenever a pull request has been approved by a reviewer. Pings the product owner in Discord telling them that it's their decision whether or not to merge the pull request.
 * @param client The Discord bot used to send the message
 * @param payload The event payload
 */
async function pullRequestReviewApproved(client: DiscordBot, payload: PullRequestReviewSubmittedEvent) {
    const poDiscordId = UserMapper.getDiscordId(config.gitHubProductOwner)
    const reviewerDiscordId = UserMapper.getDiscordId(payload.review.user.login)

    const description: string = `${await client.getUser(poDiscordId)}: Pull request ${hyperlink(`#${payload.pull_request.number}: ${payload.pull_request.title}`, payload.pull_request.html_url)} has been approved by ${await client.getUser(reviewerDiscordId)}, it is now up to you to decide it's destiny.`;

    const messagePayload: MessageEmbed = new MessageEmbed().setTitle("How does the judge respond?").setDescription(description);
    await client.sendMessage([messagePayload]);
}

/**
 * Called whenever a reviewer requests changes for a pull request. Pings the pull request owner in Discord, telling them to perform the necessary changes.
 * @param client The Discord bot used to send the message
 * @param payload The event payload
 */
async function pullRequestReviewChangesRequested(client: DiscordBot, payload: PullRequestReviewSubmittedEvent) {
    const ownerDiscordId = UserMapper.getDiscordId(payload.pull_request.user.login)

    const description: string = `${await client.getUser(ownerDiscordId)}: The judge has ruled to take this to a higher instance. Changes have been requested for the pull request ${hyperlink(`#${payload.pull_request.number}: ${payload.pull_request.title}`, payload.pull_request.html_url)}. Address the comments, then re-request the review in GitHub.`;

    const messagePayload: MessageEmbed = new MessageEmbed().setTitle("A verdict has been made").setDescription(description);
    await client.sendMessage([messagePayload]);
}

/**
 * The GitHubEventExecutor for the 'pull_request_review' event. Handles the "submitted" action and the "approved", and "changes_requested" state. The "approved" state is handled by pinging the product owner in Discord, and the "changes_requested" is handled by pinging the pull request owner in Discord.
 * @param client The Discord bot used to send the messages
 * @param payload The event payload
 * @returns void
 */
export const executor: GitHubEventExecutor = async (client: DiscordBot, payload: PullRequestReviewEvent) => {
    if (payload.action != "submitted") {
        return;
    }

    switch (payload.review.state.toLowerCase()) {
        case "approved":
            await pullRequestReviewApproved(client, payload);
            break;
        case "changes_requested":
            await pullRequestReviewChangesRequested(client, payload);
            break;
    }
}

/**
 * The event name: 'pull_request_review'
 */
export const name: string = 'pull_request_review'