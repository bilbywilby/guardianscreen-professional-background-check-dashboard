import { Hono } from "hono";
import { z } from 'zod';
import type { Env } from './core-utils';
import { CheckEntity, ConfigEntity, runMockCheck, AuditEntity, logAudit } from "./check-entities";
import { ok, bad } from './core-utils';
import type { BackgroundCheck } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // CONFIG ROUTES
  app.get('/api/config', async (c) => {
    const config = new ConfigEntity(c.env);
    const state = await config.getState();
    if (!state.apiKey) {
        const newKey = `gs_live_${crypto.randomUUID().replaceAll('-', '')}`;
        await config.patch({ apiKey: newKey, mockMode: true });
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
        mockMode: z.boolean().optional(),
      });
      const body = schema.parse(bodyRaw);
      const config = new ConfigEntity(c.env);
      await config.patch(body);
      const ip = c.req.header('CF-Connecting-IP') || 'unknown';
      await logAudit(c.env, ip, 'config.updated', body);
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
    page.items.sort((a, b) => b.createdAt - a.createdAt);
    return ok(c, page);
  });
  app.get('/api/checks/:id', async (c) => {
    const { id } = c.req.param();
    const check = new CheckEntity(c.env, id);
    if (!(await check.exists())) {
        return bad(c, 'Check not found');
    }
    return ok(c, await check.getState());
  });
  app.get('/api/audits', async (c) => {
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const limit = lq ? Math.max(1, Math.min(50, Number(lq) | 0)) : 20;
    const page = await AuditEntity.list(c.env, cq ?? null, limit);
    page.items.sort((a, b) => b.timestamp - a.timestamp);
    return ok(c, page);
  });
  const checkRequestSchema = z.object({
    maskedName: z.string(),
    cacheKey: z.string().length(64),
    // Keep raw PII for creation, but it won't be stored long-term or preferred for display
    name: z.string(),
    dob: z.string(),
    ssn: z.string(),
  });
  app.post('/api/checks', async (c) => {
    try {
      const bodyRaw = await c.req.json<Record<string, unknown>>();
      const body = checkRequestSchema.parse(bodyRaw);
      const config = new ConfigEntity(c.env);
      const ip = c.req.header('CF-Connecting-IP') || 'unknown';
      const creditCheck = await config.deductCredit();
      if (!creditCheck.success) {
        return bad(c, creditCheck.reason || 'Failed to process check.');
      }
      const newCheck: BackgroundCheck = {
        ...body,
        id: crypto.randomUUID(),
        status: 'Pending' as const,
        createdAt: Date.now(),
      };
      await CheckEntity.create(c.env, newCheck);
      await logAudit(c.env, ip, 'check.initiated', {
        checkId: newCheck.id,
        maskedName: body.maskedName,
        cacheKey: body.cacheKey,
      });
      c.executionCtx.waitUntil((async () => {
        const result = await runMockCheck(c.env, newCheck);
        const check = new CheckEntity(c.env, newCheck.id);
        await check.patch({
          status: result.status,
          resultData: result.resultData,
          completedAt: Date.now(),
        });
        await logAudit(c.env, ip, 'check.completed', {
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