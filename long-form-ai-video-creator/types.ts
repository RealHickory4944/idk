export enum SceneStatus {
  Idle = 'idle',
  Queued = 'queued',
  Generating = 'generating',
  Success = 'success',
  Error = 'error',
}

export enum ErrorType {
  None = 'none',
  Safety = 'safety',
  Internal = 'internal',
  Unknown = 'unknown',
}

export interface Scene {
  id: string;
  prompt: string;
  status: SceneStatus;
  videoUrl?: string;
  progressMessage?: string;
  errorType?: ErrorType;
}
