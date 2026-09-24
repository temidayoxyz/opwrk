import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../package-manager.js', () => ({
  checkForUpdates: vi.fn(),
}));

const packageManager = await import('../package-manager.js');
const { registerOpenChamberRoutes } = await import('./openchamber-routes.js');

function createApp({ environment = {}, desktopUpdater } = {}) {
  const app = express();
  registerOpenChamberRoutes(app, {
    process: { env: environment },
    desktopUpdater,
    modelsDevApiUrl: 'https://models.example.test',
    modelsMetadataCacheTtl: 0,
    fetchFreeZenModels: vi.fn(),
    getCachedZenModels: vi.fn(),
  });
  return app;
}

beforeEach(() => {
  packageManager.checkForUpdates.mockResolvedValue({
    available: false,
    version: '1.0.0',
    currentVersion: '1.0.0',
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('OpWrk release routes', () => {
  it('checks releases without forwarding a client install identifier or usage flag', async () => {
    const app = createApp();

    await request(app)
      .get('/api/openchamber/update-check?appType=web&currentVersion=1.0.0&installId=private-id&reportUsage=true')
      .expect(200);

    expect(packageManager.checkForUpdates).toHaveBeenCalledWith({
      appType: 'web',
      platform: undefined,
      currentVersion: '1.0.0',
    });
  });

  it('refuses web self-update without touching the inherited package manager', async () => {
    const app = createApp();

    await request(app).post('/api/openchamber/update-install').expect(501, {
      code: 'WEB_UPDATE_UNAVAILABLE',
      error: 'OpWrk web self-update is unavailable until an OpWrk package is published. Download a desktop release or update this source checkout manually.',
    });
    expect(packageManager.checkForUpdates).not.toHaveBeenCalled();
  });

  it('uses the Electron updater for a browser attached to a desktop host', async () => {
    const desktopUpdater = {
      check: vi.fn(async () => ({ available: true, currentVersion: '1.0.0', version: '1.1.0' })),
    };
    const app = createApp({ environment: { OPENCHAMBER_RUNTIME: 'desktop' }, desktopUpdater });

    await request(app).get('/api/openchamber/update-check?appType=web').expect(200, {
      available: true,
      currentVersion: '1.0.0',
      version: '1.1.0',
      packageManager: 'electron',
      updateOwner: 'electron-updater',
    });
    expect(desktopUpdater.check).toHaveBeenCalledOnce();
    expect(packageManager.checkForUpdates).not.toHaveBeenCalled();
  });

  it('fails closed if the desktop updater bridge is absent', async () => {
    const app = createApp({ environment: { OPENCHAMBER_RUNTIME: 'desktop' } });

    await request(app).get('/api/openchamber/update-check?appType=web').expect(503, {
      available: false,
      code: 'DESKTOP_UPDATER_UNAVAILABLE',
      error: 'The desktop updater is not available.',
    });
    await request(app).post('/api/openchamber/update-install').expect(503, {
      code: 'DESKTOP_UPDATER_UNAVAILABLE',
      error: 'The desktop updater is not available.',
    });
  });

  it('downloads a desktop update and asks Electron to restart', async () => {
    const desktopUpdater = {
      check: vi.fn(),
      install: vi.fn(async () => ({ available: true, version: '1.1.0' })),
      restart: vi.fn(),
    };
    const app = createApp({ environment: { OPENCHAMBER_RUNTIME: 'desktop' }, desktopUpdater });

    await request(app).post('/api/openchamber/update-install').expect(200, {
      success: true,
      message: 'Desktop update downloaded, host will restart shortly',
      version: '1.1.0',
      packageManager: 'electron',
      updateOwner: 'electron-updater',
      autoRestart: true,
      restartManager: 'electron-updater',
    });
    await new Promise((resolve) => setImmediate(resolve));
    expect(desktopUpdater.install).toHaveBeenCalledOnce();
    expect(desktopUpdater.restart).toHaveBeenCalledOnce();
  });

  it('reports a rejected desktop restart until the next install attempt', async () => {
    const desktopUpdater = {
      check: vi.fn(async () => ({ available: true, version: '1.1.0' })),
      install: vi.fn(async () => ({ available: true, version: '1.1.0' })),
      restart: vi.fn().mockRejectedValueOnce(new Error('Signature rejected')).mockResolvedValue(undefined),
    };
    const app = createApp({ environment: { OPENCHAMBER_RUNTIME: 'desktop' }, desktopUpdater });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await request(app).post('/api/openchamber/update-install').expect(200);
    await new Promise((resolve) => setImmediate(resolve));
    await request(app).get('/api/openchamber/update-check?appType=web&updateStatus=true').expect(503, {
      code: 'DESKTOP_UPDATE_RESTART_FAILED',
      error: 'Signature rejected',
    });
    await request(app).post('/api/openchamber/update-install').expect(200);
    await new Promise((resolve) => setImmediate(resolve));
    await request(app).get('/api/openchamber/update-check?appType=web&updateStatus=true').expect(200);
  });
});
