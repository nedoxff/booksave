<script lang="ts">
    import Icon from "@iconify/svelte";

    export let title: string;
</script>

<div class="flex flex-col gap-1 items-center">
    <Icon width={36} icon="svg-spinners:90-ring-with-bg"/>
    {title}
    <slot/>
</div>