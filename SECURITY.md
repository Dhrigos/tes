# Security Policy

PT Dolphin Proprietary Software

This document describes how to report security issues for this proprietary application owned by PT Dolphin. This repository and its binaries are not open-source. Distribution and access are limited to authorized licensees only.

## Supported Versions

Security updates are provided for versions under active support or as defined by the commercial agreement (SLA) with PT Dolphin.

| Release channel                | Security status               |
| ------------------------------ | ----------------------------- |
| Latest stable release          | Supported                     |
| Previous stable (<= 12 months) | Supported for critical fixes  |
| Older releases                 | Not supported                 |

For production deployments, ensure you are on the latest stable release or a release covered by your support contract.

## Reporting a Vulnerability

Please email a detailed report to: security@ptdolphin.co.id

Include, when possible:
- Affected product/version and deployment environment
- Vulnerability type and impact
- Step-by-step reproduction and proof-of-concept
- Logs, screenshots, or crash dumps (no sensitive data)
- Your contact information for follow-up

We ask that you do not publicly disclose the issue until we confirm and provide guidance or a fix.

## Response Targets

- Acknowledgement: within 2 business days
- Triage & initial assessment: within 7 business days
- Fix or mitigation ETA: communicated after triage (typically 30–90 days, severity-dependent)

These targets may vary based on severity, scope, and contractual obligations.

## Coordinated Disclosure

We follow a coordinated disclosure approach. After validation, we will:
- Work with you on remediation or mitigations
- Credit you upon mutual agreement (optional)
- Publish advisories as appropriate to affected customers

Please refrain from sharing exploit details publicly before a fix or advisory is available.

## Safe Harbor for Good-Faith Research

If you adhere to the following, PT Dolphin will not pursue legal action for your good‑faith security research:
- Avoid privacy violations and data exfiltration
- Do not disrupt or degrade service
- Only test systems you are authorized to test
- Give us a reasonable time to remediate

Note: Social engineering, physical attacks, spam, and testing against third‑party providers or integrations without their explicit permission are out of scope.

## Out of Scope

- Denial of Service (load/volume) tests on production without prior written consent
- Vulnerabilities requiring physical access
- Clickjacking on pages without sensitive actions
- Best‑practice recommendations without demonstrable security impact

## PGP/Encryption

If you require encrypted communication, request our security PGP key via the security contact above.
