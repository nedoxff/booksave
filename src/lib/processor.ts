import { getAuthorizationData } from "$lib/api/auth";
import { abort, getSessionValue, updateState } from "@/entrypoints/background";
import { ExtensionState } from "./api/types/internal/ExtensionState";
import { RawTweet } from "./api/types/external/common-types";
import { ExportRequest, FilenameOption, SourceOption } from "./api/types/internal/ExportOptions";
import { TweetMedia } from "./api/types/internal/TweetMedia";
import { sendMessage } from "./messaging";
import { createArchiveForSource } from "./archive";
import { getBookmarkChunk } from "./api/bookmarks";
import { getLikesChunk } from "./api/profile";
import { getMediaChunk } from "./api/media";

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

export const processBookmarks = async () => {
    await updateState(ExtensionState.PROCESSING_BOOKMARKS);
    await createArchiveForSource(SourceOption.BOOKMARKS, "bookmarks.zip", getBookmarkChunk);
}

export const processLikedTweets = async () => {
    await updateState(ExtensionState.PROCESSING_LIKED_TWEETS);
    await createArchiveForSource(SourceOption.LIKED_TWEETS, "liked.zip", getLikesChunk);
}

export const processMediaTweets = async () => {
    await updateState(ExtensionState.PROCESSING_MEDIA_TWEETS);
    await createArchiveForSource(SourceOption.MEDIA_TWEETS, "media.zip", getMediaChunk);
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
    try {
        const requestOptions = await getSessionValue<ExportRequest>("requestOptions");
        await updateState(ExtensionState.RECEIVING_BEARER_TOKEN);
        await initializeAuthorizationData();

        if (requestOptions.from.has(SourceOption.BOOKMARKS)) await processBookmarks();
        if (requestOptions.from.has(SourceOption.LIKED_TWEETS)) await processLikedTweets();
        if (requestOptions.from.has(SourceOption.MEDIA_TWEETS)) await processMediaTweets();
        await updateState(ExtensionState.IDLE);
    }
    catch (err) {
        await abort("failed to export your tweets", `general error: ${err}`);
    }
}
