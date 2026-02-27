import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
  ActivityIndicator, TextInput, Alert, Linking
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, useIsDark, formatDate, formatFileSize } from '@/lib/utils';
import { Card, Badge, EmptyState, Avatar } from '@/components/ui';
import {
  FontSize, Spacing, BorderRadius, FontWeight, AccentColors,
} from '@/lib/theme';
import api from '@/lib/api';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  category: string;
  customerId?: string;
  dealId?: string;
  createdAt: string;
  updatedAt: string;
  customer?: { name: string };
  deal?: { title: string };
  uploadedBy?: { name: string };
}

const CATEGORIES = ['all', 'contracts', 'proposals', 'invoices', 'reports', 'other'];

const fileTypeIcons: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  pdf: { icon: 'document-text', color: AccentColors.red },
  doc: { icon: 'document', color: AccentColors.blue },
  docx: { icon: 'document', color: AccentColors.blue },
  xls: { icon: 'grid', color: AccentColors.emerald },
  xlsx: { icon: 'grid', color: AccentColors.emerald },
  ppt: { icon: 'albums', color: AccentColors.amber },
  pptx: { icon: 'albums', color: AccentColors.amber },
  jpg: { icon: 'image', color: AccentColors.violet },
  jpeg: { icon: 'image', color: AccentColors.violet },
  png: { icon: 'image', color: AccentColors.violet },
  zip: { icon: 'folder-open', color: AccentColors.neutral },
};

export default function DocumentsScreen() {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchDocuments = async () => {
    try {
      const response = await api.getDocuments() as any;
      setDocuments(response.documents || response || []);
    } catch (err: any) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDocuments();
  }, []);

  const getFileIcon = (type: string) => {
    const ext = type.split('/').pop()?.toLowerCase() || '';
    return fileTypeIcons[ext] || { icon: 'document' as const, color: AccentColors.neutral };
  };

  const handleOpenDocument = (doc: Document) => {
    if (doc.url) {
      Linking.openURL(doc.url);
    } else {
      Alert.alert('Error', 'Document URL not available');
    }
  };

  const handleDeleteDocument = async (id: string) => {
    Alert.alert('Delete Document', 'Are you sure you want to delete this document?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteDocument(id);
            setDocuments(docs => docs.filter(d => d.id !== id));
          } catch (err) {
            Alert.alert('Error', 'Failed to delete document');
          }
        },
      },
    ]);
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: documents.length,
    totalSize: documents.reduce((sum, d) => sum + (d.size || 0), 0),
    categories: CATEGORIES.slice(1).map(cat => ({
      name: cat,
      count: documents.filter(d => d.category === cat).length,
    })),
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Documents', headerShown: true }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
      >
        {/* Stats Card */}
        <Card style={{ padding: Spacing.lg, marginBottom: Spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginBottom: 4 }}>
                TOTAL DOCUMENTS
              </Text>
              <Text style={{ fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: colors.text }}>
                {stats.total}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginBottom: 4 }}>
                STORAGE USED
              </Text>
              <Text style={{ fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: colors.text }}>
                {formatFileSize(stats.totalSize)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Search */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
          backgroundColor: colors.card, borderRadius: BorderRadius.lg,
          borderWidth: 1, borderColor: colors.border,
          paddingHorizontal: Spacing.lg, height: 48, marginBottom: Spacing.md,
        }}>
          <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search documents..."
            placeholderTextColor={colors.textTertiary}
            style={{ flex: 1, color: colors.text, fontSize: FontSize.md }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: Spacing.lg }}
          contentContainerStyle={{ gap: Spacing.sm }}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={{
                paddingHorizontal: 16, paddingVertical: 8,
                borderRadius: BorderRadius.full,
                backgroundColor: selectedCategory === cat ? colors.text : colors.card,
                borderWidth: 1,
                borderColor: selectedCategory === cat ? colors.text : colors.border,
              }}
            >
              <Text style={{
                fontSize: FontSize.sm, fontWeight: FontWeight.medium,
                color: selectedCategory === cat ? colors.background : colors.textSecondary,
                textTransform: 'capitalize',
              }}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Documents List */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.text} style={{ marginTop: 60 }} />
        ) : filteredDocuments.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="No documents found"
            description={searchQuery ? 'Try a different search term' : 'Upload documents to get started'}
          />
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {filteredDocuments.map((doc) => {
              const fileType = getFileIcon(doc.type);
              return (
                <TouchableOpacity
                  key={doc.id}
                  onPress={() => handleOpenDocument(doc)}
                  onLongPress={() => handleDeleteDocument(doc.id)}
                  activeOpacity={0.7}
                >
                  <Card style={{
                    padding: Spacing.lg,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                    <View style={{
                      width: 44, height: 44, borderRadius: BorderRadius.md,
                      backgroundColor: fileType.color + '15',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Ionicons name={fileType.icon} size={22} color={fileType.color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                      <Text
                        numberOfLines={1}
                        style={{ fontSize: FontSize.md, fontWeight: FontWeight.medium, color: colors.text }}
                      >
                        {doc.name}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 }}>
                        <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>
                          {formatFileSize(doc.size)}
                        </Text>
                        <Text style={{ fontSize: FontSize.xs, color: colors.textTertiary }}>•</Text>
                        <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>
                          {formatDate(doc.createdAt)}
                        </Text>
                      </View>
                      {(doc.customer || doc.deal) && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 6 }}>
                          {doc.customer && (
                            <Badge label={doc.customer.name} color={AccentColors.blue} />
                          )}
                          {doc.deal && (
                            <Badge label={doc.deal.title} color={AccentColors.emerald} />
                          )}
                        </View>
                      )}
                    </View>
                    <Badge label={doc.category} color={AccentColors.neutral} />
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </>
  );
}
