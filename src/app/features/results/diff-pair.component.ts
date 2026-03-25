import {Component, input, output} from '@angular/core';
import {MatchPair} from '../../core/models/matching.models';
import {HighlightDiffPipe} from '../../shared/pipes/highlight-diff.pipe';

@Component({
  selector: 'app-diff-pair',
  imports: [HighlightDiffPipe],
  template: `
    <div
      class="bg-surface-hover rounded-lg p-4 border border-border"
      [class.opacity-40]="pair().isIgnored">

      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span
            class="text-xs font-mono font-semibold px-2 py-0.5 rounded"
            [class]="badgeClass()">
            {{ Math.round(pair().similarity * 100) }}%
          </span>
          <span class="text-xs text-text-dim">{{ pair().matchType }}</span>
        </div>
        <div class="flex gap-2">
          <button
            (click)="toggleIgnore.emit(pair())"
            class="text-xs text-text-dim hover:text-text transition-colors px-2 py-1 rounded hover:bg-base">
            {{ pair().isIgnored ? 'Unignore' : 'Ignore' }}
          </button>
        </div>
      </div>

      <!-- Diff content -->
      @if (pair().similarity === 1.0) {
        <div class="font-mono text-sm text-match-exact">
          {{ pair().figmaNode.rawText }}
        </div>
      } @else {
        <div class="space-y-2">
          <div class="flex gap-2 items-start">
            <span class="text-xs text-text-dim w-16 shrink-0 pt-0.5">Figma</span>
            <span class="font-mono text-sm break-all">{{ pair().figmaNode.rawText }}</span>
          </div>
          <div class="flex gap-2 items-start">
            <span class="text-xs text-text-dim w-16 shrink-0 pt-0.5">Website</span>
            <span class="font-mono text-sm break-all">{{ pair().websiteNode.rawText }}</span>
          </div>
          <div class="flex gap-2 items-start pt-1 border-t border-border/50">
            <span class="text-xs text-text-dim w-16 shrink-0 pt-0.5">Diff</span>
            <span class="font-mono text-sm break-all" [innerHTML]="pair().diffs | highlightDiff"></span>
          </div>
        </div>
      }

      @if (pair().figmaNode.layerName) {
        <div class="mt-2 text-xs text-text-dim">
          Layer: {{ pair().figmaNode.layerName }}
        </div>
      }
    </div>
  `,
})
export class DiffPairComponent {
  pair = input.required<MatchPair>();
  toggleIgnore = output<MatchPair>();

  protected readonly Math = Math;

  badgeClass(): string {
    const score = this.pair().similarity;
    if (score === 1.0) return 'bg-match-exact/20 text-match-exact';
    if (score >= 0.8) return 'bg-match-close/20 text-match-close';
    return 'bg-match-missing/20 text-match-missing';
  }
}
