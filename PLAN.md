# PLAN.md — Figma vs Website Text Comparison Tool

## 1. Project Structure

```
figma-text-diff/
├── src/
│   ├── app/
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   ├── app.component.scss
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   │
│   │   ├── core/
│   │   │   ├── models/
│   │   │   │   ├── figma.models.ts          # Figma API response types, FigmaTextNode
│   │   │   │   ├── website.models.ts        # WebsiteTextNode
│   │   │   │   ├── matching.models.ts       # MatchResult, MatchPair, DiffResult, SimilarityEntry
│   │   │   │   └── app-state.models.ts      # AppState, ComparisonSummary, FilterMode, SortMode
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── figma-api.service.ts     # Figma REST API calls, token management
│   │   │   │   ├── text-extractor.service.ts # Parse pasted text, normalize, clean
│   │   │   │   ├── text-matcher.service.ts  # Core fuzzy matching engine (pure functions)
│   │   │   │   ├── diff.service.ts          # Character-level diff computation
│   │   │   │   ├── bookmarklet.service.ts   # Generate bookmarklet JS, handle postMessage
│   │   │   │   ├── export.service.ts        # Markdown/JSON report generation
│   │   │   │   └── theme.service.ts         # Dark/light theme toggle, localStorage persistence
│   │   │   │
│   │   │   └── utils/
│   │   │       ├── string-normalize.ts      # Unicode normalization, whitespace collapsing
│   │   │       └── levenshtein.ts           # Levenshtein distance + similarity ratio
│   │   │
│   │   ├── features/
│   │   │   ├── figma-panel/
│   │   │   │   ├── figma-panel.component.ts       # Left panel container
│   │   │   │   ├── figma-panel.component.html
│   │   │   │   ├── figma-panel.component.scss
│   │   │   │   ├── figma-api-input.component.ts   # Token + URL input form
│   │   │   │   ├── figma-paste-input.component.ts # Manual paste textarea
│   │   │   │   └── text-node-list.component.ts    # Scrollable list of extracted text nodes
│   │   │   │
│   │   │   ├── website-panel/
│   │   │   │   ├── website-panel.component.ts     # Right panel container
│   │   │   │   ├── website-panel.component.html
│   │   │   │   ├── website-panel.component.scss
│   │   │   │   ├── bookmarklet-input.component.ts # Bookmarklet instructions + message listener
│   │   │   │   ├── website-paste-input.component.ts
│   │   │   │   └── text-node-list.component.ts    # Reused shared component (or separate)
│   │   │   │
│   │   │   └── results/
│   │   │       ├── results.component.ts           # Results view container
│   │   │       ├── results.component.html
│   │   │       ├── results.component.scss
│   │   │       ├── summary-bar.component.ts       # Match stats bar
│   │   │       ├── diff-pair.component.ts         # Single matched pair with inline diff
│   │   │       ├── unmatched-list.component.ts    # Missing/extra text sections
│   │   │       └── result-filters.component.ts    # Filter & sort controls
│   │   │
│   │   └── shared/
│   │       ├── components/
│   │       │   ├── theme-toggle.component.ts
│   │       │   ├── tab-switcher.component.ts      # Toggle between API/Paste modes
│   │       │   └── similarity-badge.component.ts  # "92% match" pill
│   │       └── pipes/
│   │           └── highlight-diff.pipe.ts         # Pipe to render inline diff HTML
│   │
│   ├── styles/
│   │   ├── styles.scss                # Global styles, Tailwind import, CSS variables
│   │   ├── _variables.scss            # Theme CSS custom properties (dark/light)
│   │   └── _typography.scss           # Monospace font setup for diff view
│   │
│   ├── index.html
│   └── main.ts
│
├── angular.json
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
└── PLAN.md
```

---

## 2. Data Flow Diagram

