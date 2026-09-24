import { describe, expect, it } from 'vitest';

import { createUpdateCommand } from './commands-update.js';

describe('update command', () => {
  it('fails clearly instead of running an inherited package installer', async () => {
    const updateCommand = createUpdateCommand();

    await expect(updateCommand()).rejects.toThrow(
      'OpWrk CLI self-update is not available. Install a published OpWrk release from https://github.com/temidayoxyz/opwrk/releases/latest.',
    );
  });
});
