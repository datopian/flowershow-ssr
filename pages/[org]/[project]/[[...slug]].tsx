import React from "react";
import { NextSeo } from "next-seo";
import { InferGetServerSidePropsType, GetServerSideProps } from "next";
import { db } from "@/lib/db";

/* import { NavItem, NavGroup } from "@portaljs/core"; */

import MdxPage from "@/components/MdxPage";
/* import computeFields from "@/lib/computeFields"; */
import parse from "@/lib/markdown";
import { getRepoFile, getAllRepoFilePaths } from "@/lib/octokit";
import { filePathsToPermalinks } from "@/lib/filePathsToPermalinks";
import { defaultConfig } from "@portaljs/core";


export default function Page({ source, meta, siteConfig }: InferGetServerSidePropsType<typeof getServerSideProps>) {
    source = JSON.parse(source);

    const seoImages = (() => {
        // if page has specific image set
        if (meta.image) {
            return [
                {
                    url: meta.image.startsWith("http")
                        ? meta.image
                        : `${siteConfig.domain}${meta.image}`,
                    width: 1200,
                    height: 627,
                    alt: meta.title,
                },
            ];
        }
        // otherwise return default images array set in config file
        return siteConfig.nextSeo?.openGraph?.images || [];
    })();

    return (
        <>
            <NextSeo
                title={meta.title}
                description={meta.description}
                openGraph={{
                    title: meta.title,
                    description: meta.description,
                    images: seoImages,
                }}
            />
            <MdxPage source={source} frontMatter={meta} />
        </>
    );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
    const { org, project, slug = [] } = params;

    // TODO types!
    const dbProject = await db.project.findFirst({
        where: {
            name: project as string, // TODO type
            org: {
                name: org as string, // TODO type
            }
        },
    });

    if (!dbProject) {
        return {
            notFound: true,
        };
    }

    const { gh_repository, gh_owner, gh_branch } = dbProject;

    const path = (slug as string[]).join("/");
    let file: string;

    try {
        // if the path points to a file
        file = await getRepoFile({
            project: {
                owner: gh_owner,
                repo: gh_repository,
                branch: gh_branch
            },
            path: path + ".md",
        });
    } catch (e1) {
        try {
            // if the path points to a directory, get the index.md file inside
            file = await getRepoFile({
                project: {
                    owner: gh_owner,
                    repo: gh_repository,
                    branch: gh_branch
                },
                path: path + "/index.md",
            });

        } catch (e2) {
            return {
                notFound: true,
            };
        }
    }

    // TODO don't compute this on every request?
    const filePaths = await getAllRepoFilePaths({
        project: {
            owner: gh_owner,
            repo: gh_repository,
            branch: gh_branch
        }
    });

    const permalinks = filePathsToPermalinks({
        filePaths,
        org: params.org as string,
        project: params.project as string,
        ghPagesDomain: gh_owner + ".github.io/" + gh_repository, // TODO
    });

    const { mdxSource, frontMatter } = await parse(file, "mdx", {}, permalinks);

    // TODO temporary replacement for contentlayer's computedFields
    /* const frontMatterWithComputedFields = await computeFields({
*     frontMatter,
*     urlPath,
*     filePath,
*     source,
*     siteConfig: config,
* }); */

    let userConfig: any = {};

    try {
        // if the path points to a directory, get the index.md file inside
        userConfig = await getRepoFile({
            project: {
                owner: gh_owner,
                repo: gh_repository,
                branch: gh_branch,
            },
            path: "/config.json",
        });
        userConfig = JSON.parse(userConfig);
    } catch {
        console.log("no config file found");
    }

    const siteConfig = {
        ...defaultConfig,
        ...userConfig,
        // TODO dirty temporary solution
        navLinks: userConfig.navLinks ? userConfig.navLinks.map((link) => ({
            ...link,
            href: orgPrefixLink(link.href, org as string, project as string)
        })) : [],
        // prevent theme object overrides for
        // values not provided in userConfig
        theme: {
            ...defaultConfig.theme,
            ...userConfig?.theme,
        },
    };

    return {
        props: {
            source: JSON.stringify(mdxSource),
            meta: frontMatter,
            siteConfig
        },
    }
}

function orgPrefixLink(link: string, org: string, project: string) {
    return `/@${org}/${project}/${link}`
}

interface Project {
    id: string;
    org: string;
    config: {
        repo: string;
        owner: string;
        branch: string;
        ghPagesDomain?: string;
    }
}
