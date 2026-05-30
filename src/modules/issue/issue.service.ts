import { pool } from '../../db';
import { ISSUE_STATUS, ISSUE_TYPE, type IssueFilters } from '../../types';
import type { Issue } from './issue.interface';

const createIssueToDB = async (reporter_id: number, payload: Issue) => {
  const user = await pool.query(
    `
        SELECT * FROM users
        WHERE id=$1
        `,
    [reporter_id],
  );

  if (user.rows.length === 0) {
    throw new Error('User not found');
  }

  const { title, description, type, status } = payload;

  if (!Object.values(ISSUE_TYPE).includes(type)) {
    throw new Error('Issue type must be either bug or feature_request');
  }

  if (status && !Object.values(ISSUE_STATUS).includes(status)) {
    throw new Error('Status must be one of: open, in_progress, resolved');
  }

  const result = await pool.query(
    `
    INSERT INTO issues (title,description,type,status,reporter_id)
    VALUES($1,$2,$3,COALESCE($4,'open'),$5)
    RETURNING *
    `,
    [title, description, type, status, reporter_id],
  );

  return result;
};

const getAllIssuesFromDB = async (filters: IssueFilters = {}) => {
  const { sort = 'newest', type, status } = filters;

  const conditions = [];
  const values = [];

  // type filter (optional)
  if (type === 'bug' || type === 'feature_request') {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }

  // status filter (optional)
  if (status === 'open' || status === 'in_progress' || status === 'resolved') {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  // sort (newest is default)
  const orderDirection = sort === 'oldest' ? 'ASC' : 'DESC';

  const result = await pool.query(
    `SELECT * FROM issues
     ${whereClause}
     ORDER BY created_at ${orderDirection}`,
    values,
  );

  return result;
};

export const issueService = {
  createIssueToDB,
  getAllIssuesFromDB,
};
