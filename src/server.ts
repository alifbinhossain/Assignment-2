import app from './app';
import config from './config';

const port: number = config.port;

const main = () => {
  app.listen(port, () => {
    console.log(`The Application is running on port: ${port}`);
  });
};

main();
