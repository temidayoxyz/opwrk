import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  checkForUpdates,
  executeUpdate,
  getCurrentVersion,
  getUpdateCommand,
} from './package-manager.js';

const RELEASE_API = 'https://api.github.com/repos/temidayoxyz/opwrk/releases/latest';
const RELEASE_URL = 'https://github.com/temidayoxyz/opwrk/releases';
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockRelease(release, status = 200) {
  const fetchMock = vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => release,
  }));
  globalThis.fetch = fetchMock;
  return fetchMock;
}

describe('OpWrk release checks', () => {
  it('uses only OpWrk GitHub releases and sends no install identity', async () => {
    const fetchMock = mockRelease({
      tag_name: 'v1.1.0',
      body: 'A better first release.',
      assets: [],
    });

    const result = await checkForUpdates({ currentVersion: '1.0.0', appType: 'web' });

    expect(result).toMatchObject({
      available: false,
      currentVersion: '1.0.0',
      version: '1.1.0',
      body: 'A better first release.',
      releaseUrl: `${RELEASE_URL}/tag/v1.1.0`,
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe(RELEASE_API);
    expect(fetchMock.mock.calls[0][1]).not.toHaveProperty('body');
  });

  it('treats a missing first release as no update', async () => {
    mockRelease({}, 404);

    expect(await checkForUpdates({ currentVersion: '1.0.0' })).toMatchObject({
      available: false,
      currentVersion: '1.0.0',
    });
  });

  it('offers only an OpWrk Android APK to an Android app', async () => {
    mockRelease({
      tag_name: 'v1.1.0',
      assets: [
        { name: 'OpenChamber-1.1.0-android.apk', browser_download_url: 'https://example.test/old.apk' },
        { name: 'OpWrk-1.1.0-android.aab', browser_download_url: `${RELEASE_URL}/download/v1.1.0/app.aab` },
        { name: 'OpWrk-1.1.0-android.apk', browser_download_url: `${RELEASE_URL}/download/v1.1.0/OpWrk-1.1.0-android.apk` },
      ],
    });

    expect(await checkForUpdates({ currentVersion: '1.0.0', appType: 'mobile-capacitor', platform: 'android' })).toMatchObject({
      available: true,
      downloadUrl: `${RELEASE_URL}/download/v1.1.0/OpWrk-1.1.0-android.apk`,
    });
  });

  it('does not offer an update when an APK is missing or the release is older', async () => {
    mockRelease({ tag_name: 'v1.1.0', assets: [] });
    expect((await checkForUpdates({ currentVersion: '1.0.0', appType: 'mobile-capacitor', platform: 'android' })).available).toBe(false);
    expect((await checkForUpdates({ currentVersion: '1.2.0', appType: 'mobile-capacitor', platform: 'android' })).available).toBe(false);
  });

  it('keeps a failed fetch distinct from no update', async () => {
    globalThis.fetch = vi.fn(async () => { throw new Error('offline'); });

    expect(await checkForUpdates({ currentVersion: '1.0.0' })).toMatchObject({
      available: false,
      error: 'Could not reach OpWrk releases.',
    });
  });

  it('rejects invalid release metadata', async () => {
    mockRelease({ tag_name: 'vnot-a-version' });

    expect(await checkForUpdates({ currentVersion: '1.0.0' })).toMatchObject({
      available: false,
      error: 'OpWrk release version was invalid.',
    });
  });
});

describe('web self-update guard', () => {
  it('does not install the inherited OpenChamber npm package', () => {
    expect(getUpdateCommand).toThrow('OpWrk web self-update is unavailable');
    expect(executeUpdate('npm', { silent: true })).toEqual({ success: false, exitCode: 1 });
  });

  it('reads the package version for the CLI', () => {
    expect(getCurrentVersion()).toBe('1.0.0');
  });
});
