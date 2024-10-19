import { onMessage, sendMessage } from "$lib/messaging";
import { ExtensionState } from "$lib/api/types/internal/ExtensionState";
import { processRequest } from "$lib/processor";

export const getSessionValue = async <T>(name: string) => (await browser.storage.session.get(name))[name] as T;

export const abort = async (simple: string, technical: string) => {
  await browser.storage.session.set({
    extensionState: ExtensionState.ABORTED
  });
  await sendMessage("abort", { simple: simple, technical: technical });
};

export const updateState = async (state: ExtensionState) => {
  await browser.storage.session.set({
    extensionState: state
  });
  await sendMessage("updateState", state);
}

export default defineBackground(() => {
  browser.storage.session.set({
    extensionState: ExtensionState.IDLE
  });

  onMessage("getState", async () => await getSessionValue<ExtensionState>("extensionState"));
  onMessage("beginExport", async (msg) => {
    await browser.storage.session.set({
      requestOptions: msg.data
    });
    processRequest();
  });

  console.info("registered background script listeners");
});
