import {Component, output, signal} from '@angular/core';
import {FigmaTextNode} from '../../core/models/figma.models';
import {TabSwitcherComponent} from '../../shared/components/tab-switcher.component';
import {FigmaApiInputComponent} from './figma-api-input.component';
import {FigmaPasteInputComponent} from './figma-paste-input.component';

@Component({
  selector: 'app-figma-panel',
  imports: [TabSwitcherComponent, FigmaApiInputComponent, FigmaPasteInputComponent],
  template: `
    <div class="bg-surface rounded-xl p-4 h-full flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold text-text uppercase tracking-wider">Figma Source</h2>
        <app-tab-switcher [(activeTab)]="activeTab">
          <span tabA>API</span>
          <span tabB>Paste</span>
        </app-tab-switcher>
      </div>

      @if (activeTab() === 'a') {
        <app-figma-api-input (extracted)="onExtracted($event)" />
      } @else {
        <app-figma-paste-input (extracted)="onExtracted($event)" />
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
export class FigmaPanelComponent {
  textExtracted = output<FigmaTextNode[]>();

  activeTab = signal<'a' | 'b'>('a');
  nodeCount = signal(0);

  onExtracted(nodes: FigmaTextNode[]): void {
    this.nodeCount.set(nodes.length);
    this.textExtracted.emit(nodes);
  }
}
