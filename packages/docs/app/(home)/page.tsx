import Link from "next/link"
import { Accordion, Accordions } from "fumadocs-ui/components/accordion"

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">OpenTUI Web</h1>
        <p className="text-lg text-fd-muted-foreground mb-8 max-w-lg mx-auto">
          Render terminal UIs to HTML5 Canvas with React. No xterm.js. No
          terminal emulator. Just pixels.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/docs"
            className="rounded-lg bg-fd-primary px-6 py-3 text-fd-primary-foreground font-medium hover:bg-fd-primary/90"
          >
            Get Started
          </Link>
          <Link
            href="https://github.com/nichochar/opentui"
            className="rounded-lg border border-fd-border px-6 py-3 font-medium hover:bg-fd-accent"
          >
            GitHub
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-16">
        <div className="rounded-xl border border-fd-border p-6 text-left">
          <h3 className="font-semibold mb-2">Canvas Rendering</h3>
          <p className="text-sm text-fd-muted-foreground">
            TUI content drawn directly to HTML5 Canvas, not a DOM tree.
            Pixel-perfect output with efficient dirty-region repainting.
          </p>
        </div>
        <div className="rounded-xl border border-fd-border p-6 text-left">
          <h3 className="font-semibold mb-2">React Reconciler</h3>
          <p className="text-sm text-fd-muted-foreground">
            Write TUI layouts with JSX using primitives like{" "}
            <code className="text-xs">&lt;box&gt;</code>,{" "}
            <code className="text-xs">&lt;text&gt;</code>, and{" "}
            <code className="text-xs">&lt;input&gt;</code>. Full React
            lifecycle support.
          </p>
        </div>
        <div className="rounded-xl border border-fd-border p-6 text-left">
          <h3 className="font-semibold mb-2">Yoga Layout</h3>
          <p className="text-sm text-fd-muted-foreground">
            Flexbox positioning powered by yoga-layout. Use familiar props like
            padding, margin, flexDirection, and gap.
          </p>
        </div>
      </div>

      <Accordions type="single" className="w-full max-w-3xl text-left">
        <Accordion title="How is this different from xterm.js?">
          xterm.js is a terminal emulator that interprets ANSI escape codes.
          OpenTUI Web takes a fundamentally different approach: it renders
          directly to canvas using a React reconciler and Yoga layout engine. No
          terminal emulation layer, no escape codes — just a React component tree
          painted to pixels.
        </Accordion>
        <Accordion title="What frameworks are supported?">
          Vite and Next.js are supported with first-party plugins. Any React
          framework can work with appropriate module resolution configuration.
        </Accordion>
        <Accordion title="Is it SSR-safe?">
          Yes. <code>OpenTuiCanvas</code> renders an empty div on the server and
          hydrates the canvas on the client. No{" "}
          <code>dynamic(() =&gt; import(...), {"{"} ssr: false {"}"})</code>{" "}
          wrapper is needed.
        </Accordion>
        <Accordion title="What interaction is supported?">
          Text selection, copy/paste, keyboard events, and file drag-and-drop
          are all supported on the canvas. Key events are forwarded to focused
          components.
        </Accordion>
        <Accordion title="How does the rendering pipeline work?">
          JSX goes through the React reconciler, which builds a renderable tree.
          Yoga computes flexbox layout, a BrowserBuffer stores the cell grid, and
          CanvasPainter draws it to an HTML5 Canvas element.
        </Accordion>
        <Accordion title="Is OpenTUI Web production-ready?">
          OpenTUI Web is experimental. APIs may change between releases. Use it
          at your own risk.
        </Accordion>
      </Accordions>
    </main>
  )
}
