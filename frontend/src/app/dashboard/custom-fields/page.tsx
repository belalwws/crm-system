'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Plus, Edit, Trash2, SlidersHorizontal, Hash, Calendar, ToggleLeft, List, Type, Link2, Mail, Phone } from 'lucide-react';
import { Card, Badge, Modal, Input, Button, EmptyState } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import api from '@/lib/api';

interface CustomField {
  id: string;
  name: string;
  label: string;
  fieldType: string;
  entity: string;
  isRequired: boolean;
  options?: any;
  defaultValue?: string;
  sortOrder: number;
  createdAt: string;
}

const fieldTypeIcons: Record<string, any> = {
  TEXT: Type, NUMBER: Hash, DATE: Calendar, BOOLEAN: ToggleLeft,
  SELECT: List, MULTI_SELECT: List, URL: Link2, EMAIL: Mail, PHONE: Phone,
};

const entityLabels: Record<string, string> = {
  customer: 'Customer', deal: 'Deal', task: 'Task', contact: 'Contact',
};

export default function CustomFieldsPage() {
  const { getToken } = useAuth();
  const toast = useToast();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '', label: '', fieldType: 'TEXT', entity: 'customer',
    isRequired: false, options: '', defaultValue: '', sortOrder: 0,
  });

  const fetchFields = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      api.setToken(token);
      const res = await api.getCustomFields(entityFilter || undefined);
      setFields((res.data as CustomField[]) || []);
    } catch (error) {
      console.error('Error fetching custom fields:', error);
    } finally {
      setLoading(false);
    }
  }, [getToken, entityFilter]);

  useEffect(() => { fetchFields(); }, [fetchFields]);

  const resetForm = () => {
    setForm({ name: '', label: '', fieldType: 'TEXT', entity: 'customer', isRequired: false, options: '', defaultValue: '', sortOrder: 0 });
    setEditingField(null);
  };

  const openEdit = (field: CustomField) => {
    setEditingField(field);
    setForm({
      name: field.name,
      label: field.label,
      fieldType: field.fieldType,
      entity: field.entity,
      isRequired: field.isRequired,
      options: field.options ? (Array.isArray(field.options) ? field.options.join(', ') : JSON.stringify(field.options)) : '',
      defaultValue: field.defaultValue || '',
      sortOrder: field.sortOrder,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.label) {
      toast.error('Name and label are required');
      return;
    }
    setSubmitting(true);
    try {
      const token = await getToken();
      api.setToken(token);
      const data: any = {
        ...form,
        options: ['SELECT', 'MULTI_SELECT'].includes(form.fieldType)
          ? form.options.split(',').map((o: string) => o.trim()).filter(Boolean)
          : undefined,
      };
      if (editingField) {
        await api.updateCustomField(editingField.id, data);
        toast.success('Field updated');
      } else {
        await api.createCustomField(data);
        toast.success('Field created');
      }
      setShowModal(false);
      resetForm();
      fetchFields();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save custom field');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this custom field? All stored values will be lost.')) return;
    try {
      const token = await getToken();
      api.setToken(token);
      await api.deleteCustomField(id);
      toast.success('Field deleted');
      fetchFields();
    } catch {
      toast.error('Failed to delete field');
    }
  };

  const grouped = fields.reduce((acc, field) => {
    const key = field.entity;
    if (!acc[key]) acc[key] = [];
    acc[key].push(field);
    return acc;
  }, {} as Record<string, CustomField[]>);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Custom Fields</h1>
          <p className="text-neutral-500 mt-1">Extend your CRM with custom data fields</p>
        </div>
        <div className="flex gap-3">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm"
          >
            <option value="">All Entities</option>
            <option value="customer">Customer</option>
            <option value="deal">Deal</option>
            <option value="task">Task</option>
            <option value="contact">Contact</option>
          </select>
          <Button onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Field
          </Button>
        </div>
      </div>

      {fields.length === 0 ? (
        <EmptyState
          icon={<SlidersHorizontal className="w-12 h-12" />}
          title="No custom fields"
          description="Create custom fields to capture additional data for your entities"
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([entity, entityFields]) => (
            <div key={entity}>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                {entityLabels[entity] || entity}
                <Badge variant="neutral" size="sm">{entityFields.length}</Badge>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {entityFields
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map(field => {
                    const Icon = fieldTypeIcons[field.fieldType] || Type;
                    return (
                      <Card key={field.id} hover>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <Icon className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">{field.label}</h3>
                              <p className="text-xs text-neutral-500 font-mono">{field.name}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(field)} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700">
                              <Edit className="w-3.5 h-3.5 text-neutral-500" />
                            </button>
                            <button onClick={() => handleDelete(field.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="neutral" size="sm">{field.fieldType}</Badge>
                          {field.isRequired && <Badge variant="danger" size="sm">Required</Badge>}
                          {field.defaultValue && (
                            <span className="text-xs text-neutral-500">Default: {field.defaultValue}</span>
                          )}
                        </div>
                        {field.options && Array.isArray(field.options) && field.options.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(field.options as string[]).slice(0, 5).map((opt, i) => (
                              <Badge key={i} variant="neutral" size="sm">{opt}</Badge>
                            ))}
                            {(field.options as string[]).length > 5 && (
                              <span className="text-xs text-neutral-500">+{(field.options as string[]).length - 5} more</span>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingField ? 'Edit Custom Field' : 'Add Custom Field'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Field Name *" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value.toLowerCase().replace(/\s+/g, '_') }))} placeholder="e.g. company_size" />
            <Input label="Display Label *" value={form.label} onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Company Size" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Entity *</label>
              <select value={form.entity} onChange={(e) => setForm(f => ({ ...f, entity: e.target.value }))} className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm" disabled={!!editingField}>
                <option value="customer">Customer</option>
                <option value="deal">Deal</option>
                <option value="task">Task</option>
                <option value="contact">Contact</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Field Type *</label>
              <select value={form.fieldType} onChange={(e) => setForm(f => ({ ...f, fieldType: e.target.value }))} className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm">
                <option value="TEXT">Text</option>
                <option value="NUMBER">Number</option>
                <option value="DATE">Date</option>
                <option value="BOOLEAN">Boolean</option>
                <option value="SELECT">Select</option>
                <option value="MULTI_SELECT">Multi-Select</option>
                <option value="URL">URL</option>
                <option value="EMAIL">Email</option>
                <option value="PHONE">Phone</option>
              </select>
            </div>
          </div>
          {['SELECT', 'MULTI_SELECT'].includes(form.fieldType) && (
            <Input
              label="Options (comma-separated)"
              value={form.options}
              onChange={(e) => setForm(f => ({ ...f, options: e.target.value }))}
              placeholder="e.g. Small, Medium, Large, Enterprise"
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Default Value" value={form.defaultValue} onChange={(e) => setForm(f => ({ ...f, defaultValue: e.target.value }))} />
            <Input label="Sort Order" type="number" value={form.sortOrder} onChange={(e) => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isRequired} onChange={(e) => setForm(f => ({ ...f, isRequired: e.target.checked }))} className="rounded" />
            Required Field
          </label>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting}>{editingField ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
