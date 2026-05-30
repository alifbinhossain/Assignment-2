import type { Request, Response } from 'express';
import { sendResponse, serverError } from '../../utils/sendResponse';
import { issueService } from './issue.service';
import type { IssueFilters } from '../../types';

const createAnIssue = async (req: Request, res: Response) => {
  try {
    const result = await issueService.createIssueToDB(1, req.body);
    return sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Issue created successfully',
      data: result.rows?.[0],
    });
  } catch (error) {
    serverError(res, error);
  }
};

const getAllIssues = async (req: Request, res: Response) => {
  try {
    const { sort, type, status } = req.query;
    const result = await issueService.getAllIssuesFromDB({
      sort,
      type,
      status,
    } as IssueFilters);
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Issues retrieved successfully',
      data: result.rows,
    });
  } catch (error) {
    serverError(res, error);
  }
};

const getSingleIssue = async (req: Request, res: Response) => {
  try {
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Issue retrieved successfully',
      data: {},
    });
  } catch (error) {
    serverError(res, error);
  }
};
const updateAnIssue = async (req: Request, res: Response) => {
  try {
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Issue updated successfully',
      data: {},
    });
  } catch (error) {
    serverError(res, error);
  }
};

const deleteAnIssue = async (req: Request, res: Response) => {
  try {
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Issue deleted successfully',
    });
  } catch (error) {
    serverError(res, error);
  }
};

export const issueController = {
  createAnIssue,
  getAllIssues,
  getSingleIssue,
  updateAnIssue,
  deleteAnIssue,
};
