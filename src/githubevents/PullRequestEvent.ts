import { PullRequestClosedEvent, PullRequestEvent, PullRequestOpenedEvent, PullRequestReopenedEvent, PullRequestReviewRequestedEvent, User } from "@octokit/webhooks-types";
import { MessageEmbed } from "discord.js";
import { DiscordBot } from "../core/DiscordBot";
import { GitHubEventExecutor } from "../interfaces/GitHubEvent";
import { UserMapper } from "../util/UserMapper";
import { hyperlink } from '@discordjs/builders'
import { GitHubApi, PullRequest } from "../core/GitHubApi";

/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 * GitHubEvent handler for the 'pull_request' event
 */

/**
 * Helper class used to represent newly opened pull requests
 */
class PullRequestOpened {
    number: number
    reviewRequestNotificationSent: boolean = false
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Stores all the newly opened pull requests for which the corresponding 'review_requested' event has not yet been handled
 */
const newPullRequests: Array<PullRequestOpened> = new Array()

/**
 * Called whenever a new pull request has been opened. Simply adds the pull request to the "newPullRequests" array
 * @param payload The payload for the event
 */
function pullRequestOpened(payload: PullRequestOpenedEvent) {
    // Workaround to make sure that reviewers only get pinged once.
    const pullRequestOpened: PullRequestOpened = new PullRequestOpened()
    pullRequestOpened.number = payload.number

    newPullRequests.push(pullRequestOpened)
}

/**
 * Called whenever a pull request has been reopened. Notifies the pull request reviewers in Discord.
 * @param client The Discord bot used to send the message
 * @param payload The payload for the event
 */
async function pullRequestReopened(client: DiscordBot, payload: PullRequestReopenedEvent) {
    // Ping PR reviewers saying that the PR has been re-opened
    // Seems to be something funky with octokit, cannot retrieve the pull request itself from the payload, so I'll do it via the GitHubApi class instead
    const pullRequest: PullRequest = await GitHubApi.getPullRequest(payload.number);
    let description: string = "";

    for (let i = 0; i < pullRequest.reviewRequests.length; i++) {
        const reviewRequest = pullRequest.reviewRequests[i]
        const discordId = UserMapper.getDiscordId(reviewRequest.reviewer)
        description += `${await client.getUser(discordId)} `
    }

    description = description.trim()
    description += `: The pull request ${hyperlink(`#${pullRequest.number}: ${pullRequest.title}`, pullRequest.url)} has been re-opened. You are back on for review-duty, get a move on! 👮🏻‍♂️`

    const embed = new MessageEmbed().setTitle("Review Police court duty").setDescription(description).setFooter(client.user.username)

    client.sendMessage([embed])
}

/**
 * Called whenever a review has been requested for a pull request. Pings the reviewer that was requested, in Discord.
 * @param client The Discord bot used to send the message
 * @param payload The event payload
 */
async function pullRequestReviewRequested(client: DiscordBot, payload: PullRequestReviewRequestedEvent) {
    /* 
     * This event is triggered one time for each reviewer when a new PR is opened and reviewerers are auto-assigned.
     * This is a workaround to only trigger the discord ping once for all of the assigned reviewers
     */
    const index = newPullRequests.length == 0 ? -1 : newPullRequests.findIndex(x => x.number == payload.pull_request.number)
    let pullRequest: PullRequestOpened

    if (index >= 0) {
        pullRequest = newPullRequests[index]
    }

    if (index == -1 || !pullRequest.reviewRequestNotificationSent) {
        const discordUsers: Array<string> = new Array();

        if (index != -1) {
            pullRequest.reviewRequestNotificationSent = true

            await new Promise(async (resolve, reject) => {
                await delay(5000)
                try {
                    delete newPullRequests[index]
                } catch (err) {
                    reject(err)
                }
                resolve("")
            })

            payload.pull_request.requested_reviewers.forEach(reviewer => {
                const user: User = reviewer as User
                const discordId: string = UserMapper.getDiscordId(user.login)
                discordUsers.push(discordId)
            })
        } else {
            if ("requested_reviewer" in payload) {
                const user: User = payload.requested_reviewer
                const discordId: string = UserMapper.getDiscordId(user.login)
                discordUsers.push(discordId)
            }
        }

        let description: string = ""

        for (let i = 0; i < discordUsers.length; i++) {
            const discordUser = discordUsers[i]
            description += `${await client.getUser(discordUser)} `
        }

        description = description.trim()
        description += ": You have been summoned for review duty on pull request " + hyperlink(`#${payload.pull_request.number}: ${payload.pull_request.title}`, payload.pull_request.html_url) + ". Please either accept the review request by using the /accept command, or ignore this message."

        const embed = new MessageEmbed().setTitle("Review Police court duty").setDescription(description).setFooter(client.user.username)

        client.sendMessage([embed])
    }
}

/**
 * Called whenever a pull request has been merged. Sends a message in Discord to notify members of the team that the pull request has been merged.
 * @param client The Discord bot used to send the message
 * @param payload The event payload
 */
function pullRequestMerged(client: DiscordBot, payload: PullRequestClosedEvent) {
    const description: string = `The pull request ${hyperlink(`#${payload.pull_request.number}: ${payload.pull_request.title}`, payload.pull_request.html_url)} has been merged. Good job everybody! 👏🏻`

    const embed = new MessageEmbed().setTitle("Review Police merge notice").setDescription(description).setFooter(client.user.username)

    client.sendMessage([embed])
}

/**
 * Called whenever a pull request has been closed (but not merged). Sends a message to the pull request reviewers in Discord saying that they don't have to worry about reviewing it anymore.
 * @param client The Discord bot used to send the message
 * @param payload The event payload
 */
async function pullRequestClosed(client: DiscordBot, payload: PullRequestClosedEvent) {
    let description: string = "";

    for (let i = 0; i < payload.pull_request.requested_reviewers.length; i++) {
        const reviewer = payload.pull_request.requested_reviewers[i]
        const user: User = reviewer as User;
        const discordId = UserMapper.getDiscordId(user.login)
        description += `${await client.getUser(discordId)} `
    }

    description = description.trim()
    description += `The pull request ${hyperlink(`#${payload.pull_request.number}: ${payload.pull_request.title}`, payload.pull_request.html_url)} has been closed. You have been set free from review duty this time, I'll catch you next time 🚓`

    const embed = new MessageEmbed().setTitle("Review Police court duty").setDescription(description).setFooter(client.user.username)

    client.sendMessage([embed])
}

/**
 * The GitHubEventExecutor for this event. Handles the "reopened", "review_requested", "merged" and "closed" states by notifying the corresponding people in Discord. Handles the "opened" event by preparing a workaround for the "review_requested" event which will be triggered later by the auto-assign bot.
 * @param client The Discord client used to send the messages
 * @param payload The event payload
 */
export const executor: GitHubEventExecutor = async (client: DiscordBot, payload: PullRequestEvent) => {
    if ("action" in payload) {
        switch (payload.action) {
            case "opened":
                pullRequestOpened(payload as PullRequestOpenedEvent)
                break;
            case "reopened":
                pullRequestReopened(client, payload as PullRequestReopenedEvent);
                break;
            case "review_requested":
                await pullRequestReviewRequested(client, payload as PullRequestReviewRequestedEvent)
                break;
            case "closed":
                if (!payload.pull_request.merged) {
                    pullRequestClosed(client, payload as PullRequestClosedEvent)
                } else {
                    pullRequestMerged(client, payload as PullRequestClosedEvent);
                }
                break;
        }
    }
}

/**
 * The event name: 'pull_request'
 */
export const name: string = 'pull_request'