# Monitoring & Logging Strategy

## 1. Application Logging (Winston)

- **Levels**: error, warn, info, http
- **Format**: `timestamp [level]: message`
- **Transports**:
  - Console (all environments)
  - `logs/error.log` (production, errors only)
  - `logs/combined.log` (production, all logs)

## 2. Azure Monitor Integration

### Setup

1. Create Application Insights resource in Azure.
2. Add `applicationinsights` package: `npm i applicationinsights`
3. At top of `backend/src/server.js` (before other imports):

```javascript
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  const appInsights = require('applicationinsights');
  appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING).start();
}
```

4. Set `APPLICATIONINSIGHTS_CONNECTION_STRING` in production env.

### What to Monitor

- Request duration, failure rate
- Custom events: `trackEvent({ name: 'AIRecommendation', properties: { type } })`
- Dependencies: MongoDB, Gemini API calls
- Exceptions: unhandled errors sent automatically

## 3. Health Checks

- `GET /health` returns `{ status: 'ok', timestamp }`
- Use for load balancer / container orchestration probes

## 4. Metrics to Track

| Metric | Source |
|--------|--------|
| API latency p95 | Azure Monitor / APM |
| Auth failures | Application Insights |
| AI recommendation latency | Custom metric |
| MongoDB connection pool | Application Insights |
| Error rate | Built-in |

## 5. Alerting

Configure Azure Monitor alerts for:

- Error rate > 5%
- Response time p95 > 2s
- Health endpoint down
- MongoDB connection failures
