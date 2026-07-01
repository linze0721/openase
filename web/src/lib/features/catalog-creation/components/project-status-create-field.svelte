<script lang="ts">
  import {
    defaultCreateProjectStatus,
    getCreateTimeProjectStatusOptions,
    getProjectStatusDescription,
    getProjectStatusLabelKey,
  } from '$lib/features/catalog-creation/model'
  import { i18nStore } from '$lib/i18n/store.svelte'
  import { Label } from '$ui/label'
  import * as Popover from '$ui/popover'
  import * as Select from '$ui/select'
  import { CircleHelp } from '@lucide/svelte'

  let {
    status,
    onStatusChange,
    id = 'project-status',
  }: {
    status: string
    onStatusChange: (value: string) => void
    id?: string
  } = $props()

  const createTimeOptions = getCreateTimeProjectStatusOptions()

  function statusLabel(value: string) {
    const key = getProjectStatusLabelKey(value)
    return key ? i18nStore.t(key) : value
  }

  function statusDescriptionKey(value: string) {
    return getProjectStatusDescription(value)
  }
</script>

<div class="space-y-2">
  <div class="flex items-center gap-1.5">
    <Label for={id}>
      {i18nStore.t('catalog.project.dialog.labels.status')}
    </Label>
    <Popover.Root>
      <Popover.Trigger>
        {#snippet child({ props })}
          <button
            {...props}
            type="button"
            class="text-muted-foreground hover:text-foreground inline-flex size-5 shrink-0 items-center justify-center rounded-full transition-colors"
            aria-label={i18nStore.t('catalog.project.dialog.statusLearnMoreTitle')}
          >
            <CircleHelp class="size-3.5" />
          </button>
        {/snippet}
      </Popover.Trigger>
      <Popover.Content class="w-80 max-w-[95vw] p-3 text-sm leading-relaxed" align="start">
        <p class="text-foreground font-medium">
          {i18nStore.t('catalog.project.dialog.statusLearnMoreTitle')}
        </p>
        <p class="text-muted-foreground mt-2">
          {i18nStore.t('catalog.project.dialog.statusLearnMore')}
        </p>
      </Popover.Content>
    </Popover.Root>
  </div>

  <Select.Root
    type="single"
    value={status}
    onValueChange={(value) => onStatusChange(value || defaultCreateProjectStatus)}
  >
    <Select.Trigger id={id} class="w-full">{statusLabel(status)}</Select.Trigger>
    <Select.Content class="max-w-[min(100vw-2rem,24rem)]">
      {#each createTimeOptions as option (option)}
        {@const descriptionKey = statusDescriptionKey(option)}
        <Select.Item value={option} class="items-start py-2">
          <span class="flex min-w-0 flex-col gap-0.5 text-left">
            <span class="text-foreground font-medium">{statusLabel(option)}</span>
            {#if descriptionKey}
              <span class="text-muted-foreground text-xs leading-snug font-normal">
                {i18nStore.t(descriptionKey)}
              </span>
            {/if}
          </span>
        </Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>

  <p class="text-muted-foreground text-sm leading-snug">
    {i18nStore.t('catalog.project.dialog.statusHelper')}
    <span class="text-muted-foreground/90">
      {i18nStore.t('catalog.project.dialog.statusChangeLater')}
    </span>
  </p>

  {#if statusDescriptionKey(status)}
    <p class="text-muted-foreground text-xs leading-snug">
      {i18nStore.t(statusDescriptionKey(status)!)}
    </p>
  {/if}
</div>