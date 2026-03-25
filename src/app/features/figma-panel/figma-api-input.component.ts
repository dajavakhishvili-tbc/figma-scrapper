import {Component, inject, output, signal, resource, computed} from '@angular/core';
import {form, FormField, required} from '@angular/forms/signals';
import {FigmaApiService} from '../../core/services/figma-api.service';
import {FigmaTextNode} from '../../core/models/figma.models';

@Component({
  selector: 'app-figma-api-input',
  imports: [FormField],
  template: `
    <div class="space-y-3">
      <div>
        <label class="block text-sm text-text-muted mb-1">Figma Personal Access Token</label>
        <input
          type="password"
          [formField]="configForm.token"
          placeholder="figd_..."
          class="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent" />
      </div>

      <div>
        <label class="block text-sm text-text-muted mb-1">Figma Frame URL</label>
        <input
          [formField]="configForm.figmaUrl"
          placeholder="https://www.figma.com/design/FILE_KEY/Name?node-id=..."
          class="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent" />
        @if (urlError()) {
          <p class="text-match-missing text-xs mt-1">{{ urlError() }}</p>
        }
      </div>

      <button
        (click)="extract()"
        [disabled]="configForm().invalid() || figmaResource.isLoading()"
        class="w-full bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-base font-medium py-2 px-4 rounded-lg text-sm transition-colors">
        @if (figmaResource.isLoading()) {
          Extracting...
        } @else {
          Extract from Figma
        }
      </button>

      @if (figmaResource.error()) {
        <p class="text-match-missing text-xs">{{ figmaResource.error() }}</p>
      }
    </div>
  `,
})
export class FigmaApiInputComponent {
  private readonly figmaApi = inject(FigmaApiService);

  extracted = output<FigmaTextNode[]>();

  configModel = signal({
    token: this.figmaApi.getToken(),
    figmaUrl: '',
  });

  configForm = form(this.configModel, (s) => {
    required(s.token, {message: 'Token is required'});
    required(s.figmaUrl, {message: 'Figma URL is required'});
  });

  urlError = signal('');

  // Trigger signal for the resource
  private readonly fetchTrigger = signal<{token: string; fileKey: string; nodeId: string} | null>(null);

  figmaResource = resource({
    params: () => this.fetchTrigger(),
    loader: async ({params, abortSignal}) => {
      if (!params) return [] as FigmaTextNode[];
      const nodes = await this.figmaApi.fetchTextNodes(params, abortSignal);
      this.extracted.emit(nodes);
      return nodes;
    },
  });

  extract(): void {
    const {token, figmaUrl} = this.configModel();
    this.urlError.set('');

    const parsed = this.figmaApi.parseFigmaUrl(figmaUrl);
    if (!parsed) {
      this.urlError.set('Invalid Figma URL. Expected: https://www.figma.com/design/FILE_KEY/Name?node-id=...');
      return;
    }

    this.figmaApi.saveToken(token);
    this.fetchTrigger.set({token, fileKey: parsed.fileKey, nodeId: parsed.nodeId});
  }
}
