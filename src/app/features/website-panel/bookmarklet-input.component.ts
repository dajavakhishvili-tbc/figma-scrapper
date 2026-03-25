import {Component, inject, output, signal, OnInit, OnDestroy, NgZone, ElementRef, afterNextRender} from '@angular/core';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {BookmarkletService} from '../../core/services/bookmarklet.service';
import {TextExtractorService} from '../../core/services/text-extractor.service';
import {WebsiteTextNode} from '../../core/models/website.models';

@Component({
  selector: 'app-bookmarklet-input',
  template: `
    <div class="space-y-4">
      <!-- Bookmarklet drag link -->
      <div class="bg-base rounded-lg p-4 border border-border">
        <p class="text-sm text-text-muted mb-3">
          Drag this button to your bookmarks bar, then click it on any website:
        </p>
        <a
          [href]="safeBookmarkletCode"
          (click)="$event.preventDefault()"
          class="inline-block bg-accent hover:bg-accent-hover text-base font-medium py-2 px-5 rounded-lg text-sm transition-colors cursor-grab active:cursor-grabbing">
          Extract Text
        </a>
        <p class="text-xs text-text-dim mt-3">
          Hover to highlight a section, click to extract it. Press <kbd class="bg-base px-1 rounded text-text-muted">Esc</kbd> to extract the full page.
        </p>
      </div>

      @if (listening()) {
        <div class="flex items-center gap-2 text-xs text-accent">
          <span class="inline-block w-2 h-2 rounded-full bg-accent animate-pulse"></span>
          Listening for clipboard data...
        </div>
      }

      <!-- Manual fallback button -->
      <button
        (click)="manualRead()"
        class="w-full bg-surface-hover hover:bg-surface-active text-text font-medium py-2 px-4 rounded-lg text-sm transition-colors border border-border">
        Read Clipboard
      </button>

      @if (error()) {
        <p class="text-match-missing text-xs">{{ error() }}</p>
      }

      @if (sourceUrl()) {
        <p class="text-xs text-text-dim truncate">
          Source: <span class="text-accent">{{ sourceUrl() }}</span>
        </p>
      }
    </div>
  `,
})
export class BookmarkletInputComponent implements OnInit, OnDestroy {
  private readonly bookmarkletService = inject(BookmarkletService);
  private readonly extractor = inject(TextExtractorService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly zone = inject(NgZone);

  extracted = output<WebsiteTextNode[]>();

  safeBookmarkletCode: SafeUrl;
  listening = signal(true);
  error = signal('');
  sourceUrl = signal('');

  private readonly onVisibilityChange = () => this.tryReadClipboard();

  constructor() {
    const raw = this.bookmarkletService.generateBookmarkletCode();
    this.safeBookmarkletCode = this.sanitizer.bypassSecurityTrustUrl(raw);
  }

  ngOnInit(): void {
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  ngOnDestroy(): void {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  /** Manual button click — has user activation so clipboard read is more reliable */
  async manualRead(): Promise<void> {
    this.error.set('');
    try {
      const text = await navigator.clipboard.readText();
      this.processClipboardText(text);
    } catch {
      this.error.set('Clipboard access denied. Allow clipboard permission in your browser, or paste the JSON in the Paste tab.');
    }
  }

  private async tryReadClipboard(): Promise<void> {
    if (document.visibilityState !== 'visible') return;

    try {
      const text = await navigator.clipboard.readText();
      this.processClipboardText(text);
    } catch {
      // Auto-read blocked by browser — user can use the manual button
    }
  }

  private processClipboardText(text: string): void {
    if (!text.trim()) return;

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return;
    }

    const payload = this.extractor.validateBookmarkletPayload(data);
    if (!payload) {
      this.error.set('Clipboard does not contain bookmarklet data. Run the bookmarklet first.');
      return;
    }

    this.zone.run(() => {
      const nodes = this.extractor.parseBookmarkletPayload(payload);
      this.sourceUrl.set(payload.url);
      this.error.set('');
      this.listening.set(false);
      this.extracted.emit(nodes);
    });
  }
}
