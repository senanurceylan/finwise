const app = require('./app');
const config = require('./config');

app.set('env', config.nodeEnv);

app.listen(config.port, () => {
  console.log(`FinWise API http://localhost:${config.port}`);
});
