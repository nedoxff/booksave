<script lang="ts">
  import StartingWidget from "./states/StartingWidget.svelte";
  import SimpleError from "$lib/custom/SimpleError.svelte";
  import { onMessage, sendMessage } from "$lib/messaging";
  import { ExtensionState } from "$lib/api/types/internal/ExtensionState";
  import Icon from "@iconify/svelte";
  import GenericLoadingWidget from "./states/GenericLoadingWidget.svelte";
  import { Button } from "$lib/components/ui/button";
  import ProcessingWidget from "./states/ProcessingWidget.svelte";
  import { SourceOption } from "$lib/api/types/internal/ExportOptions";
  import PopupFooter from "$lib/custom/PopupFooter.svelte";
  import type { BooksaveError } from "$lib/api/types/shared-types";

  let hasCookies: boolean = false;
  let state: ExtensionState | undefined = undefined;
  let error: BooksaveError | undefined;

  const init = async () => {
    try {
      hasCookies =
        (await browser.cookies.get({ name: "twid", url: "https://x.com" })) !==
          null &&
        (await browser.cookies.get({ name: "ct0", url: "https://x.com" })) !==
          null &&
        (await browser.cookies.get({
          name: "auth_token",
          url: "https://x.com",
        })) !== null;
    } catch (err) {
      console.error(`failed to retreive twitter's cookies: ${err}`);
      hasCookies = false;
    }

    onMessage("updateState", (msg) => {
      state = msg.data;
    });
    onMessage("abort", (msg) => {
      state = ExtensionState.ABORTED;
      error = msg.data;
    });

    try {
      const syncedState = await sendMessage("getState", undefined);
      state = syncedState;
      if (state === ExtensionState.ABORTED) {
        sendMessage("getError", undefined).then((err) => {
          error = err;
        });
      }
    } catch (err) {
      const msg = `failed to communicate with the background script: ${err}`;

      console.error(msg);
      state = ExtensionState.ABORTED;
      error = {
        simple: "couldn't start the extension",
        technical: msg,
      };
    }

    console.info("registered popup listeners");
  };
</script>

{#await init() then}
  <div
    class="w-[500px] p-5 pt-3 flex flex-col gap-3 justify-center items-center"
  >
    <div class="flex flex-col gap-1 w-full">
      <div class="flex flex-row gap-1 items-center">
        <Icon
          width={36}
          icon="material-symbols:bookmark-heart-outline-rounded"
        />
        <p class="text-lg font-bold">booksave</p>
        <p class="ml-1 text-xs text-mono text-muted-foreground">
          ({ExtensionState[state ?? ExtensionState.IDLE]})
        </p>
      </div>
      <hr
        class="block h-[1px] w-full border-0 border-t-2 border-solid border-black m-0 p-0"
      />
    </div>

    {#if !hasCookies}
      <SimpleError
        title="you aren't logged in to twitter"
        description="ct0, twid and auth_token cookies are required"
      />
    {:else if state == ExtensionState.ABORTED}
      <div class="flex flex-col gap-2 w-full items-center">
        <SimpleError
          title={error?.simple ?? "something went completely wrong"}
          description={error?.technical ?? "the error object is undefined"}
        />
        <Button
          variant="outline"
          on:click={() => {
            state = ExtensionState.IDLE;
          }}>reset</Button
        >
      </div>
    {:else if state == ExtensionState.RECEIVING_BEARER_TOKEN}
      <GenericLoadingWidget title="receiving the bearer token" />
    {:else if state == ExtensionState.PROCESSING_BOOKMARKS}
      <ProcessingWidget
        title="processing your bookmarks"
        type={SourceOption.BOOKMARKS}
      />
    {:else if state == ExtensionState.PROCESSING_LIKED_TWEETS}
      <ProcessingWidget
        title="processing your liked tweets"
        type={SourceOption.LIKED_TWEETS}
      />
    {:else if state == ExtensionState.PROCESSING_MEDIA_TWEETS}
      <ProcessingWidget
        title="processing your media tweets"
        type={SourceOption.MEDIA_TWEETS}
      />
    {:else if state == ExtensionState.IDLE}
      <StartingWidget />
    {/if}

    <PopupFooter />
  </div>
{/await}
