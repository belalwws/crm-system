"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Plus,
  Search,
  DollarSign,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Filter,
  LayoutGrid,
  List,
  TrendingUp,
  ArrowRight,
  Download,
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
  Avatar,
  Dropdown,
  PageLoading,
  NoData,
  NoResults,
  Badge,
  useToast,
} from "@/components/ui";
import { formatCurrency, formatDate, useDebounce } from "@/lib/hooks";
import dynamic from "next/dynamic";
import { Pagination } from "@/components/ui/pagination";
import { BulkActionsBar } from "@/components/ui/bulk-actions-bar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useConfirmDialog } from "@/components/ui/use-confirm-dialog";
import api from "@/lib/api";

// Dynamic import for heavy Kanban component
const KanbanView = dynamic(() => import("@/components/deals/kanban-view").then(m => ({ default: m.KanbanView })), { ssr: false, loading: () => <div className="h-[600px] animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-xl" /> });

interface Customer {
  id: string;
  name: string;
}

interface Deal {
  id: string;
  title: string;
  description?: string;
  value: number;
  stage: string;
  probability: number;
  customer: Customer;
  expectedCloseDate?: string;
  createdAt: string;
}

const stages = [
  { value: "lead", label: "Lead", color: "bg-neutral-500" },
  { value: "qualified", label: "Qualified", color: "bg-blue-500" },
  { value: "proposal", label: "Proposal", color: "bg-amber-500" },
  { value: "negotiation", label: "Negotiation", color: "bg-orange-500" },
  { value: "closed-won", label: "Closed Won", color: "bg-emerald-500" },
  { value: "closed-lost", label: "Closed Lost", color: "bg-red-500" },
];

const stageOptions = stages.map((s) => ({ value: s.value, label: s.label }));

