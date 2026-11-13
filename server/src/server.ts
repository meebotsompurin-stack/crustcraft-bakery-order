import { app } from './app';
import { getJwtSecret } from './services/auth.service';

getJwtSecret();

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`CrustCraft API server listening on http://${HOST}:${PORT}`);
});
