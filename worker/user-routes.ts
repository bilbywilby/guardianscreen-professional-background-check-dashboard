import { Hono } from "hono";
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Env } from './core-utils';
import { CheckEntity, ConfigEntity, runMockCheck } from "./check-entities";
import { ok, bad, notFound } from './core-utils';
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // CONFIG ROUTES
  app.get('/api/config', async (c) => {
    const config = new ConfigEntity(c.env);
    const state = await config.getState();
    // On first run, apiKey might be empty. Let's seed one.
    if (!state.apiKey) {
        const newKey = `gs_live_${crypto.randomUUID().replaceAll('-', '')}`;
        await config.patch({ apiKey: newKey });
        return ok(c, await config.getState());
    }
    return ok(c, state);
  });
  app.post('/api/config', 
    zValidator('json', z.object({
      apiKey: z.string().optional(),
      alertThreshold: z.number().min(0).optional(),
      retentionDays: z.number().min(1).optional(),
    })),
    async (c) => {
      const body = c.req.valid('json');
      const config = new ConfigEntity(c.env);
      await config.patch(body);
      return ok(c, await config.getState());
    }
  );
  // CHECK ROUTES
  app.get('/api/checks', async (c) => {
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const limit = lq ? Math.max(1, Math.min(50, Number(lq) | 0)) : 20;
    const page = await CheckEntity.list(c.env, cq ?? null, limit);
    // Sort by creation date descending
    page.items.sort((a, b) => b.createdAt - a.createdAt);
    return ok(c, page);
  });
  const checkSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD"),
    ssn: z.string().regex(/^\d{4}$/, "SSN must be the last 4 digits"),
  });
  app.post('/api/checks', 
    zValidator('json', checkSchema),
    async (c) => {
      const body = c.req.valid('json');
      const config = new ConfigEntity(c.env);
      // Check for credits before running a check
      const hasCredits = await config.deductCredit();
      if (!hasCredits) {
        return bad(c, 'Insufficient credits to run a check.');
      }
      const newCheck = {
        ...body,
        id: crypto.randomUUID(),
        status: 'Pending' as const,
        createdAt: Date.now(),
      };
      await CheckEntity.create(c.env, newCheck);
      // Fire-and-forget the mock API call simulation
      c.executionCtx.waitUntil((async () => {
        const result = await runMockCheck();
        const check = new CheckEntity(c.env, newCheck.id);
        await check.patch({
          status: result.status,
          resultData: result.resultData,
          completedAt: Date.now(),
        });
      })());
      return ok(c, newCheck);
    }
  );
}