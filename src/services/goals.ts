import { supabase, DbGoal, DbMilestone } from '../lib/supabase';
import { GoalItem, Milestone } from '../../types';

// 将数据库里程碑格式转换为前端格式
const toMilestone = (db: DbMilestone): Milestone => ({
    id: db.id,
    title: db.title,
    completed: db.completed,
});

// 将数据库目标格式转换为前端格式
const toGoalItem = (db: DbGoal, milestones: Milestone[] = []): GoalItem => ({
    id: db.id,
    category: db.category,
    title: db.title,
    bgImage: db.bg_image,
    progress: db.progress,
    milestones,
    deadline: db.deadline || undefined,
});

// 将前端目标格式转换为数据库格式
const toDbGoal = (goal: Partial<GoalItem>): Partial<DbGoal> => {
    const result: Partial<DbGoal> = {};
    if (goal.category !== undefined) result.category = goal.category;
    if (goal.title !== undefined) result.title = goal.title;
    if (goal.bgImage !== undefined) result.bg_image = goal.bgImage;
    if (goal.progress !== undefined) result.progress = goal.progress;
    if (goal.deadline !== undefined) result.deadline = goal.deadline;
    return result;
};

// 目标服务
export const goalsService = {
    // 获取所有目标（包含里程碑）
    async getAll(): Promise<GoalItem[]> {
        // 获取所有目标
        const { data: goalsData, error: goalsError } = await supabase
            .from('goals')
            .select('*')
            .order('created_at', { ascending: false });

        if (goalsError) {
            console.error('获取目标失败:', goalsError);
            throw goalsError;
        }

        // 获取所有里程碑
        const { data: milestonesData, error: milestonesError } = await supabase
            .from('milestones')
            .select('*')
            .order('sort_order', { ascending: true });

        if (milestonesError) {
            console.error('获取里程碑失败:', milestonesError);
            throw milestonesError;
        }

        // 按目标ID分组里程碑
        const milestonesByGoal: Record<string, Milestone[]> = {};
        (milestonesData || []).forEach((m: DbMilestone) => {
            if (!milestonesByGoal[m.goal_id]) {
                milestonesByGoal[m.goal_id] = [];
            }
            milestonesByGoal[m.goal_id].push(toMilestone(m));
        });

        // 组合目标和里程碑
        return (goalsData || []).map((g: DbGoal) =>
            toGoalItem(g, milestonesByGoal[g.id] || [])
        );
    },

    // 创建新目标（包含里程碑）
    async create(goal: Partial<GoalItem>): Promise<GoalItem> {
        // 1. 创建目标
        const { data: goalData, error: goalError } = await supabase
            .from('goals')
            .insert(toDbGoal(goal))
            .select()
            .single();

        if (goalError) {
            console.error('创建目标失败:', goalError);
            throw goalError;
        }

        // 2. 创建里程碑
        const milestones: Milestone[] = [];
        if (goal.milestones && goal.milestones.length > 0) {
            const milestonesToInsert = goal.milestones.map((m, index) => ({
                goal_id: goalData.id,
                title: m.title,
                completed: m.completed,
                sort_order: index,
            }));

            const { data: milestonesData, error: milestonesError } = await supabase
                .from('milestones')
                .insert(milestonesToInsert)
                .select();

            if (milestonesError) {
                console.error('创建里程碑失败:', milestonesError);
                throw milestonesError;
            }

            milestones.push(...(milestonesData || []).map(toMilestone));
        }

        return toGoalItem(goalData, milestones);
    },

    // 更新目标（包含里程碑同步）
    async update(id: string, updates: Partial<GoalItem>): Promise<GoalItem> {
        // 1. 更新目标基本信息
        const { data: goalData, error: goalError } = await supabase
            .from('goals')
            .update(toDbGoal(updates))
            .eq('id', id)
            .select()
            .single();

        if (goalError) {
            console.error('更新目标失败:', goalError);
            throw goalError;
        }

        // 2. 同步里程碑（删除旧的，插入新的）
        let milestones: Milestone[] = [];
        if (updates.milestones !== undefined) {
            // 删除现有里程碑
            await supabase
                .from('milestones')
                .delete()
                .eq('goal_id', id);

            // 插入新里程碑
            if (updates.milestones.length > 0) {
                const milestonesToInsert = updates.milestones.map((m, index) => ({
                    goal_id: id,
                    title: m.title,
                    completed: m.completed,
                    sort_order: index,
                }));

                const { data: milestonesData, error: milestonesError } = await supabase
                    .from('milestones')
                    .insert(milestonesToInsert)
                    .select();

                if (milestonesError) {
                    console.error('更新里程碑失败:', milestonesError);
                    throw milestonesError;
                }

                milestones = (milestonesData || []).map(toMilestone);
            }
        } else {
            // 获取现有里程碑
            const { data: existingMilestones } = await supabase
                .from('milestones')
                .select('*')
                .eq('goal_id', id)
                .order('sort_order');

            milestones = (existingMilestones || []).map(toMilestone);
        }

        return toGoalItem(goalData, milestones);
    },

    // 删除目标（里程碑会级联删除）
    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('删除目标失败:', error);
            throw error;
        }
    },
};
