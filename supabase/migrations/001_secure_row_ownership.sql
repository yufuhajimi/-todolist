ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE inspirations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Apply this migration only after reviewing the data. It intentionally stops
-- if existing rows have no ownership mapping.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM tasks WHERE user_id IS NULL)
       OR EXISTS (SELECT 1 FROM inspirations WHERE user_id IS NULL)
       OR EXISTS (SELECT 1 FROM goals WHERE user_id IS NULL)
       OR EXISTS (SELECT 1 FROM milestones WHERE user_id IS NULL) THEN
        RAISE EXCEPTION 'Ownership migration stopped: map existing rows to auth.users before adding NOT NULL constraints';
    END IF;
END $$;

ALTER TABLE tasks ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE inspirations ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE goals ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE milestones ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE inspirations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE goals ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE milestones ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "允许公开读取 tasks" ON tasks;
DROP POLICY IF EXISTS "允许公开插入 tasks" ON tasks;
DROP POLICY IF EXISTS "允许公开更新 tasks" ON tasks;
DROP POLICY IF EXISTS "允许公开删除 tasks" ON tasks;
DROP POLICY IF EXISTS "允许公开读取 inspirations" ON inspirations;
DROP POLICY IF EXISTS "允许公开插入 inspirations" ON inspirations;
DROP POLICY IF EXISTS "允许公开更新 inspirations" ON inspirations;
DROP POLICY IF EXISTS "允许公开删除 inspirations" ON inspirations;
DROP POLICY IF EXISTS "允许公开读取 goals" ON goals;
DROP POLICY IF EXISTS "允许公开插入 goals" ON goals;
DROP POLICY IF EXISTS "允许公开更新 goals" ON goals;
DROP POLICY IF EXISTS "允许公开删除 goals" ON goals;
DROP POLICY IF EXISTS "允许公开读取 milestones" ON milestones;
DROP POLICY IF EXISTS "允许公开插入 milestones" ON milestones;
DROP POLICY IF EXISTS "允许公开更新 milestones" ON milestones;
DROP POLICY IF EXISTS "允许公开删除 milestones" ON milestones;

DROP POLICY IF EXISTS "用户只能读取自己的 tasks" ON tasks;
DROP POLICY IF EXISTS "用户只能创建自己的 tasks" ON tasks;
DROP POLICY IF EXISTS "用户只能更新自己的 tasks" ON tasks;
DROP POLICY IF EXISTS "用户只能删除自己的 tasks" ON tasks;
CREATE POLICY "用户只能读取自己的 tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户只能创建自己的 tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户只能更新自己的 tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户只能删除自己的 tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户只能读取自己的 inspirations" ON inspirations;
DROP POLICY IF EXISTS "用户只能创建自己的 inspirations" ON inspirations;
DROP POLICY IF EXISTS "用户只能更新自己的 inspirations" ON inspirations;
DROP POLICY IF EXISTS "用户只能删除自己的 inspirations" ON inspirations;
CREATE POLICY "用户只能读取自己的 inspirations" ON inspirations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户只能创建自己的 inspirations" ON inspirations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户只能更新自己的 inspirations" ON inspirations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户只能删除自己的 inspirations" ON inspirations FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户只能读取自己的 goals" ON goals;
DROP POLICY IF EXISTS "用户只能创建自己的 goals" ON goals;
DROP POLICY IF EXISTS "用户只能更新自己的 goals" ON goals;
DROP POLICY IF EXISTS "用户只能删除自己的 goals" ON goals;
CREATE POLICY "用户只能读取自己的 goals" ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户只能创建自己的 goals" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户只能更新自己的 goals" ON goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户只能删除自己的 goals" ON goals FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户只能读取自己的 milestones" ON milestones;
DROP POLICY IF EXISTS "用户只能创建自己的 milestones" ON milestones;
DROP POLICY IF EXISTS "用户只能更新自己的 milestones" ON milestones;
DROP POLICY IF EXISTS "用户只能删除自己的 milestones" ON milestones;
CREATE POLICY "用户只能读取自己的 milestones" ON milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户只能创建自己的 milestones" ON milestones FOR INSERT
    WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM goals WHERE goals.id = milestones.goal_id AND goals.user_id = auth.uid()));
CREATE POLICY "用户只能更新自己的 milestones" ON milestones FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM goals WHERE goals.id = milestones.goal_id AND goals.user_id = auth.uid()));
CREATE POLICY "用户只能删除自己的 milestones" ON milestones FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_inspirations_user_id ON inspirations(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON milestones(user_id);
