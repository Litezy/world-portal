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
- **0007 Admin Dashboard Architecture, Mobile-First UI & API Specification**: [Technical ADR](./0007-admin-dashboard-architecture.md) | [ADR for Dummies](./0007-admin-dashboard-architecture.dummies.md)
- **0008 Agency Portal Backend Architecture & Data Store Implementation**: [Technical ADR](./0008-agency-portal-backend-architecture.md) | [ADR for Dummies](./0008-agency-portal-backend-architecture.dummies.md)
- **0009 Hire & Professional Services Backend Architecture**: [Technical ADR](./0009-hire-professional-services-backend-architecture.md) | [ADR for Dummies](./0009-hire-professional-services-backend-architecture.dummies.md)
- **0010 Unified Basket & Package Checkout Payment Engine**: [Technical ADR](./0010-basket-checkout-payment-engine.md) | [ADR for Dummies](./0010-basket-checkout-payment-engine.dummies.md)
- **0011 WorldSpace API Integration & Proxy Seam**: [Technical ADR](./0011-worldspace-api-proxy-integration.md) | [ADR for Dummies](./0011-worldspace-api-proxy-integration.dummies.md)
- **0012 Frontend Seam Integration with NestJS Backend Services**: [Technical ADR](./0012-frontend-seam-integration.md) | [ADR for Dummies](./0012-frontend-seam-integration.dummies.md)
- **0013 Admin Catalog Oversight for Agencies & Professional Services**: [Technical ADR](./0013-admin-catalog-oversight.md) | [ADR for Dummies](./0013-admin-catalog-oversight.dummies.md)
- **0014 WorldStreet Applicant Authentication**: [Technical ADR](./0014-worldstreet-applicant-authentication.md) | [ADR for Dummies](./0014-worldstreet-applicant-authentication.dummies.md)
- **0015 Vivid Voice Assistant**: [Technical ADR](./0015-vivid-voice-assistant.md) | [ADR for Dummies](./0015-vivid-voice-assistant.dummies.md)






