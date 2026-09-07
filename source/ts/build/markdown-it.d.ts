/**
 * The slice of markdown-it this build uses. The package ships no types and pulling in
 * @types/markdown-it for one method is not worth a dependency (02-§9.6).
 */
declare module "markdown-it" {
  interface MarkdownItOptions {
    html?: boolean;
    linkify?: boolean;
    typographer?: boolean;
  }
  class MarkdownIt {
    constructor(options?: MarkdownItOptions);
    render(text: string): string;
  }
  export default MarkdownIt;
}
