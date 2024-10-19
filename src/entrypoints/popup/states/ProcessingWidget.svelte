<script lang="ts">
    import { SourceOption } from "$lib/api/types/internal/ExportOptions";
    import { onMessage, sendMessage } from "$lib/messaging";
    import GenericLoadingWidget from "./GenericLoadingWidget.svelte";

    export let type: SourceOption;
    export let title: string;

    let processedCount: number = 0;
    let skippedCount: number = 0;

    onMount(() => {
        try {
            sendMessage("getProcessingStats").then((data) => {
                processedCount = data.processed;
                skippedCount = data.skipped;
            })
        }
        catch {
            console.warn(`failed to fetch processing stats for ${SourceOption[type]}. defaulting to zeroes`);
        }

        const removeListener = onMessage("sendProcessingStats", (msg) => {
            if(msg.data.type !== type) return;
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
    <p class="text-md text-center">
        processed <span class="font-medium">{processedCount}</span> tweets |
        skipped <span class="font-medium">{skippedCount}</span> tweets
    </p>
    <p class="text-muted-foreground text-sm max-w-[75%] text-center">
        you can close this popup. the download will start automatically.
    </p>
</div>
