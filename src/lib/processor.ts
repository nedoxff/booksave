import { getAuthorizationData } from "$lib/api/auth";
import { abort, getSessionValue, updateState } from "@/entrypoints/background";
import { TwitterAuthorization } from "./api/types/internal/TwitterAuthorization";
import { ExtensionState } from "./api/types/internal/ExtensionState";
import { RawTweet } from "./api/types/external/common_types";
import { ExportRequest, FilenameOption, SourceOption } from "./api/types/internal/ExportOptions";
import { TweetMedia } from "./api/types/internal/TweetMedia";
import { processBookmarks } from "./processors/bookmarks";
import { sendMessage } from "./messaging";
import { processLikedTweets } from "./processors/likedTweets";
import { processMediaTweets } from "./processors/mediaTweets";

const initializeAuthorizationData = async () => {
    const dirtyAuth = await getAuthorizationData();
    if (dirtyAuth === null) {
        console.error("authorization cookies were not found. aborting");
        abort("couldn't get authorization data", "auth_token and ct0 cookies were not found");
    }
    else {
        console.info("successfully acquired authorization credentials");
        await browser.storage.session.set({
            authorization: dirtyAuth
        });
    }
}

export const formatFilename = async (directory: string, extension: string, tweet: RawTweet, media: TweetMedia) => {
    const requestOptions = await getSessionValue<ExportRequest>("requestOptions");
    const handle = tweet.core.user_results.result.legacy.screen_name;
    const date = new Date(tweet.legacy.created_at).toLocaleDateString().replaceAll('/', '-').replaceAll('.', '-');

    let result = media.id + ' ';
    if (requestOptions.how.has(FilenameOption.INCLUDE_HANDLE)) result += `(@${handle}) `;
    if (requestOptions.how.has(FilenameOption.INCLUDE_SIZE)) result += `[${media.size.width}x${media.size.height}] `;
    if (requestOptions.how.has(FilenameOption.INCLUDE_DATE)) result += `[${date}] `;
    return `${directory}/${result.trim()}.${extension}`;
};

export const processRequest = async () => {
    const requestOptions = await getSessionValue<ExportRequest>("requestOptions");
    await updateState(ExtensionState.RECEIVING_BEARER_TOKEN);
    await initializeAuthorizationData();

    if (requestOptions.from.has(SourceOption.BOOKMARKS)) await processBookmarks();
    if (requestOptions.from.has(SourceOption.LIKED_TWEETS)) await processLikedTweets();
    if (requestOptions.from.has(SourceOption.MEDIA_TWEETS)) await processMediaTweets();
    await sendMessage("updateState", ExtensionState.IDLE);
}
