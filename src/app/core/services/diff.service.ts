import {Injectable} from '@angular/core';
import {diff_match_patch, DIFF_EQUAL, DIFF_INSERT, DIFF_DELETE} from 'diff-match-patch';
import {DiffSegment} from '../models/matching.models';

@Injectable({providedIn: 'root'})
export class DiffService {
  private readonly dmp = new diff_match_patch();

  computeDiff(original: string, modified: string): DiffSegment[] {
    const diffs = this.dmp.diff_main(original, modified);
    this.dmp.diff_cleanupSemantic(diffs);

    return diffs.map(([op, text]) => ({
      type: op === DIFF_EQUAL ? 'equal' as const
           : op === DIFF_INSERT ? 'insert' as const
           : 'delete' as const,
      text,
    }));
  }
}
