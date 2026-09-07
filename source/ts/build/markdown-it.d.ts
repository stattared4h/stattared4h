/**
 * The slice of markdown-it this build uses. The package ships no types and pulling in
 * @types/markdown-it for a handful of members is not worth a dependency (02-§9.6).
 *
 * `env` is markdown-it's own way of passing per-render context to a rule: whatever is
 * given to `render` reaches every renderer rule unchanged. source/ts/build/markdown.ts
 * uses it to hand the image resolver down to the image rule.
 */
declare module "markdown-it" {
  interface MarkdownItOptions {
    html?: boolean;
    linkify?: boolean;
    typographer?: boolean;
  }

  /** One parsed token. Only the attribute lookup the image rule needs is declared. */
  export interface Token {
    attrGet(name: string): string | null;
  }

  /** A renderer rule, as markdown-it calls it. */
  export type RenderRule<Env> = (
    tokens: Token[],
    index: number,
    options: MarkdownItOptions,
    env: Env,
    self: unknown,
  ) => string;

  export interface Renderer {
    rules: Record<string, RenderRule<never> | undefined>;
  }

  class MarkdownIt {
    constructor(options?: MarkdownItOptions);
    readonly renderer: Renderer;
    render(text: string, env?: unknown): string;
  }
  export default MarkdownIt;
}
