import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";
import {
  ExportRequest,
  FilenameOption,
} from "./api/types/internal/ExportOptions";
import { TweetMedia } from "./api/types/internal/TweetMedia";
import { RawTweet } from "./api/types/external/common-types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type FlyAndScaleParams = {
  y?: number;
  x?: number;
  start?: number;
  duration?: number;
};

export const flyAndScale = (
  node: Element,
  params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 },
): TransitionConfig => {
  const style = getComputedStyle(node);
  const transform = style.transform === "none" ? "" : style.transform;

  const scaleConversion = (
    valueA: number,
    scaleA: [number, number],
    scaleB: [number, number],
  ) => {
    const [minA, maxA] = scaleA;
    const [minB, maxB] = scaleB;

    const percentage = (valueA - minA) / (maxA - minA);
    const valueB = percentage * (maxB - minB) + minB;

    return valueB;
  };

  const styleToString = (
    style: Record<string, number | string | undefined>,
  ): string => {
    return Object.keys(style).reduce((str, key) => {
      if (style[key] === undefined) return str;
      return str + `${key}:${style[key]};`;
    }, "");
  };

  return {
    duration: params.duration ?? 200,
    delay: 0,
    css: (t) => {
      const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
      const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
      const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

      return styleToString({
        transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
        opacity: t,
      });
    },
    easing: cubicOut,
  };
};

export const formatFilename = async (
  requestOptions: ExportRequest,
  directory: string,
  extension: string,
  tweet: RawTweet,
  media: TweetMedia,
) => {
  const handle = tweet.core.user_results.result.legacy.screen_name;
  const date = new Date(tweet.legacy.created_at)
    .toLocaleDateString()
    .replaceAll("/", "-")
    .replaceAll(".", "-");

  let result = media.id + " ";
  if (requestOptions.how.includes(FilenameOption.INCLUDE_HANDLE))
    result += `(@${handle}) `;
  if (requestOptions.how.includes(FilenameOption.INCLUDE_SIZE))
    result += `[${media.size.width}x${media.size.height}] `;
  if (requestOptions.how.includes(FilenameOption.INCLUDE_DATE))
    result += `[${date}] `;
  return `${directory}/${result.trim()}.${extension}`;
};
