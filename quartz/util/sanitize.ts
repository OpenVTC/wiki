import { defaultSchema, type Options as SanitizeSchema } from "rehype-sanitize"

// Raw HTML in content is untrusted: pages are written by people and by an LLM from upstream
// sources. This schema starts from rehype-sanitize's default (GitHub's rules) and additionally
// allows only the markup Quartz itself generates before the sanitizer runs: callouts, wikilink
// embeds and transclusions, text highlights, tag links, mermaid blocks, math placeholders and
// syntax highlighting. Plugins that run after the sanitizer (block references, YouTube embeds,
// heading anchors, link crawling, KaTeX) are not affected by it.

// Colours and font styles emitted by rehype-pretty-code for the light and dark themes
const shikiStyle =
  /^(?:--shiki-(?:light|dark)(?:-bg|-font-style|-font-weight|-text-decoration)?:(?:#[\da-f]{3,8}|inherit|normal|italic|bold|none|underline);?)+$/i

export const sanitizeSchema: SanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "abbr",
    "audio",
    "figcaption",
    "figure",
    "iframe",
    "mark",
    "video",
  ],
  // drop <style> together with its contents rather than unwrapping it into visible text
  strip: [...(defaultSchema.strip ?? []), "style"],
  // Only prefix `name`. remark-rehype already prefixes footnote ids with `user-content-`, and
  // prefixing ids a second time would break the footnote links that point at them.
  clobber: ["name"],
  attributes: {
    ...defaultSchema.attributes,
    a: [
      "ariaDescribedBy",
      "ariaLabel",
      "ariaLabelledBy",
      "dataFootnoteBackref",
      "dataFootnoteRef",
      "href",
      ["className", "data-footnote-backref", "internal", "broken", "tag-link", "transclude-inner"],
    ],
    blockquote: [
      "cite",
      // callouts (whose type can be any name) and transclusions
      ["className", /^[\w-]+$/],
      "dataCallout",
      "dataCalloutFold",
      "dataCalloutMetadata",
      "dataUrl",
      "dataBlock",
      "dataEmbedAlias",
    ],
    code: [
      ["className", /^language-./, "mermaid", "math-inline", "math-display"],
      "dataClipboard",
      "dataLanguage",
      "dataTheme",
      ["style", /^display:\s*grid;?$/],
    ],
    div: [
      "itemScope",
      "itemType",
      [
        "className",
        "callout-content",
        "callout-icon",
        "callout-title",
        "callout-title-inner",
        "fold-callout-icon",
      ],
    ],
    figure: ["dataRehypePrettyCodeFigure"],
    figcaption: [
      "dataRehypePrettyCodeTitle",
      "dataRehypePrettyCodeCaption",
      "dataLanguage",
      "dataTheme",
    ],
    pre: ["dataLanguage", "dataTheme", ["style", shikiStyle]],
    span: [
      ["className", "text-highlight"],
      "dataLine",
      "dataHighlightedLine",
      "dataHighlightedChars",
      "dataCharsId",
      "dataRehypePrettyCodeFigure",
      ["style", shikiStyle],
    ],
    mark: ["dataHighlightedChars", "dataCharsId"],
    iframe: ["src", ["className", "pdf"]],
    audio: ["src", "controls"],
    video: ["src", "controls"],
  },
}
