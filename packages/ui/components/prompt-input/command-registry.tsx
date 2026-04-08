import { useSyncExternalStore, useEffect, createContext, useContext, useMemo, useRef, type ReactNode } from "react"

// ============================================================================
// Command interface
// ============================================================================

/** A slash command with optional execution handler. */
export interface PromptInputCommand {
  cmd: string
  desc?: string
  /** Categorization for grouping in autocomplete (e.g. 'builtin', 'claude-code', 'git'). */
  group?: string
  /** When provided, PromptInput calls this directly instead of onSubmit. */
  onExecute?: () => void
  /** Hide from autocomplete suggestions but still executable. */
  hidden?: boolean
}

// ============================================================================
// Registry (standalone, framework-agnostic)
// ============================================================================

export type CommandRegistryListener = () => void

const EMPTY: PromptInputCommand[] = []

export class CommandRegistry {
  private commands = new Map<string, PromptInputCommand>()
  private listeners = new Set<CommandRegistryListener>()
  private _snapshot: PromptInputCommand[] = EMPTY

  /** Register a command. Returns an unsubscribe function. */
  register(command: PromptInputCommand): () => void {
    this.commands.set(command.cmd, command)
    this.notify()
    return () => {
      this.commands.delete(command.cmd)
      this.notify()
    }
  }

  /** Register multiple commands at once. Returns an unsubscribe function that removes all. */
  registerAll(commands: PromptInputCommand[]): () => void {
    for (const cmd of commands) {
      this.commands.set(cmd.cmd, cmd)
    }
    this.notify()
    return () => {
      for (const cmd of commands) {
        this.commands.delete(cmd.cmd)
      }
      this.notify()
    }
  }

  /** Unregister a command by name. */
  unregister(cmd: string): void {
    if (this.commands.delete(cmd)) {
      this.notify()
    }
  }

  /** Find a command by exact name. */
  find(cmd: string): PromptInputCommand | undefined {
    return this.commands.get(cmd)
  }

  /** Subscribe to changes. Returns unsubscribe function. */
  subscribe(listener: CommandRegistryListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** Stable snapshot for useSyncExternalStore — only allocates when commands change. */
  getSnapshot = (): PromptInputCommand[] => this._snapshot

  private notify() {
    this._snapshot = Array.from(this.commands.values())
    for (const listener of this.listeners) {
      listener()
    }
  }
}

// ============================================================================
// React context + hooks
// ============================================================================

const CommandRegistryCtx = createContext<CommandRegistry | null>(null)

export interface CommandProviderProps {
  children: ReactNode
  /** Use an existing registry instance. If omitted, a new one is created. */
  registry?: CommandRegistry
}

/** Provides a CommandRegistry to all descendant PromptInput components. */
export function CommandProvider({ children, registry }: CommandProviderProps) {
  const owned = useMemo(() => registry ?? new CommandRegistry(), [registry])
  return (
    <CommandRegistryCtx.Provider value={owned}>
      {children}
    </CommandRegistryCtx.Provider>
  ) as any // @ts-nocheck workaround for OpenTUI JSX type conflicts
}

/** Access the nearest CommandRegistry. Returns null if no provider is present. */
export function useOptionalCommandRegistry(): CommandRegistry | null {
  return useContext(CommandRegistryCtx)
}

/** Access the nearest CommandRegistry. Throws if no provider is present. */
export function useCommandRegistry(): CommandRegistry {
  const ctx = useContext(CommandRegistryCtx)
  if (!ctx) {
    throw new Error("useCommandRegistry requires a <CommandProvider> ancestor.")
  }
  return ctx
}

/**
 * Subscribe to command registry changes and return the current command list.
 * Works with or without a CommandProvider — returns an empty array if no provider.
 */
export function useRegistryCommands(): PromptInputCommand[] {
  const registry = useOptionalCommandRegistry()
  const registryRef = useRef(registry)
  registryRef.current = registry

  return useSyncExternalStore(
    (cb) => registryRef.current?.subscribe(cb) ?? (() => {}),
    () => registryRef.current?.getSnapshot() ?? EMPTY,
    () => EMPTY,
  )
}

/**
 * Register a command in the nearest CommandRegistry. Automatically unregisters on unmount.
 * No-op if no CommandProvider is present.
 */
export function useRegisterCommand(command: PromptInputCommand): void {
  const registry = useOptionalCommandRegistry()

  useEffect(() => {
    if (!registry) return
    return registry.register(command)
  }, [registry, command])
}

/**
 * Register multiple commands. Automatically unregisters on unmount.
 * No-op if no CommandProvider is present.
 */
export function useRegisterCommands(commands: PromptInputCommand[]): void {
  const registry = useOptionalCommandRegistry()

  useEffect(() => {
    if (!registry || commands.length === 0) return
    return registry.registerAll(commands)
  }, [registry, commands])
}
