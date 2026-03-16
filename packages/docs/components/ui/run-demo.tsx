import { Tab, Tabs } from "fumadocs-ui/components/tabs"
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock"

export function RunDemo({ name }: { name: string }) {
  return (
    <>
      <h2>Run demo</h2>
      <Tabs items={["bunx", "curl"]}>
        <Tab value="bunx">
          <DynamicCodeBlock lang="bash" code={`bunx @gridland/demo ${name}`} codeblock={{ title: "Terminal" }} />
        </Tab>
        <Tab value="curl">
          <DynamicCodeBlock lang="bash" code={`curl -fsSL https://raw.githubusercontent.com/thoughtfulllc/gridland/main/scripts/run-demo.sh | bash -s ${name}`} codeblock={{ title: "Terminal" }} />
        </Tab>
      </Tabs>
    </>
  )
}
