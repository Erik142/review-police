import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/core";
import { Config } from "../interfaces/Config";

/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 * An interface representing the key elements in a GitHub pull request
 */
export interface PullRequest {
    title: string,
    url: string
    number: number,
    status: string,
    reviewRequests: Array<ReviewRequest>
}

/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 * An interface representing the key elements in a GitHub review request
 */
export interface ReviewRequest {
    url: string,
    reviewer: string
    pullNumber: number,
    title: string
}

/**
 * @author Erik Wahlberger
 * @version 2021-10-01
 * A class used to communicate with the GitHub pull request API
 */
export abstract class GitHubApi {
    private static repoOwner = 'Erik142'
    private static repoName = 'Team-Apricot'

    private static octokit: Octokit
    private static config: Config

    /**
     * Set the configuration for the API to use
     * @param config The configuration
     */
    static setConfig(config: Config) {
        GitHubApi.config = config;
    }

    /**
     * Setup the initial connection to the GitHub API. This only needs to be done once
     * @returns void
     */
    private static setup(): void {
        if (GitHubApi.octokit) {
            return;
        }

        GitHubApi.octokit = new Octokit({
            authStrategy: createAppAuth,
            auth: {
                appId: 141501,
                privateKey: this.config.gitHubPrivateRSAKey.replace(/\\n/g, '\n'),
                installationId: this.config.gitHubInstallationId
            },
        });
    }

    /**
     * Retrieves all the open pull requests for the repo in the configuration
     * @returns An array of PullRequest objects
     */
    static async getPullRequests(): Promise<Array<PullRequest>> {
        await GitHubApi.setup()

        const response = await GitHubApi.octokit.request('GET /repos/{owner}/{repo}/pulls', {
            owner: GitHubApi.repoOwner,
            repo: GitHubApi.repoName,
            state: 'open'
        });

        const pullRequests: Array<PullRequest> = new Array()

        response['data'].forEach((singleResponse: any) => {
            pullRequests.push(this.getPullRequestFromResponse(singleResponse))
        })

        return pullRequests;
    }

    /**
     * Retrieves a single open pull request for the repo in the configuration
     * @param pullNumber The pull request number
     * @returns The pull request as a PullRequest object
     */
    static async getPullRequest(pullNumber: number): Promise<PullRequest> {
        await GitHubApi.setup()

        let pullRequest: PullRequest = undefined;

        try {
            const response = await GitHubApi.octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
                owner: GitHubApi.repoOwner,
                repo: GitHubApi.repoName,
                pull_number: pullNumber
            });

            if (response.status == 200) {
                pullRequest = this.getPullRequestFromResponse(response['data']);
            }
        } catch {

        }

        return pullRequest;
    }

    /**
     * Retrieves all the review requests from the open pull requests in the repo in the configuration, for the specified user
     * @param username The username for the GitHub user
     * @returns An array of ReviewRequest objects
     */
    static async getAllReviewRequests(username: string): Promise<Array<ReviewRequest>> {
        await GitHubApi.setup()

        let pullRequests: Array<PullRequest> = await GitHubApi.getPullRequests()
        let reviewRequests: Array<ReviewRequest> = []

        pullRequests.forEach(pullRequest => {
            let reviews: Array<ReviewRequest> = pullRequest.reviewRequests

            reviews.forEach((reviewRequest: ReviewRequest) => {
                if (reviewRequest.reviewer == username) {
                    reviewRequests.push(reviewRequest)
                }
            })
        })

        return reviewRequests
    }

    /**
     * Retrieves all the accepted review requests from the open pull requests in the repo in the configuration for the specified user, meaning all the review requests where the specified user is the only reviewer
     * @param username The username for the GitHub user
     * @returns An array of ReviewRequest objects
     */
    static async getAcceptedReviewRequests(username: string): Promise<Array<ReviewRequest>> {
        await GitHubApi.setup()

        let pullRequests: Array<PullRequest> = await GitHubApi.getPullRequests()
        let reviewRequests: Array<ReviewRequest> = []

        pullRequests.forEach(pullRequest => {
            const reviews: Array<ReviewRequest> = pullRequest.reviewRequests

            if (reviews.length == 1) {
                if (reviews[0].reviewer == username) {
                    reviewRequests.push(reviews[0])
                }
            }
        })

        return reviewRequests
    }

    /**
     * Retrieves all the unaccepted review requests from the open pull requests in the repo in the configuration for the specified user, meaning all the review requests where the specified user is not the only reviewer
     * @param username The username for the GitHub user
     * @returns An array of ReviewRequest objects
     */
    static async getUnacceptedReviewRequests(username: string): Promise<Array<ReviewRequest>> {
        await GitHubApi.setup()

        let pullRequests: Array<PullRequest> = await GitHubApi.getPullRequests()
        let reviewRequests: Array<ReviewRequest> = []

        pullRequests.forEach(pullRequest => {
            let reviews: Array<ReviewRequest> = pullRequest.reviewRequests

            if (reviews.length > 1) {
                reviews.forEach((reviewRequest: ReviewRequest) => {
                    if (reviewRequest.reviewer == username) {
                        reviewRequests.push(reviewRequest)
                    }
                })
            }
        })

        return reviewRequests
    }

    /**
     * Deletes the specified reviewers from the specified pull request in the repo in the configuration
     * @param pullRequestNumber The pull request number
     * @param reviewers The reviewers to be deleted
     * @returns true if successful, false otherwise
     */
    static async deleteReviewers(pullRequestNumber: number, reviewers: string[]): Promise<boolean> {
        await GitHubApi.setup()

        let response = await GitHubApi.octokit.request('DELETE /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers', {
            owner: GitHubApi.repoOwner,
            repo: GitHubApi.repoName,
            pull_number: pullRequestNumber,
            reviewers: reviewers
        })

        return response['status'] == 200
    }

    /**
     * Convert the GitHub pull request API response into a PullRequest object
     * @param response The API response
     * @returns A PullRequest object
     */
    private static getPullRequestFromResponse(response: any): PullRequest {
        let pullRequest: PullRequest = {
            title: response['title'] as string,
            url: response['html_url'] as string,
            number: response['number'] as number,
            status: response['status'] as string,
            reviewRequests: GitHubApi.getReviewRequestsFromResponse(response)
        }

        return pullRequest;
    }

    /**
     * Convert the GitHub pull request API response into an array of ReviewRequest objects
     * @param response The API response
     * @returns An array of ReviewRequest objects
     */
    private static getReviewRequestsFromResponse(response: any): Array<ReviewRequest> {
        const reviewRequests: Array<ReviewRequest> = new Array()

        let reviewers: Array<any> = response['requested_reviewers']

        for (let i = 0; i < reviewers.length; i++) {
            let reviewRequest: ReviewRequest = {
                pullNumber: response['number'] as number,
                title: response['title'] as string,
                url: response['html_url'] as string,
                reviewer: reviewers[i]['login'] as string
            }

            reviewRequests.push(reviewRequest)
        }

        return reviewRequests;
    }
}