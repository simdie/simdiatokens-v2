"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { format, parseISO, isPast } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  fetchTaskLists,
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  Task,
  TaskList,
} from "@/lib/api";
import {
  ArrowLeft, Plus, Search, Loader2, Check, CheckSquare, Square, Trash2, Edit3,
  Calendar, Clock, AlertCircle, Star, ListTodo, X, ChevronDown,
} from "lucide-react";

interface TasksViewProps {
  tokenId: string;
  onBack: () => void;
}

export default function TasksView({ tokenId, onBack }: TasksViewProps) {
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [activeListId, setActiveListId] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formDueTime, setFormDueTime] = useState("23:59");
  const [formImportance, setFormImportance] = useState("normal");
  const [formStatus, setFormStatus] = useState("notStarted");
  const [formReminder, setFormReminder] = useState(false);

  const loadTaskLists = useCallback(async () => {
    if (!tokenId) return;
    setLoading(true);
    try {
      const data = await fetchTaskLists(tokenId);
      const lists = data.lists || [];
      setTaskLists(lists);
      // Select default list if available
      const defaultList = lists.find((l) => l.wellknownListName === "defaultList");
      if (defaultList) {
        setActiveListId(defaultList.id);
      } else if (lists.length > 0) {
        setActiveListId(lists[0].id);
      }
    } catch (err: any) {
      toast.error("Failed to load task lists", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [tokenId]);

  const loadTasks = useCallback(async () => {
    if (!tokenId || !activeListId) return;
    setLoading(true);
    try {
      const data = await fetchTasks(tokenId, activeListId);
      setTasks(data.tasks || []);
    } catch (err: any) {
      toast.error("Failed to load tasks", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [tokenId, activeListId]);

  useEffect(() => {
    loadTaskLists();
  }, [loadTaskLists]);

  useEffect(() => {
    if (activeListId) loadTasks();
  }, [activeListId, loadTasks]);

  const resetForm = () => {
    setFormTitle("");
    setFormBody("");
    setFormDueDate("");
    setFormDueTime("23:59");
    setFormImportance("normal");
    setFormStatus("notStarted");
    setFormReminder(false);
  };

  const populateForm = (task: Task) => {
    setFormTitle(task.title || "");
    setFormBody(task.body?.content || "");
    if (task.dueDateTime?.dateTime) {
      const date = parseISO(task.dueDateTime.dateTime);
      setFormDueDate(format(date, "yyyy-MM-dd"));
      setFormDueTime(format(date, "HH:mm"));
    } else {
      setFormDueDate("");
      setFormDueTime("23:59");
    }
    setFormImportance(task.importance || "normal");
    setFormStatus(task.status || "notStarted");
    setFormReminder(task.isReminderOn || false);
  };

  const handleCreateTask = async () => {
    if (!tokenId || !activeListId || !formTitle.trim()) return;
    setSaving(true);
    try {
      const payload: any = {
        title: formTitle.trim(),
        importance: formImportance,
        status: formStatus,
      };
      if (formBody.trim()) payload.body = formBody.trim();
      if (formDueDate) {
        payload.due_date_time = `${formDueDate}T${formDueTime}:00.000Z`;
      }

      await createTask(tokenId, activeListId, payload);
      toast.success("Task created");
      setCreateDialogOpen(false);
      resetForm();
      loadTasks();
    } catch (err: any) {
      toast.error("Failed to create task", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!tokenId || !activeListId || !selectedTask || !formTitle.trim()) return;
    setSaving(true);
    try {
      const payload: any = {
        title: formTitle.trim(),
        importance: formImportance,
        status: formStatus,
        is_reminder_on: formReminder,
      };
      if (formBody.trim()) payload.body = formBody.trim();
      if (formDueDate) {
        payload.due_date_time = `${formDueDate}T${formDueTime}:00.000Z`;
      } else {
        payload.due_date_time = null;
      }

      await updateTask(tokenId, activeListId, selectedTask.id, payload);
      toast.success("Task updated");
      setEditDialogOpen(false);
      resetForm();
      setSelectedTask(null);
      loadTasks();
    } catch (err: any) {
      toast.error("Failed to update task", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
    if (!tokenId || !activeListId) return;
    const newStatus = task.status === "completed" ? "notStarted" : "completed";
    try {
      await updateTask(tokenId, activeListId, task.id, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
      toast.success(newStatus === "completed" ? "Task completed" : "Task reopened");
    } catch (err: any) {
      toast.error("Failed to update task", { description: err.message });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!tokenId || !activeListId || !confirm("Delete this task?")) return;
    try {
      await deleteTask(tokenId, activeListId, taskId);
      toast.success("Task deleted");
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (selectedTask?.id === taskId) setSelectedTask(null);
    } catch (err: any) {
      toast.error("Failed to delete task", { description: err.message });
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const q = searchQuery.toLowerCase();
    return (
      task.title?.toLowerCase().includes(q) ||
      task.body?.content?.toLowerCase().includes(q)
    );
  });

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const overdueCount = tasks.filter((t) => {
    if (t.status === "completed") return false;
    if (!t.dueDateTime?.dateTime) return false;
    return isPast(parseISO(t.dueDateTime.dateTime));
  }).length;

  const formatTaskDate = (task: Task) => {
    if (!task.dueDateTime?.dateTime) return null;
    const date = parseISO(task.dueDateTime.dateTime);
    const isOverdue = task.status !== "completed" && isPast(date);
    return {
      text: format(date, "MMM d, yyyy h:mm a"),
      isOverdue,
    };
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0f1115]">
      {/* Tasks Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2e37]">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-[#e2e8f0] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Mail
          </button>
          <div className="h-4 w-px bg-[#2a2e37]" />
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-[#0f6cbd]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">To Do</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] bg-[#0f6cbd]/10 text-[#0f6cbd] border-[#0f6cbd]/20">
              {tasks.length - completedCount} active
            </Badge>
            {completedCount > 0 && (
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                {completedCount} done
              </Badge>
            )}
            {overdueCount > 0 && (
              <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-400 border-rose-500/20">
                {overdueCount} overdue
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* List selector */}
          {taskLists.length > 1 && (
            <Select value={activeListId} onValueChange={(v) => v && setActiveListId(v)}>
              <SelectTrigger className="w-48 h-8 text-xs bg-[#1a1d24] border-[#2a2e37] text-[#e2e8f0]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1d24] border-[#2a2e37]">
                {taskLists.map((list) => (
                  <SelectItem key={list.id} value={list.id} className="text-xs text-[#e2e8f0]">
                    {list.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748b]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="pl-9 w-48 h-8 text-xs bg-[#1a1d24] border-[#2a2e37] text-[#e2e8f0]"
            />
          </div>
          <Button size="sm" onClick={() => { resetForm(); setCreateDialogOpen(true); }} className="bg-[#0f6cbd] hover:bg-[#0f6cbd]/90 text-white h-8 text-xs gap-1">
            <Plus className="h-3.5 w-3.5" /> New Task
          </Button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto">
        {loading && tasks.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-5 w-5 animate-spin text-[#0f6cbd]" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#94a3b8]">
            <ListTodo className="h-12 w-12 mb-3 text-[#2a2e37]" />
            <p className="text-sm">No tasks found</p>
            <p className="text-xs text-[#64748b] mt-1">
              {searchQuery ? "Try a different search" : "Add a new task to get started"}
            </p>
          </div>
        ) : (
          <div className="px-4 py-2 space-y-1">
            {filteredTasks.map((task, index) => {
              const isCompleted = task.status === "completed";
              const dateInfo = formatTaskDate(task);
              const isImportant = task.importance === "high";

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "group flex items-start gap-3 px-3 py-2.5 rounded-lg border border-[#2a2e37] bg-[#1a1d24] hover:bg-[#1a1d24]/80 transition-colors",
                    isCompleted && "opacity-60"
                  )}
                >
                  {/* Checkbox */}
                  <div className="pt-0.5 flex-shrink-0">
                    <button
                      onClick={() => handleToggleTaskStatus(task)}
                      className={cn(
                        "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors",
                        isCompleted
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-[#475569] hover:border-[#0f6cbd]"
                      )}
                    >
                      {isCompleted && <Check className="h-3.5 w-3.5 text-white" />}
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "text-sm text-[#e2e8f0]",
                        isCompleted && "line-through text-[#64748b]"
                      )}>
                        {task.title}
                      </p>
                      {isImportant && (
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                      )}
                    </div>
                    {task.body?.content && (
                      <p className={cn(
                        "text-xs text-[#94a3b8] mt-0.5",
                        isCompleted && "text-[#64748b]"
                      )}>
                        {task.body.content}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {dateInfo && (
                        <span className={cn(
                          "text-[10px] flex items-center gap-1",
                          dateInfo.isOverdue ? "text-rose-400" : "text-[#64748b]"
                        )}>
                          <Calendar className="h-3 w-3" />
                          {dateInfo.text}
                          {dateInfo.isOverdue && " (overdue)"}
                        </span>
                      )}
                      {task.isReminderOn && (
                        <span className="text-[10px] text-[#64748b] flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Reminder
                        </span>
                      )}
                      {task.status === "inProgress" && (
                        <Badge variant="outline" className="text-[9px] bg-[#0f6cbd]/10 text-[#0f6cbd] border-[#0f6cbd]/20">
                          In Progress
                        </Badge>
                      )}
                      {task.status === "completed" && (
                        <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          Completed
                        </Badge>
                      )}
                      {task.status === "notStarted" && (
                        <Badge variant="outline" className="text-[9px] bg-[#1a1d24] text-[#64748b] border-[#2a2e37]">
                          Not Started
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => {
                        populateForm(task);
                        setSelectedTask(task);
                        setEditDialogOpen(true);
                      }}
                      className="p-1.5 rounded hover:bg-[#2a2e37] text-[#94a3b8] hover:text-[#e2e8f0]"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 rounded hover:bg-rose-500/10 text-[#94a3b8] hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Task Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#1a1d24] border-[#2a2e37]">
          <DialogHeader>
            <DialogTitle className="text-[#e2e8f0]">New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-[#94a3b8]">Title *</label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-[#94a3b8]">Notes</label>
              <textarea
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                placeholder="Add details..."
                rows={3}
                className="w-full bg-[#0f1115] border border-[#2a2e37] rounded-lg text-xs text-[#e2e8f0] p-2 outline-none focus-visible:ring-1 focus-visible:ring-[#0f6cbd] resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#94a3b8]">Due Date</label>
                <Input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8]">Due Time</label>
                <Input
                  type="time"
                  value={formDueTime}
                  onChange={(e) => setFormDueTime(e.target.value)}
                  className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#94a3b8]">Importance</label>
                <Select value={formImportance} onValueChange={(v) => v && setFormImportance(v)}>
                  <SelectTrigger className="bg-[#0f1115] border-[#2a2e37] text-xs text-[#e2e8f0]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d24] border-[#2a2e37]">
                    <SelectItem value="normal" className="text-xs text-[#e2e8f0]">Normal</SelectItem>
                    <SelectItem value="high" className="text-xs text-[#e2e8f0]">High</SelectItem>
                    <SelectItem value="low" className="text-xs text-[#e2e8f0]">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-[#94a3b8]">Status</label>
                <Select value={formStatus} onValueChange={(v) => v && setFormStatus(v)}>
                  <SelectTrigger className="bg-[#0f1115] border-[#2a2e37] text-xs text-[#e2e8f0]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d24] border-[#2a2e37]">
                    <SelectItem value="notStarted" className="text-xs text-[#e2e8f0]">Not Started</SelectItem>
                    <SelectItem value="inProgress" className="text-xs text-[#e2e8f0]">In Progress</SelectItem>
                    <SelectItem value="completed" className="text-xs text-[#e2e8f0]">Completed</SelectItem>
                    <SelectItem value="waitingOnOthers" className="text-xs text-[#e2e8f0]">Waiting</SelectItem>
                    <SelectItem value="deferred" className="text-xs text-[#e2e8f0]">Deferred</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formReminder}
                onCheckedChange={(v) => setFormReminder(v === true)}
                className="border-[#475569] data-[state=checked]:bg-[#0f6cbd] data-[state=checked]:border-[#0f6cbd]"
              />
              <label className="text-xs text-[#94a3b8]">Set reminder</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setCreateDialogOpen(false); resetForm(); }} className="border-[#2a2e37]">Cancel</Button>
            <Button size="sm" onClick={handleCreateTask} disabled={saving || !formTitle.trim()} className="bg-[#0f6cbd] hover:bg-[#0f6cbd]/90 text-white gap-1">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <Plus className="h-3.5 w-3.5" /> Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#1a1d24] border-[#2a2e37]">
          <DialogHeader>
            <DialogTitle className="text-[#e2e8f0]">Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-[#94a3b8]">Title *</label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-[#94a3b8]">Notes</label>
              <textarea
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                placeholder="Add details..."
                rows={3}
                className="w-full bg-[#0f1115] border border-[#2a2e37] rounded-lg text-xs text-[#e2e8f0] p-2 outline-none focus-visible:ring-1 focus-visible:ring-[#0f6cbd] resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#94a3b8]">Due Date</label>
                <Input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8]">Due Time</label>
                <Input
                  type="time"
                  value={formDueTime}
                  onChange={(e) => setFormDueTime(e.target.value)}
                  className="bg-[#0f1115] border-[#2a2e37] text-[#e2e8f0] text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#94a3b8]">Importance</label>
                <Select value={formImportance} onValueChange={(v) => v && setFormImportance(v)}>
                  <SelectTrigger className="bg-[#0f1115] border-[#2a2e37] text-xs text-[#e2e8f0]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d24] border-[#2a2e37]">
                    <SelectItem value="normal" className="text-xs text-[#e2e8f0]">Normal</SelectItem>
                    <SelectItem value="high" className="text-xs text-[#e2e8f0]">High</SelectItem>
                    <SelectItem value="low" className="text-xs text-[#e2e8f0]">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-[#94a3b8]">Status</label>
                <Select value={formStatus} onValueChange={(v) => v && setFormStatus(v)}>
                  <SelectTrigger className="bg-[#0f1115] border-[#2a2e37] text-xs text-[#e2e8f0]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d24] border-[#2a2e37]">
                    <SelectItem value="notStarted" className="text-xs text-[#e2e8f0]">Not Started</SelectItem>
                    <SelectItem value="inProgress" className="text-xs text-[#e2e8f0]">In Progress</SelectItem>
                    <SelectItem value="completed" className="text-xs text-[#e2e8f0]">Completed</SelectItem>
                    <SelectItem value="waitingOnOthers" className="text-xs text-[#e2e8f0]">Waiting</SelectItem>
                    <SelectItem value="deferred" className="text-xs text-[#e2e8f0]">Deferred</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formReminder}
                onCheckedChange={(v) => setFormReminder(v === true)}
                className="border-[#475569] data-[state=checked]:bg-[#0f6cbd] data-[state=checked]:border-[#0f6cbd]"
              />
              <label className="text-xs text-[#94a3b8]">Set reminder</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setEditDialogOpen(false); resetForm(); }} className="border-[#2a2e37]">Cancel</Button>
            <Button size="sm" onClick={handleUpdateTask} disabled={saving || !formTitle.trim()} className="bg-[#0f6cbd] hover:bg-[#0f6cbd]/90 text-white gap-1">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <Check className="h-3.5 w-3.5" /> Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
