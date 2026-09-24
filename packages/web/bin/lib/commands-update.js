function createUpdateCommand() {
  return async function updateCommand() {
    throw new Error(
      'OpWrk CLI self-update is not available. Install a published OpWrk release from https://github.com/temidayoxyz/opwrk/releases/latest.',
    );
  };
}

export { createUpdateCommand };
