// window.RickForm public API — render <RickSheet> imperatively from add_code rule.
import { createRoot, type Root } from "react-dom/client"
import { useEffect, useState } from "react"
import { RickSheet, type RickSheetMode } from "./components/rick-sheet"
import { RickFormRegistry, type RickFormContentProps } from "./registry"

export interface RickFormOpenParams {
  contentKey: string
  title?: string
  mode?: RickSheetMode
  config?: Record<string, unknown>
  callbacks?: {
    onSubmit?: (values: Record<string, unknown>) => void
    onClose?: () => void
    onValidate?: (values: Record<string, unknown>) => string | null
  }
}

interface ControllerProps extends RickFormOpenParams {
  onTeardown: () => void
}

function Controller({
  contentKey,
  title,
  mode = "auto",
  config = {},
  callbacks = {},
  onTeardown,
}: ControllerProps) {
  const [open, setOpen] = useState(true)
  const Content = RickFormRegistry.resolve(contentKey)

  useEffect(() => {
    if (!Content) {
      // eslint-disable-next-line no-console
      console.error(
        `[RickForm] unknown contentKey "${contentKey}". Registered: ${RickFormRegistry.list().join(", ") || "(none)"}`,
      )
      onTeardown()
    }
  }, [Content, contentKey, onTeardown])

  if (!Content) return null

  const handleClose = () => {
    setOpen(false)
    callbacks.onClose?.()
    // allow exit animation to play before unmount
    window.setTimeout(onTeardown, 220)
  }

  const handleSubmit = (values: Record<string, unknown>) => {
    callbacks.onSubmit?.(values)
    handleClose()
  }

  const props: RickFormContentProps = {
    config,
    onSubmit: handleSubmit,
    onClose: handleClose,
    onValidate: callbacks.onValidate,
  }

  return (
    <RickSheet open={open} onClose={handleClose} mode={mode} title={title}>
      <Content {...props} />
    </RickSheet>
  )
}

let mountNode: HTMLDivElement | null = null
let root: Root | null = null

function ensureRoot(): Root {
  if (root && mountNode) return root
  mountNode = document.createElement("div")
  mountNode.setAttribute("data-rick-form-root", "")
  document.body.appendChild(mountNode)
  root = createRoot(mountNode)
  return root
}

function teardown() {
  if (root) {
    root.unmount()
    root = null
  }
  if (mountNode && mountNode.parentNode) {
    mountNode.parentNode.removeChild(mountNode)
    mountNode = null
  }
}

export const RickForm = {
  open(params: RickFormOpenParams): void {
    const r = ensureRoot()
    r.render(<Controller {...params} onTeardown={teardown} />)
  },
  close(): void {
    teardown()
  },
  content: {
    register: RickFormRegistry.register,
    list: RickFormRegistry.list,
  },
}