```
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│         FIGMA PANEL (Left)      │     │       WEBSITE PANEL (Right)     │
│                                 │     │                                 │
│  ┌───────────┐  ┌────────────┐  │     │  ┌─────────────┐ ┌──────────┐  │
│  │ Figma API │  │ Paste Text │  │     │  │ Bookmarklet │ │  Paste   │  │
│  │  Input    │  │  Textarea  │  │     │  │  Listener   │ │ Textarea │  │
│  └─────┬─────┘  └─────┬──────┘  │     │  └──────┬──────┘ └────┬─────┘  │
│        │               │         │     │         │              │        │
│        ▼               ▼         │     │         ▼              ▼        │
│  ┌──────────────────────────┐    │     │  ┌───────────────────────────┐  │
│  │  FigmaApiService         │    │     │  │  TextExtractorService     │  │
│  │  - fetchFileNodes()      │    │     │  │  - parseBookmarkletData() │  │
│  │  - extractTextNodes()    │    │     │  │  - parsePastedText()      │  │
│  └────────────┬─────────────┘    │     │  └─────────────┬─────────────┘  │
│               │                  │     │                │                │
│               ▼                  │     │                ▼                │
│  ┌──────────────────────────┐    │     │  ┌───────────────────────────┐  │
│  │  FigmaTextNode[]         │    │     │  │  WebsiteTextNode[]        │  │
│  │  (normalized, sorted     │    │     │  │  (normalized, cleaned)    │  │
│  │   by Y position)         │    │     │  │                           │  │
│  └────────────┬─────────────┘    │     │  └─────────────┬─────────────┘  │
└───────────────┼──────────────────┘     └────────────────┼────────────────┘
                │                                         │
                └──────────────┬──────────────────────────┘
                               ▼
                ┌──────────────────────────────┐
                │     TextMatcherService        │
                │                              │
                │  1. Build similarity matrix   │
                │  2. Greedy best-match pairing │
                │  3. Categorize results        │
                └──────────────┬───────────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │     DiffService              │
                │  - computeCharDiff() for     │
                │    each matched pair          │
                └──────────────┬───────────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │     MatchResult              │
                │  - matchedPairs[]            │
                │  - unmatchedFigma[]          │
                │  - unmatchedWebsite[]        │
                │  - summary stats             │
                └──────────────┬───────────────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │     RESULTS VIEW             │
                │  - Summary bar               │
                │  - Diff pair list            │
                │  - Unmatched sections        │
                │  - Filters & export          │
                └──────────────────────────────┘
```

---

## 3. Interface / Type Definitions

```ts
// ── figma.models.ts ──

/** Raw Figma API text node (subset of Figma REST API response) */
export interface FigmaApiTextNode {
  readonly id: string;
  readonly name: string;
  readonly type: 'TEXT';
  readonly characters: string;
  readonly style: {
    readonly fontSize: number;
    readonly fontWeight: number;
    readonly fontFamily: string;
  };
  readonly absoluteBoundingBox: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
}

/** Normalized text node for matching */
export interface FigmaTextNode {
  readonly id: string;
  readonly layerName: string;
  readonly rawText: string;
  readonly normalizedText: string;
  readonly fontSize: number;
  readonly fontWeight: number;
  readonly y: number;          // for vertical sort ordering
  readonly x: number;
}

/** Figma API connection config */
export interface FigmaConfig {
  readonly token: string;
  readonly fileKey: string;
  readonly nodeId: string;
}


// ── website.models.ts ──

/** Extracted website text node */
export interface WebsiteTextNode {
  readonly id: string;          // generated UUID
  readonly rawText: string;
  readonly normalizedText: string;
  readonly tagName: string;     // e.g. 'H1', 'P', 'BUTTON'
  readonly selector: string;    // CSS selector path (from bookmarklet)
  readonly index: number;       // DOM order index
}

/** Data shape sent by the bookmarklet via postMessage */
export interface BookmarkletPayload {
  readonly source: 'figma-text-diff-bookmarklet';
  readonly version: 1;
  readonly url: string;
  readonly timestamp: number;
  readonly nodes: ReadonlyArray<{
    readonly text: string;
    readonly tagName: string;
    readonly selector: string;
    readonly rect: { x: number; y: number; width: number; height: number };
  }>;
}


// ── matching.models.ts ──

/** A single cell in the similarity matrix */
export interface SimilarityEntry {
  readonly figmaIndex: number;
  readonly websiteIndex: number;
  readonly score: number;         // 0.0 to 1.0
  readonly matchType: 'exact' | 'normalized-exact' | 'fuzzy';
}

/** A matched pair of text nodes */
export interface MatchPair {
  readonly figmaNode: FigmaTextNode;
  readonly websiteNode: WebsiteTextNode;
  readonly similarity: number;
  readonly matchType: 'exact' | 'normalized-exact' | 'fuzzy';
  readonly diffs: DiffSegment[];
  readonly isIgnored: boolean;
}

/** Character-level diff segment */
export interface DiffSegment {
  readonly type: 'equal' | 'insert' | 'delete';
  readonly text: string;
}

/** Full comparison result */
export interface MatchResult {
  readonly matchedPairs: MatchPair[];
  readonly unmatchedFigma: FigmaTextNode[];
  readonly unmatchedWebsite: WebsiteTextNode[];
  readonly summary: ComparisonSummary;
}


// ── app-state.models.ts ──

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

export type ExtractionMode = 'api' | 'paste';

export interface AppState {
  readonly figmaNodes: FigmaTextNode[];
  readonly websiteNodes: WebsiteTextNode[];
  readonly matchResult: MatchResult | null;
  readonly isComparing: boolean;
  readonly filterMode: FilterMode;
  readonly sortMode: SortMode;
  readonly similarityThreshold: number; // default 0.6
}
```

---

