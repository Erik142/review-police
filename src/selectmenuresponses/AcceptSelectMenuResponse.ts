import { InteractionReplyOptions, MessageEmbed, SelectMenuInteraction } from "discord.js";
import { DiscordBot } from "../core/DiscordBot";
import { GitHubApi, PullRequest, ReviewRequest } from "../core/GitHubApi";
import { SelectMenuResponseExecutor } from "../interfaces/SelectMenuResponse";
import { UserMapper } from "../util/UserMapper";

/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 */

/**
 * Retrieves the remaining reviewers except the specified username for the specified pull request number
 * @param username The username to neglect in the return value
 * @param pullRequestNumber The number for the pull request
 * @returns An Array of ReviewRequest objects containing all reviewers except the specified username
 */
async function getRemainingReviewers(username: string, pullRequestNumber: number): Promise<Array<ReviewRequest>> {
    const pullRequest: PullRequest = await GitHubApi.getPullRequest(pullRequestNumber)

    const reviewers: Array<ReviewRequest> = new Array()

    pullRequest.reviewRequests.forEach(reviewRequest => {
        if (reviewRequest.reviewer != username) {
            reviewers.push(reviewRequest)
        }
    })

    return reviewers
}

/**
 * Deletes the remaining reviewers except the specified username for the specified pull request number
 * @param username The username to neglect in the return value
 * @param pullRequestNumber The number for the pull request
 * @returns true if the operation was successful, false otherwise
 */
async function deleteRemainingReviewers(username: string, pullRequestNumber: number): Promise<boolean> {
    const reviewers: Array<ReviewRequest> = await getRemainingReviewers(username, pullRequestNumber)

    return await GitHubApi.deleteReviewers(pullRequestNumber, reviewers.map(x => x.reviewer))
}

/**
 * SelectMenuResponseExecutor for this interaction. Retrieves the value(s) from the from the SelecMenu and deletes the remaining reviewers from the pull request(s), then pings them in Discord saying that the user who initiated the command has accepted the review request.
 * @param client The Discord bot used to send the message
 * @param interaction The interaction to handle
 * @returns void
 */
export const executor: SelectMenuResponseExecutor = async (client: DiscordBot, interaction: SelectMenuInteraction) => {
    const embeds: Array<MessageEmbed> = new Array();

    for (let i = 0; i < interaction.values.length; i++) {
        const value: string = interaction.values[i]
        const pullRequestNumber = Number(value)
        const user = interaction.user
        const username = UserMapper.getGithubUsername(user.id)

        const reviewRequests: Array<ReviewRequest> = await GitHubApi.getAllReviewRequests(username)
        const pullRequest: PullRequest = await GitHubApi.getPullRequest(pullRequestNumber)

        if (!pullRequest) {
            const reply: InteractionReplyOptions = { embeds: [new MessageEmbed().setTitle('Review Police court duty').setDescription(`I don't know what you're going on about... Come on, get on out of here! The pull request with number ${pullRequestNumber} does not exist!`)] }
            interaction.reply(reply)
            return;
        }

        let reviewRequested = false
        let deleteSuccessfull = false
        let success = false
        let alreadyAssigned = false

        let remainingReviewers: Array<ReviewRequest> = new Array()

        for (let i = 0; i < reviewRequests.length; i++) {
            if (reviewRequests[i].pullNumber == pullRequestNumber) {
                reviewRequested = true;
                break;
            }
        }

        if (reviewRequested) {
            remainingReviewers = await getRemainingReviewers(username, pullRequestNumber)

            console.log(`Remaining reviewer count: ${remainingReviewers.length}`)

            if (remainingReviewers.length >= 1) {
                deleteSuccessfull = await deleteRemainingReviewers(username, pullRequestNumber)
            }
            else {
                alreadyAssigned = true
            }
        }

        success = reviewRequested && deleteSuccessfull
        let description = ""

        if (alreadyAssigned) {
            description = "Trying to work double shifts, eh? You have already accepted this request review, try another one."
        } else if (success) {
            description = ""

            for (let i = 0; i < remainingReviewers.length; i++) {
                const reviewRequest = remainingReviewers[i]
                let discordId = UserMapper.getDiscordId(reviewRequest.reviewer)
                description += `${await client.getUser(discordId)} `
            }

            description = description.trim()

            let userDiscordId = UserMapper.getDiscordId(username)

            description += `: ${await client.getUser(userDiscordId)} has bailed you out of review duty. I'll catch you next time 🚓`
        } else if (!reviewRequested) {
            description = "Trying to bail your friends out of review duty, huh? Not gonna happen this time. Your review has not been requested for this pull request, try another one."
        } else if (!deleteSuccessfull && reviewRequested) {
            description = "Your friends could not be bailed out of review duty this time. Something went wrong when trying to remove other reviewers from the pull request. Try again or do it manually in GitHub."
        }
        embeds.push(new MessageEmbed().setTitle("Review Police: Court Duty").setDescription(description).setURL(pullRequest.url))
    }

    await interaction.update({ content: `PR${interaction.values.length > 1 ? 's have' : ' has'} been selected. Use /accept again to select more PRs.`, components: [] })
    await client.sendMessage(embeds)
}

export const name: string = "accept-pr-response"