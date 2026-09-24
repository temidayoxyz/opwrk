import { create } from 'zustand';
import type { UpdateInfo, UpdateProgress } from '@/lib/desktop';
import {
  checkForDesktopUpdates,
  downloadDesktopUpdate,
  restartToApplyUpdate,
  isElectronShell,
  isVSCodeRuntime,
  isWebRuntime,
} from '@/lib/desktop';
import { formatMessage, useI18nStore } from '@/lib/i18n/store';
import { getUpdateInstallErrorMessage } from '@/lib/updateInstallError';
import { runtimeFetch } from '@/lib/runtime-fetch';
import { getClientPlatform, isCapacitorApp } from '@/lib/platform';

declare const __APP_VERSION__: string | undefined;

type UpdateState = {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  info: UpdateInfo | null;
  progress: UpdateProgress | null;
  error: string | null;
  runtimeType: 'desktop' | 'web' | 'vscode' | 'mobile' | null;
  lastChecked: number | null;
  nextCheckInSec: number | null;
};

interface UpdateStore extends UpdateState {
  checkForUpdates: () => Promise<number | null>;
  downloadUpdate: () => Promise<void>;
  restartToUpdate: () => Promise<void>;
  dismiss: () => void;
  reset: () => void;
}

type ClientRuntime = 'desktop' | 'web' | 'vscode' | 'mobile';


function detectPlatform(): 'macos' | 'windows' | 'linux' | 'web' | 'android' | 'ios' {
  const clientPlatform = getClientPlatform();
  if (clientPlatform === 'android' || clientPlatform === 'ios') return clientPlatform;
  if (typeof navigator === 'undefined') return 'web';
  const platform = (navigator.platform || '').toLowerCase();
  if (platform.includes('mac')) return 'macos';
  if (platform.includes('win')) return 'windows';
  if (platform.includes('linux')) return 'linux';
  return 'web';
}

function mapRuntimeParams(runtime: ClientRuntime): URLSearchParams {
  const params = new URLSearchParams();
  params.set('platform', detectPlatform());
  if (runtime === 'desktop') {
    params.set('appType', 'desktop-electron');
    return params;
  }

  if (runtime === 'vscode') {
    params.set('appType', 'vscode');
    return params;
  }

  if (runtime === 'mobile') {
    params.set('appType', 'mobile-capacitor');
    return params;
  }

  params.set('appType', 'web');
  return params;
}

