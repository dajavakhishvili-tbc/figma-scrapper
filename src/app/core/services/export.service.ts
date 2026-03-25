import {Injectable} from '@angular/core';
import {MatchResult} from '../models/matching.models';

@Injectable({providedIn: 'root'})
export class ExportService {

  toMarkdown(result: MatchResult): string {
    const {summary, matchedPairs, unmatchedFigma, unmatchedWebsite} = result;
    const lines: string[] = [
      '# Figma Text Diff Report',
      '',
      '## Summary',
      `- **Total Figma text nodes**: ${summary.totalFigma}`,
      `- **Total Website text nodes**: ${summary.totalWebsite}`,
      `- **Exact matches**: ${summary.exactMatches}`,
      `- **Close matches**: ${summary.closeMatches}`,
      `- **Missing from website**: ${summary.missingFromWebsite}`,
      `- **Extra on website**: ${summary.extraOnWebsite}`,
      `- **Overall match**: ${summary.overallMatchPercentage}%`,
      '',
    ];

    const mismatches = matchedPairs.filter((p) => p.similarity < 1.0 && !p.isIgnored);
    if (mismatches.length > 0) {
      lines.push('## Mismatches', '');
      for (const pair of mismatches) {
        lines.push(
          `### ${Math.round(pair.similarity * 100)}% match`,
          `- **Figma**: ${pair.figmaNode.rawText}`,
          `- **Website**: ${pair.websiteNode.rawText}`,
          '',
        );
      }
    }

    if (unmatchedFigma.length > 0) {
      lines.push('## Missing from Website', '');
      for (const node of unmatchedFigma) {
        lines.push(`- ${node.rawText}`);
      }
      lines.push('');
    }

    if (unmatchedWebsite.length > 0) {
      lines.push('## Extra on Website', '');
      for (const node of unmatchedWebsite) {
        lines.push(`- ${node.rawText}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  toJson(result: MatchResult): string {
    return JSON.stringify(result, null, 2);
  }

  async copyToClipboard(text: string): Promise<void> {
    await navigator.clipboard.writeText(text);
  }
}
