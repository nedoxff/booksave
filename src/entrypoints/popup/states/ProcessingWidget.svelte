<script lang="ts">
    import { SourceOption } from "$lib/api/types/internal/ExportOptions";
    import { onMessage, sendMessage } from "$lib/messaging";
    import GenericLoadingWidget from "./GenericLoadingWidget.svelte";

    export let type: SourceOption;
    export let title: string;

    const EASTER_EGG_THRESHOLD: number = 1000;

    let processedCount: number = 0;
    let skippedCount: number = 0;

    onMount(() => {
        sendMessage("getProcessingStats", undefined)
            .then((data) => {
                processedCount = data.processed;
                skippedCount = data.skipped;
            })
            .catch((err) =>
                console.warn(
                    `failed to fetch processing stats for ${SourceOption[type]}: ${err}`,
                ),
            );

        const removeListener = onMessage("sendProcessingStats", (msg) => {
            if (msg.data.type !== type) return;
            processedCount = msg.data.processed;
            skippedCount = msg.data.skipped;
        });

        return () => {
            removeListener();
        };
    });
</script>

<div class="flex flex-col items-center">
    <GenericLoadingWidget {title} />
    <p class="text-base text-center">
        processed <span class="font-medium">{processedCount}</span> tweets |
        skipped <span class="font-medium">{skippedCount}</span> tweets
        {#if processedCount >= EASTER_EGG_THRESHOLD}
            <br />
            <span class="font-semibold">that's a lot of tweets!</span>
        {/if}
    </p>
    <p class="text-muted-foreground text-sm max-w-[75%] text-center">
        you can close this popup. the download will start automatically.
    </p>
</div>
