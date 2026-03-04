import defaultMdxComponents from "fumadocs-ui/mdx"

type MDXComponents = Record<string, React.ComponentType<any>>

export function useMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...components,
  }
}
