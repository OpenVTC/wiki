import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const ArticleTitle: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const title = fileData.frontmatter?.title
  if (title) {
    return <p></p>
  } else {
    return null
  }
}

ArticleTitle.css = `
.article-title {
  margin: 2rem 0 0 0;
}
`

export default (() => ArticleTitle) satisfies QuartzComponentConstructor
