import { ExportRequest, FormatOption, SourceOption } from "$lib/api/types/internal/ExportOptions";
import { ZipWriter } from "@zip.js/zip.js";
import { getMedia, TweetMediaType } from "../api/types/internal/TweetMedia";
import streamSaver from 'streamsaver';
import { onMessage, sendMessage } from "../messaging";
import { getSessionValue, updateState } from "@/entrypoints/background";
import { ExtensionState } from "$lib/api/types/internal/ExtensionState";
import { formatFilename } from "$lib/processor";
import { getLikesChunk } from "$lib/api/profile";

export const processLikedTweets = async () => {
    await updateState(ExtensionState.PROCESSING_LIKED_TWEETS);

    let processed: number = 0;
    let skipped: number = 0;

    const removeListener = onMessage("getProcessingStats", () => {
        return { processed: processed, skipped: skipped };
    });

    const requestOptions = await getSessionValue<ExportRequest>("requestOptions");
    const stream = streamSaver.createWriteStream('liked.zip');
    const archive = new ZipWriter(stream);

    if (requestOptions.what.has(FormatOption.IMAGE)) archive.add("images", undefined, { directory: true });
    if (requestOptions.what.has(FormatOption.VIDEO)) archive.add("videos", undefined, { directory: true });

    let currentCursor: string | undefined = undefined;
    while (true) {
        const { tweets, cursor } = await getLikesChunk(currentCursor);

        if (tweets.length === 0) break;
        if (cursor !== undefined) currentCursor = cursor;

        for (const tweet of tweets) {
            try {
                for (const media of getMedia(tweet)) {
                    switch (media.type) {
                        case TweetMediaType.PHOTO: {
                            if (!requestOptions.what.has(FormatOption.IMAGE)) break;

                            const response = await fetch(media.bestUrl);
                            if (response.ok) {
                                await archive.add(await formatFilename("images", media.extension, tweet, media), response.body!, {
                                    useWebWorkers: false,
                                });
                            }

                            break;
                        }
                        case TweetMediaType.VIDEO: {
                            if (!requestOptions.what.has(FormatOption.VIDEO)) break;

                            const response = await fetch(media.bestUrl);
                            if (response.ok) {
                                await archive.add(await formatFilename("videos", media.extension, tweet, media), response.body!, {
                                    useWebWorkers: false
                                });
                            }

                            break;
                        }
                        case TweetMediaType.GIF: {
                            if (!requestOptions.what.has(FormatOption.GIF)) break;

                            const response = await fetch(media.bestUrl);
                            if (response.ok) {
                                await archive.add(await formatFilename("gifs", media.extension, tweet, media), response.body!, {
                                    useWebWorkers: false
                                });
                            }

                            break;
                        }
                    }
                }
                processed++;
            }
            catch (err) {
                console.error(`skipping tweet ${tweet.rest_id}: ${err}`);
                skipped++;
            }
        }

        await sendMessage('sendProcessingStats', { type: SourceOption.LIKED_TWEETS, processed: processed, skipped: skipped });
    }

    removeListener();
    await archive.close();
}