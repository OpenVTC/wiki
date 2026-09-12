import test, { after, before, describe } from "node:test"
import assert from "node:assert"
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

// Builds the pages in fixtures/sanitize with the real Quartz pipeline and checks that the
// payloads in them do not reach the emitted HTML, and that Quartz's own markup still does.

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")
const fixtureDir = path.join(repoRoot, "quartz", "util", "fixtures", "sanitize")
const outputDir = path.join(repoRoot, "quartz", ".quartz-cache", "sanitize-test-output")

const rawTextElements = /(<(script|style)\b[^>]*>)([\s\S]*?)(<\/\2>)/gi
const tagPattern =
  /<([a-zA-Z][\w:-]*)((?:\s+[^\s"'>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*\/?>/g
const attributePattern = /([^\s"'>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g
const urlAttributes = new Set(["action", "background", "data", "formaction", "href", "src"])
const forbiddenTags = new Set(["base", "embed", "form", "frame", "frameset", "object"])
const dangerousUrl = /^(?:javascript|vbscript|data:text\/html)/i

function decodeEntities(value: string): string {
  return value
    .replace(/&#x([\da-f]+);?/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&colon;/gi, ":")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
}

// Lists script-capable markup in an HTML document: event handler attributes, srcdoc,
// meta refresh, script URLs, embedding elements, and script or style elements carrying the
// fixture marker. Text and attribute values that merely contain escaped payloads are ignored.
function findDangerousMarkup(html: string): string[] {
  const problems: string[] = []

  for (const [, , tag, body] of html.matchAll(rawTextElements)) {
    if (body.includes("xss-marker")) problems.push(`<${tag}> element from content`)
  }

  const markup = html.replace(rawTextElements, "$1$4")
  for (const [, rawTag, attributes] of markup.matchAll(tagPattern)) {
    const tag = rawTag.toLowerCase()
    if (forbiddenTags.has(tag)) problems.push(`<${tag}> element`)

    for (const [, rawName, doubleQuoted, singleQuoted, unquoted] of attributes.matchAll(
      attributePattern,
    )) {
      const name = rawName.toLowerCase()
      const value = decodeEntities(doubleQuoted ?? singleQuoted ?? unquoted ?? "")
      if (name.startsWith("on") || name === "srcdoc") {
        problems.push(`${name} attribute on <${tag}>`)
      } else if (name === "http-equiv" && value.toLowerCase() === "refresh") {
        problems.push(`meta refresh`)
      } else if (urlAttributes.has(name) && dangerousUrl.test(value.replace(/[\0-\x20]/g, ""))) {
        problems.push(`${name}="${value}" on <${tag}>`)
      }
    }
  }

  return problems
}

describe("sanitization of rendered content", () => {
  const pages = new Map<string, string>()

  before(() => {
    fs.rmSync(outputDir, { recursive: true, force: true })
    const build = spawnSync(
      process.execPath,
      ["./quartz/bootstrap-cli.mjs", "build", "-d", fixtureDir, "-o", outputDir],
      { cwd: repoRoot, encoding: "utf8" },
    )
    assert.strictEqual(build.status, 0, `quartz build failed:\n${build.stdout}\n${build.stderr}`)

    for (const page of ["payloads", "features", "tags/sanitize-fixture"]) {
      pages.set(page, fs.readFileSync(path.join(outputDir, `${page}.html`), "utf8"))
    }
  })

  after(() => {
    fs.rmSync(outputDir, { recursive: true, force: true })
  })

  test("the checker detects the payload shapes", () => {
    const problems = findDangerousMarkup(
      `<img src=x onerror=alert(1)><a href=" &#106;avascript:alert(1)">x</a>` +
        `<iframe srcdoc="x"></iframe><meta http-equiv="refresh"><object></object>` +
        `<script>alert("xss-marker")</script><p title="&lt;img onerror=alert(1)&gt;">ok</p>`,
    )
    assert.strictEqual(problems.length, 6, problems.join("\n"))
  })

  test("payloads in content do not reach the emitted HTML", () => {
    for (const [page, html] of pages) {
      assert.deepStrictEqual(findDangerousMarkup(html), [], `dangerous markup in ${page}.html`)
    }
  })

  test("the payload page keeps its harmless content", () => {
    const html = pages.get("payloads")!
    for (const text of ["markdown link", "raw link", "clickable", "Callout body."]) {
      assert.ok(html.includes(text), `payloads.html is missing "${text}"`)
    }
  })

  test("Quartz markup survives sanitization", () => {
    const html = pages.get("features")!
    const expected = [
      // callouts
      'class="callout note"',
      'class="callout tip is-collapsible is-collapsed"',
      'data-callout="my-custom-type"',
      'data-callout-metadata="meta"',
      'class="callout-title-inner"',
      // wikilinks, tags and transclusions
      'href="./target" class="internal alias"',
      'class="tag-link',
      "transclude-src",
      "A paragraph with a block reference.",
      // media embeds
      'width="100" height="50"',
      '<iframe src="./doc.pdf" class="pdf"',
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
      '<video src="./clip.mp4" controls',
      '<audio src="./song.mp3" controls',
      // syntax highlighting, mermaid and math
      "data-rehype-pretty-code-figure",
      "data-rehype-pretty-code-title",
      "data-highlighted-line",
      "--shiki-light:",
      'class="mermaid"',
      "data-clipboard=",
      'class="katex"',
      'class="katex-display"',
      // footnotes, task lists, highlights
      'href="#user-content-fn-1"',
      'id="user-content-fn-1"',
      "data-footnote-backref",
      'class="contains-task-list"',
      'class="text-highlight"',
    ]
    for (const snippet of expected) {
      assert.ok(html.includes(snippet), `features.html is missing ${snippet}`)
    }
  })
})
