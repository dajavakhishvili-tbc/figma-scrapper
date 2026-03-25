import {Injectable} from '@angular/core';
import {FigmaApiTextNode, FigmaConfig, FigmaTextNode} from '../models/figma.models';
import {normalizeText, generateId} from '../utils/string-normalize';

const TOKEN_KEY = 'figma-text-diff-token';
const FIGMA_API_BASE = 'https://api.figma.com/v1';

/** Layer names that indicate placeholder/structural nodes, not real content */
const NOISE_LAYER_NAMES = new Set([
  'slot', 'divider', 'spacer', 'placeholder', 'frame', 'group',
  'rectangle', 'ellipse', 'line', 'vector', 'component',
  'auto layout', 'container',
]);

/**
 * Words that are common Figma component placeholder tokens.
 * We match text composed entirely of these words (e.g. "Divider title", "Secondary text").
 */
const PLACEHOLDER_WORDS = new Set([
  'slot', 'divider', 'spacer', 'placeholder', 'label', 'title',
  'subtitle', 'description', 'heading', 'body', 'caption', 'text',
  'content', 'item', 'primary', 'secondary', 'tertiary', 'menu',
  'header', 'footer', 'helper', 'supporting', 'overline', 'subhead',
]);

/** Regex patterns to extract file key and node ID from various Figma URL formats */
const FIGMA_URL_PATTERNS = [
  // https://www.figma.com/design/FILE_KEY/Name?node-id=NODE_ID
  /figma\.com\/(?:design|file)\/([a-zA-Z0-9]+)(?:\/[^?]*)?(?:\?.*node-id=([^&]+))?/,
];

@Injectable({providedIn: 'root'})
export class FigmaApiService {

  saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  getToken(): string {
    return localStorage.getItem(TOKEN_KEY) ?? '';
  }

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  parseFigmaUrl(url: string): Omit<FigmaConfig, 'token'> | null {
    for (const pattern of FIGMA_URL_PATTERNS) {
      const match = url.match(pattern);
      if (match) {
        const fileKey = match[1];
        const nodeId = match[2] ? decodeURIComponent(match[2]).replace(/-/g, ':') : '';
        if (fileKey) return {fileKey, nodeId};
      }
    }
    return null;
  }

  async fetchTextNodes(config: FigmaConfig, abortSignal?: AbortSignal): Promise<FigmaTextNode[]> {
    const {token, fileKey, nodeId} = config;
    const url = nodeId
      ? `${FIGMA_API_BASE}/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`
      : `${FIGMA_API_BASE}/files/${fileKey}`;

    const response = await fetch(url, {
      headers: {'X-Figma-Token': token},
      signal: abortSignal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`Figma API error (${response.status}): ${errorBody || response.statusText}`);
    }

    const data = await response.json();
    const documentNode = nodeId
      ? data.nodes?.[nodeId]?.document
      : data.document;

    if (!documentNode) {
      throw new Error('Could not find the specified node in the Figma file.');
    }

    const textNodes: FigmaApiTextNode[] = [];
    this.traverseTree(documentNode, textNodes);

    return textNodes
      .filter((n) => !this.isNoiseNode(n))
      .map((n) => this.toFigmaTextNode(n))
      .sort((a, b) => a.y - b.y || a.x - b.x);
  }

  private traverseTree(node: any, results: FigmaApiTextNode[]): void {
    if (node.type === 'TEXT' && node.characters?.trim()) {
      results.push({
        id: node.id,
        name: node.name,
        type: 'TEXT',
        characters: node.characters,
        style: {
          fontSize: node.style?.fontSize ?? 0,
          fontWeight: node.style?.fontWeight ?? 400,
          fontFamily: node.style?.fontFamily ?? '',
        },
        absoluteBoundingBox: node.absoluteBoundingBox ?? {x: 0, y: 0, width: 0, height: 0},
      });
    }

    if (node.children) {
      for (const child of node.children) {
        this.traverseTree(child, results);
      }
    }
  }

  /** Filters out structural/placeholder nodes that aren't real content */
  private isNoiseNode(node: FigmaApiTextNode): boolean {
    const layerName = node.name.toLowerCase().trim();

    // Skip if the layer name is a known structural name
    if (NOISE_LAYER_NAMES.has(layerName)) return true;

    // Skip if the text is entirely composed of placeholder words
    // e.g. "Slot", "Divider title", "Secondary text", "Primary text"
    if (this.isPlaceholderText(node.characters)) return true;

    return false;
  }

  /** Returns true if text is made up entirely of known placeholder words */
  private isPlaceholderText(text: string): boolean {
    const words = text.trim().toLowerCase().split(/\s+/);
    return words.length > 0 && words.length <= 4 && words.every((w) => PLACEHOLDER_WORDS.has(w));
  }

  private toFigmaTextNode(apiNode: FigmaApiTextNode): FigmaTextNode {
    return {
      id: apiNode.id || generateId(),
      layerName: apiNode.name,
      rawText: apiNode.characters,
      normalizedText: normalizeText(apiNode.characters),
      fontSize: apiNode.style.fontSize,
      fontWeight: apiNode.style.fontWeight,
      y: apiNode.absoluteBoundingBox.y,
      x: apiNode.absoluteBoundingBox.x,
    };
  }
}
