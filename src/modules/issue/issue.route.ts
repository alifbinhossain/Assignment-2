import { Router } from 'express';
import { issueController } from './issue.controller';
import authMiddleware from '../../middleware/auth';
import { USER_ROLE } from '../../types';

const router = Router();

// CREATE ISSUE
router.post(
  '/',
  authMiddleware(USER_ROLE.MAINTAINER, USER_ROLE.CONTRIBUTOR),
  issueController.createAnIssue,
);

// GET ALL ISSUES
router.get('/', issueController.getAllIssues);

// GET SINGLE ISSUE
router.get('/:id', issueController.getSingleIssue);

// UPDATE ISSUE
router.patch('/:id', issueController.updateAnIssue);

// DELETE ISSUE
router.delete(
  '/:id',
  authMiddleware(USER_ROLE.MAINTAINER),
  issueController.deleteAnIssue,
);

export const issueRouter = router;
