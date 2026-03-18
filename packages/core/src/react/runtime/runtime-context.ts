import { createContext, useContext, createElement, type ReactNode } from "react"
import { singleton } from "../../lib/singleton"

export type RuntimeType = "web" | "terminal"

export const RuntimeContext = singleton("RuntimeContext", () =>
  createContext<RuntimeType>("terminal"),
)

export function useRuntime(): RuntimeType {
  return useContext(RuntimeContext)
}

export interface RuntimeProviderProps {
  value: RuntimeType
  children: ReactNode
}

export function RuntimeProvider({ value, children }: RuntimeProviderProps) {
  return createElement(RuntimeContext.Provider, { value }, children)
}
