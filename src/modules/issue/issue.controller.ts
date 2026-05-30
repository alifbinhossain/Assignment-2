import type { Request, Response } from 'express';
import type { IssueFilters } from '../../types';
import { sendResponse, serverError } from '../../utils/sendResponse';
import { issueService } from './issue.service';

const createAnIssue = async (req: Request, res: Response) => {
  try {
    const result = await issueService.createIssueToDB(req?.user?.id, req.body);
    return sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Issue created successfully',
      data: result,
    });
  } catch (error) {
    serverError(res, error);
  }
};

const getAllIssues = async (req: Request, res: Response) => {
  try {
    const { sort, type, status } = req.query;
    const data = await issueService.getAllIssuesFromDB({
      sort,
      type,
      status,
    } as IssueFilters);

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Issues retrieved successfully',
      data,
    });
  } catch (error) {
    serverError(res, error);
  }
};

const getSingleIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const issue = await issueService.getSingleIssueFromDB(id as string);

    if (!issue) {
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: 'Issue not found',
        data: issue,
      });
    }

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Issue retrieved successfully',
      data: issue,
    });
  } catch (error) {
    serverError(res, error);
  }
};

const updateAnIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await issueService.updateIssueToDB(id as string, req.body);

    if (!result) {
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: 'Issue not found',
      });
    }

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Issue updated successfully',
      data: result,
    });
  } catch (error) {
    serverError(res, error);
  }
};

const deleteAnIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await issueService.deleteIssueFromDB(id as string);

    if (!result) {
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: 'Issue not found',
      });
    }

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
