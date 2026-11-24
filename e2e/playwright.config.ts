import { defineConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Load root .env if present (without overriding explicit environment variables)
const rootEnvPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(rootEnvPath)) {
  for (const line of fs.readFileSync(rootEnvPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
}

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Desktop',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'Tablet',
      use: {
        browserName: 'chromium',
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'Mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 375, height: 667 },
      },
    },
  ],
  webServer: [
    {
      command: 'npm run dev:server',
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: !process.env.CI,
      cwd: '..',
      timeout: 30000,
      env: {
        PORT: '3001',
        DATABASE_URL:
          process.env.DATABASE_URL ||
          'postgresql://crustcraft:crustcraft_test_password@localhost:5432/crustcraft_test?schema=public',
        JWT_SECRET: process.env.JWT_SECRET || 'crustcraft-e2e-jwt-secret-2026',
      },
    },
    {
      command: 'npm run dev:client',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      cwd: '..',
      timeout: 30000,
    },
  ],
});
