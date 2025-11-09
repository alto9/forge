---
object_id: lambda
title: AWS Lambda Function
aliases: ["aws-lambda", "lambda-function"]
---

# Lambda Function Guidance

## Overview
Use AWS Lambda to run serverless functions in response to events. This guidance defines conventions for function structure, configuration, deployment, and observability.

## Implementation
- Runtime: Prefer Node.js LTS unless the project dictates another runtime
- Packaging: Bundle minimal dependencies; exclude devDependencies
- IAM: Principle of least privilege; one role per function with scoped policies
- Configuration: Use environment variables for configuration; do not hardcode secrets
- Timeouts/Memory: Set per-function based on workload; avoid defaults

## Integration Patterns
- API Gateway: For HTTP endpoints; define routes, request/response models
- EventBridge/SQS: For async/decoupled workflows; handle retries and DLQs
- DynamoDB: Use efficient partition keys; batch operations when possible

## Observability
- Logging: Structured JSON logs; include correlation IDs
- Metrics: Emit custom metrics for success, error, and latency
- Tracing: Enable X-Ray or equivalent tracing where available

## Deployment
- Infrastructure as Code: Use CDK/Terraform with reviewable diffs
- Versioning/Aliases: Publish versions and route traffic via aliases for safe rollout
- CI/CD: Automated builds, tests, and deployments with approvals for production

## Security
- Secrets: Use AWS Secrets Manager or Parameter Store
- Network: Use VPC only when required; understand cold start/network trade-offs
- Input Validation: Validate event payloads; reject malformed inputs early

## Acceptance Criteria
- Function deploys via pipeline with IaC
- Observability in place (logs, metrics, tracing)
- Permissions scoped to minimum required
- Clear error handling and retries configured


