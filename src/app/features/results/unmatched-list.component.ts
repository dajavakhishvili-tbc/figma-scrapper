import {Component, input} from '@angular/core';
import {FigmaTextNode} from '../../core/models/figma.models';
import {WebsiteTextNode} from '../../core/models/website.models';

@Component({
  selector: 'app-unmatched-list',
  template: `
    @if (figmaNodes().length > 0) {
      <div class="space-y-2">
        <h3 class="text-sm font-semibold text-match-missing flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-match-missing"></span>
          Missing from Website ({{ figmaNodes().length }})
        </h3>
        @for (node of figmaNodes(); track node.id) {
          <div class="bg-surface-hover rounded-lg p-3 border border-match-missing/20">
            <p class="font-mono text-sm text-text">{{ node.rawText }}</p>
            @if (node.layerName) {
              <p class="text-xs text-text-dim mt-1">Layer: {{ node.layerName }}</p>
            }
          </div>
        }
      </div>
    }

    @if (websiteNodes().length > 0) {
      <div class="space-y-2" [class.mt-6]="figmaNodes().length > 0">
        <h3 class="text-sm font-semibold text-match-extra flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-match-extra"></span>
          Extra on Website ({{ websiteNodes().length }})
        </h3>
        @for (node of websiteNodes(); track node.id) {
          <div class="bg-surface-hover rounded-lg p-3 border border-match-extra/20">
            <p class="font-mono text-sm text-text">{{ node.rawText }}</p>
            @if (node.tagName && node.tagName !== 'TEXT') {
              <p class="text-xs text-text-dim mt-1">&lt;{{ node.tagName.toLowerCase() }}&gt;</p>
            }
          </div>
        }
      </div>
    }
  `,
})
export class UnmatchedListComponent {
  figmaNodes = input<FigmaTextNode[]>([]);
  websiteNodes = input<WebsiteTextNode[]>([]);
}
