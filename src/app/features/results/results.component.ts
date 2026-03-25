import {Component, computed, inject, input, signal} from '@angular/core';
import {FigmaTextNode} from '../../core/models/figma.models';
import {WebsiteTextNode} from '../../core/models/website.models';
import {FilterMode, MatchPair, MatchResult, SortMode} from '../../core/models/matching.models';
import {TextMatcherService} from '../../core/services/text-matcher.service';
import {ExportService} from '../../core/services/export.service';
import {SummaryBarComponent} from './summary-bar.component';
import {DiffPairComponent} from './diff-pair.component';
import {UnmatchedListComponent} from './unmatched-list.component';
import {ResultFiltersComponent} from './result-filters.component';

@Component({
  selector: 'app-results',
  imports: [SummaryBarComponent, DiffPairComponent, UnmatchedListComponent, ResultFiltersComponent],
  template: `
    @if (matchResult(); as result) {
      <div class="space-y-4">
        <!-- Summary -->
        <app-summary-bar [summary]="result.summary" />

        <!-- Filters & Export -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <app-result-filters
            [(filterMode)]="filterMode"
            [(sortMode)]="sortMode"
            [(searchQuery)]="searchQuery" />

          <div class="flex gap-2">
            <button
              (click)="copyMarkdown()"
              class="bg-base hover:bg-surface-hover border border-border text-text text-xs px-3 py-1.5 rounded-lg transition-colors">
              {{ copyState() === 'copied' ? 'Copied!' : 'Copy Report' }}
            </button>
            <button
              (click)="downloadJson()"
              class="bg-base hover:bg-surface-hover border border-border text-text text-xs px-3 py-1.5 rounded-lg transition-colors">
              Export JSON
            </button>
          </div>
        </div>

        <!-- Matched pairs -->
        @if (showPairs()) {
          <div class="space-y-3">
            @for (pair of filteredPairs(); track $index) {
              <app-diff-pair [pair]="pair" (toggleIgnore)="toggleIgnore($event)" />
            }
          </div>
        }

        <!-- Unmatched -->
        @if (showUnmatched()) {
          <app-unmatched-list
            [figmaNodes]="filteredUnmatchedFigma()"
            [websiteNodes]="filteredUnmatchedWebsite()" />
        }

        @if (filteredPairs().length === 0 && !showUnmatched()) {
          <div class="text-center py-8 text-text-dim text-sm">
            No results match the current filter.
          </div>
        }
      </div>
    }
  `,
})
export class ResultsComponent {
  private readonly matcher = inject(TextMatcherService);
  private readonly exportService = inject(ExportService);

  figmaNodes = input<FigmaTextNode[]>([]);
  websiteNodes = input<WebsiteTextNode[]>([]);
  trigger = input(0);

  filterMode = signal<FilterMode>('all');
  sortMode = signal<SortMode>('position');
  searchQuery = signal('');
  copyState = signal<'idle' | 'copied'>('idle');

  matchResult = computed<MatchResult | null>(() => {
    // Re-run when trigger changes
    this.trigger();
    const figma = this.figmaNodes();
    const website = this.websiteNodes();
    if (figma.length === 0 || website.length === 0) return null;
    return this.matcher.compare(figma, website);
  });

  filteredPairs = computed(() => {
    const result = this.matchResult();
    if (!result) return [];

    let pairs = [...result.matchedPairs];
    const filter = this.filterMode();
    const query = this.searchQuery().toLowerCase();

    // Filter
    switch (filter) {
      case 'exact':
        pairs = pairs.filter((p) => p.similarity === 1.0);
        break;
      case 'mismatches':
        pairs = pairs.filter((p) => p.similarity < 1.0);
        break;
      case 'missing':
      case 'extra':
        return [];
    }

    // Search
    if (query) {
      pairs = pairs.filter(
        (p) =>
          p.figmaNode.rawText.toLowerCase().includes(query) ||
          p.websiteNode.rawText.toLowerCase().includes(query),
      );
    }

    // Sort
    return this.sortPairs(pairs);
  });

  filteredUnmatchedFigma = computed(() => {
    const result = this.matchResult();
    if (!result) return [];
    const filter = this.filterMode();
    if (filter === 'exact' || filter === 'mismatches') return [];

    const query = this.searchQuery().toLowerCase();
    let nodes = result.unmatchedFigma;
    if (filter === 'extra') return [];
    if (query) nodes = nodes.filter((n) => n.rawText.toLowerCase().includes(query));
    return nodes;
  });

  filteredUnmatchedWebsite = computed(() => {
    const result = this.matchResult();
    if (!result) return [];
    const filter = this.filterMode();
    if (filter === 'exact' || filter === 'mismatches') return [];

    const query = this.searchQuery().toLowerCase();
    let nodes = result.unmatchedWebsite;
    if (filter === 'missing') return [];
    if (query) nodes = nodes.filter((n) => n.rawText.toLowerCase().includes(query));
    return nodes;
  });

  showPairs = computed(() => {
    const filter = this.filterMode();
    return filter !== 'missing' && filter !== 'extra';
  });

  showUnmatched = computed(() => {
    const filter = this.filterMode();
    return (
      (filter === 'all' || filter === 'missing' || filter === 'extra') &&
      (this.filteredUnmatchedFigma().length > 0 || this.filteredUnmatchedWebsite().length > 0)
    );
  });

  toggleIgnore(pair: MatchPair): void {
    pair.isIgnored = !pair.isIgnored;
  }

  async copyMarkdown(): Promise<void> {
    const result = this.matchResult();
    if (!result) return;
    const md = this.exportService.toMarkdown(result);
    await this.exportService.copyToClipboard(md);
    this.copyState.set('copied');
    setTimeout(() => this.copyState.set('idle'), 2000);
  }

  downloadJson(): void {
    const result = this.matchResult();
    if (!result) return;
    const json = this.exportService.toJson(result);
    const blob = new Blob([json], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'figma-text-diff-report.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  private sortPairs(pairs: MatchPair[]): MatchPair[] {
    const mode = this.sortMode();
    switch (mode) {
      case 'similarity':
        return pairs.sort((a, b) => a.similarity - b.similarity);
      case 'alphabetical':
        return pairs.sort((a, b) => a.figmaNode.rawText.localeCompare(b.figmaNode.rawText));
      case 'position':
      default:
        return pairs;
    }
  }
}