## 4. Component Responsibility, Inputs & Outputs

### App Shell — `AppComponent`
- **Role**: Root layout. Two-panel split + results view below.
- **State**: Holds top-level signals for `figmaNodes`, `websiteNodes`, `matchResult`.
- **Template**: Header with theme toggle, two-column panel area, results area.

### Figma Panel — `FigmaPanelComponent`
- **Role**: Container that toggles between API input and paste input.
- **Inputs**: None (root-level feature).
- **Outputs**: `textExtracted: OutputEmitterRef<FigmaTextNode[]>` — emits when text is extracted.
- **State**: `extractionMode: Signal<ExtractionMode>`, `isLoading: Signal<boolean>`.

### `FigmaApiInputComponent`
- **Role**: Token + Figma URL form. Calls `FigmaApiService`.
- **Inputs**: None.
- **Outputs**: `extracted: OutputEmitterRef<FigmaTextNode[]>`.
- **Form**: Signal form with fields: `token`, `figmaUrl`.
- **Behavior**: Parses file key + node ID from URL. Persists token to localStorage. Calls API via `resource()`.

### `FigmaPasteInputComponent`
- **Role**: Textarea for manual paste.
- **Inputs**: None.
- **Outputs**: `extracted: OutputEmitterRef<FigmaTextNode[]>`.
- **Behavior**: Splits text by newline, creates `FigmaTextNode[]` from lines.

### Website Panel — `WebsitePanelComponent`
- **Role**: Container toggling between bookmarklet and paste.
- **Inputs**: None.
- **Outputs**: `textExtracted: OutputEmitterRef<WebsiteTextNode[]>`.

### `BookmarkletInputComponent`
- **Role**: Shows bookmarklet drag-to-toolbar instructions. Listens for `postMessage`.
- **Inputs**: None.
- **Outputs**: `extracted: OutputEmitterRef<WebsiteTextNode[]>`.
- **Behavior**: Registers `window.addEventListener('message', ...)` in constructor. Validates `BookmarkletPayload`. Generates bookmarklet code via `BookmarkletService`.

### `WebsitePasteInputComponent`
- **Role**: Textarea for pasting website text.
- **Inputs**: None.
- **Outputs**: `extracted: OutputEmitterRef<WebsiteTextNode[]>`.

### `TextNodeListComponent` (shared between both panels)
- **Role**: Scrollable list showing extracted text nodes.
- **Inputs**: `nodes: InputSignal<(FigmaTextNode | WebsiteTextNode)[]>`, `label: InputSignal<string>`.
- **Outputs**: None.

### Results — `ResultsComponent`
- **Role**: Main results container. Orchestrates comparison and displays results.
- **Inputs**: `figmaNodes: InputSignal<FigmaTextNode[]>`, `websiteNodes: InputSignal<WebsiteTextNode[]>`.
- **State**: `matchResult: Signal<MatchResult | null>`, `filterMode`, `sortMode`.

### `SummaryBarComponent`
- **Inputs**: `summary: InputSignal<ComparisonSummary>`.
- **Role**: Displays stat pills (exact, close, missing, extra, overall %).

### `DiffPairComponent`
- **Inputs**: `pair: InputSignal<MatchPair>`.
- **Outputs**: `ignore: OutputEmitterRef<MatchPair>`, `unmatch: OutputEmitterRef<MatchPair>`.
- **Role**: Side-by-side diff view for a single matched pair. Uses `highlight-diff` pipe.

### `UnmatchedListComponent`
- **Inputs**: `figmaUnmatched: InputSignal<FigmaTextNode[]>`, `websiteUnmatched: InputSignal<WebsiteTextNode[]>`.
- **Outputs**: `manualPair: OutputEmitterRef<{ figma: FigmaTextNode; website: WebsiteTextNode }>`.
- **Role**: Shows missing/extra sections. Click-to-pair: select one from each list.

### `ResultFiltersComponent`
- **Inputs**: `currentFilter: InputSignal<FilterMode>`, `currentSort: InputSignal<SortMode>`.
- **Outputs**: `filterChange: OutputEmitterRef<FilterMode>`, `sortChange: OutputEmitterRef<SortMode>`, `searchChange: OutputEmitterRef<string>`.

---

## 5. Service Breakdown

### `FigmaApiService`

```ts
@Injectable({ providedIn: 'root' })
export class FigmaApiService {
  /** Persist token to localStorage */
  saveToken(token: string): void;

  /** Retrieve token from localStorage */
  getToken(): string | null;

  /** Clear stored token */
  clearToken(): void;

  /** Parse Figma URL into file key and node ID */
  parseFigmaUrl(url: string): FigmaConfig | null;

  /**
   * Fetch text nodes from a specific Figma frame.
   * GET /v1/files/:file_key/nodes?ids=:node_id
   * Returns normalized FigmaTextNode[] sorted by Y position.
   */
  fetchTextNodes(config: FigmaConfig, abortSignal?: AbortSignal): Promise<FigmaTextNode[]>;
}
```

