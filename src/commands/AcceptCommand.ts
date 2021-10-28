import { CommandInteraction, MessageActionRow, MessageEmbed, MessageSelectMenu, MessageSelectOptionData } from "discord.js";
import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandExecutor } from "../interfaces/Command";
import { GitHubApi, ReviewRequest } from "../core/GitHubApi";
import { UserMapper } from "../util/UserMapper";

/**
 * Retrieves the SlashCommandBuilder for this command
 * @returns The SlashCommandBuilder object
 */
function getBuilder(): SlashCommandBuilder {
    const builder: SlashCommandBuilder = new SlashCommandBuilder()
    builder.setName('accept')
    builder.setDescription('Accept the review request for a particular PR in GitHub')

    return builder;
}

/**
 * The CommandExecutor for this command. Retrieves all review requests for the user sending the command. If any unaccepted review requests are available, a MessageSelectMenu with the unaccepted review requests will be shown to the user.
 * @param client The Discord bot client
 * @param interaction The corresponding interaction that triggered this CommandExecutor
 */
export const executor: CommandExecutor = async (client, interaction: CommandInteraction) => {
    const username = UserMapper.getGithubUsername(interaction.user.id)
    const reviewRequests: Array<ReviewRequest> = await GitHubApi.getUnacceptedReviewRequests(username)

    if (reviewRequests.length == 0) {
        const reply: MessageEmbed = new MessageEmbed().setTitle("Accept review request").setDescription("Sorry, you don't have any unaccepted review requests...")
        await interaction.reply({ embeds: [reply] })
    } else {
        const messageActionRow: MessageActionRow = new MessageActionRow()
        const selectOptions: Array<MessageSelectOptionData> = new Array();

        reviewRequests.forEach(reviewRequest => {
            const selectOptionData: MessageSelectOptionData = {
                label: reviewRequest.title,
                description: `PR #${reviewRequest.pullNumber}`,
                value: reviewRequest.pullNumber.toString()
            }

            selectOptions.push(selectOptionData)
        })

        messageActionRow.addComponents(new MessageSelectMenu().setCustomId('accept-pr-response').setPlaceholder('Select a PR').addOptions(selectOptions))
        await interaction.reply({ content: "Choose from the PRs below:", components: [messageActionRow], ephemeral: true })
    }
}

/**
 * The SlashCommandBuilder
 */
export const builder: SlashCommandBuilder = getBuilder()

/**
 * The command name
 */
export const name: string = 'accept'