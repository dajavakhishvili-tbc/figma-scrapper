import {Component, model} from '@angular/core';
import {FilterMode, SortMode} from '../../core/models/matching.models';

@Component({
  selector: 'app-result-filters',
  template: `
    <div class="flex flex-wrap items-center gap-3">
      <!-- Filter buttons -->
      <div class="flex gap-1 bg-base rounded-lg p-1">
        @for (f of filters; track f.value) {
          <button
            class="px-3 py-1 rounded-md text-xs font-medium transition-colors"
            [class]="filterMode() === f.value ? 'bg-surface text-text' : 'text-text-muted hover:text-text'"
            (click)="filterMode.set(f.value)">
            {{ f.label }}
          </button>
        }
      </div>

      <!-- Sort -->
      <select
        class="bg-base border border-border rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
        [value]="sortMode()"
        (change)="sortMode.set($any($event.target).value)">
        <option value="position">Sort: Position</option>
        <option value="similarity">Sort: Similarity</option>
        <option value="alphabetical">Sort: A-Z</option>
      </select>

      <!-- Search -->
      <input
        type="text"
        [value]="searchQuery()"
        (input)="searchQuery.set($any($event.target).value)"
        placeholder="Search results..."
        class="bg-base border border-border rounded-lg px-3 py-1.5 text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-accent w-48" />
    </div>
  `,
})
export class ResultFiltersComponent {
  filterMode = model<FilterMode>('all');
  sortMode = model<SortMode>('position');
  searchQuery = model('');

  readonly filters: Array<{value: FilterMode; label: string}> = [
    {value: 'all', label: 'All'},
    {value: 'mismatches', label: 'Mismatches'},
    {value: 'missing', label: 'Missing'},
    {value: 'extra', label: 'Extra'},
    {value: 'exact', label: 'Exact'},
  ];
}
