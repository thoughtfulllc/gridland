/**
 * AST-based lint rule: no runtime-singleton calls in renderable constructors.
 *
 * Phase 4 deliverable D4.2 of tasks/003-browser-compat-contract.md.
 *
 * The rule: any file under `packages/core/src/renderables/**` or
 * `packages/web/src/components/**` must not, from inside a constructor body,
 *
 *   - call `resolveRenderLib()` or `registerRenderLib()`
 *   - call `OptimizedBuffer.create(...)`
 *
 * Rationale: constructors run during React reconciliation, before any runtime
 * capability is known. Any singleton dependency at construction time will
 * crash in runtimes that don't provide it. Resource allocation belongs in
 * `renderSelf()` via `ensureBuffer()` or equivalent. See
 * `.claude/rules/renderable-constructors.md` and spec §2.2 / Phase 1.
 *
 * The rule's value is: even if no future renderable *currently* reintroduces
 * the bug, the lint keeps the invariant enforced as the codebase grows.
 */

import * as ts from "typescript"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative, resolve } from "node:path"

export interface LintFinding {
  filename: string
  line: number
  column: number
  message: string
}

const FORBIDDEN_CALLS = new Set(["resolveRenderLib", "registerRenderLib"])
const FORBIDDEN_MEMBER_CALLS = [
  { object: "OptimizedBuffer", property: "create" },
]

/**
 * Walk a single source file and return findings for constructor-body violations.
 * Pure function — no I/O. Tests drive it with inline fixture sources.
 */
export function lintRenderableConstructor(filename: string, source: string): LintFinding[] {
  const findings: LintFinding[] = []
  const sourceFile = ts.createSourceFile(filename, source, ts.ScriptTarget.ESNext, /*setParentNodes*/ true, ts.ScriptKind.TS)

  function visitNode(node: ts.Node, insideConstructor: boolean) {
    if (insideConstructor && ts.isCallExpression(node)) {
      const expr = node.expression

      // Direct call: resolveRenderLib(), registerRenderLib()
      if (ts.isIdentifier(expr) && FORBIDDEN_CALLS.has(expr.text)) {
        findings.push(makeFinding(sourceFile, filename, node, `${expr.text}() called in renderable constructor body`))
      }

      // Member call: OptimizedBuffer.create(...)
      if (ts.isPropertyAccessExpression(expr)) {
        const obj = expr.expression
        const prop = expr.name
        if (ts.isIdentifier(obj) && ts.isIdentifier(prop)) {
          for (const forbidden of FORBIDDEN_MEMBER_CALLS) {
            if (obj.text === forbidden.object && prop.text === forbidden.property) {
              findings.push(
                makeFinding(sourceFile, filename, node, `${forbidden.object}.${forbidden.property}() called in renderable constructor body`),
              )
            }
          }
        }
      }
    }

    // Enter constructor bodies. Nested functions (arrow, function expression)
    // inside a constructor body are still considered "inside constructor"
    // because if they're invoked synchronously they run during reconciliation;
    // if they're deferred (event handler, callback), the runtime singleton
    // may still be unregistered at call time. Err on the side of strict.
    const enteringConstructor = ts.isConstructorDeclaration(node)

    ts.forEachChild(node, (child) => visitNode(child, insideConstructor || enteringConstructor))
  }

  visitNode(sourceFile, /*insideConstructor*/ false)

  return findings
}

function makeFinding(
  sourceFile: ts.SourceFile,
  filename: string,
  node: ts.Node,
  message: string,
): LintFinding {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
  return {
    filename,
    line: line + 1,
    column: character + 1,
    message,
  }
}

// ─── CLI entry point ──────────────────────────────────────────────────────

const LINT_ROOTS: Array<{ absPath: string; relPath: string }> = [
  {
    absPath: resolve(import.meta.dirname, "../src/renderables"),
    relPath: "packages/core/src/renderables",
  },
  {
    absPath: resolve(import.meta.dirname, "../../web/src/components"),
    relPath: "packages/web/src/components",
  },
]

function listTypeScriptFiles(rootDir: string): string[] {
  const out: string[] = []
  function walk(dir: string): void {
    let entries: string[]
    try {
      entries = readdirSync(dir)
    } catch {
      return
    }
    for (const entry of entries) {
      const full = join(dir, entry)
      let st
      try {
        st = statSync(full)
      } catch {
        continue
      }
      if (st.isDirectory()) {
        // Skip __tests__ — test files are not renderables and often mock
        // the exact forbidden surfaces we're looking for.
        if (entry === "__tests__" || entry === "node_modules") continue
        walk(full)
      } else if (st.isFile() && (entry.endsWith(".ts") || entry.endsWith(".tsx"))) {
        // Skip .test.ts / .test.tsx by filename convention.
        if (entry.endsWith(".test.ts") || entry.endsWith(".test.tsx")) continue
        out.push(full)
      }
    }
  }
  walk(rootDir)
  return out
}

if (import.meta.main) {
  const allFindings: LintFinding[] = []
  let filesScanned = 0

  for (const { absPath, relPath } of LINT_ROOTS) {
    const files = listTypeScriptFiles(absPath)
    for (const file of files) {
      filesScanned++
      const source = readFileSync(file, "utf-8")
      const relative_ = join(relPath, relative(absPath, file))
      const findings = lintRenderableConstructor(relative_, source)
      allFindings.push(...findings)
    }
  }

  if (allFindings.length > 0) {
    console.error("lint-renderable-constructors: violations found\n")
    for (const f of allFindings) {
      console.error(`  ${f.filename}:${f.line}:${f.column}  ${f.message}`)
    }
    console.error(
      "\nRenderable constructors must not call runtime singletons. Move the allocation into a lazy ensureBuffer() or equivalent method called from renderSelf(). See .claude/rules/renderable-constructors.md and tasks/003-browser-compat-contract.md §2.2 / Phase 1.",
    )
    process.exit(1)
  }

  console.log(
    `lint-renderable-constructors: OK (${filesScanned} files scanned, 0 violations)`,
  )
}
