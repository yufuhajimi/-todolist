import { createClient } from '@supabase/supabase-js';

// 从环境变量读取 Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('缺少 Supabase 配置。请检查 .env.local 文件中的 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
}

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 数据库表类型定义
export interface DbTask {
  id: string;
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  is_daily: boolean;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface DbInspiration {
  id: string;
  type: 'text' | 'image' | 'voice';
  title: string;
  content: string;
  tags: string[];
  image_src: string | null;
  duration: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbGoal {
  id: string;
  category: string;
  title: string;
  bg_image: string;
  progress: number;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMilestone {
  id: string;
  goal_id: string;
  title: string;
  completed: boolean;
  sort_order: number;
  created_at: string;
}
