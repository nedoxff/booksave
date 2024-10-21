<script lang="ts">
    import Icon from '@iconify/svelte';

    export let title: string;
    export let description: string;
</script>

<div class="flex flex-col items-center text-center">
    <Icon width={36} class="text-red-600" icon="material-symbols:error-outline"/>
    <p class="text-base font-medium">{title}</p>
    <p class="text-xs font-mono">({description})</p>
</div>