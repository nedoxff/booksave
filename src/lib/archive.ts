import { ExportRequest, FormatOption, SourceOption } from "$lib/api/types/internal/ExportOptions";
import { ZipWriter } from "@zip.js/zip.js";
import { getMedia, TweetMediaType } from "./api/types/internal/TweetMedia";
import streamSaver from 'streamsaver';
import { onMessage, sendMessage } from "./messaging";
import { abort, getSessionValue, updateState } from "@/entrypoints/background";
import { formatFilename } from "$lib/processor";
import { RawTweet } from "./api/types/external/common-types";

type TweetReceiverReturn = { tweets: RawTweet[], cursor?: string };
type TweetReceiver = (cursor?: string) => Promise<TweetReceiverReturn>;

export const createArchiveForSource = async (source: SourceOption, name: string, tweetReceiver: TweetReceiver) => {
    let processed: number = 0;
    let skipped: number = 0;

    const removeListener = onMessage("getProcessingStats", () => {
        return { processed: processed, skipped: skipped };
    });

    const faultyReceiver = async (cursor?: string): Promise<TweetReceiverReturn | null> => {
        try {
            return await tweetReceiver(cursor);
        }
        catch (err) {
            await abort("failed to access twitter's api", `while processing ${source}: ${err}`);
            return null;
        }
    }

    const stream = streamSaver.createWriteStream(name);
    const archive = new ZipWriter(stream);

    const requestOptions = await getSessionValue<ExportRequest>("requestOptions");
    if (requestOptions.what.has(FormatOption.IMAGE)) archive.add("images", undefined, { directory: true });
    if (requestOptions.what.has(FormatOption.VIDEO)) archive.add("videos", undefined, { directory: true });
    if (requestOptions.what.has(FormatOption.GIF)) archive.add("gifs", undefined, { directory: true });

    let currentCursor: string | undefined = undefined;
    while (true) {
        try {
            const data = await faultyReceiver(currentCursor);
            if (data === null) return;

            const { tweets, cursor } = data;

            if (tweets.length === 0) break;
            if (cursor !== undefined) currentCursor = cursor;

            const processTweet = async (tweet: RawTweet) => {
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
                    console.warn(`skipping tweet ${tweet.rest_id}: ${err}`);
                    skipped++;
                }
            };

            for (const tweet of tweets) {
                await processTweet(tweet);
                if (tweet.quoted_status_result !== undefined && requestOptions.includeQuotes) {
                    await processTweet(tweet.quoted_status_result.result);
                }
            }

            await sendMessage('sendProcessingStats', { type: source, processed: processed, skipped: skipped });
        }
        catch (err) {
            await abort("failed to export tweets", `in ${source}: ${err}`);
            break;
        }
    }

    removeListener();
    await archive.close();
}