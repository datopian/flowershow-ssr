import React from "react";
import { NextSeo } from "next-seo";
import { InferGetServerSidePropsType, GetServerSideProps } from "next";

/* import { NavItem, NavGroup } from "@portaljs/core"; */

import MdxPage from "@/components/MdxPage";
/* import computeFields from "@/lib/computeFields"; */
import parse from "@/lib/markdown";
import { getRepoFile, getAllRepoFilePaths } from "@/lib/octokit";
import { filePathsToPermalinks } from "@/lib/filePathsToPermalinks";
import siteConfig from "@/config/siteConfig";


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
    const { org, slug = [] } = params;

    const projectsRes = await fetch('https://raw.githubusercontent.com/datopian/flowershow-ssr/main/projects.json')
    const projects: Project[] = await projectsRes.json()
    const project = projects.find(p => p.org === org);

    if (!project) {
        return {
            notFound: true,
        };
    }

    const { repo, owner, branch, ghPagesDomain } = project.config;

    const path = (slug as string[]).join("/");
    let file: string;

    try {
        // if the path points to a file
        file = await getRepoFile({
            project: {
                owner,
                repo,
                branch,
            },
            path: path + ".md",
        });
    } catch (e1) {
        /* console.log(e1.message); */
        try {
            // if the path points to a directory, get the index.md file inside
            file = await getRepoFile({
                project: {
                    owner,
                    repo,
                    branch,
                },
                path: path + "/index.md",
            });

        } catch (e2) {
            /* console.log(e2.message); */
            return {
                notFound: true,
            };
        }
    }

    // TODO don't compute this on every request?
    const filePaths = await getAllRepoFilePaths({
        project: {
            owner,
            repo,
            branch,
        }
    });

    const permalinks = filePathsToPermalinks({
        filePaths,
        org: params.org as string,
        ghPagesDomain: ghPagesDomain + "/" + repo,
    });

    console.log(permalinks);

    const { mdxSource, frontMatter } = await parse(file, "mdx", {}, permalinks);

    // TODO temporary replacement for contentlayer's computedFields
    /* const frontMatterWithComputedFields = await computeFields({
*     frontMatter,
*     urlPath,
*     filePath,
*     source,
*     siteConfig: config,
* }); */

    return {
        props: {
            source: JSON.stringify(mdxSource),
            meta: frontMatter,
            siteConfig
        },
    }
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
