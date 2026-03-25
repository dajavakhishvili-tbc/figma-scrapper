import {Component, signal} from '@angular/core';
import {FigmaTextNode} from './core/models/figma.models';
import {WebsiteTextNode} from './core/models/website.models';
import {FigmaPanelComponent} from './features/figma-panel/figma-panel.component';
import {WebsitePanelComponent} from './features/website-panel/website-panel.component';
import {ResultsComponent} from './features/results/results.component';

@Component({
  selector: 'app-root',
  imports: [FigmaPanelComponent, WebsitePanelComponent, ResultsComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  figmaNodes = signal<FigmaTextNode[]>([]);
  websiteNodes = signal<WebsiteTextNode[]>([]);
  compareTrigger = signal(0);

  onFigmaExtracted(nodes: FigmaTextNode[]): void {
    this.figmaNodes.set(nodes);
  }

  onWebsiteExtracted(nodes: WebsiteTextNode[]): void {
    this.websiteNodes.set(nodes);
  }

  compare(): void {
    this.compareTrigger.update((v) => v + 1);
  }

  get canCompare(): boolean {
    return this.figmaNodes().length > 0 && this.websiteNodes().length > 0;
  }
}
