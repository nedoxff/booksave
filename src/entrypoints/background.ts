import { onMessage, sendMessage } from "$lib/messaging";
import { ExtensionState } from "$lib/api/types/internal/ExtensionState";
import { BooksaveError } from "$lib/api/types/shared-types";

export const getSessionValue = async <T>(name: string) =>
  (await browser.storage.session.get(name))[name] as T;

export const abort = async (err: BooksaveError) => {
  try {
    await sendMessage("abort", err);
  } catch (err) {
    console.warn(`couldn't send an abort message to popup: ${err}`);
  }
};

export const updateState = async (state: ExtensionState) => {
  await browser.storage.session.set({
    extensionState: state,
  });
  try {
    await sendMessage("updateState", state);
  } catch (err) {
    console.warn(`couldn't sync the extension state with the popup: ${err}`);
  }
};

export default defineBackground({
  main() {
    browser.storage.session.set({
      extensionState: ExtensionState.IDLE,
    });

    onMessage("abort", async (msg) => {
      await browser.storage.session.set({
        extensionState: ExtensionState.ABORTED,
        error: msg.data,
      });
      console.warn(
        `received an abort message: ${msg.data.simple} (${msg.data.technical})`,
      );
    });
    onMessage(
      "getError",
      async () => await getSessionValue<BooksaveError>("error"),
    );
    onMessage(
      "getState",
      async () => await getSessionValue<ExtensionState>("extensionState"),
    );
    onMessage("beginExport", async (msg) => {
      await browser.storage.session.set({
        requestOptions: msg.data,
      });
      if (import.meta.env.MANIFEST_VERSION === 2) {
        await (await import("$lib/processor-mv2")).processRequest();
      } else {
        await (await import("$lib/processor-mv3")).processRequest();
      }
    });

    console.info("registered background script listeners");
  },
});
