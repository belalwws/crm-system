"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Plus,
  Search,
  Mail,
  Phone,
  Building,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Filter,
  Download,
  Upload,
  UserPlus,
  X,
  Copy,
  Merge,
} from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Select,
  SearchInput,
  Modal,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  StatusBadge,
  Avatar,
  Dropdown,
  PageLoading,
  NoData,
  NoResults,
  Card,
  useToast,
} from "@/components/ui";
import { Pagination } from "@/components/ui/pagination";
import { BulkActionsBar } from "@/components/ui/bulk-actions-bar";
import { formatDate } from "@/lib/hooks";
import api from "@/lib/api";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
}

const statusOptions = [
  { value: "lead", label: "Lead" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function CustomersPage() {
  const { getToken } = useAuth();
  const toast = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [duplicates, setDuplicates] = useState<Customer[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "lead",
    notes: "",
  });

  const fetchCustomers = useCallback(async () => {
    try {
      const token = await getToken();
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/customers?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setCustomers(data.data);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [getToken, toast, page, search, statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", company: "", status: "lead", notes: "" });
    setIsEditing(false);
    setSelectedCustomer(null);
  };

  const openEditModal = (customer: Customer) => {
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
      company: customer.company || "",
      status: customer.status,
      notes: customer.notes || "",
    });
    setSelectedCustomer(customer);
    setIsEditing(true);
    setShowModal(true);
  };

  const openViewModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const token = await getToken();
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_URL}/customers/${selectedCustomer?.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/customers`;
      
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
        toast.success(isEditing ? "Customer updated successfully" : "Customer created successfully");
        setShowModal(false);
        resetForm();
        fetchCustomers();
      } else {
        toast.error(data.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error("Failed to save customer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    
    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        toast.success("Customer deleted successfully");
        fetchCustomers();
      } else {
        toast.error("Failed to delete customer");
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete customer");
    }
  };



  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === customers.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(customers.map(c => c.id)));
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} customers?`)) return;
    try {
      const token = await getToken();
      api.setToken(token);
      await api.bulkDeleteCustomers(Array.from(selectedIds));
      toast.success(`${selectedIds.size} customers deleted`);
      setSelectedIds(new Set());
      fetchCustomers();
    } catch { toast.error('Bulk delete failed'); }
  };

  const handleExportCsv = async () => {
    try {
      const token = await getToken();
      api.setToken(token);
      const blob = await api.exportCsv('customers');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'customers.csv'; a.click();
      URL.revokeObjectURL(url);
      toast.success('Export started');
    } catch { toast.error('Export failed'); }
  };

  const handleCheckDuplicates = async () => {
    try {
      const token = await getToken();
      api.setToken(token);
      // Check each customer for duplicates
      const allDups: Customer[] = [];
      for (const c of customers.slice(0, 20)) {
        try {
          const res = await api.checkDuplicates({ email: c.email, name: c.name, phone: c.phone });
          if (res.data && Array.isArray(res.data)) {
            const dups = (res.data as Customer[]).filter((d: Customer) => d.id !== c.id);
            dups.forEach((d: Customer) => {
              if (!allDups.find(x => x.id === d.id)) allDups.push(d);
            });
          }
        } catch {}
      }
      setDuplicates(allDups);
      setShowDuplicates(true);
      if (allDups.length === 0) toast.info('No duplicates found!');
    } catch { toast.error('Duplicate check failed'); }
  };

  const handleMerge = async (primaryId: string, secondaryId: string) => {
    if (!confirm('Merge these customers? The secondary customer will be removed.')) return;
    try {
      const token = await getToken();
      api.setToken(token);
      await api.mergeCustomers(primaryId, secondaryId);
      toast.success('Customers merged');
      setShowDuplicates(false);
      fetchCustomers();
    } catch { toast.error('Merge failed'); }
  };

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Customers</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Customers • Page {page} of {totalPages}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={<Copy className="w-4 h-4" />} onClick={handleCheckDuplicates}>
            Duplicates
          </Button>
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
            Add Customer
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 animate-slide-up">
        <div className="flex-1">
          <SearchInput
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-500 transition-colors"
        >
          <option value="all">All Status</option>
          <option value="lead">Lead</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Customers Table */}
      {customers.length === 0 ? (
        <NoData
          type="Customer"
          onAdd={() => {
            resetForm();
            setShowModal(true);
          }}
        />
      ) : customers.length === 0 ? (
        <Card>
          <NoResults searchTerm={search} />
        </Card>
      ) : (
        <div className="animate-slide-up">
          <Table>
            <TableHeader>
              <TableHead>
                <input type="checkbox" checked={selectedIds.size === customers.length && customers.length > 0} onChange={toggleSelectAll} className="rounded" />
              </TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden md:table-cell">Company</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden lg:table-cell">Added</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableHeader>
            <TableBody>
              {customers.map((customer, index) => (
                <TableRow
                  key={customer.id}
                  className={`animate-slide-up ${selectedIds.has(customer.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <TableCell>
                    <input type="checkbox" checked={selectedIds.has(customer.id)} onChange={() => toggleSelect(customer.id)} className="rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={customer.name} size="md" />
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{customer.name}</p>
                        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                          <Mail className="w-3.5 h-3.5" />
                          {customer.email}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                            <Phone className="w-3.5 h-3.5" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {customer.company && (
                      <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                        <Building className="w-4 h-4" />
                        {customer.company}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <StatusBadge status={customer.status} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-neutral-500 dark:text-neutral-400">
                    {formatDate(customer.createdAt)}
                  </TableCell>
                  <TableCell align="right">
                    <Dropdown
                      items={[
                        {
                          label: "View Details",
                          icon: <Eye className="w-4 h-4" />,
                          onClick: () => openViewModal(customer),
                        },
                        {
                          label: "Edit",
                          icon: <Edit className="w-4 h-4" />,
                          onClick: () => openEditModal(customer),
                        },
                        {
                          label: "Delete",
                          icon: <Trash2 className="w-4 h-4" />,
                          onClick: () => handleDelete(customer.id),
                          danger: true,
                        },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <BulkActionsBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={[
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
        title={isEditing ? "Edit Customer" : "Add New Customer"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter customer name"
          />
          <Input
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="customer@example.com"
          />
          <Input
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 (555) 000-0000"
          />
          <Input
            label="Company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="Company name"
          />
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={statusOptions}
          />
          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Add any notes about this customer..."
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
              {isEditing ? "Update Customer" : "Add Customer"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedCustomer(null);
        }}
        title="Customer Details"
        size="md"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar name={selectedCustomer.name} size="xl" />
              <div>
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">{selectedCustomer.name}</h3>
                <StatusBadge status={selectedCustomer.status} />
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                <Mail className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                <span>{selectedCustomer.email}</span>
              </div>
              {selectedCustomer.phone && (
                <div className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                  <Phone className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                  <span>{selectedCustomer.phone}</span>
                </div>
              )}
              {selectedCustomer.company && (
                <div className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                  <Building className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                  <span>{selectedCustomer.company}</span>
                </div>
              )}
            </div>

            {selectedCustomer.notes && (
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">Notes</h4>
                <p className="text-neutral-700 dark:text-neutral-300">{selectedCustomer.notes}</p>
              </div>
            )}

            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Added on {formatDate(selectedCustomer.createdAt)}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(selectedCustomer);
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
                  handleDelete(selectedCustomer.id);
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

      {/* Duplicates Modal */}
      <Modal
        isOpen={showDuplicates}
        onClose={() => setShowDuplicates(false)}
        title="Potential Duplicates"
        size="lg"
      >
        {duplicates.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">No duplicate customers found.</div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-neutral-500 mb-4">Found {duplicates.length} potential duplicate(s). Select a customer to merge.</p>
            {duplicates.map((dup) => (
              <div key={dup.id} className="flex items-center justify-between p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar name={dup.name} size="sm" />
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white text-sm">{dup.name}</p>
                    <p className="text-xs text-neutral-500">{dup.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {customers.filter(c => c.id !== dup.id && (c.email === dup.email || c.name === dup.name)).map((primary) => (
                    <button
                      key={primary.id}
                      onClick={() => handleMerge(primary.id, dup.id)}
                      className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Merge into {primary.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
