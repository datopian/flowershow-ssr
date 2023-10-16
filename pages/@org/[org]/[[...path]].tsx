import React from "react";
import { NextSeo } from "next-seo";
import { InferGetServerSidePropsType, GetServerSideProps } from "next";

/* import { NavItem, NavGroup } from "@portaljs/core"; */

import MdxPage from "@/components/MdxPage";
/* import computeFields from "@/lib/computeFields"; */
import parse from "@/lib/markdown";
import { getRepoFile } from "@/lib/octokit";
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
    // TODO lookup org in the database, get the repo name, owner and branch
    // mock for now
    const project = projectsDB.find(p => p.org === params.org);
    const { repo, owner, branch } = project.config;

    const path = params.path ? (params.path as string[]).join("/") : "index";
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
            console.log(e1.message);
            console.log(e2.message);
            return {
                notFound: true,
            };
        }
    }

    const { mdxSource, frontMatter } = await parse(file, "mdx", {});

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


const projectsDB = [
    {
        id: 1,
        org: "bulbasaur",
        type: "github",
        config: {
            owner: "olayway",
            repo: "digital-garden",
            branch: "main"
        }
    }
]
