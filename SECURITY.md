# Security policy

FeedLens is a static, client-side demo: it has no server, no accounts and no
database. Everything a visitor does, including reading an Instagram export,
happens in their own browser tab. The site is published from `main` by the
`FeedLens checks` workflow, and that workflow only publishes a build that
passed the unit and browser test suites.

## Supported versions

| Branch | Status |
| --- | --- |
| `main` | Supported, and the only branch published to GitHub Pages |
| `feedlens-demo` | Supported for the hackathon submission window |
| anything else | Development branches, not supported |

## Reporting a vulnerability

Please report privately through GitHub's
[Report a vulnerability](https://github.com/luminaryshadows/cis-hackathon-2026/security/advisories/new)
form, which opens a private security advisory. Do not open a public issue for a
suspected vulnerability, and do not include a real Instagram export or any other
personal data in a report.

Useful reports include the affected file or URL, what an attacker gains, and the
smallest steps that reproduce it. Expect an acknowledgement within a few days.

## What the repository should never contain

No credentials, tokens or environment files are committed; `.env*`, keys and
`node_modules/` are ignored, secret scanning and push protection are enabled on
the repository, and every third-party action in CI is pinned to a full commit
SHA. If you find a secret in the history, report it privately rather than opening
an issue.