### `TextExtractorService`

```ts
@Injectable({ providedIn: 'root' })
export class TextExtractorService {
  /** Parse pasted text into FigmaTextNode[] (one per line) */
  parsePastedAsFigma(text: string): FigmaTextNode[];

  /** Parse pasted text into WebsiteTextNode[] (one per line) */
  parsePastedAsWebsite(text: string): WebsiteTextNode[];

  /** Parse bookmarklet JSON payload into WebsiteTextNode[] */
  parseBookmarkletPayload(payload: BookmarkletPayload): WebsiteTextNode[];

  /** Normalize a string: trim, collapse whitespace, normalize unicode */
  normalizeText(text: string): string;
}
```

### `TextMatcherService` (Core — pure functions, heavily unit tested)

```ts
@Injectable({ providedIn: 'root' })
export class TextMatcherService {
  /**
   * Run the full matching pipeline.
   * Returns categorized results with diff details.
   */
  compare(
    figmaNodes: FigmaTextNode[],
    websiteNodes: WebsiteTextNode[],
    options?: MatchOptions
  ): MatchResult;

  /** Compute similarity between two strings (0.0 - 1.0) */
  computeSimilarity(a: string, b: string): SimilarityEntry['score'];

  /** Build the full similarity matrix */
  buildSimilarityMatrix(
    figma: FigmaTextNode[],
    website: WebsiteTextNode[]
  ): SimilarityEntry[];

  /** Greedy best-match pairing from the matrix */
  assignPairs(
    matrix: SimilarityEntry[],
    threshold: number
  ): { pairs: Array<[number, number, number]>; unmatchedFigma: number[]; unmatchedWebsite: number[] };
}

export interface MatchOptions {
  readonly threshold?: number;        // default 0.6
  readonly shortStringThreshold?: number; // default 0.85 for strings <= 3 chars
  readonly tryJoinAdjacent?: boolean; // default true — join adjacent short website texts
}
```

### `DiffService`

```ts
@Injectable({ providedIn: 'root' })
export class DiffService {
  /**
   * Compute character-level diff between two strings.
   * Uses diff-match-patch under the hood.
   */
  computeDiff(original: string, modified: string): DiffSegment[];
}
```

### `BookmarkletService`

```ts
@Injectable({ providedIn: 'root' })
export class BookmarkletService {
  /**
   * Generate the bookmarklet JavaScript code string.
   * The bookmarklet:
   *   1. Walks the DOM
   *   2. Extracts visible text with metadata
   *   3. Opens our app (or uses opener.postMessage) with the payload
   */
  generateBookmarkletCode(appUrl: string): string;

  /**
   * Validate an incoming postMessage as BookmarkletPayload.
   */
  validatePayload(data: unknown): BookmarkletPayload | null;
}
```

### `ExportService`

```ts
@Injectable({ providedIn: 'root' })
export class ExportService {
  /** Generate a markdown report of all mismatches */
  toMarkdown(result: MatchResult): string;

  /** Generate a JSON export */
  toJson(result: MatchResult): string;

  /** Copy text to clipboard */
  copyToClipboard(text: string): Promise<void>;
}
```

### `ThemeService`

```ts
@Injectable({ providedIn: 'root' })
export class ThemeService {
  /** Current theme signal */
  readonly theme: Signal<'dark' | 'light'>;

  /** Toggle theme, persist to localStorage */
  toggle(): void;

  /** Apply theme class to document.body */
  applyTheme(): void;
}
```

---

## 6. Matching Algorithm — Detailed Pseudocode

### Step 1: Normalize All Text

```
for each node in figmaNodes:
  node.normalizedText = normalize(node.rawText)
    → lowercase
    → trim leading/trailing whitespace
    → collapse multiple spaces/newlines to single space
    → normalize unicode (NFC)
    → strip zero-width characters

for each node in websiteNodes:
  (same normalization)
```

### Step 2: Build Similarity Matrix

```
matrix = []

for i in 0..figmaNodes.length:
  for j in 0..websiteNodes.length:
    a = figmaNodes[i].normalizedText
    b = websiteNodes[j].normalizedText

    if a === b:
      score = 1.0, type = 'exact'
    else if a.toLowerCase() === b.toLowerCase():
      score = 0.99, type = 'normalized-exact'
    else:
      levDist = levenshteinDistance(a, b)
      maxLen = max(a.length, b.length)
      score = maxLen === 0 ? 1.0 : 1 - (levDist / maxLen)
      type = 'fuzzy'

    matrix.push({ figmaIndex: i, websiteIndex: j, score, type })
```

