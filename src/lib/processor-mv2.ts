import { getAuthorizationData } from "$lib/api/auth";
import { abort, getSessionValue, updateState } from "@/entrypoints/background";
import { ExtensionState } from "./api/types/internal/ExtensionState";
import {
  ExportRequest,
  SourceOption,
} from "./api/types/internal/ExportOptions";
import { createArchiveForSource } from "./archive";
import { TwitterAuthorization } from "./api/types/internal/TwitterAuthorization";

const initializeAuthorizationData = async () => {
  const dirtyAuth = await getAuthorizationData();
  if (dirtyAuth === null) {
    console.error("authorization cookies were not found. aborting");
    abort({
      simple: "couldn't get authorization data",
      technical: "auth_token, twid and ct0 cookies were not found",
    });
  } else {
    console.info("successfully acquired authorization credentials");
    await browser.storage.session.set({
      authorization: dirtyAuth,
    });
  }
};

const sourceConverter: Record<SourceOption, ExtensionState> = {
  [SourceOption.BOOKMARKS]: ExtensionState.PROCESSING_BOOKMARKS,
  [SourceOption.LIKED_TWEETS]: ExtensionState.PROCESSING_LIKED_TWEETS,
  [SourceOption.MEDIA_TWEETS]: ExtensionState.PROCESSING_MEDIA_TWEETS,
};

export const process = async (
  source: SourceOption,
  authorization: TwitterAuthorization,
  requestOptions: ExportRequest,
) => {
  await updateState(sourceConverter[source]);
  await createArchiveForSource(requestOptions, authorization, source);
};

export const processRequest = async () => {
  try {
    const requestOptions =
      await getSessionValue<ExportRequest>("requestOptions");
    await updateState(ExtensionState.RECEIVING_BEARER_TOKEN);
    await initializeAuthorizationData();

    const authorization =
      await getSessionValue<TwitterAuthorization>("authorization");
    if (requestOptions.from.includes(SourceOption.BOOKMARKS))
      await process(SourceOption.BOOKMARKS, authorization, requestOptions);
    if (requestOptions.from.includes(SourceOption.LIKED_TWEETS))
      await process(SourceOption.LIKED_TWEETS, authorization, requestOptions);
    if (requestOptions.from.includes(SourceOption.MEDIA_TWEETS))
      await process(SourceOption.MEDIA_TWEETS, authorization, requestOptions);
    await updateState(ExtensionState.IDLE);
  } catch (err) {
    await abort({
      simple: "failed to export your tweets",
      technical: `general error: ${err}`,
    });
  }
};
