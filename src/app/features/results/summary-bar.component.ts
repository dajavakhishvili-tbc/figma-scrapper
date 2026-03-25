import {Component, input} from '@angular/core';
import {ComparisonSummary} from '../../core/models/matching.models';

@Component({
  selector: 'app-summary-bar',
  template: `
    <div class="flex flex-wrap gap-3 items-center">
      <div class="flex items-center gap-1.5 bg-base px-3 py-1.5 rounded-lg">
        <span class="w-2 h-2 rounded-full bg-match-exact"></span>
        <span class="text-sm text-text">{{ summary().exactMatches }} exact</span>
      </div>
      <div class="flex items-center gap-1.5 bg-base px-3 py-1.5 rounded-lg">
        <span class="w-2 h-2 rounded-full bg-match-close"></span>
        <span class="text-sm text-text">{{ summary().closeMatches }} close</span>
      </div>
      <div class="flex items-center gap-1.5 bg-base px-3 py-1.5 rounded-lg">
        <span class="w-2 h-2 rounded-full bg-match-missing"></span>
        <span class="text-sm text-text">{{ summary().missingFromWebsite }} missing</span>
      </div>
      <div class="flex items-center gap-1.5 bg-base px-3 py-1.5 rounded-lg">
        <span class="w-2 h-2 rounded-full bg-match-extra"></span>
        <span class="text-sm text-text">{{ summary().extraOnWebsite }} extra</span>
      </div>
      <div class="ml-auto bg-base px-4 py-1.5 rounded-lg">
        <span class="text-lg font-bold" [class]="percentageClass()">
          {{ summary().overallMatchPercentage }}%
        </span>
        <span class="text-xs text-text-muted ml-1">match</span>
      </div>
    </div>
  `,
})
export class SummaryBarComponent {
  summary = input.required<ComparisonSummary>();

  percentageClass() {
    const pct = this.summary().overallMatchPercentage;
    if (pct >= 90) return 'text-match-exact';
    if (pct >= 60) return 'text-match-close';
    return 'text-match-missing';
  }
}
