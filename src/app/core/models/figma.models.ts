export interface FigmaApiTextNode {
  readonly id: string;
  readonly name: string;
  readonly type: 'TEXT';
  readonly characters: string;
  readonly style: {
    readonly fontSize: number;
    readonly fontWeight: number;
    readonly fontFamily: string;
  };
  readonly absoluteBoundingBox: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
}

export interface FigmaTextNode {
  readonly id: string;
  readonly layerName: string;
  readonly rawText: string;
  readonly normalizedText: string;
  readonly fontSize: number;
  readonly fontWeight: number;
  readonly y: number;
  readonly x: number;
}

export interface FigmaConfig {
  readonly token: string;
  readonly fileKey: string;
  readonly nodeId: string;
}
