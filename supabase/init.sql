-- ============================================
-- MindFlow 数据库初始化脚本
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================

-- 1. 创建 tasks 表 (任务)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT DEFAULT '工作',
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    completed BOOLEAN DEFAULT FALSE,
    is_daily BOOLEAN DEFAULT FALSE,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建 inspirations 表 (灵感)
CREATE TABLE IF NOT EXISTS inspirations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'voice')),
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    image_src TEXT,
    duration TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建 goals 表 (目标)
CREATE TABLE IF NOT EXISTS goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT DEFAULT '个人',
    title TEXT NOT NULL,
    bg_image TEXT DEFAULT 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1000',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    deadline DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建 milestones 表 (里程碑)
CREATE TABLE IF NOT EXISTS milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS) 策略
-- 每个用户只能访问自己的数据。anon 角色没有任何业务数据权限。
-- ============================================

-- 启用 RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户只能读取自己的 tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户只能创建自己的 tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户只能更新自己的 tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户只能删除自己的 tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "用户只能读取自己的 inspirations" ON inspirations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户只能创建自己的 inspirations" ON inspirations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户只能更新自己的 inspirations" ON inspirations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户只能删除自己的 inspirations" ON inspirations FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "用户只能读取自己的 goals" ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "用户只能创建自己的 goals" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户只能更新自己的 goals" ON goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户只能删除自己的 goals" ON goals FOR DELETE USING (auth.uid() = user_id);

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

-- ============================================
-- 创建索引提升查询性能
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
CREATE INDEX IF NOT EXISTS idx_tasks_is_daily ON tasks(is_daily);
CREATE INDEX IF NOT EXISTS idx_milestones_goal_id ON milestones(goal_id);

-- ============================================
-- 创建自动更新 updated_at 的触发器
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspirations_updated_at
    BEFORE UPDATE ON inspirations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
    BEFORE UPDATE ON goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 示例数据 (可选，用于测试)
-- ============================================
/*
INSERT INTO tasks (title, category, priority, is_daily, date) VALUES
    ('晨间健身 45分钟', '个人', 'high', false, CURRENT_DATE),
    ('重构产品定价模型', '工作', 'medium', false, CURRENT_DATE),
    ('每日背诵 20 个单词', '学习', 'medium', true, CURRENT_DATE);

INSERT INTO inspirations (type, title, content, tags) VALUES
    ('text', '暗黑模式配色', '使用 #101f22 作为背景色，搭配 #2bcdee 作为强调色，整体采用玻璃拟态风格设计。', ARRAY['#UI设计']);

INSERT INTO goals (category, title, bg_image, progress) VALUES
    ('艺术', '学会吉他弹奏', 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=1000', 33);

INSERT INTO milestones (goal_id, title, completed, sort_order) 
SELECT id, '基础持琴与拨弦', true, 1 FROM goals WHERE title = '学会吉他弹奏'
UNION ALL
SELECT id, '封闭和弦练习', false, 2 FROM goals WHERE title = '学会吉他弹奏'
UNION ALL
SELECT id, '指弹《卡农》', false, 3 FROM goals WHERE title = '学会吉他弹奏';
*/
