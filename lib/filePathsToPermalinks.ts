export const filePathsToPermalinks = (
    {
        filePaths,
        org,
        project,
        ignorePatterns = [/\.gitignore/],
        ghPagesDomain,
    }:
        {
            filePaths: string[],
            org: string,
            project: string,
            ignorePatterns?: Array<RegExp>,
            ghPagesDomain?: string,
        }
) => {
    const filesFiltered = filePaths.filter((file) => {
        return !ignorePatterns.some((pattern) => file.match(pattern));
    });

    return filesFiltered.map((file) => pathToPermalinkFunc(file, org, project, ghPagesDomain));
};

const pathToPermalinkFunc = (
    filePath: string,
    org: string,
    project: string,
    githubPagesDomain?: string,
) => {
    let permalink = filePath
        .replace(/\.(mdx|md)/, "")
        .replace(/\\/g, "/") // replace windows backslash with forward slash
        .replace(/\/index$/, ""); // remove index from the end of the permalink
    // for images, keep the extension but add github pages domain prefix
    if (filePath.match(/\.(png|jpg|jpeg|gif|svg)$/)) {
        permalink = githubPagesDomain ? `https://${githubPagesDomain}/${permalink}` : permalink;
    } else {
        permalink = `/@${org}/${project}/${permalink}`;
    }
    return permalink.length > 0 ? permalink : "/"; // for home page
};
