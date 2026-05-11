// Content plugin registry for <RickSheet>.
// Each entry: contentKey (kebab-case + hypothesis-date YYYY-MM-DD) → React component.
// Per skill `1-project-create-launch` §Naming convention — use date of hypothesis,
// not vN suffix.
import type { ComponentType } from "react"

export interface RickFormContentProps {
  config: Record<string, unknown>
  onSubmit: (values: Record<string, unknown>) => void
  onClose: () => void
  onValidate?: (values: Record<string, unknown>) => string | null
}

type RegistryMap = Map<string, ComponentType<RickFormContentProps>>

const registry: RegistryMap = new Map()

export const RickFormRegistry = {
  register(contentKey: string, component: ComponentType<RickFormContentProps>): void {
    if (registry.has(contentKey)) {
      // eslint-disable-next-line no-console
      console.warn(`[RickForm] content key "${contentKey}" already registered — overwriting`)
    }
    registry.set(contentKey, component)
  },
  resolve(contentKey: string): ComponentType<RickFormContentProps> | null {
    return registry.get(contentKey) ?? null
  },
  list(): string[] {
    return Array.from(registry.keys()).sort()
  },
}
