import type { ISSUE_STATUS, ISSUE_TYPE } from '../../types';

export interface Issue {
  title: string;
  description: string;
  type: ISSUE_TYPE;
  status?: ISSUE_STATUS;
}
