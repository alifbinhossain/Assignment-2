import type { JwtPayload } from 'jsonwebtoken';
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

  return result.rows?.[0];
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
  const reporterIds = [...new Set(result.rows.map((_r) => _r.reporter_id))];

  const reportersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1)`,
    [reporterIds],
  );

  const reporterMap = Object.fromEntries(
    reportersResult.rows.map((r) => [r.id, r]),
  );

  return result.rows.map((_r) => ({
    ..._r,
    reporter: reporterMap[_r.reporter_id] ?? null,
  }));
};

const getSingleIssueFromDB = async (id: string) => {
  const result = await pool.query(
    `SELECT
       i.id,
       i.title,
       i.description,
       i.type,
       i.status,
       json_build_object(
         'id', u.id,
         'name', u.name,
         'role', u.role
       ) AS reporter,
       i.created_at,
       i.updated_at
     FROM issues i
     JOIN users u ON u.id = i.reporter_id
     WHERE i.id = $1`,
    [id],
  );

  return result.rows?.[0] ?? undefined;
};

const updateIssueToDB = async (
  id: string,
  user: JwtPayload,
  payload: Issue,
) => {
  const { title, description, type, status } = payload;

  if (user.role === 'contributor') {
    const issueResult = await pool.query(
      `SELECT reporter_id FROM issues WHERE id = $1`,
      [id],
    );

    const issue = issueResult.rows?.[0];

    if (!issue) {
      throw new Error('Issue not found');
    }

    if (issue.reporter_id !== user.id) {
      throw new Error('You are not authorized to update this issue');
    }
  }

  const result = await pool.query(
    `
  UPDATE issues
  SET
  title=COALESCE($1,title),
  description=COALESCE($2,description),
  type=COALESCE($3,type),
  status=COALESCE($4,status)
  WHERE id=$5
  RETURNING *  
    `,
    [title, description, type, status, id],
  );

  return result.rows?.[0];
};

const deleteIssueFromDB = async (id: string) => {
  const result = await pool.query(
    `
    DELETE FROM issues
    WHERE id=$1 RETURNING *
    `,
    [id],
  );

  return result.rowCount;
};

export const issueService = {
  createIssueToDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueToDB,
  deleteIssueFromDB,
};
