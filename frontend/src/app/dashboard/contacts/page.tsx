'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Plus, Search, Edit, Trash2, User, Building2, Mail, Phone, Linkedin } from 'lucide-react';
import { Card, Badge, Modal, Input, Textarea, Button, EmptyState } from '@/components/ui';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useConfirmDialog } from '@/components/ui/use-confirm-dialog';
import api from '@/lib/api';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  department?: string;
  isPrimary: boolean;
  linkedIn?: string;
  notes?: string;
  customerId: string;
  customer?: { id: string; name: string; company?: string };
  createdAt: string;
}

export default function ContactsPage() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const toast = useToast();
  const { confirm, dialogProps } = useConfirmDialog();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);

  // Form
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    title: '', department: '', isPrimary: false,
    linkedIn: '', notes: '', customerId: '',
  });

  const fetchContacts = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      api.setToken(token);
      const res = await api.getContacts();
      setContacts((res.data as Contact[]) || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [getToken, isSignedIn]);

  const fetchCustomers = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      api.setToken(token);
      const res = await api.getCustomers({ limit: 200 });
      setCustomers(((res.data as any[]) || []).map((c: any) => ({ id: c.id, name: c.name })));
    } catch {
      // ignore
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchContacts();
      fetchCustomers();
    }
  }, [isLoaded, isSignedIn, fetchContacts, fetchCustomers]);

  const filtered = contacts.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.customer?.name?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q)
    );
  });

  const resetForm = () => {
    setForm({ firstName: '', lastName: '', email: '', phone: '', title: '', department: '', isPrimary: false, linkedIn: '', notes: '', customerId: '' });
    setEditingContact(null);
  };

  const openEdit = (contact: Contact) => {
    setEditingContact(contact);
    setForm({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email || '',
      phone: contact.phone || '',
      title: contact.title || '',
      department: contact.department || '',
      isPrimary: contact.isPrimary,
      linkedIn: contact.linkedIn || '',
      notes: contact.notes || '',
      customerId: contact.customerId,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.customerId) {
      toast.error('First name, last name, and customer are required');
      return;
    }
    setSubmitting(true);
    try {
      const token = await getToken();
      api.setToken(token);
      if (editingContact) {
        await api.updateContact(editingContact.id, form);
        toast.success('Contact updated');
      } else {
        await api.createContact(form as any);
        toast.success('Contact created');
      }
      setShowModal(false);
      resetForm();
      fetchContacts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save contact');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Delete Contact', message: 'Delete this contact?', variant: 'danger', confirmLabel: 'Delete' });
    if (!ok) return;
    try {
      const token = await getToken();
      api.setToken(token);
      await api.deleteContact(id);
      toast.success('Contact deleted');
      fetchContacts();
    } catch {
      toast.error('Failed to delete contact');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Contacts</h1>
          <p className="text-neutral-500 mt-1">{contacts.length} contacts</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Contact
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<User className="w-12 h-12" />}
          title="No contacts found"
          description="Add contacts to track your relationships"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((contact) => (
            <Card key={contact.id} hover>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    {contact.firstName[0]}{contact.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white">
                      {contact.firstName} {contact.lastName}
                      {contact.isPrimary && <span className="ml-2"><Badge variant="success" size="sm">Primary</Badge></span>}
                    </h3>
                    {contact.title && <p className="text-xs text-neutral-500">{contact.title}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(contact)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700">
                    <Edit className="w-4 h-4 text-neutral-500" />
                  </button>
                  <button onClick={() => handleDelete(contact.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              {contact.customer && (
                <div className="flex items-center gap-1.5 text-sm text-neutral-500 mb-2">
                  <Building2 className="w-3.5 h-3.5" />
                  {contact.customer.name}
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-1.5 text-sm text-neutral-500 mb-1">
                  <Mail className="w-3.5 h-3.5" />
                  {contact.email}
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-1.5 text-sm text-neutral-500 mb-1">
                  <Phone className="w-3.5 h-3.5" />
                  {contact.phone}
                </div>
              )}
              {contact.linkedIn && (
                <div className="flex items-center gap-1.5 text-sm text-blue-500 mb-1">
                  <Linkedin className="w-3.5 h-3.5" />
                  <a href={contact.linkedIn} target="_blank" rel="noreferrer" className="hover:underline truncate">LinkedIn</a>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingContact ? 'Edit Contact' : 'Add Contact'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name *" value={form.firstName} onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))} />
            <Input label="Last Name *" value={form.lastName} onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Job Title" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
            <Input label="Department" value={form.department} onChange={(e) => setForm(f => ({ ...f, department: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Customer *</label>
            <select
              value={form.customerId}
              onChange={(e) => setForm(f => ({ ...f, customerId: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm"
            >
              <option value="">Select Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Input label="LinkedIn URL" value={form.linkedIn} onChange={(e) => setForm(f => ({ ...f, linkedIn: e.target.value }))} />
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isPrimary} onChange={(e) => setForm(f => ({ ...f, isPrimary: e.target.checked }))} className="rounded" />
            Primary Contact
          </label>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting}>{editingContact ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
