"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Plus,
  Search,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreVertical,
  Edit,
  Trash2,
  Filter,
  ListTodo,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Select,
  SearchInput,
  Modal,
  Card,
  CardHeader,
  StatusBadge,
  Badge,
  Dropdown,
  PageLoading,
  NoData,
  NoResults,
  useToast,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui";
import { formatDate, formatRelativeTime } from "@/lib/hooks";
import { AITaskPrioritization } from "@/components/ai/ai-insights";
import { TaskCard } from "@/components/tasks/task-card";

interface Task {
  id: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  status: string;
  dueDate?: string;
  customer?: { id: string; name: string };
  deal?: { id: string; title: string };
  createdAt: string;
}

const taskTypes = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "follow-up", label: "Follow Up" },
  { value: "other", label: "Other" },
];

const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const statuses = [
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  "in-progress": AlertCircle,
  completed: CheckCircle,
  cancelled: AlertCircle,
};

export default function TasksPage() {
  const { getToken } = useAuth();
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [deals, setDeals] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "other",
    priority: "medium",
    status: "pending",
    dueDate: "",
    customerId: "",
    dealId: "",
  });

  const fetchTasks = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [getToken, toast]);

  const fetchCustomersAndDeals = useCallback(async () => {
    try {
      const token = await getToken();
      const [customersRes, dealsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/deals`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const customersData = await customersRes.json();
      const dealsData = await dealsRes.json();
      if (customersData.success) setCustomers(customersData.data);
      if (dealsData.success) setDeals(dealsData.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [getToken]);

  useEffect(() => {
    fetchTasks();
    fetchCustomersAndDeals();
  }, [fetchTasks, fetchCustomersAndDeals]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "other",
      priority: "medium",
      status: "pending",
      dueDate: "",
      customerId: "",
      dealId: "",
    });
    setIsEditing(false);
    setSelectedTask(null);
  };

  const openEditModal = (task: Task) => {
    setFormData({
      title: task.title,
      description: task.description || "",
      type: task.type,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
      customerId: task.customer?.id || "",
      dealId: task.deal?.id || "",
    });
    setSelectedTask(task);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = await getToken();
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_URL}/tasks/${selectedTask?.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/tasks`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(isEditing ? "Task updated successfully" : "Task created successfully");
        setShowModal(false);
        resetForm();
        fetchTasks();
      } else {
        toast.error(data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const token = await getToken();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success("Task updated");
      fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Task deleted successfully");
        fetchTasks();
      } else {
        toast.error("Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Group tasks by status for board view
  const pendingTasks = filteredTasks.filter((t) => t.status === "pending");
  const inProgressTasks = filteredTasks.filter((t) => t.status === "in-progress");
  const completedTasks = filteredTasks.filter((t) => t.status === "completed");

  // Stats
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed"
  );
  const todayTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate).toDateString() === new Date().toDateString()
  );

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Tasks</h1>
          <p className="text-neutral-500 mt-1">
            {tasks.length} total tasks • {pendingTasks.length} pending
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAI(!showAI)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
              showAI
                ? 'bg-violet-600 text-white'
                : 'bg-violet-600/10 text-violet-400 hover:bg-violet-600/20 border border-violet-500/30'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI Prioritize
          </button>
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            Add Task
          </Button>
        </div>
      </div>

      {/* AI Prioritization Panel */}
      {showAI && (
        <div className="animate-in slide-in-from-top-2 duration-300">
          <AITaskPrioritization />
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-slide-up">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Pending</p>
              <p className="text-xl font-semibold text-neutral-900 dark:text-white">{pendingTasks.length}</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">In Progress</p>
              <p className="text-xl font-semibold text-neutral-900 dark:text-white">{inProgressTasks.length}</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Overdue</p>
              <p className="text-xl font-semibold text-neutral-900 dark:text-white">{overdueTasks.length}</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Completed</p>
              <p className="text-xl font-semibold text-neutral-900 dark:text-white">{completedTasks.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 animate-slide-up">
        <div className="flex-1">
          <SearchInput
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500 transition-colors"
        >
          <option value="all">All Status</option>
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500 transition-colors"
        >
          <option value="all">All Priority</option>
          {priorities.map((priority) => (
            <option key={priority.value} value={priority.value}>
              {priority.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <NoData
          type="Task"
          onAdd={() => {
            resetForm();
            setShowModal(true);
          }}
        />
      ) : filteredTasks.length === 0 ? (
        <Card>
          <NoResults searchTerm={search} />
        </Card>
      ) : (
        <div className="space-y-3 animate-slide-up">
          {filteredTasks.map((task, index) => (
            <div key={task.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.03}s` }}>
              <TaskCard
                task={task}
                onStatusChange={handleStatusChange}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={isEditing ? "Edit Task" : "Add New Task"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Task title"
          />
          <Select
            label="Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={taskTypes}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              options={priorities}
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={statuses}
            />
          </div>
          <Input
            label="Due Date"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">
              Related Customer (optional)
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500 transition-colors"
            >
              <option value="">Select a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">
              Related Deal (optional)
            </label>
            <select
              value={formData.dealId}
              onChange={(e) => setFormData({ ...formData, dealId: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500 transition-colors"
            >
              <option value="">Select a deal</option>
              {deals.map((deal) => (
                <option key={deal.id} value={deal.id}>
                  {deal.title}
                </option>
              ))}
            </select>
          </div>
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Task description..."
            rows={3}
          />
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting} className="flex-1">
              {isEditing ? "Update Task" : "Add Task"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
