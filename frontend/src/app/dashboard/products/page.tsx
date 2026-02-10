'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Plus, Search, Edit, Trash2, Package, DollarSign, Tag } from 'lucide-react';
import { Card, Badge, Modal, Input, Textarea, Button, EmptyState } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/hooks';

interface Product {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  unitPrice: number;
  currency: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
}

export default function ProductsPage() {
  const { getToken } = useAuth();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '', sku: '', description: '', unitPrice: 0,
    currency: 'USD', category: '', isActive: true,
  });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      api.setToken(token);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      const res = await api.getProducts(params.toString() || undefined);
      setProducts((res.data as Product[]) || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [getToken, search, categoryFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const categories = [...new Set(products.filter(p => p.category).map(p => p.category!))];

  const resetForm = () => {
    setForm({ name: '', sku: '', description: '', unitPrice: 0, currency: 'USD', category: '', isActive: true });
    setEditingProduct(null);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      sku: product.sku || '',
      description: product.description || '',
      unitPrice: product.unitPrice,
      currency: product.currency,
      category: product.category || '',
      isActive: product.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name) { toast.error('Product name is required'); return; }
    setSubmitting(true);
    try {
      const token = await getToken();
      api.setToken(token);
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, form);
        toast.success('Product updated');
      } else {
        await api.createProduct(form as any);
        toast.success('Product created');
      }
      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      const token = await getToken();
      api.setToken(token);
      await api.deleteProduct(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Products</h1>
          <p className="text-neutral-500 mt-1">{products.length} products</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="w-12 h-12" />}
          title="No products yet"
          description="Add products to use in quotes and proposals"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <Card key={product.id} hover>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white">{product.name}</h3>
                    {product.sku && <p className="text-xs text-neutral-500">SKU: {product.sku}</p>}
                  </div>
                </div>
                <Badge variant={product.isActive ? 'success' : 'neutral'} size="sm">
                  {product.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {product.description && (
                <p className="text-sm text-neutral-500 mb-3 line-clamp-2">{product.description}</p>
              )}

              <div className="flex items-center justify-between mt-auto pt-3 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span className="text-lg font-bold text-neutral-900 dark:text-white">
                    {formatCurrency(product.unitPrice)}
                  </span>
                </div>
                <div className="flex gap-1">
                  {product.category && (
                    <Badge variant="neutral" size="sm">
                      <Tag className="w-3 h-3 mr-1" />{product.category}
                    </Badge>
                  )}
                  <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700">
                    <Edit className="w-4 h-4 text-neutral-500" />
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
      >
        <div className="space-y-4">
          <Input label="Name *" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="SKU" value={form.sku} onChange={(e) => setForm(f => ({ ...f, sku: e.target.value }))} />
            <Input label="Category" value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} />
          </div>
          <Textarea label="Description" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Unit Price" type="number" value={form.unitPrice} onChange={(e) => setForm(f => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))} />
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm(f => ({ ...f, currency: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="SAR">SAR</option>
                <option value="EGP">EGP</option>
                <option value="AED">AED</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
            Active
          </label>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting}>{editingProduct ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
