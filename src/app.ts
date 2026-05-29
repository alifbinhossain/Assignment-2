import express, {
  type Application,
  type Request,
  type Response,
} from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

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

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Hello World!',
  });
});

export default app;
