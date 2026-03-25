import {Pipe, PipeTransform} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {DiffSegment} from '../../core/models/matching.models';

@Pipe({name: 'highlightDiff', pure: true})
export class HighlightDiffPipe implements PipeTransform {
  constructor(private readonly sanitizer: DomSanitizer) {}

  transform(segments: DiffSegment[]): SafeHtml {
    const html = segments
      .map((seg) => {
        const escaped = this.escapeHtml(seg.text);
        switch (seg.type) {
          case 'equal':
            return `<span class="text-text">${escaped}</span>`;
          case 'delete':
            return `<span class="bg-diff-delete-bg text-diff-delete-text line-through">${escaped}</span>`;
          case 'insert':
            return `<span class="bg-diff-insert-bg text-diff-insert-text">${escaped}</span>`;
        }
      })
      .join('');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
