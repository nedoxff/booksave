import {
  ExportRequest,
  FormatOption,
  SourceOption,
} from "$lib/api/types/internal/ExportOptions";
import { ZipWriter } from "@zip.js/zip.js";
import { getMedia, TweetMediaType } from "./api/types/internal/TweetMedia";
import streamSaver from "streamsaver";
import { onMessage, sendMessage } from "./messaging";
import { RawTweet } from "./api/types/external/common-types";
import { formatFilename } from "./utils";
import { getBookmarkChunk } from "./api/bookmarks";
import { getLikesChunk } from "./api/profile";
import { getMediaChunk } from "./api/media";
import { TwitterAuthorization } from "./api/types/internal/TwitterAuthorization";
import { abort } from "@/entrypoints/background";

type TweetReceiverReturn = { tweets: RawTweet[]; cursor?: string };
type TweetReceiver = (
  authorization: TwitterAuthorization,
  cursor: string | undefined,
  count: number,
) => Promise<TweetReceiverReturn>;

const receiverDictionary: Record<SourceOption, TweetReceiver> = {
  [SourceOption.BOOKMARKS]: getBookmarkChunk,
  [SourceOption.LIKED_TWEETS]: getLikesChunk,
  [SourceOption.MEDIA_TWEETS]: getMediaChunk,
};

const nameDictionary: Record<SourceOption, string> = {
  [SourceOption.BOOKMARKS]: "bookmarks.zip",
  [SourceOption.LIKED_TWEETS]: "likes.zip",
  [SourceOption.MEDIA_TWEETS]: "media.zip",
};

export const createArchiveForSource = async (
  requestOptions: ExportRequest,
  authorization: TwitterAuthorization,
  source: SourceOption,
) => {
  let processed: number = 0;
  let skipped: number = 0;

  const removeListener = onMessage("getProcessingStats", () => {
    return { processed: processed, skipped: skipped };
  });

  const faultyReceiver = async (
    cursor?: string,
  ): Promise<TweetReceiverReturn | null> => {
    try {
      return await receiverDictionary[source](
        authorization,
        cursor,
        requestOptions.paginationStep,
      );
    } catch (err) {
      await abort({
        simple: "failed to access twitter's api",
        technical: `while processing ${source}: ${err}`,
      });
      return null;
    }
  };

  const stream = streamSaver.createWriteStream(nameDictionary[source]);
  const archive = new ZipWriter(stream);

  if (requestOptions.what.includes(FormatOption.IMAGE))
    archive.add("images", undefined, { directory: true });
  if (requestOptions.what.includes(FormatOption.VIDEO))
    archive.add("videos", undefined, { directory: true });
  if (requestOptions.what.includes(FormatOption.GIF))
    archive.add("gifs", undefined, { directory: true });

  let currentCursor: string | undefined = undefined;
  while (true) {
    try {
      const data = await faultyReceiver(currentCursor);
      if (data === null) return;

      const { tweets, cursor } = data;

      if (tweets.length === 0) break;
      if (cursor !== undefined) currentCursor = cursor;

      const processTweet = async (tweet: RawTweet) => {
        if (tweet === undefined) return;

        try {
          for (const media of getMedia(tweet)) {
            switch (media.type) {
              case TweetMediaType.PHOTO: {
                if (!requestOptions.what.includes(FormatOption.IMAGE)) break;

                const response = await fetch(media.bestUrl);
                if (response.ok) {
                  await archive.add(
                    await formatFilename(
                      requestOptions,
                      "images",
                      media.extension,
                      tweet,
                      media,
                    ),
                    response.body!,
                    {
                      useWebWorkers: false,
                    },
                  );
                }

                break;
              }
              case TweetMediaType.VIDEO: {
                if (!requestOptions.what.includes(FormatOption.VIDEO)) break;

                const response = await fetch(media.bestUrl);
                if (response.ok) {
                  await archive.add(
                    await formatFilename(
                      requestOptions,
                      "videos",
                      media.extension,
                      tweet,
                      media,
                    ),
                    response.body!,
                    {
                      useWebWorkers: false,
                    },
                  );
                }

                break;
              }
              case TweetMediaType.GIF: {
                if (!requestOptions.what.includes(FormatOption.GIF)) break;

                const response = await fetch(media.bestUrl);
                if (response.ok) {
                  await archive.add(
                    await formatFilename(
                      requestOptions,
                      "gifs",
                      media.extension,
                      tweet,
                      media,
                    ),
                    response.body!,
                    {
                      useWebWorkers: false,
                    },
                  );
                }

                break;
              }
            }
          }

          processed++;
        } catch (err) {
          console.warn(`skipping tweet ${tweet.rest_id}: ${err}`);
          skipped++;
        }
      };

      for (const tweet of tweets) {
        await processTweet(tweet);
        if (
          tweet.quoted_status_result !== undefined &&
          requestOptions.includeQuotes
        ) {
          await processTweet(tweet.quoted_status_result.result);
        }
      }

      try {
        await sendMessage("sendProcessingStats", {
          type: source,
          processed: processed,
          skipped: skipped,
        });
      } catch (err) {
        console.warn(`couldn't send processing stats to popup: ${err}`);
      }
    } catch (err) {
      console.error(err);
      await abort({
        simple: "failed to export tweets",
        technical: `in ${SourceOption[source]}: ${err}`,
      });
      break;
    }
  }

  removeListener();
  await archive.close();
};
