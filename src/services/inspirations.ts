import { supabase, DbInspiration } from '../lib/supabase';
import { InspirationItem } from '../../types';

// 格式化时间戳
const formatTimestamp = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;

    return `${date.getMonth() + 1}/${date.getDate()}`;
};

// 将数据库格式转换为前端格式
const toInspirationItem = (db: DbInspiration): InspirationItem => ({
    id: db.id,
    type: db.type,
    title: db.title,
    content: db.content,
    tags: db.tags || [],
    timestamp: formatTimestamp(db.created_at),
    imageSrc: db.image_src || undefined,
    duration: db.duration || undefined,
});

// 将前端格式转换为数据库格式
const toDbInspiration = (item: Partial<InspirationItem>): Partial<DbInspiration> => {
    const result: Partial<DbInspiration> = {};
    if (item.type !== undefined) result.type = item.type;
    if (item.title !== undefined) result.title = item.title;
    if (item.content !== undefined) result.content = item.content;
    if (item.tags !== undefined) result.tags = item.tags;
    if (item.imageSrc !== undefined) result.image_src = item.imageSrc;
    if (item.duration !== undefined) result.duration = item.duration;
    return result;
};

// 灵感服务
export const inspirationsService = {
    // 获取所有灵感
    async getAll(): Promise<InspirationItem[]> {
        const { data, error } = await supabase
            .from('inspirations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('获取灵感失败:', error);
            throw error;
        }

        return (data || []).map(toInspirationItem);
    },

    // 创建新灵感
    async create(item: Partial<InspirationItem>): Promise<InspirationItem> {
        const { data, error } = await supabase
            .from('inspirations')
            .insert(toDbInspiration(item))
            .select()
            .single();

        if (error) {
            console.error('创建灵感失败:', error);
            throw error;
        }

        return toInspirationItem(data);
    },

    // 更新灵感
    async update(id: string, updates: Partial<InspirationItem>): Promise<InspirationItem> {
        const { data, error } = await supabase
            .from('inspirations')
            .update(toDbInspiration(updates))
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('更新灵感失败:', error);
            throw error;
        }

        return toInspirationItem(data);
    },

    // 删除灵感
    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('inspirations')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('删除灵感失败:', error);
            throw error;
        }
    },
};