**Complexity note**: For N figma nodes and M website nodes, this is O(N*M) similarity computations. Each Levenshtein is O(len_a * len_b). For typical usage (< 500 nodes per side), this completes in < 1 second. For larger sets, we can add early termination (skip pairs where length difference alone guarantees score < threshold).

### Step 3: Adjacent Text Joining (Pre-pass)

Before main matching, attempt to handle multi-line Figma text vs split DOM text:

```
for each figmaNode where rawText contains newline or length > 80:
  for each consecutive subsequence of websiteNodes (window size 2-5):
    joined = websiteNodes[j..j+k].map(n => n.normalizedText).join(' ')
    score = similarity(figmaNode.normalizedText, joined)
    if score > threshold:
      add synthetic entry to matrix with combined website indices
```

### Step 4: Greedy Best-Match Pairing

```
sort matrix by score DESC

matchedFigma = Set()
matchedWebsite = Set()
pairs = []

for entry in sorted matrix:
  if entry.figmaIndex in matchedFigma: continue
  if entry.websiteIndex in matchedWebsite: continue

  effectiveThreshold = threshold
  if figmaNodes[entry.figmaIndex].normalizedText.length <= 3:
    effectiveThreshold = shortStringThreshold  // 0.85 — stricter for short strings

  if entry.score >= effectiveThreshold:
    pairs.push(entry)
    matchedFigma.add(entry.figmaIndex)
    matchedWebsite.add(entry.websiteIndex)

unmatchedFigma = figmaNodes.indices NOT in matchedFigma
unmatchedWebsite = websiteNodes.indices NOT in matchedWebsite
```

### Step 5: Compute Diffs for Matched Pairs

```
for each pair in pairs:
  if pair.score < 1.0:
    pair.diffs = diffService.computeDiff(
      pair.figmaNode.rawText,
      pair.websiteNode.rawText
    )
  else:
    pair.diffs = [{ type: 'equal', text: pair.figmaNode.rawText }]
```

### Step 6: Compute Summary

```
summary = {
  totalFigma: figmaNodes.length,
  totalWebsite: websiteNodes.length,
  exactMatches: pairs.filter(p => p.score === 1.0).length,
  closeMatches: pairs.filter(p => p.score < 1.0).length,
  missingFromWebsite: unmatchedFigma.length,
  extraOnWebsite: unmatchedWebsite.length,
  overallMatchPercentage: (exactMatches / totalFigma) * 100
}
```

### Threshold Rationale

| Threshold | Value | Why |
|-----------|-------|-----|
| Default match threshold | 0.6 | Catches meaningful matches while excluding noise. "Subscribe to newsletter" vs "Subscribe to our newsletter" scores ~0.85. Below 0.6 tends to be false positives. |
| Short string threshold | 0.85 | Short strings like "OK" vs "Go" score 0.5 on Levenshtein but are completely different words. Higher threshold prevents false matches. |
| Normalized exact | 0.99 | Distinguishes "same text, different case" from truly identical text in reports. |

---

## 7. UI Wireframe Description

### Layout (Desktop-first)

