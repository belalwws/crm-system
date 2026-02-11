import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useThemeColors, formatDate, getPriorityColor, getStatusColor } from '@/lib/utils';
import { SearchBar, FAB, Badge, EmptyState, LoadingScreen, Chip } from '@/components/ui';
import { FontSize, Spacing, BorderRadius } from '@/lib/theme';
import type { Task } from '@/lib/types';

const STATUS_FILTERS = ['ALL', 'TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const PRIORITY_FILTERS = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function TasksScreen() {
  const colors = useThemeColors();
  const { getToken } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const fetchTasks = useCallback(async () => {
    try {
      const token = await getToken();
      api.setToken(token);
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      const res = await api.getTasks(params);
      if (res.success) setTasks(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [getToken, search, statusFilter, priorityFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchTasks(), 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, priorityFilter]);

  useEffect(() => { fetchTasks(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchTasks(); }, [fetchTasks]);

  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    try {
      const token = await getToken(); api.setToken(token);
      await api.updateTask(task.id, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch (err) { console.error(err); }
  };

  const isOverdue = (task: Task) => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';

  const renderTask = ({ item }: { item: Task }) => (
    <TouchableOpacity
      onPress={() => router.push(`/task/${item.id}`)}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.card,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: isOverdue(item) ? '#ef4444' : colors.border,
        opacity: item.status === 'COMPLETED' ? 0.7 : 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <TouchableOpacity
          onPress={() => toggleStatus(item)}
          style={{ marginRight: Spacing.md, marginTop: 2 }}
        >
          <Ionicons
            name={item.status === 'COMPLETED' ? 'checkmark-circle' : 'ellipse-outline'}
            size={26}
            color={item.status === 'COMPLETED' ? '#22c55e' : colors.textSecondary}
          />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: FontSize.lg, fontWeight: '600', color: colors.text,
            textDecorationLine: item.status === 'COMPLETED' ? 'line-through' : 'none',
          }} numberOfLines={2}>
            {item.title}
          </Text>
          {item.description && (
            <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 2 }} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, gap: Spacing.sm, flexWrap: 'wrap' }}>
            <Badge label={item.priority} color={getPriorityColor(item.priority)} />
            <Badge label={item.status.replace('_', ' ')} color={getStatusColor(item.status)} />
            {item.dueDate && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons
                  name="calendar-outline" size={12}
                  color={isOverdue(item) ? '#ef4444' : colors.textSecondary}
                />
                <Text style={{
                  fontSize: FontSize.xs,
                  color: isOverdue(item) ? '#ef4444' : colors.textSecondary,
                  fontWeight: isOverdue(item) ? '600' : '400',
                }}>
                  {formatDate(item.dueDate)}
                </Text>
              </View>
            )}
          </View>
          {item.customer && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm }}>
              <Ionicons name="person-outline" size={12} color={colors.textSecondary} />
              <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>{item.customer.name}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: Spacing.lg, paddingBottom: 0 }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search tasks..." />
        <FlatList
          data={STATUS_FILTERS}
          horizontal showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => 'status-' + item}
          contentContainerStyle={{ gap: Spacing.sm, paddingVertical: Spacing.sm }}
          renderItem={({ item }) => (
            <Chip label={item.replace('_', ' ')} active={statusFilter === item} onPress={() => setStatusFilter(item)} />
          )}
        />
        <FlatList
          data={PRIORITY_FILTERS}
          horizontal showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => 'priority-' + item}
          contentContainerStyle={{ gap: Spacing.sm, paddingBottom: Spacing.sm }}
          renderItem={({ item }) => (
            <Chip label={item} active={priorityFilter === item}
              onPress={() => setPriorityFilter(item)}
              color={item === 'ALL' ? undefined : getPriorityColor(item)} />
          )}
        />
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        contentContainerStyle={{ padding: Spacing.lg, paddingTop: 0 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState icon="checkmark-circle" title="No tasks found" message="Add your first task to stay organized" />
        }
      />

      <FAB icon="add" onPress={() => router.push('/task/create')} />
    </View>
  );
}
