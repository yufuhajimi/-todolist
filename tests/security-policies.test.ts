import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const initSql = readFileSync(resolve(process.cwd(), 'supabase/init.sql'), 'utf8');
const migrationSql = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/001_secure_row_ownership.sql'),
  'utf8',
);

describe('Supabase ownership policies', () => {
  it('does not grant unconditional public table access', () => {
    expect(initSql).not.toMatch(/USING\s*\(true\)/i);
    expect(initSql).not.toMatch(/WITH CHECK\s*\(true\)/i);
  });

  it('binds each business table to the authenticated owner', () => {
    for (const table of ['tasks', 'inspirations', 'goals', 'milestones']) {
      expect(initSql).toContain('auth.uid() = user_id');
      expect(initSql).toContain(`用户只能读取自己的 ${table}`);
    }
  });

  it('protects existing data from an unsafe automatic backfill', () => {
    expect(migrationSql).toContain('Ownership migration stopped');
    expect(migrationSql).toContain('ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL');
  });
});