async function checkForWebUpdates(runtime: ClientRuntime, currentVersion?: string): Promise<UpdateInfo | null> {
  try {
    const params = mapRuntimeParams(runtime);
    const vscodeVersion = typeof window !== 'undefined'
      ? (window as { __VSCODE_CONFIG__?: { extensionVersion?: string } }).__VSCODE_CONFIG__?.extensionVersion
      : undefined;
    if (currentVersion) params.set('currentVersion', currentVersion);
    else if (runtime === 'vscode' && vscodeVersion) params.set('currentVersion', vscodeVersion);
    const response = await runtimeFetch(`/api/openchamber/update-check?${params.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      // Background check — keep sockets free for interactive traffic at startup.
      priority: 'low',
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return {
      available: data.available ?? false,
      version: data.version,
      currentVersion: data.currentVersion ?? 'unknown',
      body: data.body,
      releaseUrl: data.releaseUrl,
      downloadUrl: data.downloadUrl,
      nextSuggestedCheckInSec:
        typeof data.nextSuggestedCheckInSec === 'number' && Number.isFinite(data.nextSuggestedCheckInSec)
          ? data.nextSuggestedCheckInSec
          : undefined,
      packageManager: data.packageManager,
      updateCommand: data.updateCommand,
    };
  } catch (error) {
    console.warn('Failed to check for updates:', error);
    throw error;
  }
}

function detectRuntimeType(): 'desktop' | 'web' | 'vscode' | 'mobile' | null {
  if (isCapacitorApp()) {
    return 'mobile';
  }
  if (isElectronShell()) {
    return 'desktop';
  }
  if (isVSCodeRuntime()) return 'vscode';
  if (isWebRuntime()) return 'web';
  return null;
}

const initialState: UpdateState = {
  checking: false,
  available: false,
  downloading: false,
  downloaded: false,
  info: null,
  progress: null,
  error: null,
  runtimeType: null,
  lastChecked: null,
  nextCheckInSec: null,
};

export const useUpdateStore = create<UpdateStore>()((set, get) => ({
  ...initialState,

  checkForUpdates: async () => {
    const runtime = detectRuntimeType();
    if (!runtime) return null;

    set({ checking: true, error: null, runtimeType: runtime });

    try {
      let info: UpdateInfo | null = null;
      let suggestedSec: number | null = null;

      if (runtime === 'desktop') {
        const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : undefined;
        const [desktopResult, apiResult] = await Promise.allSettled([
          checkForDesktopUpdates(),
          checkForWebUpdates('desktop', appVersion),
        ]);
        const desktopInfo = desktopResult.status === 'fulfilled' ? desktopResult.value : null;
        suggestedSec = apiResult.status === 'fulfilled'
          ? (apiResult.value?.nextSuggestedCheckInSec ?? null)
          : null;
        set({
          checking: false,
          available: desktopInfo?.available ?? false,
          info: desktopInfo,
          lastChecked: Date.now(),
          nextCheckInSec: suggestedSec,
        });

        return suggestedSec;
      } else if (runtime === 'web') {
        info = await checkForWebUpdates('web');
        suggestedSec = info?.nextSuggestedCheckInSec ?? null;
      } else if (runtime === 'vscode') {
        const vscodeInfo = await checkForWebUpdates('vscode');
        suggestedSec = vscodeInfo?.nextSuggestedCheckInSec ?? null;
      } else if (runtime === 'mobile') {
        const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : undefined;
        info = await checkForWebUpdates('mobile', appVersion);
        suggestedSec = info?.nextSuggestedCheckInSec ?? null;
      }

      set({
        checking: false,
        available: runtime === 'vscode' ? false : (info?.available ?? false),
        info: runtime === 'vscode' ? null : info,
        lastChecked: Date.now(),
        nextCheckInSec: suggestedSec,
      });
      return suggestedSec;
    } catch (error) {
      set({
        checking: false,
        error: error instanceof Error ? error.message : 'Failed to check for updates',
      });
      return null;
    }
  },

  downloadUpdate: async () => {
    const { available, runtimeType } = get();

    // Only the packaged desktop runtime can download and install an update.
    if (runtimeType !== 'desktop' || !available) {
      return;
    }

    set({ downloading: true, error: null, progress: null });

    try {
      const desktopInfo = await checkForDesktopUpdates();
      if (!desktopInfo?.available) {
        throw new Error('Update detected, but desktop package is not ready yet. Retry in a moment.');
      }

      set((state) => ({
        info: state.info
          ? {
            ...state.info,
            ...desktopInfo,
            // Keep the richer sidecar-sourced changelog; desktopInfo.body is
            // often the bare "See release notes at..." fallback from the
            // updater and would otherwise clobber the nice changelog.
            body: state.info.body || desktopInfo.body,
            available: state.info.available,
          }
          : desktopInfo,
      }));

      const ok = await downloadDesktopUpdate((progress) => {
        set({ progress });
      });
      if (!ok) {
        throw new Error('Desktop update only works on Local instance');
      }
      set({ downloading: false, downloaded: true });
    } catch (error) {
      set({
        downloading: false,
        error: error instanceof Error ? error.message : 'Failed to download update',
      });
    }
  },

  restartToUpdate: async () => {
    const { downloaded, runtimeType } = get();

    if (runtimeType !== 'desktop' || !downloaded) {
      return;
    }

    set({ error: null });

    try {
      const ok = await restartToApplyUpdate();
      if (!ok) {
        // No desktop bridge at all — the update was never installable here.
        throw new Error(formatMessage(useI18nStore.getState().dictionary, 'updateDialog.error.restartUnavailable'));
      }
    } catch (error) {
      // Keep the real installer failure; the dialog shows it and the button
      // stays clickable for another attempt.
      set({ error: getUpdateInstallErrorMessage(error instanceof Error ? error : new Error(String(error))) });
    }
  },

  dismiss: () => {
    set({ available: false, downloaded: false, info: null });
  },

  reset: () => {
    set(initialState);
  },
}));
