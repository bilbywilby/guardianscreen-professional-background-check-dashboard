import { Hono } from "hono";
import { z } from 'zod';
import type { Env } from './core-utils';
import { CheckEntity, ConfigEntity, runMockCheck, AuditEntity, logAudit } from "./check-entities";
import { ok, bad, notFound } from './core-utils';
import type { BackgroundCheck } from "@shared/types";
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
  app.post('/api/config', async (c) => {
    try {
      const bodyRaw = await c.req.json<Record<string, unknown>>();
      const schema = z.object({
        apiKey: z.string().optional(),
        alertThreshold: z.number().min(0).optional(),
        retentionDays: z.number().min(1).optional(),
      });
      const body = schema.parse(bodyRaw);
      const config = new ConfigEntity(c.env);
      await config.patch(body);
      await logAudit(c.env, 'config.updated', body);
      return ok(c, await config.getState());
    } catch (e: any) {
      return bad(c, e instanceof z.ZodError ? e.issues[0]?.message || 'Validation error' : 'Invalid request');
    }
  });
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
  app.get('/api/audits', async (c) => {
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const limit = lq ? Math.max(1, Math.min(50, Number(lq) | 0)) : 20;
    const page = await AuditEntity.list(c.env, cq ?? null, limit);
    page.items.sort((a, b) => b.timestamp - a.timestamp);
    return ok(c, page);
  });
  const checkSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD"),
    ssn: z.string().regex(/^\d{4}$/, "SSN must be the last 4 digits"),
  });
  app.post('/api/checks', async (c) => {
    try {
      const bodyRaw = await c.req.json<Record<string, unknown>>();
      const body = checkSchema.parse(bodyRaw);
      const config = new ConfigEntity(c.env);
      // Check for credits before running a check
      const hasCredits = await config.deductCredit();
      if (!hasCredits) {
        return bad(c, 'Insufficient credits to run a check.');
      }
      const newCheck: BackgroundCheck = {
        ...body,
        id: crypto.randomUUID(),
        status: 'Pending' as const,
        createdAt: Date.now(),
      };
      await CheckEntity.create(c.env, newCheck);
      await logAudit(c.env, 'check.initiated', {
        checkId: newCheck.id,
        name: body.name,
      });
      // Fire-and-forget the mock API call simulation
      c.executionCtx.waitUntil((async () => {
        const result = await runMockCheck();
        const check = new CheckEntity(c.env, newCheck.id);
        await check.patch({
          status: result.status,
          resultData: result.resultData,
          completedAt: Date.now(),
        });
        await logAudit(c.env, 'check.completed', {
          checkId: newCheck.id,
          status: result.status,
        });
      })());
      return ok(c, newCheck);
    } catch (e: any) {
      return bad(c, e instanceof z.ZodError ? e.issues[0]?.message || 'Validation error' : 'Invalid request');
    }
  });
}