```
┌──────────────────────────────────────────────────────────────────┐
│  HEADER BAR                                                      │
│  [Logo/Title: "Figma Text Diff"]           [Theme Toggle] [?]   │
├──────────────────────────────┬───────────────────────────────────┤
│                              │                                   │
│  FIGMA PANEL                 │  WEBSITE PANEL                    │
│                              │                                   │
│  ┌──────────────────────┐    │  ┌─────────────────────────┐      │
│  │ [API] [Paste] tabs   │    │  │ [Bookmarklet] [Paste]   │      │
│  └──────────────────────┘    │  └─────────────────────────┘      │
│                              │                                   │
│  (API mode):                 │  (Bookmarklet mode):              │
│  Token: [••••••••••]         │  Drag this to your bookmarks:     │
│  Figma URL: [_________]     │  ┌─────────────────────┐          │
│  [Extract Text]              │  │ 📋 Extract Text     │  ← link │
│                              │  └─────────────────────┘          │
│  (Paste mode):               │  Then click it on any website.    │
│  ┌──────────────────────┐    │  Status: Waiting for data...      │
│  │                      │    │                                   │
│  │  paste figma text    │    │  (Paste mode):                    │
│  │  here...             │    │  ┌─────────────────────────┐      │
│  │                      │    │  │ paste website text...   │      │
│  └──────────────────────┘    │  └─────────────────────────┘      │
│                              │                                   │
│  Extracted: 42 text nodes    │  Extracted: 38 text nodes         │
│  ┌──────────────────────┐    │  ┌─────────────────────────┐      │
│  │ "Welcome to..."      │    │  │ "Welcome to..."         │      │
│  │ "Sign up today"      │    │  │ "Sign up now"           │      │
│  │ "Learn more"         │    │  │ "Learn more"            │      │
│  │ ...                   │    │  │ ...                     │      │
│  └──────────────────────┘    │  └─────────────────────────┘      │
│                              │                                   │
├──────────────────────────────┴───────────────────────────────────┤
│                                                                  │
│  ═══════════════ [  Compare  ] ═══════════════                   │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  RESULTS                                                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ ✅ 30 exact  ⚠️ 5 close  ❌ 4 missing  ➕ 3 extra │ 73%  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [All] [Mismatches] [Missing] [Extra]    Sort: [Position ▼]     │
│  Search: [________________]              [Copy Report] [Export]  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 92% match                                      [Ignore]   │  │
│  │ Figma:   "Sign up today and get started"                   │  │
│  │ Website: "Sign up ██now██ and get started"                 │  │
│  │          ────────  today → now                             │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ 100% match                                                 │  │
│  │ Figma:   "Welcome to our platform"                         │  │
│  │ Website: "Welcome to our platform"                         │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ ❌ MISSING FROM WEBSITE                                    │  │
│  │ "Terms and conditions apply"                               │  │
│  │ "Limited time offer"                    [Pair with... ▼]   │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ ➕ EXTRA ON WEBSITE                                        │  │
│  │ "Cookie consent notice"                                    │  │
│  │ "Powered by Acme Inc"                   [Pair with... ▼]   │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Theme

- **Dark mode (default)**: `bg: #1e1e2e`, `surface: #2a2a3c`, `text: #cdd6f4`, accent colors for diffs
- **Light mode**: `bg: #ffffff`, `surface: #f5f5f5`, `text: #1e1e2e`
- Diff colors: `delete: #f38ba8 / rgba(243,139,168,0.2)`, `insert: #a6e3a1 / rgba(166,227,161,0.2)`
- Monospace font for diff view: `'JetBrains Mono', 'Fira Code', 'Consolas', monospace`

---

## 8. Edge Cases & Limitations

### Known Edge Cases

| Case | Handling Strategy |
|------|-------------------|
| **Very short strings** ("OK", "$", "x") | Higher similarity threshold (0.85). Only match if near-exact. |
| **Duplicate text** (multiple "Learn More") | Match in order of appearance (by DOM index / Y position). First unmatched Figma "Learn More" pairs with first unmatched website "Learn More". |
| **Multiline Figma text → split DOM nodes** | Adjacent joining pre-pass: try combining 2-5 consecutive website nodes and match against long Figma strings. |
| **Dynamic content** (dates, usernames, numbers) | User can mark any pair as "ignored". Ignored items excluded from stats. |
| **Unicode** (smart quotes, em dashes, etc.) | Normalize to ASCII equivalents before matching: `"` → `"`, `—` → `-`, `…` → `...` |
| **HTML entities in pasted text** | Decode `&amp;`, `&lt;`, `&nbsp;` etc. during extraction. |
| **Empty strings after normalization** | Filter out nodes with empty normalized text. |
| **Very large Figma files (1000+ text nodes)** | Show progress indicator. Consider Web Worker for matching computation. |

### Known Limitations

1. **Bookmarklet cannot access Shadow DOM** — text inside web components using Shadow DOM won't be extracted. Document this in the UI.
2. **Figma API rate limits** — Personal tokens are limited to ~30 req/min. Single frame extraction is 1 request, so this is fine for normal use.
3. **No visual position matching** — MVP matches on text content only, not spatial position. A "Header" in Figma won't preferentially match an `<h1>` based on position.
4. **No image text / OCR** — Only extracts text nodes, not text rendered in images.
5. **Bookmarklet won't capture text from iframes** (cross-origin restriction).
6. **SPA lazy-loaded content** — Bookmarklet captures what's currently in the DOM. User must scroll/load all content first.

---

## 9. Implementation Order

Build in this order to reach a working state fastest (vertical slice approach):

### Phase 1: Scaffold & Core Engine (no UI yet)
1. `ng new figma-text-diff --style=scss --ssr=false` + `ng add tailwindcss`
2. **Models** — All interfaces in `core/models/`
3. **`string-normalize.ts`** — Pure utility functions
4. **`levenshtein.ts`** — Levenshtein distance + similarity ratio
5. **`TextMatcherService`** — The core matching engine with full unit tests
6. **`DiffService`** — Wrapper around `diff-match-patch`
7. **`TextExtractorService`** — Text parsing and normalization

### Phase 2: Minimal UI (paste-only, end-to-end flow)
8. **`ThemeService`** + global styles + CSS variables (dark theme)
9. **`AppComponent`** — Two-panel layout shell
10. **`FigmaPasteInputComponent`** — Textarea input
11. **`WebsitePasteInputComponent`** — Textarea input
12. **`ResultsComponent`** + **`SummaryBarComponent`** — Show match stats
13. **`DiffPairComponent`** + **`highlight-diff.pipe.ts`** — Inline diff rendering
14. **`UnmatchedListComponent`** — Missing/extra sections
15. **Wire it all together** — Compare button triggers matching, results display

