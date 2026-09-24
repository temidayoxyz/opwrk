import { z } from 'zod';

const updateRequestSchema = z.object({
  appType: z.string().trim().min(1).optional(),
  platform: z.string().trim().min(1).optional(),
  currentVersion: z.string().trim().min(1).optional(),
});

export const registerOpenChamberRoutes = (app, dependencies) => {
  const {
    process,
    modelsDevApiUrl,
    modelsMetadataCacheTtl,
    fetchFreeZenModels,
    getCachedZenModels,
    desktopUpdater,
  } = dependencies;

  let desktopRestartError = null;

  app.get('/api/openchamber/update-check', async (req, res) => {
    try {
      const parsedRequest = updateRequestSchema.safeParse(req.query);
      if (!parsedRequest.success) {
        return res.status(400).json({ code: 'INVALID_UPDATE_REQUEST', error: 'Invalid update check parameters.' });
      }
      const updateRequest = parsedRequest.data;
      let updateInfo;
      if (process.env.OPENCHAMBER_RUNTIME === 'desktop' && updateRequest.appType === 'web') {
        if (desktopRestartError && req.query.updateStatus === 'true') {
          return res.status(503).json({
            code: 'DESKTOP_UPDATE_RESTART_FAILED',
            error: desktopRestartError,
          });
        }
        if (typeof desktopUpdater?.check !== 'function') {
          return res.status(503).json({
            available: false,
            code: 'DESKTOP_UPDATER_UNAVAILABLE',
            error: 'The desktop updater is not available.',
          });
        }
        updateInfo = {
          ...await desktopUpdater.check(),
          packageManager: 'electron',
          updateOwner: 'electron-updater',
        };
      } else {
        const { checkForUpdates } = await import('../package-manager.js');
        updateInfo = await checkForUpdates(updateRequest);
      }
      res.json(updateInfo);
    } catch (error) {
      console.error('Failed to check for updates:', error);
      res.status(500).json({
        available: false,
        error: error instanceof Error ? error.message : 'Failed to check for updates',
      });
    }
  });

  app.post('/api/openchamber/update-install', async (_req, res) => {
    try {
      if (process.env.OPENCHAMBER_RUNTIME === 'desktop') {
        if (typeof desktopUpdater?.install !== 'function' || typeof desktopUpdater?.restart !== 'function') {
          return res.status(503).json({
            code: 'DESKTOP_UPDATER_UNAVAILABLE',
            error: 'The desktop updater is not available.',
          });
        }

        desktopRestartError = null;
        const updateInfo = await desktopUpdater.install();
        if (!updateInfo?.available) {
          return res.status(400).json({ error: 'No update available' });
        }

        res.json({
          success: true,
          message: 'Desktop update downloaded, host will restart shortly',
          version: updateInfo.version,
          packageManager: 'electron',
          updateOwner: 'electron-updater',
          autoRestart: true,
          restartManager: 'electron-updater',
        });

        setImmediate(() => {
          Promise.resolve()
            .then(() => desktopUpdater.restart())
            .catch((error) => {
              desktopRestartError = error instanceof Error ? error.message : 'Failed to restart after desktop update';
              console.error('Failed to restart after desktop update:', error);
            });
        });
        return;
      }

      return res.status(501).json({
        code: 'WEB_UPDATE_UNAVAILABLE',
        error: 'OpWrk web self-update is unavailable until an OpWrk package is published. Download a desktop release or update this source checkout manually.',
      });
    } catch (error) {
      console.error('Failed to install update:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to install update',
      });
    }
  });

  app.get('/api/openchamber/models-metadata', async (_req, res) => {
    try {
      const { getModelsMetadata } = await import('./models-metadata.js');
      const { metadata, fromCache, stale } = await getModelsMetadata({
        url: modelsDevApiUrl,
        ttlMs: modelsMetadataCacheTtl,
      });
      res.setHeader('Cache-Control', fromCache && !stale ? 'public, max-age=60' : 'public, max-age=300');
      res.json(metadata);
    } catch (error) {
      console.warn('Failed to fetch models.dev metadata via server:', error);
      const statusCode = error?.name === 'TimeoutError' || error?.name === 'AbortError' ? 504 : 502;
      res.status(statusCode).json({ error: 'Failed to retrieve model metadata' });
    }
  });

  app.get('/api/zen/models', async (_req, res) => {
    try {
      const models = await fetchFreeZenModels();
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.json({ models });
    } catch (error) {
      console.warn('Failed to fetch zen models:', error);
      const cachedZenModels = getCachedZenModels();
      if (cachedZenModels) {
        res.setHeader('Cache-Control', 'public, max-age=60');
        res.json(cachedZenModels);
      } else {
        const statusCode = error?.name === 'AbortError' ? 504 : 502;
        res.status(statusCode).json({ error: 'Failed to retrieve zen models' });
      }
    }
  });
};
