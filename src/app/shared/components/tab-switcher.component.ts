import {Component, model} from '@angular/core';

@Component({
  selector: 'app-tab-switcher',
  template: `
    <div class="flex gap-1 bg-base rounded-lg p-1">
      <button
        class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
        [class]="activeTab() === 'a' ? 'bg-surface text-text' : 'text-text-muted hover:text-text'"
        (click)="activeTab.set('a')">
        <ng-content select="[tabA]" />
      </button>
      <button
        class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
        [class]="activeTab() === 'b' ? 'bg-surface text-text' : 'text-text-muted hover:text-text'"
        (click)="activeTab.set('b')">
        <ng-content select="[tabB]" />
      </button>
    </div>
  `,
})
export class TabSwitcherComponent {
  activeTab = model<'a' | 'b'>('a');
}