> **Milestone**: At this point, paste text on both sides, hit Compare, see diffs. Fully functional for manual paste flow.

### Phase 3: Figma API Integration
16. **`FigmaApiService`** — API calls, URL parsing, token management
17. **`FigmaApiInputComponent`** — Token + URL form with `resource()` for API calls
18. **`FigmaPanelComponent`** — Tab switcher between API and Paste
19. **`TextNodeListComponent`** — Scrollable extracted nodes preview

### Phase 4: Bookmarklet
20. **`BookmarkletService`** — Generate bookmarklet code
21. **`BookmarkletInputComponent`** — Instructions + postMessage listener
22. **`WebsitePanelComponent`** — Tab switcher between Bookmarklet and Paste

### Phase 5: Polish & Features
23. **`ResultFiltersComponent`** — Filter/sort/search controls
24. **Manual pairing** — Click-to-pair from unmatched lists
25. **Ignore functionality** — Mark pairs as ignored
26. **`ExportService`** + export buttons
27. **`ThemeToggleComponent`** — Light/dark switch in header
28. **Similarity threshold slider** — Let user adjust threshold and re-compare
29. **Responsive polish** — Ensure panels stack on smaller screens

### Phase 6: Testing & Hardening
30. **Unit tests for `TextMatcherService`** — Cover all edge cases from Section 8
31. **Unit tests for `DiffService`**
32. **Unit tests for `FigmaApiService`** (URL parsing, response transformation)
33. **Component tests** for key interactions (compare flow, filter changes)
34. **`ng build`** — Verify production build succeeds

---

## 10. Testing Strategy

### Unit Test Priority (Vitest)

#### Tier 1 — Critical (must have)

**`TextMatcherService`** — The brain of the app:
```
- exact match: "Hello World" ↔ "Hello World" → score 1.0
- normalized match: "Hello World" ↔ "hello world" → score 0.99
- fuzzy match: "Sign up today" ↔ "Sign up now" → score ~0.73
- short string strict: "OK" ↔ "Go" → below threshold, no match
- duplicate handling: 3× "Learn More" ↔ 3× "Learn More" → 3 exact pairs
- unmatched figma: ["A", "B", "C"] ↔ ["A", "B"] → "C" unmatched
- unmatched website: ["A"] ↔ ["A", "B"] → "B" extra
- adjacent joining: "Long multi\nline text" ↔ ["Long multi", "line text"] → match
- empty inputs: [] ↔ [] → empty result
- threshold boundary: score exactly at 0.6 → included; 0.59 → excluded
- large input performance: 200×200 matrix completes in < 2 seconds
```

**`levenshtein.ts`**:
```
- identical strings → distance 0
- single char diff → distance 1
- completely different → distance = max length
- empty string vs non-empty → distance = non-empty length
- unicode characters handled correctly
```

**`string-normalize.ts`**:
```
- collapses multiple spaces: "a  b   c" → "a b c"
- trims: "  hello  " → "hello"
- normalizes smart quotes: "\u201CHello\u201D" → "\"Hello\""
- strips zero-width chars
- normalizes unicode NFC
```

#### Tier 2 — Important

**`DiffService`**:
```
- identical strings → single 'equal' segment
- insertion: "abc" → "abXc" → [equal "ab", insert "X", equal "c"]
- deletion: "abXc" → "abc" → [equal "ab", delete "X", equal "c"]
- replacement: "cat" → "car" → [equal "ca", delete "t", insert "r"]
```

