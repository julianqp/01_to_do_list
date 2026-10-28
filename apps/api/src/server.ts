import { createApp } from './app';
import { parseEnv } from './config/env';

const env = parseEnv(process.env);

createApp().listen(env.PORT, (error) => {
  if (error) throw error;
  console.log(`API escuchando en http://localhost:${env.PORT}`);
});
