import { app } from './app';
import { getJwtSecret } from './services/auth.service';

getJwtSecret();

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`CrustCraft API server listening on http://localhost:${PORT}`);
});
