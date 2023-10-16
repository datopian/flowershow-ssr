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

        // TODO why is this type not working?
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

export async function getAllRepoFilePaths({
    project,
}: {
    project: GitHubProject,
}) {
    const octokit = new Octokit();
    try {
        const { data: tree } = await octokit.rest.git.getTree({
            owner: project.owner,
            repo: project.repo,
            tree_sha: project.branch,
            recursive: "true"
        })

        // Filter the tree to only include blobs (files) not trees (folders)
        const files = tree.tree.filter((file) => file.type === "blob");
        const paths = files.map((f) => f.path)

        return paths;

    } catch (error) {
        throw new Error(
            `Could not get file paths in ${project.owner}/${project.repo}`
        );
    }
}
