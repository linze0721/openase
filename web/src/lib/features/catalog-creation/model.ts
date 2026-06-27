import type { TranslationKey } from '$lib/i18n'

export type DraftParseResult<T> =
  | {
      ok: true
      value: T
    }
  | {
      ok: false
      error: string
    }

export type OrganizationCreationDraft = {
  name: string
  slug: string
}

export type ProjectCreationDraft = {
  name: string
  slug: string
  description: string
  status: string
  maxConcurrentAgents: string
  defaultAgentProviderId: string
}

/** Canonical project lifecycle values (aligned with API / `internal/domain/catalog`). */
export const projectStatusOptions = [
  'Backlog',
  'Planned',
  'In Progress',
  'Completed',
  'Canceled',
  'Archived',
] as const

export type ProjectStatus = (typeof projectStatusOptions)[number]

/** Default status for new projects (`createProjectDraft`). */
export const defaultCreateProjectStatus: ProjectStatus = 'Planned'

/**
 * Statuses offered in create-project UI. Completed, Canceled, and Archived are
 * edit-time / lifecycle transitions only (see `projectStatusSemanticMetadata`).
 */
export const createTimeProjectStatusOptions = [
  'Backlog',
  'Planned',
  'In Progress',
] as const satisfies readonly ProjectStatus[]

export type CreateTimeProjectStatus = (typeof createTimeProjectStatusOptions)[number]

/**
 * Per-status semantic metadata for catalog UI (labels/descriptions via i18n).
 *
 * Downstream effects (documented for implementers; not enforced in this module):
 * - **Organizational metadata**: `status` is stored on the project record and drives
 *   dashboards, filters, and activity — it does not bind agent skills at create API level.
 * - **Onboarding preset** (separate feature): `getBootstrapPreset` in onboarding maps
 *   `In Progress` → fullstack preset; other create-time statuses default to pm preset.
 *   That mapping is not applied by project create endpoints.
 * - **Terminal / inactive gating**: Completed, Canceled, Archived are terminal states;
 *   onboarding uses `isTerminalProjectStatus` to gate agent-workflow steps. Those statuses
 *   are omitted from `getCreateTimeProjectStatusOptions()`.
 */
export type ProjectStatusSemanticMetadata = {
  /** i18n key for short label (select display). */
  labelKey: TranslationKey
  /** i18n key for helper/description copy beside the status control. */
  descriptionKey: TranslationKey
  /** Whether this status is only meaningful after project exists (post-create edits). */
  editTimeOnly: boolean
}

const projectStatusDescriptionKeys: Record<ProjectStatus, TranslationKey> = {
  Backlog: 'catalog.project.status.Backlog.description',
  Planned: 'catalog.project.status.Planned.description',
  'In Progress': 'catalog.project.status.In Progress.description',
  Completed: 'catalog.project.status.Completed.description',
  Canceled: 'catalog.project.status.Canceled.description',
  Archived: 'catalog.project.status.Archived.description',
}

const projectStatusLabelKeys: Record<ProjectStatus, TranslationKey> = {
  Backlog: 'catalog.project.status.Backlog.label',
  Planned: 'catalog.project.status.Planned.label',
  'In Progress': 'catalog.project.status.In Progress.label',
  Completed: 'catalog.project.status.Completed.label',
  Canceled: 'catalog.project.status.Canceled.label',
  Archived: 'catalog.project.status.Archived.label',
}

const editTimeOnlyStatuses = new Set<ProjectStatus>(['Completed', 'Canceled', 'Archived'])

export const projectStatusSemanticMetadata: Record<ProjectStatus, ProjectStatusSemanticMetadata> =
  Object.fromEntries(
    projectStatusOptions.map((status) => [
      status,
      {
        labelKey: projectStatusLabelKeys[status],
        descriptionKey: projectStatusDescriptionKeys[status],
        editTimeOnly: editTimeOnlyStatuses.has(status),
      },
    ]),
  ) as Record<ProjectStatus, ProjectStatusSemanticMetadata>

