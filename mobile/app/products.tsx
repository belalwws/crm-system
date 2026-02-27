import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useAuthToken } from '@/lib/utils';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useThemeColors, formatCurrency } from '@/lib/utils';
import { EmptyState, LoadingScreen } from '@/components/ui';
import { FontSize, Spacing, BorderRadius } from '@/lib/theme';
import type { Product } from '@/lib/types';

export default function ProductsScreen() {
  const colors = useThemeColors();
  const { getAuthToken } = useAuthToken();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const res = await api.getProducts();
      if (res.success) setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [getAuthToken]);

  useEffect(() => { fetchProducts(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchProducts(); };

  if (loading) return <LoadingScreen />;

  return (
    <>
      <Stack.Screen options={{ title: 'Products' }} />
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: Spacing.lg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={<EmptyState icon="cube" title="No products" message="Your product catalog will appear here" />}
        renderItem={({ item }) => (
          <View style={{
            backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg,
            marginBottom: Spacing.md, borderWidth: 1, borderColor: colors.border,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FontSize.lg, fontWeight: '600', color: colors.text }}>{item.name}</Text>
                {item.description && (
                  <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 2 }} numberOfLines={2}>{item.description}</Text>
                )}
              </View>
              <Text style={{ fontSize: FontSize.lg, fontWeight: '700', color: '#22c55e' }}>{formatCurrency(item.price)}</Text>
            </View>
            {item.category && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, gap: 4 }}>
                <Ionicons name="pricetag-outline" size={12} color={colors.textSecondary} />
                <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>{item.category}</Text>
              </View>
            )}
          </View>
        )}
      />
    </>
  );
}
