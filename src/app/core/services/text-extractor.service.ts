import {Injectable} from '@angular/core';
import {FigmaTextNode} from '../models/figma.models';
import {BookmarkletPayload, WebsiteTextNode} from '../models/website.models';
import {normalizeText, decodeHtmlEntities, generateId} from '../utils/string-normalize';

@Injectable({providedIn: 'root'})
export class TextExtractorService {

  parsePastedAsFigma(text: string): FigmaTextNode[] {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line, i) => ({
        id: generateId(),
        layerName: `Line ${i + 1}`,
        rawText: line,
        normalizedText: normalizeText(line),
        fontSize: 0,
        fontWeight: 400,
        y: i,
        x: 0,
      }));
  }

  parsePastedAsWebsite(text: string): WebsiteTextNode[] {
    return text
      .split('\n')
      .map((line) => decodeHtmlEntities(line.trim()))
      .filter((line) => line.length > 0)
      .map((line, i) => ({
        id: generateId(),
        rawText: line,
        normalizedText: normalizeText(line),
        tagName: 'TEXT',
        selector: '',
        index: i,
      }));
  }

  parseBookmarkletPayload(payload: BookmarkletPayload): WebsiteTextNode[] {
    return payload.nodes
      .filter((n) => n.text.trim().length > 0)
      .map((n, i) => ({
        id: generateId(),
        rawText: n.text.trim(),
        normalizedText: normalizeText(n.text),
        tagName: n.tagName,
        selector: n.selector,
        index: i,
      }));
  }

  validateBookmarkletPayload(data: unknown): BookmarkletPayload | null {
    if (!data || typeof data !== 'object') return null;
    const obj = data as Record<string, unknown>;
    if (obj['source'] !== 'figma-text-diff-bookmarklet') return null;
    if (!Array.isArray(obj['nodes'])) return null;
    return data as BookmarkletPayload;
  }
}
