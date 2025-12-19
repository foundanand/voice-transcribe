export interface TranscriptionResult {
  verbatim: string;
  concise?: string;
}

export enum TranscriptionMode {
  VERBATIM = 'verbatim',
  CONCISE = 'concise'
}

export interface Message {
  id: string;
  timestamp: number;
  verbatim: string;
  concise: string;
  isProcessing: boolean;
  error?: string;
}
