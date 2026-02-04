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
import { formatDate } from "@/lib/hooks";

interface Customer {
  id: string;
  _id: string;
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
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/customers`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [getToken, toast]);

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
        ? `${process.env.NEXT_PUBLIC_API_URL}/customers/${selectedCustomer?.id || selectedCustomer?._id}`
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

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(search.toLowerCase()) ||
      customer.email.toLowerCase().includes(search.toLowerCase()) ||
      customer.company?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-white">Customers</h1>
          <p className="text-neutral-500 mt-1">
            {customers.length} total customers • {filteredCustomers.length} showing
          </p>
        </div>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 animate-slide-up">
        <div className="flex-1">
          <SearchInput
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-neutral-500 transition-colors"
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
      ) : filteredCustomers.length === 0 ? (
        <Card>
          <NoResults searchTerm={search} />
        </Card>
      ) : (
        <div className="animate-slide-up">
          <Table>
            <TableHeader>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden md:table-cell">Company</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden lg:table-cell">Added</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer, index) => (
                <TableRow
                  key={customer.id || customer._id}
                  className={`animate-slide-up`}
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={customer.name} size="md" />
                      <div>
                        <p className="font-medium text-white">{customer.name}</p>
                        <div className="flex items-center gap-2 text-sm text-neutral-500 mt-0.5">
                          <Mail className="w-3.5 h-3.5" />
                          {customer.email}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm text-neutral-500">
                            <Phone className="w-3.5 h-3.5" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {customer.company && (
                      <div className="flex items-center gap-2 text-neutral-400">
                        <Building className="w-4 h-4" />
                        {customer.company}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <StatusBadge status={customer.status} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-neutral-500">
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
                          onClick: () => handleDelete(customer.id || customer._id),
                          danger: true,
                        },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

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
                <h3 className="text-xl font-semibold text-white">{selectedCustomer.name}</h3>
                <StatusBadge status={selectedCustomer.status} />
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-neutral-800">
              <div className="flex items-center gap-3 text-neutral-300">
                <Mail className="w-5 h-5 text-neutral-500" />
                <span>{selectedCustomer.email}</span>
              </div>
              {selectedCustomer.phone && (
                <div className="flex items-center gap-3 text-neutral-300">
                  <Phone className="w-5 h-5 text-neutral-500" />
                  <span>{selectedCustomer.phone}</span>
                </div>
              )}
              {selectedCustomer.company && (
                <div className="flex items-center gap-3 text-neutral-300">
                  <Building className="w-5 h-5 text-neutral-500" />
                  <span>{selectedCustomer.company}</span>
                </div>
              )}
            </div>

            {selectedCustomer.notes && (
              <div className="pt-4 border-t border-neutral-800">
                <h4 className="text-sm font-medium text-neutral-400 mb-2">Notes</h4>
                <p className="text-neutral-300">{selectedCustomer.notes}</p>
              </div>
            )}

            <div className="pt-4 border-t border-neutral-800">
              <p className="text-sm text-neutral-500">
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
                  handleDelete(selectedCustomer.id || selectedCustomer._id);
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
    </div>
  );
}
