export enum USER_ROLE {
  CONTRIBUTOR = 'contributor',
  MAINTAINER = 'maintainer',
}

export enum ISSUE_STATUS {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
}

export enum ISSUE_TYPE {
  BUG = 'bug',
  FEATURE_REQUEST = 'feature_request',
}

export interface IResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}
