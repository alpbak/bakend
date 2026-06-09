export interface FieldDefinition {
  name: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  collection?: string;
}

export interface CollectionPermissions {
  create?: string;
  read?: string;
  update?: string;
  delete?: string;
}

export interface CollectionDefinition {
  name: string;
  fields: FieldDefinition[];
  permissions?: CollectionPermissions;
}

export interface CollectionMeta {
  name: string;
  definition: CollectionDefinition;
  createdAt: string;
  updatedAt: string;
}

export interface FileMetadata {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  visibility: string;
  userId: string;
  createdAt: string;
}

export interface FunctionTrigger {
  collection: string;
  type: string;
  eventType: string;
  filePath: string;
}

export interface JobInfo {
  name: string;
  schedule: string;
  filePath: string;
}

export interface JobRun {
  runId: string;
  startedAt: string;
  endedAt: string;
  status: string;
  error?: string;
  attempt: number;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}
