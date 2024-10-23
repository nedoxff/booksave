<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog";

    let dialog;
    const version: string = browser.runtime.getManifest().version_name ?? "dev";
</script>

<div class="flex flex-col gap-1 items-center">
    <div class="flex flex-row gap-1 text-muted-foreground text-sm">
        <Dialog.Root bind:this={dialog}>
            <Dialog.Trigger><p class="underline">about/faq</p></Dialog.Trigger>
            <Dialog.Content class="rounded-xl w-[95%] md:w-full">
                <Dialog.Header>
                    <Dialog.Title>about booksave</Dialog.Title>
                    <Dialog.Description
                        >booksave lets you export your bookmarks and collections
                        of tweets in a simple and automated manner.<br />just to
                        be clear,
                        <b
                            >your tweets are not sent to some server for
                            processing.</b
                        > everything happens on your machine and your machine only.
                    </Dialog.Description>
                </Dialog.Header>
                <Dialog.Footer>
                    <Dialog.Close>
                        <Button>ok</Button>
                    </Dialog.Close>
                </Dialog.Footer>
            </Dialog.Content>
        </Dialog.Root>
        •
        <a
            class="underline"
            href="https://github.com/nedoxff/booksave"
            target="_blank"><p>source code & contribute</p></a
        >
        •
        <a class="underline" href="https://boosty.to/nedoxff" target="_blank"
            ><p>donate</p></a
        >
    </div>
    <div class="flex flex-row gap-1 text-muted-foreground text-xs">
        <p>made by nedoxff</p>
        •
        <p>version {version}</p>
    </div>
</div>