export function isProjectStatus(value: string): value is ProjectStatus {
  return (projectStatusOptions as readonly string[]).includes(value)
}

/** i18n key for status helper text; resolve in Svelte via `i18nStore.t(key)`. */
export function getProjectStatusDescriptionKey(status: string): TranslationKey | null {
  if (!isProjectStatus(status)) {
    return null
  }
  return projectStatusDescriptionKeys[status]
}

/**
 * Returns the description translation key for a canonical status.
 * UI pattern: `i18nStore.t(getProjectStatusDescription(status) ?? fallbackKey)`.
 */
export function getProjectStatusDescription(status: string): TranslationKey | null {
  return getProjectStatusDescriptionKey(status)
}

export function getProjectStatusLabelKey(status: string): TranslationKey | null {
  if (!isProjectStatus(status)) {
    return null
  }
  return projectStatusLabelKeys[status]
}

export function getProjectStatusMetadata(status: string): ProjectStatusSemanticMetadata | null {
  if (!isProjectStatus(status)) {
    return null
  }
  return projectStatusSemanticMetadata[status]
}

/** Options for create-project forms (Backlog, Planned, In Progress). */
export function getCreateTimeProjectStatusOptions(): readonly CreateTimeProjectStatus[] {
  return createTimeProjectStatusOptions
}

export function createOrganizationDraft(): OrganizationCreationDraft {
  return {
    name: '',
    slug: '',
  }
}

export function createProjectDraft(
  defaultAgentProviderId: string | null = null,
): ProjectCreationDraft {
  return {
    name: '',
    slug: '',
    description: '',
    status: defaultCreateProjectStatus,
    maxConcurrentAgents: '',
    defaultAgentProviderId: defaultAgentProviderId ?? '',
  }
}

export function parseOrganizationDraft(draft: OrganizationCreationDraft): DraftParseResult<{
  name: string
  slug: string
}> {
  const name = draft.name.trim()
  if (!name) {
    return { ok: false, error: 'Organization name is required.' }
  }

  const slug = parseSlug(draft.slug)
  if (!slug.ok) {
    return slug
  }

  return {
    ok: true,
    value: {
      name,
      slug: slug.value,
    },
  }
}

export function parseProjectDraft(draft: ProjectCreationDraft): DraftParseResult<{
  name: string
  slug: string
  description: string
  status: string
  max_concurrent_agents?: number
  default_agent_provider_id?: string | null
}> {
  const name = draft.name.trim()
  if (!name) {
    return { ok: false, error: 'Project name is required.' }
  }

  const slug = parseSlug(draft.slug)
  if (!slug.ok) {
    return slug
  }

  const status = draft.status
  if (!projectStatusOptions.includes(status as ProjectStatus)) {
    return {
      ok: false,
      error: `Project status must be one of ${projectStatusOptions.join(', ')}.`,
    }
  }

  const maxConcurrentAgents = parseOptionalPositiveInteger(
    'Max concurrent agents',
    draft.maxConcurrentAgents,
  )
  if (!maxConcurrentAgents.ok) {
    return maxConcurrentAgents
  }

  const defaultAgentProviderId = draft.defaultAgentProviderId.trim()

  return {
    ok: true,
    value: {
      name,
      slug: slug.value,
      description: draft.description.trim(),
      status,
      max_concurrent_agents: maxConcurrentAgents.value,
      default_agent_provider_id: defaultAgentProviderId || undefined,
    },
  }
}

export function slugFromName(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

function parseSlug(raw: string): DraftParseResult<string> {
  const slug = raw.trim().toLowerCase()
  if (!slug) {
    return { ok: false, error: 'Slug is required.' }
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      ok: false,
      error: 'Slug must use lowercase letters, numbers, and single hyphens.',
    }
  }

  return { ok: true, value: slug }
}

function parseOptionalPositiveInteger(
  label: string,
  raw: string,
): DraftParseResult<number | undefined> {
  const value = raw.trim()
  if (!value) {
    return { ok: true, value: undefined }
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) {
    return { ok: false, error: `${label} must be a positive integer.` }
  }

  return { ok: true, value: parsed }
}