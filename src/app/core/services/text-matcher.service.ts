import {inject, Injectable} from '@angular/core';
import {FigmaTextNode} from '../models/figma.models';
import {WebsiteTextNode} from '../models/website.models';
import {
  MatchResult, MatchPair, MatchOptions, SimilarityEntry,
  ComparisonSummary, MatchType,
} from '../models/matching.models';
import {similarityRatio} from '../utils/levenshtein';
import {DiffService} from './diff.service';

const DEFAULT_THRESHOLD = 0.6;
const DEFAULT_SHORT_THRESHOLD = 0.85;
const SHORT_STRING_LENGTH = 3;

@Injectable({providedIn: 'root'})
export class TextMatcherService {
  private readonly diffService = inject(DiffService);

  compare(
    figmaNodes: FigmaTextNode[],
    websiteNodes: WebsiteTextNode[],
    options?: MatchOptions,
  ): MatchResult {
    const threshold = options?.threshold ?? DEFAULT_THRESHOLD;
    const shortThreshold = options?.shortStringThreshold ?? DEFAULT_SHORT_THRESHOLD;

    const matrix = this.buildSimilarityMatrix(figmaNodes, websiteNodes);
    const {pairs, unmatchedFigmaIdx, unmatchedWebsiteIdx} =
      this.assignPairs(matrix, figmaNodes, threshold, shortThreshold);

    const matchedPairs: MatchPair[] = pairs.map(([fi, wi, score, matchType]) => {
      const figmaNode = figmaNodes[fi];
      const websiteNode = websiteNodes[wi];
      const diffs = score < 1.0
        ? this.diffService.computeDiff(figmaNode.rawText, websiteNode.rawText)
        : [{type: 'equal' as const, text: figmaNode.rawText}];

      return {figmaNode, websiteNode, similarity: score, matchType, diffs, isIgnored: false};
    });

    const unmatchedFigma = unmatchedFigmaIdx.map((i) => figmaNodes[i]);
    const unmatchedWebsite = unmatchedWebsiteIdx.map((i) => websiteNodes[i]);
    const summary = this.computeSummary(matchedPairs, unmatchedFigma, unmatchedWebsite, figmaNodes.length);

    return {matchedPairs, unmatchedFigma, unmatchedWebsite, summary};
  }

  private buildSimilarityMatrix(
    figma: FigmaTextNode[],
    website: WebsiteTextNode[],
  ): SimilarityEntry[] {
    const entries: SimilarityEntry[] = [];

    for (let fi = 0; fi < figma.length; fi++) {
      const fNorm = figma[fi].normalizedText;
      for (let wi = 0; wi < website.length; wi++) {
        const wNorm = website[wi].normalizedText;

        let score: number;
        let matchType: MatchType;

        if (figma[fi].rawText === website[wi].rawText) {
          score = 1.0;
          matchType = 'exact';
        } else if (fNorm === wNorm) {
          score = 0.99;
          matchType = 'normalized-exact';
        } else {
          // Length pre-filter: if ratio of lengths < threshold, skip
          const minLen = Math.min(fNorm.length, wNorm.length);
          const maxLen = Math.max(fNorm.length, wNorm.length);
          if (maxLen > 0 && minLen / maxLen < 0.4) continue;

          score = similarityRatio(fNorm, wNorm);
          matchType = 'fuzzy';
        }

        if (score >= 0.3) {
          entries.push({figmaIndex: fi, websiteIndex: wi, score, matchType});
        }
      }
    }

    return entries;
  }

  private assignPairs(
    matrix: SimilarityEntry[],
    figmaNodes: FigmaTextNode[],
    threshold: number,
    shortThreshold: number,
  ): {
    pairs: Array<[number, number, number, MatchType]>;
    unmatchedFigmaIdx: number[];
    unmatchedWebsiteIdx: number[];
  } {
    // Sort by score descending
    const sorted = [...matrix].sort((a, b) => b.score - a.score);

    const matchedFigma = new Set<number>();
    const matchedWebsite = new Set<number>();
    const pairs: Array<[number, number, number, MatchType]> = [];

    for (const entry of sorted) {
      if (matchedFigma.has(entry.figmaIndex)) continue;
      if (matchedWebsite.has(entry.websiteIndex)) continue;

      const isShort = figmaNodes[entry.figmaIndex].normalizedText.length <= SHORT_STRING_LENGTH;
      const effectiveThreshold = isShort ? shortThreshold : threshold;

      if (entry.score >= effectiveThreshold) {
        pairs.push([entry.figmaIndex, entry.websiteIndex, entry.score, entry.matchType]);
        matchedFigma.add(entry.figmaIndex);
        matchedWebsite.add(entry.websiteIndex);
      }
    }

    const allFigmaIdx = new Set(figmaNodes.map((_, i) => i));
    const allWebsiteIdx = new Set(matrix.map((e) => e.websiteIndex));
    // Include all website indices
    const websiteCount = new Set(matrix.map((e) => e.websiteIndex));
    // Get all possible website indices from the original matrix bounds
    const maxWebIdx = matrix.reduce((max, e) => Math.max(max, e.websiteIndex), -1);

    const unmatchedFigmaIdx = [...allFigmaIdx].filter((i) => !matchedFigma.has(i));
    const unmatchedWebsiteIdx: number[] = [];
    for (let i = 0; i <= maxWebIdx; i++) {
      if (!matchedWebsite.has(i)) unmatchedWebsiteIdx.push(i);
    }

    return {pairs, unmatchedFigmaIdx, unmatchedWebsiteIdx};
  }

  private computeSummary(
    pairs: MatchPair[],
    unmatchedFigma: FigmaTextNode[],
    unmatchedWebsite: WebsiteTextNode[],
    totalFigma: number,
  ): ComparisonSummary {
    const exactMatches = pairs.filter((p) => p.similarity === 1.0).length;
    const closeMatches = pairs.filter((p) => p.similarity < 1.0).length;
    const total = Math.max(totalFigma, 1);
    const overallMatchPercentage = Math.round((exactMatches / total) * 100);

    return {
      totalFigma,
      totalWebsite: pairs.length + unmatchedWebsite.length,
      exactMatches,
      closeMatches,
      missingFromWebsite: unmatchedFigma.length,
      extraOnWebsite: unmatchedWebsite.length,
      overallMatchPercentage,
    };
  }
}
