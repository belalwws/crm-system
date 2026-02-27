import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useAuthToken } from '@/lib/utils';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useThemeColors, formatDate, timeAgo, getPriorityColor, getStatusColor } from '@/lib/utils';
import { Card, Section, Badge, LoadingScreen, ListItem, Button, Divider } from '@/components/ui';
import { FontSize, Spacing } from '@/lib/theme';
import type { Task, Note } from '@/lib/types';

export default function TaskDetailScreen() {
  const colors = useThemeColors();
  const { getAuthToken } = useAuthToken();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [task, setTask] = useState<Task | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const [taskRes, notesRes] = await Promise.all([
        api.getTask(id!),
        api.getNotes({ taskId: id }),
      ]);
      if (taskRes.success && taskRes.data) setTask(taskRes.data);
      if (notesRes.success) setNotes(Array.isArray(notesRes.data) ? notesRes.data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [id, getAuthToken]);

  useEffect(() => { fetchData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const toggleStatus = async () => {
    if (!task) return;
    const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    try {
      const token = await getAuthToken();
      await api.updateTask(id!, { status: newStatus });
      setTask({ ...task, status: newStatus });
    } catch (err) { console.error(err); }
  };

  const handleDelete = () => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const token = await getAuthToken();
        await api.deleteTask(id!); router.back();
      }},
    ]);
  };

  if (loading || !task) return <LoadingScreen />;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';

  return (
    <>
      <Stack.Screen options={{
        title: 'Task',
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => router.push(`/task/edit/${id}`)}>
              <Ionicons name="create-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete}>
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ),
      }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <Card style={{ padding: Spacing.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <TouchableOpacity onPress={toggleStatus} style={{ marginRight: Spacing.md, marginTop: 2 }}>
              <Ionicons
                name={task.status === 'COMPLETED' ? 'checkmark-circle' : 'ellipse-outline'}
                size={32}
                color={task.status === 'COMPLETED' ? '#22c55e' : colors.textSecondary}
              />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: FontSize.xxl, fontWeight: '700', color: colors.text,
                textDecorationLine: task.status === 'COMPLETED' ? 'line-through' : 'none',
              }}>
                {task.title}
              </Text>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
                <Badge label={task.priority} color={getPriorityColor(task.priority)} />
                <Badge label={task.status.replace('_', ' ')} color={getStatusColor(task.status)} />
              </View>
            </View>
          </View>

          {task.description && (
            <>
              <Divider style={{ marginVertical: Spacing.lg }} />
              <Text style={{ fontSize: FontSize.md, color: colors.text, lineHeight: 22 }}>{task.description}</Text>
            </>
          )}
        </Card>

        {/* Details */}
        <Section title="Details">
          <Card style={{ padding: Spacing.lg, gap: Spacing.md }}>
            {task.dueDate && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: isOverdue ? '#ef444420' : colors.primary + '20',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="calendar" size={18} color={isOverdue ? '#ef4444' : colors.primary} />
                </View>
                <View>
                  <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>Due Date</Text>
                  <Text style={{
                    fontSize: FontSize.md, color: isOverdue ? '#ef4444' : colors.text, fontWeight: '500',
                  }}>
                    {formatDate(task.dueDate)} {isOverdue ? '(Overdue)' : ''}
                  </Text>
                </View>
              </View>
            )}
            {task.customer && (
              <TouchableOpacity
                onPress={() => router.push(`/customer/${task.customer!.id}`)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#6366f120', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="person" size={18} color="#6366f1" />
                </View>
                <View>
                  <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>Customer</Text>
                  <Text style={{ fontSize: FontSize.md, color: colors.primary, fontWeight: '500' }}>{task.customer.name}</Text>
                </View>
              </TouchableOpacity>
            )}
            {task.deal && (
              <TouchableOpacity
                onPress={() => router.push(`/deal/${task.deal!.id}`)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#3b82f620', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="briefcase" size={18} color="#3b82f6" />
                </View>
                <View>
                  <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>Deal</Text>
                  <Text style={{ fontSize: FontSize.md, color: colors.primary, fontWeight: '500' }}>{task.deal.title}</Text>
                </View>
              </TouchableOpacity>
            )}
          </Card>
        </Section>

        {/* Quick Actions */}
        <Section title="Actions">
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <Button
              title={task.status === 'COMPLETED' ? 'Reopen' : 'Complete'}
              icon={task.status === 'COMPLETED' ? 'refresh' : 'checkmark'}
              onPress={toggleStatus}
              variant={task.status === 'COMPLETED' ? 'outline' : 'primary'}
              style={{ flex: 1 }}
            />
            <Button
              title="Edit"
              icon="create"
              onPress={() => router.push(`/task/edit/${id}`)}
              variant="outline"
              style={{ flex: 1 }}
            />
          </View>
        </Section>

        {/* Notes */}
        <Section title="Notes" action={{ label: 'Add', onPress: () => router.push(`/note/create?taskId=${id}`) }}>
          <Card>
            {notes.length === 0 ? (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: Spacing.lg }}>No notes yet</Text>
            ) : (
              notes.map((note, i) => (
                <ListItem
                  key={note.id}
                  title={note.title || 'Untitled'}
                  subtitle={`${timeAgo(note.createdAt)} • ${(note.content || '').substring(0, 60)}...`}
                  left={<Ionicons name="document-text" size={20} color={colors.primary} />}
                  bottomBorder={i < notes.length - 1}
                />
              ))
            )}
          </Card>
        </Section>

        <View style={{ marginTop: Spacing.lg, alignItems: 'center' }}>
          <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Created {formatDate(task.createdAt)}</Text>
        </View>
      </ScrollView>
    </>
  );
}
