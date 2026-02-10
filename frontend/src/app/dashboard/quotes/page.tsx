'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Plus, Search, Edit, Trash2, Send, Receipt, DollarSign, Calendar, Eye, FileText } from 'lucide-react';
import { Card, Badge, Modal, Input, Textarea, Button, EmptyState, StatusBadge } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/hooks';

interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  productId?: string;
}

interface Quote {
  id: string;
  quoteNumber: string;
  title: string;
  status: string;
  subtotal: number;
  discount: number;
  discountType: string;
  tax: number;
  total: number;
  validUntil?: string;
  notes?: string;
  terms?: string;
  customerId: string;
  dealId?: string;
  customer?: { id: string; name: string };
  deal?: { id: string; title: string };
  lineItems?: LineItem[];
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  unitPrice: number;
}

const statusColors: Record<string, string> = {
  DRAFT: 'neutral',
  SENT: 'info',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  EXPIRED: 'warning',
};

export default function QuotesPage() {
  const { getToken } = useAuth();
  const toast = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [deals, setDeals] = useState<{ id: string; title: string }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [form, setForm] = useState({
    title: '', customerId: '', dealId: '', discount: 0,
    discountType: 'PERCENTAGE', tax: 0, validUntil: '', notes: '', terms: '',
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unitPrice: 0, discount: 0, total: 0 },
  ]);

  const calculateLineTotal = (item: LineItem) => {
    const base = item.quantity * item.unitPrice;
    return base - (base * item.discount / 100);
  };

  const calculateTotal = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + calculateLineTotal(item), 0);
    const discountAmount = form.discountType === 'PERCENTAGE'
      ? subtotal * form.discount / 100
      : form.discount;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * form.tax / 100;
    return { subtotal, discountAmount, afterDiscount, taxAmount, total: afterDiscount + taxAmount };
  };

  const fetchQuotes = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      api.setToken(token);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.getQuotes(params.toString() || undefined);
      setQuotes((res.data as Quote[]) || []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  }, [getToken, search, statusFilter]);

  const fetchDeps = useCallback(async () => {
    try {
      const token = await getToken();
      api.setToken(token);
      const [custRes, dealRes, prodRes] = await Promise.all([
        api.getCustomers({ limit: 200 }),
        api.getDeals({ limit: 200 }),
        api.getProducts(),
      ]);
      setCustomers(((custRes.data as any[]) || []).map((c: any) => ({ id: c.id, name: c.name })));
      setDeals(((dealRes.data as any[]) || []).map((d: any) => ({ id: d.id, title: d.title })));
      setProducts((prodRes.data as Product[]) || []);
    } catch { /* ignore */ }
  }, [getToken]);

  useEffect(() => { fetchQuotes(); fetchDeps(); }, [fetchQuotes, fetchDeps]);

  const resetForm = () => {
    setForm({ title: '', customerId: '', dealId: '', discount: 0, discountType: 'PERCENTAGE', tax: 0, validUntil: '', notes: '', terms: '' });
    setLineItems([{ description: '', quantity: 1, unitPrice: 0, discount: 0, total: 0 }]);
    setEditingQuote(null);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0, discount: 0, total: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    setLineItems(items => items.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      updated.total = calculateLineTotal(updated);
      return updated;
    }));
  };

  const selectProduct = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      updateLineItem(index, 'description', product.name);
      const items = [...lineItems];
      items[index] = { ...items[index], description: product.name, unitPrice: product.unitPrice, productId, total: product.unitPrice * items[index].quantity };
      setLineItems(items);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.customerId) {
      toast.error('Title and customer are required');
      return;
    }
    if (lineItems.some(li => !li.description || li.unitPrice <= 0)) {
      toast.error('All line items need a description and price');
      return;
    }
    setSubmitting(true);
    try {
      const token = await getToken();
      api.setToken(token);
      const totals = calculateTotal();
      const data = {
        ...form,
        subtotal: totals.subtotal,
        total: totals.total,
        lineItems: lineItems.map((li, i) => ({ ...li, sortOrder: i, total: calculateLineTotal(li) })),
        validUntil: form.validUntil || undefined,
        dealId: form.dealId || undefined,
      };
      if (editingQuote) {
        await api.updateQuote(editingQuote.id, data);
        toast.success('Quote updated');
      } else {
        await api.createQuote(data);
        toast.success('Quote created');
      }
      setShowModal(false);
      resetForm();
      fetchQuotes();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save quote');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSend = async (id: string) => {
    try {
      const token = await getToken();
      api.setToken(token);
      await api.sendQuote(id);
      toast.success('Quote sent to customer');
      fetchQuotes();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send quote');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this quote?')) return;
    try {
      const token = await getToken();
      api.setToken(token);
      await api.deleteQuote(id);
      toast.success('Quote deleted');
      fetchQuotes();
    } catch {
      toast.error('Failed to delete quote');
    }
  };

  const viewQuote = async (quote: Quote) => {
    try {
      const token = await getToken();
      api.setToken(token);
      const res = await api.getQuote(quote.id);
      setSelectedQuote(res.data as Quote);
      setShowDetailModal(true);
    } catch {
      setSelectedQuote(quote);
      setShowDetailModal(true);
    }
  };

  const totals = calculateTotal();

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Quotes & Proposals</h1>
          <p className="text-neutral-500 mt-1">{quotes.length} quotes</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Create Quote
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search quotes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="REJECTED">Rejected</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {quotes.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-12 h-12" />}
          title="No quotes yet"
          description="Create professional quotes and proposals for your customers"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Quote #</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Title</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Status</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-500">Total</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-500">Valid Until</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map(quote => (
                <tr key={quote.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-4 py-3 font-mono text-xs">{quote.quoteNumber}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => viewQuote(quote)} className="font-medium text-neutral-900 dark:text-white hover:text-blue-600">
                      {quote.title}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{quote.customer?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={(statusColors[quote.status] || 'neutral') as any} size="sm">{quote.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(quote.total)}</td>
                  <td className="px-4 py-3 text-neutral-500">{quote.validUntil ? formatDate(quote.validUntil) : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => viewQuote(quote)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700" title="View">
                        <Eye className="w-4 h-4 text-neutral-500" />
                      </button>
                      {quote.status === 'DRAFT' && (
                        <button onClick={() => handleSend(quote.id)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Send">
                          <Send className="w-4 h-4 text-blue-500" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(quote.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Quote ${selectedQuote?.quoteNumber || ''}`}
        size="lg"
      >
        {selectedQuote && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{selectedQuote.title}</h2>
              <Badge variant={(statusColors[selectedQuote.status] || 'neutral') as any}>{selectedQuote.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-neutral-500">Customer:</span> {selectedQuote.customer?.name}</div>
              {selectedQuote.deal && <div><span className="text-neutral-500">Deal:</span> {selectedQuote.deal.title}</div>}
              {selectedQuote.validUntil && <div><span className="text-neutral-500">Valid Until:</span> {formatDate(selectedQuote.validUntil)}</div>}
            </div>
            {selectedQuote.lineItems && selectedQuote.lineItems.length > 0 && (
              <table className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                <thead className="bg-neutral-50 dark:bg-neutral-800">
                  <tr>
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedQuote.lineItems.map((li, i) => (
                    <tr key={i} className="border-t border-neutral-200 dark:border-neutral-700">
                      <td className="px-3 py-2">{li.description}</td>
                      <td className="px-3 py-2 text-right">{li.quantity}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(li.unitPrice)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(li.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="text-right space-y-1 text-sm">
              <div>Subtotal: <span className="font-medium">{formatCurrency(selectedQuote.subtotal)}</span></div>
              {selectedQuote.discount > 0 && <div className="text-red-500">Discount: -{formatCurrency(selectedQuote.discount)}</div>}
              {selectedQuote.tax > 0 && <div>Tax: {formatCurrency(selectedQuote.tax)}</div>}
              <div className="text-lg font-bold pt-2 border-t">Total: {formatCurrency(selectedQuote.total)}</div>
            </div>
            {selectedQuote.notes && <div className="text-sm"><span className="font-medium">Notes:</span> {selectedQuote.notes}</div>}
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingQuote ? 'Edit Quote' : 'Create Quote'}
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Input label="Title *" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Customer *</label>
              <select value={form.customerId} onChange={(e) => setForm(f => ({ ...f, customerId: e.target.value }))} className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm">
                <option value="">Select Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Deal (optional)</label>
              <select value={form.dealId} onChange={(e) => setForm(f => ({ ...f, dealId: e.target.value }))} className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm">
                <option value="">No Deal</option>
                {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Line Items</h3>
              <Button variant="secondary" size="sm" onClick={addLineItem}><Plus className="w-3 h-3 mr-1" /> Add Item</Button>
            </div>
            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                  <div className="col-span-12 sm:col-span-4">
                    {products.length > 0 && (
                      <select
                        value={item.productId || ''}
                        onChange={(e) => selectProduct(index, e.target.value)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-xs mb-1"
                      >
                        <option value="">Pick product...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    )}
                    <input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-sm"
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <label className="text-xs text-neutral-500">Qty</label>
                    <input type="number" min="1" value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-sm"
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <label className="text-xs text-neutral-500">Price</label>
                    <input type="number" min="0" step="0.01" value={item.unitPrice}
                      onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-sm"
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <label className="text-xs text-neutral-500">Disc %</label>
                    <input type="number" min="0" max="100" value={item.discount}
                      onChange={(e) => updateLineItem(index, 'discount', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-sm"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1 text-right">
                    <label className="text-xs text-neutral-500">Total</label>
                    <p className="text-sm font-semibold py-1.5">{formatCurrency(calculateLineTotal(item))}</p>
                  </div>
                  <div className="col-span-1">
                    {lineItems.length > 1 && (
                      <button onClick={() => removeLineItem(index)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Discount</label>
              <div className="flex gap-1">
                <input type="number" min="0" value={form.discount}
                  onChange={(e) => setForm(f => ({ ...f, discount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-2 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-sm"
                />
                <select value={form.discountType} onChange={(e) => setForm(f => ({ ...f, discountType: e.target.value }))}
                  className="px-2 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-sm"
                >
                  <option value="PERCENTAGE">%</option>
                  <option value="FIXED">$</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Tax %</label>
              <input type="number" min="0" value={form.tax}
                onChange={(e) => setForm(f => ({ ...f, tax: parseFloat(e.target.value) || 0 }))}
                className="w-full px-2 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Valid Until</label>
              <input type="date" value={form.validUntil}
                onChange={(e) => setForm(f => ({ ...f, validUntil: e.target.value }))}
                className="w-full px-2 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-sm"
              />
            </div>
          </div>

          <div className="text-right p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg space-y-1 text-sm">
            <div>Subtotal: <span className="font-medium">{formatCurrency(totals.subtotal)}</span></div>
            {totals.discountAmount > 0 && <div className="text-red-500">Discount: -{formatCurrency(totals.discountAmount)}</div>}
            {totals.taxAmount > 0 && <div>Tax: +{formatCurrency(totals.taxAmount)}</div>}
            <div className="text-lg font-bold pt-2 border-t border-neutral-200 dark:border-neutral-700">Total: {formatCurrency(totals.total)}</div>
          </div>

          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          <Textarea label="Terms & Conditions" value={form.terms} onChange={(e) => setForm(f => ({ ...f, terms: e.target.value }))} rows={2} />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting}>{editingQuote ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
