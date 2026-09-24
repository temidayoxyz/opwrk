# Walkthrough

Walkthrough creates a guided reading path through code changes. It is a developer tool, not the default way to review an OpWrk task or its finished documents.

Choose the changes to explain: uncommitted files, a branch, a commit, or a pull request. Then select a language and model and choose **Generate walkthrough**. OpWrk reads the selected diff and asks the model to describe it in a useful order. Generation costs model tokens and starts only when you request it.

Each step points back to the code it describes. The walkthrough can help you understand what changed, but it is not a test result or a list of verified defects. Check the code and run the relevant tests before accepting a change.

If the underlying code changes later, OpWrk marks affected steps as outdated. Generate again to review the new version. Changes omitted from the guided path remain available under **Not covered**.
