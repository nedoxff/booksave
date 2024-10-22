import { getAuthorizationData } from "$lib/api/auth";
import { abort, getSessionValue, updateState } from "@/entrypoints/background";
import { ExtensionState } from "./api/types/internal/ExtensionState";
import {
  ExportRequest,
  SourceOption,
} from "./api/types/internal/ExportOptions";
import { sendMessage } from "./messaging";
import { TwitterAuthorization } from "./api/types/internal/TwitterAuthorization";

const initializeAuthorizationData = async () => {
  const dirtyAuth = await getAuthorizationData();
  if (dirtyAuth === null) {
    console.error("authorization cookies were not found. aborting");
    abort(
      "couldn't get authorization data",
      "auth_token and ct0 cookies were not found",
    );
  } else {
    console.info("successfully acquired authorization credentials");
    await chrome.storage.session.set({
      authorization: dirtyAuth,
    });
  }
};

const sourceConverter: Record<SourceOption, ExtensionState> = {
  [SourceOption.BOOKMARKS]: ExtensionState.PROCESSING_BOOKMARKS,
  [SourceOption.LIKED_TWEETS]: ExtensionState.PROCESSING_LIKED_TWEETS,
  [SourceOption.MEDIA_TWEETS]: ExtensionState.PROCESSING_MEDIA_TWEETS,
};

const process = async (
  source: SourceOption,
  authorization: TwitterAuthorization,
  requestOptions: ExportRequest,
) => {
  await updateState(sourceConverter[source]);
  try {
    await sendMessage("beginExportFromOffscreenPage", {
      request: requestOptions,
      authorization: authorization,
      source: source,
    });
  } catch (err) {
    console.error(
      `couldn't communicate with the offscreen page to start processing ${SourceOption[source]}: ${err}`,
    );
    if (err instanceof Error) console.log(err.stack);
  }
};

export const processRequest = async () => {
  try {
    if (chrome.offscreen === undefined) {
      await abort(
        "your chrome browser does not support mv3",
        "chrome.offscreen is undefined",
      );
      return;
    }

    await updateState(ExtensionState.RECEIVING_BEARER_TOKEN);
    await initializeAuthorizationData();

    const requestOptions =
      await getSessionValue<ExportRequest>("requestOptions");
    const authorization =
      await getSessionValue<TwitterAuthorization>("authorization");
    await createOffscreenDocument();

    if (requestOptions.from.includes(SourceOption.BOOKMARKS))
      await process(SourceOption.BOOKMARKS, authorization, requestOptions);
    if (requestOptions.from.includes(SourceOption.LIKED_TWEETS))
      await process(SourceOption.LIKED_TWEETS, authorization, requestOptions);
    if (requestOptions.from.includes(SourceOption.MEDIA_TWEETS))
      await process(SourceOption.MEDIA_TWEETS, authorization, requestOptions);

    await closeOffscreenDocument();
    await updateState(ExtensionState.IDLE);
  } catch (err) {
    await abort("failed to export your tweets", `general error: ${err}`);
    if (await hasOffscreenDocument()) {
      await closeOffscreenDocument();
    }
  }
};

// most of offscreen-related code has been adapted from WXT's examples repository
async function createOffscreenDocument() {
  if (await hasOffscreenDocument()) {
    return;
  }

  await chrome.offscreen.createDocument({
    url: chrome.runtime.getURL("/offscreen.html"),
    reasons: [chrome.offscreen.Reason.BLOBS],
    justification:
      "download processed files (.zip archives) in the background without interrupting the user",
  });
}

async function closeOffscreenDocument() {
  if (!(await hasOffscreenDocument())) {
    return;
  }
  await chrome.offscreen.closeDocument();
}

async function hasOffscreenDocument() {
  const contexts = await chrome.runtime?.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [chrome.runtime.getURL("/offscreen.html")],
  });

  if (contexts != null) {
    return contexts.length > 0;
  } else {
    //@ts-ignore
    const matchedClients = await self.clients.matchAll();
    return matchedClients.some((client) =>
      client.url.includes(chrome.runtime.id),
    );
  }
}
