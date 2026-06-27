# Worker Jobs

The `worker` service in `docker-compose.yml` runs `server/jobs/worker.ts`.

Current scaffolded job:

- `POST /api/dormancy/check` with `Authorization: Bearer $CRON_SECRET`

Future jobs should be added to `server/jobs/worker.ts` as small named jobs, then implemented behind authenticated API routes or server services:

- valuation recalculation
- dividend schedules
- audit integrity checks
- marketplace escrow release checks
- notification generation