export default function DealsPage() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const toast = useToast();
  const { confirm, dialogProps } = useConfirmDialog();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [stageFilter, setStageFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "kanban">("kanban");
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    value: "",
    stage: "lead",
    probability: "10",
    customerId: "",
    expectedCloseDate: "",
  });

  const fetchDeals = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (stageFilter !== "all") params.set("stage", stageFilter);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/deals?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setDeals(data.data);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching deals:", error);
      toast.error("Failed to load deals");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getToken, page, debouncedSearch, stageFilter, isSignedIn]);

  const fetchCustomers = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchDeals();
      fetchCustomers();
    }
  }, [isLoaded, isSignedIn, fetchDeals, fetchCustomers]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      value: "",
      stage: "lead",
      probability: "10",
      customerId: "",
      expectedCloseDate: "",
    });
    setIsEditing(false);
    setSelectedDeal(null);
  };

  const openEditModal = (deal: Deal) => {
    setFormData({
      title: deal.title,
      description: deal.description || "",
      value: deal.value.toString(),
      stage: deal.stage,
      probability: deal.probability.toString(),
      customerId: deal.customer?.id || "",
      expectedCloseDate: deal.expectedCloseDate ? deal.expectedCloseDate.split("T")[0] : "",
    });
    setSelectedDeal(deal);
    setIsEditing(true);
    setShowModal(true);
  };

  const openViewModal = (deal: Deal) => {
    setSelectedDeal(deal);
    setShowViewModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = await getToken();
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_URL}/deals/${selectedDeal?.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/deals`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value) || 0,
          probability: parseInt(formData.probability) || 10,
          expectedCloseDate: formData.expectedCloseDate || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(isEditing ? "Deal updated successfully" : "Deal created successfully");
        setShowModal(false);
        resetForm();
        fetchDeals();
      } else {
        toast.error(data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving deal:", error);
      toast.error("Failed to save deal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Delete Deal', message: 'Are you sure you want to delete this deal?', variant: 'danger', confirmLabel: 'Delete' });
    if (!ok) return;

    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/deals/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Deal deleted successfully");
        fetchDeals();
      } else {
        toast.error("Failed to delete deal");
      }
    } catch (error) {
      console.error("Error deleting deal:", error);
      toast.error("Failed to delete deal");
    }
  };

  const handleStageChange = async (dealId: string, newStage: string) => {
    try {
      const token = await getToken();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/deals/${dealId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stage: newStage }),
      });
      toast.success("Deal stage updated");
      fetchDeals();
    } catch (error) {
      console.error("Error updating deal:", error);
      toast.error("Failed to update deal");
    }
  };

  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
  const wonDeals = deals.filter((d) => d.stage === "closed-won");
  const wonValue = wonDeals.reduce((sum, d) => sum + d.value, 0);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const handleBulkDelete = async () => {
    const ok = await confirm({ title: 'Delete Deals', message: `Delete ${selectedIds.size} deals?`, variant: 'danger', confirmLabel: 'Delete' });
    if (!ok) return;
    try {
      const token = await getToken(); api.setToken(token);
      await api.bulkDeleteDeals(Array.from(selectedIds));
      toast.success(`${selectedIds.size} deals deleted`); setSelectedIds(new Set()); fetchDeals();
    } catch { toast.error('Bulk delete failed'); }
  };

  const handleBulkStageChange = async (stage: string) => {
    try {
      const token = await getToken(); api.setToken(token);
      await api.bulkUpdateDealStage(Array.from(selectedIds), stage);
      toast.success(`${selectedIds.size} deals moved to ${stage}`); setSelectedIds(new Set()); fetchDeals();
    } catch { toast.error('Bulk stage update failed'); }
  };

  const handleExportCsv = async () => {
    try {
      const token = await getToken(); api.setToken(token);
      const blob = await api.exportCsv('deals');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'deals.csv'; a.click();
      URL.revokeObjectURL(url); toast.success('Export started');
    } catch { toast.error('Export failed'); }
  };

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Deals</h1>
          <p className="text-neutral-500 mt-1">
            {deals.length} deals • {formatCurrency(totalValue)} pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleExportCsv}>
            Export
          </Button>
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            Add Deal
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Total Pipeline</p>
              <p className="text-lg font-semibold text-neutral-900 dark:text-white">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Won This Month</p>
              <p className="text-lg font-semibold text-neutral-900 dark:text-white">{formatCurrency(wonValue)}</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Active Deals</p>
              <p className="text-lg font-semibold text-neutral-900 dark:text-white">{deals.length - wonDeals.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 animate-slide-up">
        <div className="flex-1">
          <SearchInput
            placeholder="Search deals..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={stageFilter}
          onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
          className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500 transition-colors"
        >
          <option value="all">All Stages</option>
          {stages.map((stage) => (
            <option key={stage.value} value={stage.value}>
              {stage.label}
            </option>
          ))}
        </select>
        <div className="flex rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <button
            onClick={() => setViewMode("kanban")}
            className={`p-3 transition-colors ${viewMode === "kanban" ? "bg-white text-neutral-900" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"}`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-3 transition-colors ${viewMode === "grid" ? "bg-white text-neutral-900" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Deals View */}
      {deals.length === 0 ? (
        <NoData
          type="Deal"
          onAdd={() => {
            resetForm();
            setShowModal(true);
          }}
        />
      ) : viewMode === "kanban" ? (
        <KanbanView
          deals={deals}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onView={openViewModal}
          onStageChange={handleStageChange}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up">
          {deals.map((deal, index) => (
            <Card
              key={deal.id}
              hover
              className={`animate-fade-in ${selectedIds.has(deal.id) ? 'ring-2 ring-blue-500' : ''}`}
              style={{ animationDelay: `${index * 0.03}s` } as any}
              onClick={() => openViewModal(deal)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={selectedIds.has(deal.id)} onChange={(e) => { e.stopPropagation(); toggleSelect(deal.id); }} onClick={(e) => e.stopPropagation()} aria-label={`Select ${deal.title}`} className="rounded" />
                  <h3 className="font-semibold text-neutral-900 dark:text-white line-clamp-1">{deal.title}</h3>
                </div>
                <StatusBadge status={deal.stage} size="sm" />
              </div>
              {deal.customer && (
                <p className="text-sm text-neutral-500 mb-3">{deal.customer.name}</p>
              )}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-medium">{formatCurrency(deal.value)}</span>
                </div>
                {deal.expectedCloseDate && (
                  <div className="flex items-center gap-1 text-neutral-500">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(deal.expectedCloseDate)}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                <div className="text-sm text-neutral-500">{deal.probability}% probability</div>
                <Dropdown
                  items={[
                    { label: "Edit", icon: <Edit className="w-4 h-4" />, onClick: () => openEditModal(deal) },
                    { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => handleDelete(deal.id), danger: true },
                  ]}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {deals.length > 0 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}

      <BulkActionsBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={[
          { label: 'Move to Won', icon: <ArrowRight className="w-3.5 h-3.5" />, onClick: () => handleBulkStageChange('closed-won') },
          { label: 'Move to Lost', icon: <ArrowRight className="w-3.5 h-3.5" />, onClick: () => handleBulkStageChange('closed-lost') },
          { label: 'Delete', icon: <Trash2 className="w-3.5 h-3.5" />, onClick: handleBulkDelete, variant: 'danger' },
        ]}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={isEditing ? "Edit Deal" : "Add New Deal"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Deal title"
          />
          <div>
            <label className="block text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">
              Customer <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500 transition-colors"
            >
              <option value="">Select a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Value ($)"
            type="number"
            min="0"
            step="0.01"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            placeholder="10000"
          />
          <Select
            label="Stage"
            value={formData.stage}
            onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
            options={stageOptions}
          />
          <Input
            label="Probability (%)"
            type="number"
            min="0"
            max="100"
            value={formData.probability}
            onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
          />
          <Input
            label="Expected Close Date"
            type="date"
            value={formData.expectedCloseDate}
            onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Deal description..."
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
              {isEditing ? "Update Deal" : "Add Deal"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedDeal(null);
        }}
        title="Deal Details"
        size="md"
      >
        {selectedDeal && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">{selectedDeal.title}</h3>
              <StatusBadge status={selectedDeal.stage} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-100 dark:bg-neutral-800/50 rounded-xl p-4">
                <p className="text-xs text-neutral-500 mb-1">Value</p>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(selectedDeal.value)}</p>
              </div>
              <div className="bg-neutral-100 dark:bg-neutral-800/50 rounded-xl p-4">
                <p className="text-xs text-neutral-500 mb-1">Probability</p>
                <p className="text-xl font-bold text-neutral-900 dark:text-white">{selectedDeal.probability}%</p>
              </div>
            </div>

            {selectedDeal.customer && (
              <div className="flex items-center gap-3 p-4 bg-neutral-100 dark:bg-neutral-800/50 rounded-xl">
                <Avatar name={selectedDeal.customer.name} />
                <div>
                  <p className="text-xs text-neutral-500">Customer</p>
                  <p className="text-neutral-900 dark:text-white font-medium">{selectedDeal.customer.name}</p>
                </div>
              </div>
            )}

            {selectedDeal.description && (
              <div>
                <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">Description</h4>
                <p className="text-neutral-700 dark:text-neutral-300">{selectedDeal.description}</p>
              </div>
            )}

            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-3">Move to Stage</h4>
              <div className="flex flex-wrap gap-2">
                {stages.map((stage) => (
                  <button
                    key={stage.value}
                    onClick={() => {
                      handleStageChange(selectedDeal.id, stage.value);
                      setShowViewModal(false);
                    }}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      selectedDeal.stage === stage.value
                        ? "bg-white text-neutral-900"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    }`}
                  >
                    {stage.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(selectedDeal);
                }}
                className="flex-1"
                icon={<Edit className="w-4 h-4" />}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setShowViewModal(false);
                  handleDelete(selectedDeal.id);
                }}
                className="flex-1"
                icon={<Trash2 className="w-4 h-4" />}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
