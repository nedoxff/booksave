<script lang="ts">
    import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";
    import { Button } from "$lib/components/ui/button";
    import Icon from "@iconify/svelte";
    import {
        type ExportRequest,
        FilenameOption,
        FormatOption,
        SourceOption,
    } from "$lib/api/types/internal/ExportOptions";
    import { sendMessage } from "$lib/messaging";
    import { Checkbox } from "$lib/components/ui/checkbox";
    import { Slider } from "$lib/components/ui/slider";

    const sourceConverter: Record<string, SourceOption> = {
        bookmarks: SourceOption.BOOKMARKS,
        liked: SourceOption.LIKED_TWEETS,
        media: SourceOption.MEDIA_TWEETS,
    };

    const formatConverter: Record<string, FormatOption> = {
        image: FormatOption.IMAGE,
        gif: FormatOption.GIF,
        video: FormatOption.VIDEO,
    };

    const filenameOptionConverter: Record<string, FilenameOption> = {
        handle: FilenameOption.INCLUDE_HANDLE,
        size: FilenameOption.INCLUDE_SIZE,
        date: FilenameOption.INCLUDE_DATE,
    };

    let request: ExportRequest = {
        from: new Array(),
        how: new Array(),
        what: new Array(),
        includeQuotes: false,
        paginationStep: -1,
    };

    let sources: string[] = [];
    let formats: string[] = [];
    let filenameOptions: string[] = [];
    let includeQuotes: boolean = false;
    let paginationStep: number = 50;

    const beginExport = () => {
        request.includeQuotes = includeQuotes;
        request.paginationStep = paginationStep;
        sendMessage("beginExport", request);
    };

    const saveSourceFormat = () => {
        if (sources.length == 0 || formats.length == 0) return;

        request.from = sources.map((x) => sourceConverter[x]);
        request.what = formats.map((x) => formatConverter[x]);
        state = WidgetState.FILENAME_STYLE;
    };

    const saveFilenameOptions = () => {
        request.how = filenameOptions.map((x) => filenameOptionConverter[x]);
        state = WidgetState.MISC;
    };

    enum WidgetState {
        SOURCE_AND_FORMAT,
        FILENAME_STYLE,
        MISC,
    }

    let state: WidgetState = WidgetState.SOURCE_AND_FORMAT;
</script>

{#if state === WidgetState.SOURCE_AND_FORMAT}
    <div class="flex flex-col gap-1 items-center">
        <p>i want to export...</p>

        <ToggleGroup.Root
            bind:value={sources}
            variant="outline"
            type="multiple"
        >
            <div
                class="flex w-full gap-2 flex-row justify-stretch items-stretch"
            >
                <ToggleGroup.Item
                    value="bookmarks"
                    class="py-2 h-fit flex flex-col"
                >
                    <Icon icon="material-symbols:bookmark" width={36} />
                    <p>my bookmarks</p>
                </ToggleGroup.Item>
                <ToggleGroup.Item
                    value="liked"
                    class="py-2 h-fit flex flex-col"
                >
                    <Icon icon="mdi:heart" width={36} />
                    <p>my liked tweets</p>
                </ToggleGroup.Item>
                <ToggleGroup.Item
                    value="media"
                    class="py-2 h-fit flex flex-col"
                >
                    <Icon
                        icon="material-symbols:photo-library-rounded"
                        width={36}
                    />
                    <p>my media tweets</p>
                </ToggleGroup.Item>
            </div>
        </ToggleGroup.Root>
    </div>

    <div class="flex flex-col gap-1 items-center">
        <p>including...</p>

        <ToggleGroup.Root
            bind:value={formats}
            variant="outline"
            type="multiple"
        >
            <div
                class="flex w-full gap-2 flex-row justify-stretch items-stretch"
            >
                <ToggleGroup.Item
                    value="image"
                    class="py-2 h-fit flex flex-col"
                >
                    <Icon icon="material-symbols:image" width={36} />
                    <p>images</p>
                </ToggleGroup.Item>
                <ToggleGroup.Item value="gif" class="py-2 h-fit flex flex-col">
                    <Icon icon="mdi:gif" width={36} />
                    <p>GIFs</p>
                </ToggleGroup.Item>
                <ToggleGroup.Item
                    value="video"
                    class="py-2 h-fit flex flex-col"
                >
                    <Icon icon="mdi:video" width={36} />
                    <p>videos</p>
                </ToggleGroup.Item>
            </div>
        </ToggleGroup.Root>
    </div>

    <Button on:click={saveSourceFormat} variant="outline"
        >next <Icon class="ml-1 -mr-1 mt-1" icon="mdi:chevron-right" /></Button
    >
{:else if state === WidgetState.FILENAME_STYLE}
    <div class="flex flex-col gap-1 items-center">
        <p>i want the file names to include...</p>

        <ToggleGroup.Root
            bind:value={filenameOptions}
            variant="outline"
            type="multiple"
        >
            <div
                class="flex w-full max-w-[75%] gap-2 flex-row justify-stretch items-stretch"
            >
                <ToggleGroup.Item
                    value="handle"
                    class="py-2 h-fit flex flex-col"
                >
                    <Icon icon="material-symbols:person" width={36} />
                    <p>the author's @handle</p>
                </ToggleGroup.Item>
                <ToggleGroup.Item value="size" class="py-2 h-fit flex flex-col">
                    <Icon icon="mdi:image-size-select-large" width={36} />
                    <p>the dimensions</p>
                </ToggleGroup.Item>
                <ToggleGroup.Item value="date" class="py-2 h-fit flex flex-col">
                    <Icon icon="mdi:calendar" width={36} />
                    <p>the date of posting</p>
                </ToggleGroup.Item>
            </div>
        </ToggleGroup.Root>
    </div>

    <Button on:click={saveFilenameOptions} variant="outline">next <Icon class="ml-1 -mr-1 mt-1" icon="mdi:chevron-right" /></Button>
{:else if state === WidgetState.MISC}
    <div class="flex flex-col gap-3 items-center w-full">
        <div class="flex items-center space-x-2">
            <Checkbox
                id="include-quotes"
                bind:checked={includeQuotes}
                aria-labelledby="include-quotes-label"
            />
            <label
                class="leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                for="terms"
                id="include-quotes-label"
                >include quote retweets when searching tweets</label
            >
        </div>

        <div
            class="border-muted border-2 p-2 rounded-xl flex flex-col items-start justify-start gap-1 w-fit"
        >
            <p class="text-md">the amount of tweets sent per request</p>
            <p class="-mt-1 text-sm text-muted-foreground">
                only set this to a higher value if you have a good internet
                connection.
            </p>
            <div class="flex items-center justify-start space-x-4 w-full">
                <Slider
                    value={[paginationStep]}
                    onValueChange={(v) => {
                        paginationStep = v[0];
                    }}
                    max={100}
                    min={10}
                    step={5}
                />
                <p
                    class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    {paginationStep}
                </p>
            </div>
        </div>
    </div>
    <Button on:click={beginExport} variant="outline">export!</Button>
{/if}
