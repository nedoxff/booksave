import BookmarkOptions from "$lib/static/media-options.json";
import queryString from "query-string";
import { RawTweet } from "./types/external/common-types";
import { TwitterAuthorization } from "./types/internal/TwitterAuthorization";

const MEDIA_ENDPOINT: string =
  "https://x.com/i/api/graphql/HaouMjBviBKKTYZGV_9qtg/UserMedia";

export const getMediaChunk = async (
  authorization: TwitterAuthorization,
  cursor: string | undefined,
  count: number,
): Promise<{
  tweets: RawTweet[];
  cursor?: string;
}> => {
  const query = {
    variables: JSON.stringify({
      cursor: cursor,
      userId: authorization.userId,
      count: count,
      includePromotedContent: false,
    }),
    features: JSON.stringify(BookmarkOptions),
  };

  const response = await fetch(
    MEDIA_ENDPOINT + `?${queryString.stringify(query)}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Authorization: authorization.bearerToken,
        "X-Csrf-Token": authorization.securityToken,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `user media endpoint returned ${response.status} (${response.statusText})`,
    );
  }

  let entries;

  try {
    const instructions = (await response.json()).data.user.result.timeline
      .timeline.instructions;
    const addInstruction = instructions.find(
      (x) => x.type === "TimelineAddEntries",
    );
    if (addInstruction === undefined) {
      return { tweets: [] };
    }
    entries = addInstruction.entries;
    if (!addInstruction.entries.some((x) => x.entryId.startsWith("tweet"))) {
      return { tweets: [] };
    }
  } catch (err) {
    throw new Error(`the user media endpoint sent ill-formed JSON: ${err}`);
  }

  const tweets: RawTweet[] = [];
  let newCursor: string | undefined = undefined;

  for (const entry of entries) {
    try {
      if (entry.entryId.startsWith("cursor-bottom")) {
        newCursor = entry.content.value;
      } else if (entry.entryId.startsWith("tweet")) {
        if (
          entry.content.itemContent.tweet_results.result.__typename !== "Tweet"
        )
          continue;

        const rawTweet: RawTweet =
          entry.content.itemContent.tweet_results.result;
        tweets.push(rawTweet);
      }
    } catch (err) {
      console.warn(`skipping entry: ${err}`, entry);
    }
  }

  return { tweets: tweets, cursor: newCursor };
};
