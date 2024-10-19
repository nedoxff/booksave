import BookmarkOptions from '$lib/static/media-options.json';
import queryString from 'query-string';
import { RawTweet } from './types/external/common_types';
import { getSessionValue } from '@/entrypoints/background';
import { ExportRequest } from './types/internal/ExportOptions';
import { TwitterAuthorization } from './types/internal/TwitterAuthorization';

const LIKES_ENDPOINT: string = "https://x.com/i/api/graphql/px6_YxfWkXo0odY84iqqmw/Likes";

export const getLikesChunk = async (cursor: string | undefined): Promise<{
    tweets: RawTweet[],
    cursor?: string
}> => {
    const authorization = await getSessionValue<TwitterAuthorization>("authorization");
    const query = {
        variables: JSON.stringify({
            cursor: cursor,
            userId: authorization.userId,
            count: (await getSessionValue<ExportRequest>("requestOptions")).paginationStep,
            includePromotedContent: false
        }),
        features: JSON.stringify(BookmarkOptions)
    };

    const response = await fetch(LIKES_ENDPOINT + `?${queryString.stringify(query)}`, {
        method: "GET",
        credentials: "include",
        headers: {
            Authorization: authorization.bearerToken,
            "X-Csrf-Token": authorization.securityToken
        }
    });

    if (!response.ok) {
        throw new Error(`likes endpoint returned ${response.status} (${response.statusText})`);
    }

    let entries;

    try {
        const instructions = (await response.json()).data.user.result.timeline.timeline.instructions;
        const addInstruction = instructions.find(x => x.type === "TimelineAddEntries");
        if (addInstruction === undefined) {
            return { tweets: [] };
        }
        entries = addInstruction.entries;
        if (!addInstruction.entries.some(x => x.entryId.startsWith("tweet"))) {
            return { tweets: [] };
        }
    }
    catch(err) {
        throw new Error(`the likes endpoint sent ill-formed JSON: ${err}`);
    }

    const tweets: RawTweet[] = [];
    let newCursor: string | undefined = undefined;

    for (const entry of entries) {
        try {
            if (entry.entryId.startsWith("cursor-bottom")) {
                newCursor = entry.content.value;
            }
            else if (entry.entryId.startsWith("tweet")) {
                if (entry.content.itemContent.tweet_results.result.__typename !== "Tweet")
                    continue;

                const rawTweet: RawTweet = entry.content.itemContent.tweet_results.result;
                tweets.push(rawTweet);
            }
        }
        catch (err) {
            console.warn(`skipping entry: ${err}`, entry);
        }
    }

    return { tweets: tweets, cursor: newCursor };
}