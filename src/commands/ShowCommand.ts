import { CommandInteraction, EmbedField, EmbedFieldData, Interaction, InteractionReplyOptions, MessageEmbed, User } from "discord.js";
import { SlashCommandBuilder } from '@discordjs/builders'
import { hyperlink } from '@discordjs/builders'
import { GitHubApi, ReviewRequest } from "../core/GitHubApi";
import { CommandExecutor } from "../interfaces/Command";
import { UserMapper } from "../util/UserMapper";

/**
 * Retrieves the SlashCommandBuilder for this command
 * @returns The SlashCommandBuilder object
 */
function getBuilder(): SlashCommandBuilder {
    const builder: SlashCommandBuilder = new SlashCommandBuilder()
    builder.setName('show')
    builder.setDescription('Show open PRs for which you have been assigned as a reviewer')

    builder.addUserOption(option => option.setName('user').setDescription('Show open PRs for which the specified user has been assigned as a reviewer'))
    builder.addStringOption(option => option.addChoice('All', 'all').addChoice('Accepted', 'accepted').addChoice('Unaccepted', 'unaccepted').setName('type').setDescription('Use \'All\', \'Unaccepted\' or \'Accepted\' to show the corresponding review requests (defaults to \'All\').'));

    return builder;
}

/**
 * Builds a Discord reply from the array of ReviewRequest options as well as the command (format) type
 * @param reviewRequests The array of ReviewRequest objects to construct the reply from
 * @param formatType The command variant, e.g. "all", "unaccepted" or "accepted"
 * @returns An InteractionReplyOptions object containing the reply
 */
function getReply(reviewRequests: Array<ReviewRequest>, formatType: string): InteractionReplyOptions {
    let embeds: Array<MessageEmbed> = [];

    if (reviewRequests.length === 0) {
        let formattedMessage: string = "You are free to leave, for now... You have no "

        if (formatType === 'accepted' || formatType === 'unaccepted') {
            formattedMessage += formatType
        }

        formattedMessage += " review requests. I will catch you later 🚓"

        embeds.push(new MessageEmbed().setTitle('Show review requests').setDescription(formattedMessage))
    }
    else {
        let fields: Array<EmbedFieldData> = new Array()

        reviewRequests.forEach(reviewRequest => {
            fields.push({ name: `#${reviewRequest.pullNumber}: ${reviewRequest.title}`, value: hyperlink('link', reviewRequest.url) })
        })

        embeds.push(new MessageEmbed().setTitle('Show review requests').addFields(fields))
    }

    const replyOptions: InteractionReplyOptions = { embeds: embeds }
    return replyOptions;
}

/**
 * The CommandExecutor for this command. Retrieves the review requests for the user that sent the command, and shows it as a reply in Discord
 * @param client The Discord bot
 * @param interaction The corresponding interaction that triggered this command
 */
export const executor: CommandExecutor = async (client, interaction: CommandInteraction) => {
    let isEphemeral: boolean = true
    let type = interaction.options.getString('type')
    let user: User = interaction.user

    if (!type) {
        type = 'all'
    }

    if (interaction.options.getUser('user')) {
        user = interaction.options.getUser('user') as User
        isEphemeral = false
    }

    let githubUsername: string = UserMapper.getGithubUsername(user.id)

    let reviewRequests: Array<ReviewRequest> = new Array()
    let reply: InteractionReplyOptions

    switch (type) {
        case 'all':
            reviewRequests = await GitHubApi.getAllReviewRequests(githubUsername)
            break;
        case 'accepted':
            reviewRequests = await GitHubApi.getAcceptedReviewRequests(githubUsername)
            break;
        case 'unaccepted':
            reviewRequests = await GitHubApi.getUnacceptedReviewRequests(githubUsername)
            break;
    }

    reply = getReply(reviewRequests, type)
    interaction.reply(reply)
}

/**
 * The SlashCommandBuilder
 */
export const builder: SlashCommandBuilder = getBuilder()

/**
 * The command name
 */
export const name: string = 'show'
