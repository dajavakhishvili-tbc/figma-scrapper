import {Component, inject, output, signal} from '@angular/core';
import {TextExtractorService} from '../../core/services/text-extractor.service';
import {FigmaTextNode} from '../../core/models/figma.models';

@Component({
  selector: 'app-figma-paste-input',
  template: `
    <div class="space-y-3">
      <label class="block text-sm text-text-muted">Paste Figma text (one item per line)</label>
      <textarea
        [value]="rawText()"
        (input)="rawText.set($any($event.target).value)"
        rows="8"
        placeholder="Welcome to our platform&#10;Sign up today&#10;Learn more..."
        class="w-full bg-base border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent resize-y font-mono">
      </textarea>
      <button
        (click)="extract()"
        [disabled]="!rawText().trim()"
        class="w-full bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-base font-medium py-2 px-4 rounded-lg text-sm transition-colors">
        Extract Text
      </button>
    </div>
  `,
})
export class FigmaPasteInputComponent {
  private readonly extractor = inject(TextExtractorService);

  extracted = output<FigmaTextNode[]>();
  rawText = signal('');

  extract(): void {
    const nodes = this.extractor.parsePastedAsFigma(this.rawText());
    if (nodes.length > 0) this.extracted.emit(nodes);
  }
}
