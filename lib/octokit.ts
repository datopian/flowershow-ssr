import { Octokit } from "octokit";

export interface GitHubProject {
    owner: string;
    repo: string;
    branch: string;
}

export async function getRepoFile({
    project,
    path,
}: {
    project: GitHubProject,
    path: string,
}) {
    const octokit = new Octokit();
    try {
        const response = await octokit.rest.repos.getContent({
            owner: project.owner,
            repo: project.repo,
            ref: project.branch,
            path: path
        });

        const data = response.data as {
            content?: string;
        };
        const fileContent = data.content ?? null;
        const decodedContent = Buffer.from(fileContent, "base64").toString();
        return decodedContent;

    } catch (error) {
        throw new Error(
            `Could not read ${project.owner}/${project.repo}/${path}`
        );
    }
}

