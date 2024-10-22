import { RawTweet, RawTweetMedia } from "../external/common-types";

export enum TweetMediaType {
  PHOTO,
  VIDEO,
  GIF,
}

export type TweetMedia = {
  type: TweetMediaType;
  id: string;
  bestUrl: string;
  extension: string;
  size: {
    width: number;
    height: number;
  };
};

const convertMedia = (media: RawTweetMedia): TweetMedia => {
  switch (media.type) {
    case "photo": {
      const pathname = new URL(media.media_url_https).pathname;
      const realId = pathname.split("/").pop()?.split(".").shift() ?? "";
      const extension = pathname.split("/").pop()?.split(".").pop() ?? "";

      return {
        type: TweetMediaType.PHOTO,
        id: realId,
        extension: extension,
        bestUrl: media.media_url_https + "?name=orig",
        size: {
          width: media.original_info.width,
          height: media.original_info.height,
        },
      } satisfies TweetMedia;
    }
    case "animated_gif":
    case "video": {
      if (media.video_info === undefined) {
        throw new Error(
          "cannot convert a video entity without media.video_info",
        );
      }

      let bestUrl = media.video_info.variants.sort(
        (a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0),
      )[0].url;

      const urlObject = new URL(bestUrl);
      urlObject.search = "";

      bestUrl = urlObject.toString();
      const extension =
        urlObject.pathname.split("/").pop()?.split(".").pop() ?? "";
      return {
        type:
          media.type === "video" ? TweetMediaType.VIDEO : TweetMediaType.GIF,
        id: media.id_str,
        extension: extension,
        bestUrl: bestUrl,
        size: {
          width: media.original_info.width,
          height: media.original_info.height,
        },
      } satisfies TweetMedia;
    }
    default: {
      throw new Error(`unknown media type: ${media.type}`);
    }
  }
};

export function getMedia(tweet: RawTweet): TweetMedia[] {
  return (
    tweet.legacy.extended_entities?.media ??
    tweet.legacy.entities.media ??
    []
  ).map(convertMedia);
}
