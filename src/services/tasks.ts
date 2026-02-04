import { supabase, DbTask } from '../lib/supabase';
import { TaskItem } from '../../types';

// 将数据库格式转换为前端格式
const toTaskItem = (dbTask: DbTask): TaskItem => ({
    id: dbTask.id,
    title: dbTask.title,
    category: dbTask.category,
    priority: dbTask.priority,
    completed: dbTask.completed,
    isDaily: dbTask.is_daily,
    date: dbTask.date,
});

// 将前端格式转换为数据库格式
const toDbTask = (task: Partial<TaskItem>): Partial<DbTask> => {
    const result: Partial<DbTask> = {};
    if (task.title !== undefined) result.title = task.title;
    if (task.category !== undefined) result.category = task.category;
    if (task.priority !== undefined) result.priority = task.priority;
    if (task.completed !== undefined) result.completed = task.completed;
    if (task.isDaily !== undefined) result.is_daily = task.isDaily;
    if (task.date !== undefined) result.date = task.date;
    return result;
};

// 任务服务
export const tasksService = {
    // 获取所有任务
    async getAll(): Promise<TaskItem[]> {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('获取任务失败:', error);
            throw error;
        }

        return (data || []).map(toTaskItem);
    },

    // 创建新任务
    async create(task: Partial<TaskItem>): Promise<TaskItem> {
        const { data, error } = await supabase
            .from('tasks')
            .insert(toDbTask(task))
            .select()
            .single();

        if (error) {
            console.error('创建任务失败:', error);
            throw error;
        }

        return toTaskItem(data);
    },

    // 更新任务
    async update(id: string, updates: Partial<TaskItem>): Promise<TaskItem> {
        const { data, error } = await supabase
            .from('tasks')
            .update(toDbTask(updates))
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('更新任务失败:', error);
            throw error;
        }

        return toTaskItem(data);
    },

    // 删除任务
    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('删除任务失败:', error);
            throw error;
        }
    },

    // 切换任务完成状态
    async toggleComplete(id: string, completed: boolean): Promise<TaskItem> {
        return this.update(id, { completed });
    },
};
