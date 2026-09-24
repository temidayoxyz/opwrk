# Security policy

## Report a vulnerability

Do not open a public issue for a suspected vulnerability. Use the repository's
private security advisory form:

https://github.com/temidayoxyz/opwrk/security/advisories/new

Include the affected version or commit, reproduction steps, expected impact,
and any mitigation you have tested. A maintainer will acknowledge the report
through the advisory.

## Scope

OpWrk handles model credentials, local files, browser sessions, tool output,
terminal processes, schedules, and remote connections. Reports involving
permission boundaries, path traversal, prompt injection, credential exposure,
unsafe deletion, or unapproved network access are especially important.

## Supported versions

OpWrk is in early development and does not yet publish supported releases.
Security fixes currently target the latest commit on the default branch.
