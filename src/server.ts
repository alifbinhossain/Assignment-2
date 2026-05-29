import app from './app';
import config from './config';
import { initDB } from './db';

const port: number = config.port;

const main = () => {
  initDB();
  app.listen(port, () => {
    console.log(`The Application is running on port: ${port}`);
  });
};

main();
