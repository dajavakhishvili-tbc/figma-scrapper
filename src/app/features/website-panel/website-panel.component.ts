import {Component, output, signal} from '@angular/core';
import {WebsiteTextNode} from '../../core/models/website.models';
import {TabSwitcherComponent} from '../../shared/components/tab-switcher.component';
import {BookmarkletInputComponent} from './bookmarklet-input.component';
import {WebsitePasteInputComponent} from './website-paste-input.component';

@Component({
  selector: 'app-website-panel',
  imports: [TabSwitcherComponent, BookmarkletInputComponent, WebsitePasteInputComponent],
  template: `
    <div class="bg-surface rounded-xl p-4 h-full flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold text-text uppercase tracking-wider">Website Source</h2>
        <app-tab-switcher [(activeTab)]="activeTab">
          <span tabA>Bookmarklet</span>
          <span tabB>Paste</span>
        </app-tab-switcher>
      </div>

      @if (activeTab() === 'a') {
        <app-bookmarklet-input (extracted)="onExtracted($event)" />
      } @else {
        <app-website-paste-input (extracted)="onExtracted($event)" />
      }

      @if (nodeCount() > 0) {
        <div class="mt-4 pt-3 border-t border-border">
          <p class="text-xs text-text-muted">
            Extracted <span class="text-match-exact font-semibold">{{ nodeCount() }}</span> text nodes
          </p>
        </div>
      }
    </div>
  `,
})
export class WebsitePanelComponent {
  textExtracted = output<WebsiteTextNode[]>();

  activeTab = signal<'a' | 'b'>('b');
  nodeCount = signal(0);

  onExtracted(nodes: WebsiteTextNode[]): void {
    this.nodeCount.set(nodes.length);
    this.textExtracted.emit(nodes);
  }
}
