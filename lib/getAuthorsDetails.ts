import clientPromise from "./mddb.mjs";
import sluggify from "./sluggify";

// TODO fix params
const getAuthorsDetails = async (authors?: string[], defaultAuthor?: string, avatarPlaceholder?: string) => {
  const mddb = await clientPromise;
  const allPeople = await mddb.getFiles({ folder: "people" });
  let blogAuthors: string[] = [];

  if (authors) {
    blogAuthors = authors;
  } else if (defaultAuthor) {
    blogAuthors = [defaultAuthor];
  } else {
    blogAuthors = [];
  }

  return blogAuthors.map((author) => {
    const matchedAuthor = allPeople.find((p) => {
      // TODO: slug should probably be a separate column in the DB
      const slug = sluggify(p.url_path!);
      return (
        p.metadata?.id === author ||
        slug === author ||
        p.metadata?.name === author
      );
    });
    return matchedAuthor
      ? {
        name: matchedAuthor.metadata?.name,
        avatar:
          matchedAuthor.metadata?.avatar ?? avatarPlaceholder,
        // TODO find a better way
        urlPath: !matchedAuthor.metadata?.isDraft && matchedAuthor.url_path,
      }
      : {
        name: author,
        avatar: avatarPlaceholder,
      };
  });
};

export default getAuthorsDetails;
