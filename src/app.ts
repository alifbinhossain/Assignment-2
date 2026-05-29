import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Application } from 'express';
import { authRouter } from './modules/auth/auth.route';
import { issueRouter } from './modules/issue/issue.route';

const app: Application = express();

app.use(cookieParser());
app.use(express.text());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: 'http://localhost:3000',
  }),
);

app.use('/api/auth', authRouter);
app.use('/api/issues', issueRouter);

export default app;
