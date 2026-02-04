
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Inbox,
  CheckSquare,
  Target,
  User,
  Menu,
  Search,
  Filter,
  Mic,
  Image as ImageIcon,
  MoreHorizontal,
  Edit2,
  Calendar as CalendarIcon,
  Copy,
  Plus,
  ChevronRight,
  ChevronLeft,
  Bolt,
  Maximize2,
  Trash2,
  X,
  StopCircle,
  Hash,
  Check,
  SearchX,
  Settings,
  LogOut,
  RefreshCw,
  Clock,
  ListTodo,
  ChevronDown,
  Type,
  Loader2
} from 'lucide-react';
import { TabId, InspirationItem, TaskItem, GoalItem, Milestone } from './types';
import { tasksService } from './src/services/tasks';
import { inspirationsService } from './src/services/inspirations';
import { goalsService } from './src/services/goals';

// --- Utility Functions ---
const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getTodayStr = () => formatDate(new Date());

type TaskFilter = 'all' | 'daily' | 'overdue' | null;

// --- Loading Component ---
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = '加载中...' }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <Loader2 className="w-10 h-10 text-primary animate-spin" />
    <p className="text-slate-500 text-sm font-medium">{message}</p>
  </div>
);

// --- Sub-Components ---

/**
 * Sidebar / Menu Drawer
 */
const Sidebar: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onFilterSelect: (filter: TaskFilter) => void;
  activeFilter: TaskFilter;
  counts: { all: number; daily: number; overdue: number };
}> = ({ isOpen, onClose, onFilterSelect, activeFilter, counts }) => {
  if (!isOpen) return null;

  const items: { id: TaskFilter | 'settings'; icon: React.ReactNode; label: string; count?: number }[] = [
    { id: 'all', icon: <CheckSquare className="w-5 h-5" />, label: '全部任务', count: counts.all },
    { id: 'daily', icon: <RefreshCw className="w-5 h-5" />, label: '日常循环', count: counts.daily },
    { id: 'overdue', icon: <Clock className="w-5 h-5" />, label: '已过期', count: counts.overdue },
    { id: 'settings', icon: <Settings className="w-5 h-5" />, label: '系统设置' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
      <div
        className="relative w-4/5 max-w-[300px] h-full bg-surface-dark border-r border-white/10 p-8 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-12 shrink-0">
          <div className="size-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-white font-black text-lg">自律达人</h3>
            <p className="text-slate-500 text-xs">普通会员</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1 overflow-y-auto no-scrollbar">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'settings') return;
                onFilterSelect(item.id);
                onClose();
              }}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${activeFilter === item.id ? 'bg-primary/10 text-primary border border-primary/10' : 'hover:bg-white/5 text-slate-300'}`}
            >
              <div className="flex items-center gap-4">
                <span className={`${activeFilter === item.id ? 'text-primary' : 'text-slate-500 group-hover:text-primary'} transition-colors`}>{item.icon}</span>
                <span className="font-bold">{item.label}</span>
              </div>
              {item.count !== undefined && <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeFilter === item.id ? 'bg-primary text-black' : 'bg-white/5 text-slate-500'}`}>{item.count}</span>}
            </button>
          ))}
        </nav>

        <button className="shrink-0 flex items-center gap-4 p-4 text-red-500 font-bold hover:bg-red-500/10 rounded-2xl transition-all mt-auto">
          <LogOut className="w-5 h-5" />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );
};

/**
 * Goal Modal
 */
const GoalModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<GoalItem>) => void;
  initialData?: GoalItem | null;
}> = ({ isOpen, onClose, onSave, initialData }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('个人');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [bgImage, setBgImage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
      setCategory(initialData?.category || '个人');
      setMilestones(initialData?.milestones || []);
      setBgImage(initialData?.bgImage || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1000');
    }
  }, [isOpen, initialData]);

  const addMilestone = () => {
    if (newMilestoneText.trim()) {
      const nm: Milestone = { id: Date.now().toString(), title: newMilestoneText.trim(), completed: false };
      setMilestones([...milestones, nm]);
      setNewMilestoneText('');
    }
  };

  const toggleMilestone = (id: string) => setMilestones(ms => ms.map(m => m.id === id ? { ...m, completed: !m.completed } : m));
  const removeMilestone = (id: string) => setMilestones(ms => ms.filter(m => m.id !== id));
  const calculateProgress = () => milestones.length === 0 ? 0 : Math.round((milestones.filter(m => m.completed).length / milestones.length) * 100);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] glass-overlay flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <div className="bg-surface-dark border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] p-8 w-full max-w-md h-[80vh] sm:h-auto flex flex-col animate-in slide-in-from-bottom-20 duration-300" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6 sm:hidden shrink-0" />
        <div className="flex justify-between items-center mb-8 shrink-0">
          <h3 className="text-white font-black text-2xl">{initialData ? '编辑愿景' : '开启新目标'}</h3>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">目标标题</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white focus:border-primary outline-none" placeholder="你想达成什么？" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">分类</label>
              <input value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white focus:border-primary outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">当前进度</label>
              <div className="h-14 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-center px-4 gap-3">
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${calculateProgress()}%` }} />
                </div>
                <span className="text-primary font-black text-sm">{calculateProgress()}%</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><ListTodo className="w-3 h-3" />里程碑清单</label>
            <div className="space-y-3">
              {milestones.map(m => (
                <div key={m.id} className="flex items-center gap-3 bg-black/20 p-3 rounded-2xl border border-white/5">
                  <button onClick={() => toggleMilestone(m.id)} className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all ${m.completed ? 'bg-primary border-primary' : 'border-white/20'}`}>{m.completed && <Check className="w-4 h-4 text-black stroke-[4]" />}</button>
                  <span className={`flex-1 text-sm font-bold ${m.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{m.title}</span>
                  <button onClick={() => removeMilestone(m.id)} className="p-2 text-slate-600 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-2xl p-2 pl-4">
                <input value={newMilestoneText} onChange={e => setNewMilestoneText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMilestone()} placeholder="添加新里程碑..." className="bg-transparent border-none outline-none text-white text-sm flex-1" />
                <button onClick={addMilestone} className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center active:scale-90 transition-all"><Plus className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-4 shrink-0">
          <button disabled={!title.trim()} onClick={() => { onSave({ title, category, milestones, progress: calculateProgress(), bgImage }); onClose(); }} className="w-full py-5 bg-primary text-black rounded-2xl font-black text-lg active:scale-95 transition-all shadow-[0_10px_30px_rgba(43,205,238,0.2)]">保存愿景</button>
        </div>
      </div>
    </div>
  );
};

/**
 * Inspiration Modal - Updated with separate Title and Content
 */
const InspirationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<InspirationItem>) => void;
  initialData?: InspirationItem | null;
}> = ({ isOpen, onClose, onSave, initialData }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
      setContent(initialData?.content || '');
      setTags(initialData?.tags || []);
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [isOpen, initialData]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim().startsWith('#') ? newTag.trim() : `#${newTag.trim()}`]);
      setNewTag('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] glass-overlay flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <div className="bg-surface-dark border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] p-8 w-full max-w-lg h-[90vh] sm:h-auto flex flex-col animate-in slide-in-from-bottom-20 duration-300" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6 sm:hidden shrink-0" />
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h3 className="text-white font-black text-2xl">{initialData ? '编辑灵感' : '捕捉新灵感'}</h3>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">主标题</label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-primary outline-none transition-all placeholder:text-slate-700"
              placeholder="为灵感取个简短的标题"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">灵感正文</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-primary outline-none transition-all placeholder:text-slate-700 resize-none leading-relaxed"
              placeholder="在这里记录详细内容..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">分类标签</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary font-bold flex items-center gap-2">
                  {tag}
                  <X className="w-3 h-3 cursor-pointer hover:text-white transition-colors" onClick={() => setTags(tags.filter(t => t !== tag))} />
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-2xl px-4 py-3">
              <Hash className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="bg-transparent border-none outline-none text-white text-sm w-full"
                placeholder="添加新标签并回车..."
              />
            </div>
          </div>
        </div>

        <div className="pt-4 shrink-0">
          <button
            disabled={!title.trim() && !content.trim()}
            onClick={() => { onSave({ title, content, tags, type: 'text' }); onClose(); }}
            className="w-full py-5 bg-primary text-background-dark rounded-2xl font-black text-lg active:scale-95 transition-all shadow-[0_10px_30px_rgba(43,205,238,0.3)]"
          >
            保存灵感
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Task Modal
 */
const TaskModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<TaskItem>) => void;
  initialData?: TaskItem | null;
}> = ({ isOpen, onClose, onSave, initialData }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('工作');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isDaily, setIsDaily] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
      setCategory(initialData?.category || '工作');
      setPriority(initialData?.priority || 'medium');
      setIsDaily(initialData?.isDaily || false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] glass-overlay flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <div className="bg-surface-dark border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] p-8 w-full max-sm:w-full max-w-sm animate-in slide-in-from-bottom-20 duration-300 shadow-[0_-20px_60px_rgba(0,0,0,0.5)]" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6 sm:hidden" />
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-white font-black text-2xl">{initialData ? '编辑任务' : '添加新任务'}</h3>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">任务标题</label>
            <input ref={inputRef} type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-primary outline-none transition-all placeholder:text-slate-700 shadow-inner" placeholder="你想做什么？" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">任务类型</label>
              <div className="flex bg-black/40 rounded-2xl p-1 border border-white/5">
                <button onClick={() => setIsDaily(false)} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${!isDaily ? 'bg-primary text-black' : 'text-slate-600 hover:text-slate-400'}`}>普通</button>
                <button onClick={() => setIsDaily(true)} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${isDaily ? 'bg-primary text-black' : 'text-slate-600 hover:text-slate-400'}`}>日常</button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">优先级</label>
              <div className="flex bg-black/40 rounded-2xl p-1 border border-white/5">
                {(['low', 'medium', 'high'] as const).map(p => (
                  <button key={p} onClick={() => setPriority(p)} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${priority === p ? 'bg-primary text-black' : 'text-slate-600 hover:text-slate-400'}`}>{p === 'high' ? '高' : p === 'medium' ? '中' : '低'}</button>
                ))}
              </div>
            </div>
          </div>
          <button disabled={!title.trim()} onClick={() => { onSave({ title, category, priority, isDaily }); onClose(); }} className="w-full py-5 bg-primary text-background-dark rounded-2xl font-black text-lg active:scale-95 transition-all shadow-[0_15px_40px_rgba(43,205,238,0.3)] disabled:opacity-30 mt-4">保存任务</button>
        </div>
      </div>
    </div>
  );
};

/**
 * Calendar Picker Modal
 */
const CalendarModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onSelect: (date: string) => void;
}> = ({ isOpen, onClose, selectedDate, onSelect }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[120] glass-overlay flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-surface-dark border border-white/10 rounded-[32px] p-8 w-full max-w-sm animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <h3 className="text-white font-black text-xl mb-6 flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-primary" /> 选择日期</h3>
        <input type="date" value={selectedDate} onChange={(e) => { onSelect(e.target.value); onClose(); }} className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-white focus:border-primary outline-none text-lg color-scheme-dark" />
        <button onClick={onClose} className="w-full mt-6 py-4 bg-white/5 text-slate-400 rounded-2xl font-bold">取消</button>
      </div>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('tasks');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [inbox, setInbox] = useState<InspirationItem[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInspirationModalOpen, setIsInspirationModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [editingInspiration, setEditingInspiration] = useState<InspirationItem | null>(null);
  const [editingGoal, setEditingGoal] = useState<GoalItem | null>(null);

  const [inboxSearch, setInboxSearch] = useState('');
  const [showInboxSearch, setShowInboxSearch] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [taskFilter, setTaskFilter] = useState<TaskFilter>(null);

  // --- Load Data from Supabase ---
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [tasksData, inspirationsData, goalsData] = await Promise.all([
        tasksService.getAll(),
        inspirationsService.getAll(),
        goalsService.getAll(),
      ]);

      setTasks(tasksData);
      setInbox(inspirationsData);
      setGoals(goalsData);
    } catch (err) {
      console.error('加载数据失败:', err);
      setError('数据加载失败，请检查网络连接和 Supabase 配置');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Handlers ---
  const handleSaveTask = async (data: Partial<TaskItem>) => {
    try {
      if (editingTask) {
        const updated = await tasksService.update(editingTask.id, data);
        setTasks(ts => ts.map(t => t.id === editingTask.id ? updated : t));
      } else {
        const newTask = await tasksService.create({ ...data, date: selectedDate });
        setTasks(ts => [newTask, ...ts]);
      }
    } catch (err) {
      console.error('保存任务失败:', err);
    }
    setEditingTask(null);
  };

  const handleSaveInspiration = async (data: Partial<InspirationItem>) => {
    try {
      if (editingInspiration) {
        const updated = await inspirationsService.update(editingInspiration.id, data);
        setInbox(prev => prev.map(i => i.id === editingInspiration.id ? updated : i));
      } else {
        const newItem = await inspirationsService.create(data);
        setInbox(prev => [newItem, ...prev]);
      }
    } catch (err) {
      console.error('保存灵感失败:', err);
    }
    setEditingInspiration(null);
  };

  const handleSaveGoal = async (data: Partial<GoalItem>) => {
    try {
      if (editingGoal) {
        const updated = await goalsService.update(editingGoal.id, data);
        setGoals(gs => gs.map(g => g.id === editingGoal.id ? updated : g));
      } else {
        const newGoal = await goalsService.create(data);
        setGoals(gs => [newGoal, ...gs]);
      }
    } catch (err) {
      console.error('保存目标失败:', err);
    }
    setEditingGoal(null);
  };

  const deleteInspiration = async (id: string) => {
    try {
      await inspirationsService.delete(id);
      setInbox(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error('删除灵感失败:', err);
    }
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
      const updated = await tasksService.toggleComplete(id, !task.completed);
      setTasks(ts => ts.map(t => t.id === id ? updated : t));
    } catch (err) {
      console.error('切换任务状态失败:', err);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await tasksService.delete(id);
      setTasks(ts => ts.filter(t => t.id !== id));
    } catch (err) {
      console.error('删除任务失败:', err);
    }
  };

  const handleGlobalAdd = () => {
    if (activeTab === 'inbox') {
      setEditingInspiration(null);
      setIsInspirationModalOpen(true);
    } else if (activeTab === 'tasks') {
      setEditingTask(null);
      setIsTaskModalOpen(true);
    } else if (activeTab === 'goals') {
      setEditingGoal(null);
      setIsGoalModalOpen(true);
    }
  };

  const handleFilterSelect = (filter: TaskFilter) => {
    setTaskFilter(filter);
    setActiveTab('tasks');
  };

  // --- Filtering Logic ---
  const filteredInbox = inbox.filter(item =>
    item.title.toLowerCase().includes(inboxSearch.toLowerCase()) ||
    item.content.toLowerCase().includes(inboxSearch.toLowerCase()) ||
    item.tags.some(t => t.toLowerCase().includes(inboxSearch.toLowerCase()))
  );

  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'daily') return t.isDaily;
    if (taskFilter === 'overdue') return !t.completed && t.date < getTodayStr() && !t.isDaily;
    if (t.isDaily) return true;
    if (t.completed) return t.date === selectedDate;
    return t.date <= selectedDate;
  });

  const progress = filteredTasks.length > 0 ? Math.round((filteredTasks.filter(t => t.completed).length / filteredTasks.length) * 100) : 0;
  const counts = {
    all: tasks.length,
    daily: tasks.filter(t => t.isDaily).length,
    overdue: tasks.filter(t => !t.completed && t.date < getTodayStr() && !t.isDaily).length,
  };

  const getFilterLabel = () => {
    if (taskFilter === 'all') return '全部任务';
    if (taskFilter === 'daily') return '日常循环';
    if (taskFilter === 'overdue') return '已过期任务';
    return selectedDate === getTodayStr() ? '今天' : selectedDate;
  };

  // Show loading or error state
  if (isLoading) {
    return (
      <div className="flex flex-col h-[100dvh] w-full bg-background-dark overflow-hidden font-sans select-none items-center justify-center">
        <LoadingSpinner message="正在连接 Supabase..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-[100dvh] w-full bg-background-dark overflow-hidden font-sans select-none items-center justify-center gap-6 p-8">
        <div className="text-red-500 text-6xl">⚠️</div>
        <h2 className="text-white text-xl font-bold text-center">{error}</h2>
        <p className="text-slate-500 text-sm text-center">请确保已在 Supabase 执行 init.sql 建表脚本</p>
        <button
          onClick={loadData}
          className="px-6 py-3 bg-primary text-black rounded-xl font-bold flex items-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-background-dark overflow-hidden font-sans select-none">

      <main className="flex-1 relative overflow-y-auto no-scrollbar pb-[120px]">
        {activeTab === 'tasks' && (
          <div className="p-6 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <button onClick={() => setIsSidebarOpen(true)} className="p-3 -ml-3 text-slate-400 active:scale-90 hover:text-white transition-all"><Menu className="w-6 h-6" /></button>
              <h1 className="text-white text-lg font-black tracking-tight">每日待办与规划</h1>
              <div className="flex items-center gap-1">
                <button onClick={() => setIsCalendarOpen(true)} className="text-primary active:scale-90 p-3 hover:bg-primary/10 rounded-full transition-all"><CalendarIcon className="w-6 h-6" /></button>
                <div className="size-9 rounded-full bg-surface-dark border border-white/10 flex items-center justify-center overflow-hidden"><User className="w-5 h-5 text-slate-500" /></div>
              </div>
            </div>
            <div className="flex items-end justify-between border-b border-white/5 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{taskFilter ? 'FILTER VIEW' : (selectedDate === getTodayStr() ? 'TODAY' : 'PLANNED DATE')}</span>
                <h2 className="text-3xl font-black text-white flex items-center gap-2">{getFilterLabel()}{taskFilter && <ChevronDown className="w-6 h-6 text-primary" />}</h2>
              </div>
              {(selectedDate !== getTodayStr() || taskFilter) && <button onClick={() => { setSelectedDate(getTodayStr()); setTaskFilter(null); }} className="px-4 py-2 bg-primary/10 text-primary text-xs font-black rounded-xl border border-primary/20 active:scale-95 transition-all">清除筛选</button>}
            </div>
            <div className="bg-[#1a2c30] border border-primary/20 p-6 rounded-3xl relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center"><CheckSquare className="w-4 h-4 text-primary" /></div>
                  <span className="text-white text-sm font-black">完成进度</span>
                </div>
                <div className="flex items-baseline gap-1"><span className="text-primary text-2xl font-black tracking-tighter">{progress}</span><span className="text-primary/50 text-sm font-bold">%</span></div>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(43,205,238,0.5)]" style={{ width: `${progress}%` }} /></div>
              <p className="text-slate-500 text-[10px] mt-5 italic font-medium flex items-center gap-2"><Bolt className="w-3 h-3 text-primary fill-current" />"自律即自由，从每一件小事做起"</p>
            </div>
            <div className="space-y-4">
              {filteredTasks.map(task => (
                <div key={task.id} className={`group relative flex items-center gap-4 p-5 rounded-3xl border transition-all active:scale-[0.99] ${task.completed ? 'bg-slate-900/40 border-white/5 opacity-40' : 'bg-surface-dark border-white/5 shadow-xl hover:border-white/10'}`}>
                  <button onClick={() => toggleTask(task.id)} className={`size-8 rounded-xl border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-primary border-primary' : 'border-primary/30 hover:border-primary'}`}>{task.completed && <Check className="w-6 h-6 text-black stroke-[4]" />}</button>
                  <div className="flex-1 min-w-0" onClick={() => { setEditingTask(task); setIsTaskModalOpen(true); }}>
                    <div className="flex items-center gap-2 mb-1">
                      {task.isDaily && <span className="text-[9px] font-black bg-primary text-black px-1.5 py-0.5 rounded-md flex items-center gap-1 uppercase tracking-tighter shadow-sm shadow-primary/20"><RefreshCw className="w-2 h-2" /> 日常</span>}
                      {task.date < getTodayStr() && !task.completed && !task.isDaily && <span className="text-[9px] font-black bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-md flex items-center gap-1 uppercase tracking-tighter"><Clock className="w-2 h-2" /> 延期</span>}
                    </div>
                    <p className={`text-base font-bold truncate ${task.completed ? 'text-slate-500 line-through' : 'text-white'}`}>{task.title}</p>
                    <div className="flex gap-2 mt-2"><span className="text-[10px] font-black text-slate-500 uppercase px-2 py-0.5 bg-white/5 rounded-md border border-white/5">{task.category}</span></div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} className="p-3 text-red-500/0 group-hover:text-red-500 transition-all hover:bg-red-500/10 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                </div>
              ))}
              <button onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }} className="w-full py-12 rounded-3xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-4 text-slate-600 hover:text-primary transition-all active:scale-[0.98] group"><div className="size-14 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-all"><Plus className="w-8 h-8" /></div><span className="font-black text-sm tracking-widest uppercase">添加新待办</span></button>
            </div>
          </div>
        )}

        {activeTab === 'inbox' && (
          <div className="p-6 space-y-6 animate-in slide-in-from-left-4 duration-500">
            <header className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-2xl border border-primary/20 shadow-lg shadow-primary/10"><Inbox className="w-6 h-6 text-primary" /></div>
                <div><h1 className="text-2xl font-black text-white">灵感捕捉</h1><p className="text-slate-500 text-xs font-bold">捕捉每一个闪现的奇思妙想</p></div>
              </div>
              <button onClick={() => setShowInboxSearch(!showInboxSearch)} className={`p-3 rounded-full transition-all active:scale-90 ${showInboxSearch ? 'bg-primary text-black' : 'text-slate-400 hover:bg-white/5'}`}><Search className="w-6 h-6" /></button>
            </header>

            {showInboxSearch && (
              <div className="bg-surface-dark/50 border border-white/10 p-5 rounded-3xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300 shadow-2xl mb-6">
                <Search className="w-5 h-5 text-slate-500" />
                <input
                  autoFocus
                  value={inboxSearch}
                  onChange={e => setInboxSearch(e.target.value)}
                  placeholder="搜索标题、内容或标签..."
                  className="bg-transparent border-none outline-none text-white w-full font-bold text-sm"
                />
                {inboxSearch && <X className="w-5 h-5 text-slate-500 cursor-pointer" onClick={() => setInboxSearch('')} />}
              </div>
            )}

            <div className="grid gap-5">
              {filteredInbox.map(item => (
                <div
                  key={item.id}
                  onClick={() => { setEditingInspiration(item); setIsInspirationModalOpen(true); }}
                  className="bg-surface-dark p-6 rounded-[32px] border border-white/5 active:scale-[0.98] transition-all relative group hover:border-white/10 shadow-xl overflow-hidden"
                >
                  <button onClick={(e) => { e.stopPropagation(); deleteInspiration(item.id); }} className="absolute top-5 right-5 p-2 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg"><Type className="w-3 h-3 text-primary" /></div>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.timestamp}</p>
                  </div>
                  <h3 className="text-xl font-black text-white leading-tight mb-3 group-hover:text-primary transition-colors">{item.title || "无标题"}</h3>
                  <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed mb-5 font-medium">{item.content}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map(t => (
                      <span key={t} className="text-primary text-[10px] font-black bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
              {filteredInbox.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-slate-600 italic gap-6 opacity-30">
                  <SearchX className="w-16 h-16" />
                  <p className="font-bold text-sm tracking-widest">暂无相关灵感记录</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="p-6 space-y-8 animate-in slide-in-from-right-4 duration-500">
            <header className="mb-6"><h1 className="text-3xl font-black text-white mb-2 tracking-tight">长远目标</h1><p className="text-slate-500 text-sm font-bold">将愿景拆解为可执行的步骤</p></header>
            <div className="grid gap-6 pb-20">
              {goals.map(goal => (
                <div key={goal.id} onClick={() => { setEditingGoal(goal); setIsGoalModalOpen(true); }} className="relative h-56 rounded-[40px] overflow-hidden shadow-2xl active:scale-[0.98] transition-all group border border-white/5">
                  <img src={goal.bgImage} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-1000" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/20 to-transparent p-8 flex flex-col justify-end">
                    <span className="self-start px-4 py-1.5 bg-primary text-black text-[10px] font-black rounded-xl mb-auto uppercase tracking-widest border border-primary/10">{goal.category}</span>
                    <h3 className="text-2xl font-black text-white mb-2">{goal.title}</h3>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold flex items-center gap-2"><Target className="w-3 h-3 text-primary" />里程碑: {goal.milestones.find(m => !m.completed)?.title || '全部达成!'}</span>
                      <span className="text-xl font-black text-primary drop-shadow-[0_0_10px_rgba(43,205,238,0.5)]">{goal.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full mt-4 overflow-hidden border border-white/5"><div className="h-full bg-primary transition-all duration-1000 shadow-[0_0_15px_rgba(43,205,238,0.6)]" style={{ width: `${goal.progress}%` }} /></div>
                  </div>
                </div>
              ))}
              <button onClick={() => { setEditingGoal(null); setIsGoalModalOpen(true); }} className="h-56 rounded-[40px] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-4 text-slate-600 transition-all active:scale-[0.98] group bg-white/[0.01]"><div className="size-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-all"><Plus className="w-8 h-8" /></div><span className="font-black tracking-widest text-sm">开启新的愿景计划</span></button>
            </div>
          </div>
        )}
      </main>

      {/* FAB */}
      <button onClick={handleGlobalAdd} className="fixed bottom-[115px] right-8 size-16 bg-primary text-background-dark rounded-full shadow-[0_15px_45px_rgba(43,205,238,0.5)] flex items-center justify-center active:scale-90 transition-all z-50 border-4 border-background-dark group"><Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" strokeWidth={4} /></button>

      {/* Nav */}
      <nav className="h-[105px] bg-surface-dark/95 backdrop-blur-3xl border-t border-white/5 flex items-center justify-around px-8 pb-10 z-[100] shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
        <button onClick={() => { setActiveTab('inbox'); setTaskFilter(null); }} className={`flex flex-col items-center gap-2 transition-all active:scale-95 ${activeTab === 'inbox' ? 'text-primary translate-y-[-5px]' : 'text-slate-600'}`}><div className={`p-2 rounded-2xl transition-all ${activeTab === 'inbox' ? 'bg-primary/10' : ''}`}><Inbox className={`w-6 h-6 ${activeTab === 'inbox' ? 'fill-current' : ''}`} /></div><span className="text-[9px] font-black uppercase tracking-[0.2em]">灵感</span></button>
        <button onClick={() => setActiveTab('tasks')} className={`flex flex-col items-center gap-2 transition-all active:scale-95 ${activeTab === 'tasks' ? 'text-primary translate-y-[-5px]' : 'text-slate-600'}`}><div className={`p-2 rounded-2xl transition-all ${activeTab === 'tasks' ? 'bg-primary/10' : ''}`}><CheckSquare className={`w-6 h-6 ${activeTab === 'tasks' ? 'fill-current' : ''}`} /></div><span className="text-[9px] font-black uppercase tracking-[0.2em]">待办</span></button>
        <button onClick={() => { setActiveTab('goals'); setTaskFilter(null); }} className={`flex flex-col items-center gap-2 transition-all active:scale-95 ${activeTab === 'goals' ? 'text-primary translate-y-[-5px]' : 'text-slate-600'}`}><div className={`p-2 rounded-2xl transition-all ${activeTab === 'goals' ? 'bg-primary/10' : ''}`}><Target className={`w-6 h-6 ${activeTab === 'goals' ? 'fill-current' : ''}`} /></div><span className="text-[9px] font-black uppercase tracking-[0.2em]">愿景</span></button>
      </nav>

      {/* Modals */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onFilterSelect={handleFilterSelect}
        activeFilter={taskFilter}
        counts={counts}
      />
      <TaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} onSave={handleSaveTask} initialData={editingTask} />
      <InspirationModal isOpen={isInspirationModalOpen} onClose={() => setIsInspirationModalOpen(false)} onSave={handleSaveInspiration} initialData={editingInspiration} />
      <GoalModal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} onSave={handleSaveGoal} initialData={editingGoal} />
      <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} selectedDate={selectedDate} onSelect={setSelectedDate} />
    </div>
  );
};

export default App;
