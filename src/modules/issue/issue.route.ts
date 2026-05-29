import { Router } from 'express';
import { issueController } from './issue.controller';

const router = Router();

// CREATE ISSUE
router.post('/', issueController.createAnIssue);

// GET ALL ISSUES
router.get('/', issueController.getAllIssues);

// GET SINGLE ISSUE
router.get('/:id', issueController.getSingleIssue);

// UPDATE ISSUE
router.patch('/:id', issueController.updateAnIssue);

// DELETE ISSUE
router.delete('/:id', issueController.deleteAnIssue);

export const issueRouter = router;
