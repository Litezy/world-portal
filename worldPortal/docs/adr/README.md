# Architecture Decision Records (ADRs)

All major technical decisions, architectural patterns, data model definitions, and feature designs for **World Portal** must be recorded here as ADRs.

## Workflow Rules
1. **Branch First:** Every feature development task must start in a new git branch checked out from the updated `main` branch (`git checkout main && git pull && git checkout -b feat/feature-name`).
2. **Dual ADR Requirement:** Every feature requires **TWO** ADR files:
   - **Technical ADR (`000X-feature-name.md`)**: Based on [`0000-adr-template.md`](./0000-adr-template.md), covering deep technical design, NestJS modules, Prisma models, Redis/BullMQ queue structures, and test specs.
   - **ADR for Dummies (`000X-feature-name.dummies.md`)**: Based on [`0000-adr-dummies-template.md`](./0000-adr-dummies-template.md), covering plain-language business problem, benefits, simple operational flows, and non-technical impact.
3. **Approval Mandate:** Both ADRs must be reviewed and marked `Approved` prior to writing feature code.

## Templates
- [Technical ADR Template](./0000-adr-template.md)
- [ADR for Dummies Template](./0000-adr-dummies-template.md)

## Index of ADRs
- **0001 Profile & Account Management**: [Technical ADR](./0001-profile-account-management.md) | [ADR for Dummies](./0001-profile-account-management.dummies.md)
- **0002 S3 Document Upload Service**: [Technical ADR](./0002-s3-document-upload-service.md) | [ADR for Dummies](./0002-s3-document-upload-service.dummies.md)
- **0003 Visa Documentation & Information Processing Workflow**: [Technical ADR](./0003-visa-documentation-processing-workflow.md) | [ADR for Dummies](./0003-visa-documentation-processing-workflow.dummies.md)
- **0004 Payment Transaction Management & Decoupled Engine**: [Technical ADR](./0004-payment-transaction-management.md) | [ADR for Dummies](./0004-payment-transaction-management.dummies.md)
- **0005 Pluggable Cloud Storage Provider Architecture**: [Technical ADR](./0005-pluggable-cloud-storage-provider.md) | [ADR for Dummies](./0005-pluggable-cloud-storage-provider.dummies.md)
- **0006 RapidAPI Visa Requirement Integration**: [Technical ADR](./0006-visa-requirement-integration.md) | [ADR for Dummies](./0006-visa-requirement-integration.dummies.md)

