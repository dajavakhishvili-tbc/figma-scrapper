export interface WebsiteTextNode {
  readonly id: string;
  readonly rawText: string;
  readonly normalizedText: string;
  readonly tagName: string;
  readonly selector: string;
  readonly index: number;
}

export interface BookmarkletPayload {
  readonly source: 'figma-text-diff-bookmarklet';
  readonly version: number;
  readonly url: string;
  readonly timestamp: number;
  readonly nodes: ReadonlyArray<{
    readonly text: string;
    readonly tagName: string;
    readonly selector: string;
    readonly rect: { x: number; y: number; width: number; height: number };
  }>;
}
