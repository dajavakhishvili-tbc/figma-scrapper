import {FigmaTextNode} from './figma.models';
import {WebsiteTextNode} from './website.models';

export interface SimilarityEntry {
  readonly figmaIndex: number;
  readonly websiteIndex: number;
  readonly score: number;
  readonly matchType: MatchType;
}

export type MatchType = 'exact' | 'normalized-exact' | 'fuzzy';

export interface MatchPair {
  readonly figmaNode: FigmaTextNode;
  readonly websiteNode: WebsiteTextNode;
  readonly similarity: number;
  readonly matchType: MatchType;
  readonly diffs: DiffSegment[];
  isIgnored: boolean;
}

export interface DiffSegment {
  readonly type: 'equal' | 'insert' | 'delete';
  readonly text: string;
}

export interface MatchResult {
  readonly matchedPairs: MatchPair[];
  readonly unmatchedFigma: FigmaTextNode[];
  readonly unmatchedWebsite: WebsiteTextNode[];
  readonly summary: ComparisonSummary;
}

export interface ComparisonSummary {
  readonly totalFigma: number;
  readonly totalWebsite: number;
  readonly exactMatches: number;
  readonly closeMatches: number;
  readonly missingFromWebsite: number;
  readonly extraOnWebsite: number;
  readonly overallMatchPercentage: number;
}

export type FilterMode = 'all' | 'mismatches' | 'missing' | 'extra' | 'exact';
export type SortMode = 'position' | 'similarity' | 'alphabetical';

export interface MatchOptions {
  readonly threshold?: number;
  readonly shortStringThreshold?: number;
  readonly tryJoinAdjacent?: boolean;
}