**`FigmaApiService`** (URL parsing only — don't test actual HTTP):
```
- full URL: "https://www.figma.com/design/ABC123/Name?node-id=1-2" → { fileKey: "ABC123", nodeId: "1-2" }
- URL with encoded node-id: "node-id=1%3A2" → nodeId: "1:2"
- invalid URL → null
- file-only URL (no node-id) → parse file key, nodeId empty
```

**`TextExtractorService`**:
```
- paste splitting: "line1\nline2\n\nline3" → 3 nodes (empty lines filtered)
- bookmarklet payload validation: valid payload → WebsiteTextNode[]
- bookmarklet invalid payload → null
```

#### Tier 3 — Nice to have

**`ExportService`**:
```
- markdown output includes all mismatches
- JSON output is valid JSON and round-trips
```

**Component tests** (TestBed):
```
- DiffPairComponent renders diff segments with correct CSS classes
- SummaryBarComponent displays correct counts
- ResultFiltersComponent emits correct filter/sort values
```

### Test File Naming Convention

```
src/app/core/services/text-matcher.service.spec.ts
src/app/core/utils/levenshtein.spec.ts
src/app/core/utils/string-normalize.spec.ts
```

### Running Tests

```bash
ng test                    # Run all unit tests via Vitest
ng test --watch            # Watch mode during development
ng test --coverage         # Coverage report
```

---

## 11. Bookmarklet Technical Design

The bookmarklet is a critical piece — here's the detailed design:

### Generated Bookmarklet Code (minified, URI-encoded)

```javascript
javascript:void(function(){
  const SELECTOR = 'h1,h2,h3,h4,h5,h6,p,span,a,button,label,li,td,th,caption,figcaption,blockquote,dt,dd,legend,summary,option';
  const HIDDEN_TAGS = new Set(['SCRIPT','STYLE','NOSCRIPT','TEMPLATE','SVG']);

  function isVisible(el) {
    if (HIDDEN_TAGS.has(el.tagName)) return false;
    const style = getComputedStyle(el);
    return style.display !== 'none'
        && style.visibility !== 'hidden'
        && style.opacity !== '0';
  }

  function getSelector(el) {
    const parts = [];
    while (el && el !== document.body) {
      let s = el.tagName.toLowerCase();
      if (el.id) { s += '#' + el.id; parts.unshift(s); break; }
      if (el.className && typeof el.className === 'string') {
        s += '.' + el.className.trim().split(/\s+/).join('.');
      }
      parts.unshift(s);
      el = el.parentElement;
    }
    return parts.join(' > ');
  }

  const nodes = [];
  document.querySelectorAll(SELECTOR).forEach((el, i) => {
    if (!isVisible(el)) return;
    // Get direct text content (not children's text)
    const text = Array.from(el.childNodes)
      .filter(n => n.nodeType === Node.TEXT_NODE)
      .map(n => n.textContent.trim())
      .filter(Boolean)
      .join(' ');
    if (!text) return;
    const rect = el.getBoundingClientRect();
    nodes.push({
      text,
      tagName: el.tagName,
      selector: getSelector(el),
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
    });
  });

  const payload = {
    source: 'figma-text-diff-bookmarklet',
    version: 1,
    url: location.href,
    timestamp: Date.now(),
    nodes
  };

  // Strategy: open the app and post message
  const appUrl = '%APP_URL%';
  const w = window.open(appUrl);
  setTimeout(() => w.postMessage(payload, '*'), 2000);
})();
```

### Communication Flow

1. User is on our app → clicks link to "open target website" (or navigates manually)
2. User clicks bookmarklet on the target website
3. Bookmarklet opens our app in a new tab/window and posts the payload via `postMessage`
4. Our app's `BookmarkletInputComponent` listens for the message, validates, and extracts nodes

**Alternative flow** (if app is already open):
1. Bookmarklet stores payload in `localStorage` under a known key
2. Our app polls `localStorage` or uses `storage` event listener
3. This handles the case where the user already has the app open

---

## 12. Dependencies

```json
{
  "dependencies": {
    "diff-match-patch": "^1.0.5"
  },
  "devDependencies": {
    "@types/diff-match-patch": "^1.0.36"
  }
}
```

**No `fast-levenshtein` needed** — we implement our own Levenshtein in `levenshtein.ts` (~20 lines). One fewer dependency, and we can optimize for our specific use case (early termination when score drops below threshold).

---

## 13. Performance Considerations

| Scenario | Approach |
|----------|----------|
| 100×100 text nodes (10,000 comparisons) | Runs synchronously in < 100ms. No optimization needed. |
| 500×500 (250,000 comparisons) | May take 1-3 seconds. Show spinner. Consider early termination in Levenshtein when distance exceeds threshold. |
| 1000+ nodes per side | Move matching to a Web Worker to avoid blocking UI. (Phase 5 enhancement, not MVP.) |
| Long strings (500+ chars each) | Levenshtein is O(n*m). For very long strings, use a length-ratio pre-filter: if `min/max < 0.5`, skip the comparison (can't possibly reach 0.6 threshold). |

---

## Summary of Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Styling | Tailwind CSS v4 | First-class Angular support via `ng add`, rapid utility-class development |
| State management | Angular Signals | Built-in, no extra deps, perfect for this scope |
| Forms | Signal Forms | Angular 21 best practice for new apps |
| HTTP for Figma API | `resource()` with `fetch` | Reactive, handles abort/reload natively |
| Diff library | `diff-match-patch` | Battle-tested, small footprint, character-level diffs |
| Levenshtein | Custom implementation | Avoid dependency for ~20 lines of code, enables early termination optimization |
| Website extraction | Bookmarklet + Paste | No CORS issues, works on SPAs, works on auth-protected pages |
| Testing | Vitest | Angular 21 default, fast, modern |
| Theme default | Dark mode | Developer tool convention |
| i18n | English only | Per requirements |
| Figma scope | Specific frame/node | Per requirements, avoids huge file downloads |
