import { ExtensionState } from "$lib/api/types/internal/ExtensionState";
import { defineExtensionMessaging } from "@webext-core/messaging";
import {
  ExportRequest,
  SourceOption,
} from "./api/types/internal/ExportOptions";
import { TwitterAuthorization } from "./api/types/internal/TwitterAuthorization";

interface ProtocolMap {
  // called from background
  clientLog(message: string);
  updateState(state: ExtensionState);
  abort(reason: { simple: string; technical: string });
  sendProcessingStats(data: {
    type: SourceOption;
    processed: number;
    skipped: number;
  });
  beginExportFromOffscreenPage(data: {
    request: ExportRequest;
    authorization: TwitterAuthorization;
    source: SourceOption;
  });

  // called from popup
  beginExport(data: ExportRequest);
  getState(): ExtensionState;
  getError(): { simple: string; technical: string };
  getProcessingStats(): { processed: number; skipped: number };
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();
