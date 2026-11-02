import { app } from './app';

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`CrustCraft API server listening on http://localhost:${PORT}`);
});
