import React from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle, RefreshControl, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/lib/utils';
import { BorderRadius, FontSize, Spacing } from '@/lib/theme';

// ── Badge ────────────────────────────────────────────────
interface BadgeProps {
  label: string;
  color: string;
  bgColor?: string;
  size?: 'sm' | 'md';
}
export function Badge({ label, color, bgColor, size = 'sm' }: BadgeProps) {
  return (
    <View style={[styles.badge, {
      backgroundColor: bgColor || color + '20',
      paddingHorizontal: size === 'sm' ? 8 : 10,
      paddingVertical: size === 'sm' ? 2 : 4,
    }]}>
      <Text style={[styles.badgeText, {
        color,
        fontSize: size === 'sm' ? FontSize.xs : FontSize.sm,
      }]}>{label}</Text>
    </View>
  );
}

// ── Card ─────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}
export function Card({ children, style, onPress }: CardProps) {
  const colors = useThemeColors();
  const cardStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...style,
  };

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

// ── StatCard ─────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress?: () => void;
}
export function StatCard({ title, value, icon, color, onPress }: StatCardProps) {
  const colors = useThemeColors();
  return (
    <Card onPress={onPress} style={{ flex: 1, minWidth: 140 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{
          width: 40, height: 40, borderRadius: BorderRadius.md,
          backgroundColor: color + '15', alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>{title}</Text>
          <Text style={{ fontSize: FontSize.xl, fontWeight: '700', color: colors.text }}>{value}</Text>
        </View>
      </View>
    </Card>
  );
}

// ── Button ───────────────────────────────────────────────
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}
export function Button({
  title, onPress, variant = 'primary', size = 'md',
  icon, loading, disabled, style,
}: ButtonProps) {
  const colors = useThemeColors();
  const bgMap = {
    primary: colors.primary,
    secondary: colors.surface,
    danger: colors.danger,
    ghost: 'transparent',
  };
  const textMap = {
    primary: '#fff',
    secondary: colors.text,
    danger: '#fff',
    ghost: colors.primary,
  };
  const heightMap = { sm: 34, md: 44, lg: 52 };
  const fontMap = { sm: FontSize.sm, md: FontSize.md, lg: FontSize.base };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[{
        backgroundColor: bgMap[variant],
        height: heightMap[size],
        borderRadius: BorderRadius.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.lg,
        gap: 6,
        opacity: disabled ? 0.5 : 1,
        borderWidth: variant === 'secondary' ? 1 : 0,
        borderColor: colors.border,
      }, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textMap[variant]} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={textMap[variant]} />}
          <Text style={{ color: textMap[variant], fontSize: fontMap[size], fontWeight: '600' }}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ── Input ────────────────────────────────────────────────
interface InputProps {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  secureTextEntry?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  editable?: boolean;
}
export function Input({
  label, value, onChangeText, placeholder, multiline,
  keyboardType, secureTextEntry, icon, error, editable = true,
}: InputProps) {
  const colors = useThemeColors();
  return (
    <View style={{ gap: 4 }}>
      {label && (
        <Text style={{ fontSize: FontSize.sm, fontWeight: '500', color: colors.textSecondary }}>
          {label}
        </Text>
      )}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.inputBg, borderRadius: BorderRadius.md,
        borderWidth: error ? 1.5 : 1,
        borderColor: error ? colors.danger : colors.border,
        paddingHorizontal: Spacing.md,
        minHeight: multiline ? 100 : 44,
      }}>
        {icon && <Ionicons name={icon} size={18} color={colors.textTertiary} style={{ marginRight: 8 }} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          multiline={multiline}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          editable={editable}
          style={{
            flex: 1,
            color: colors.text,
            fontSize: FontSize.md,
            paddingVertical: multiline ? Spacing.md : 0,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
        />
      </View>
      {error && <Text style={{ fontSize: FontSize.xs, color: colors.danger }}>{error}</Text>}
    </View>
  );
}

// ── SearchBar ────────────────────────────────────────────
interface SearchBarProps {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}
export function SearchBar({ value, onChangeText, placeholder = 'Search...' }: SearchBarProps) {
  const colors = useThemeColors();
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.inputBg, borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.lg, height: 42,
    }}>
      <Ionicons name="search" size={18} color={colors.textTertiary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        style={{
          flex: 1,
          marginLeft: 8,
          color: colors.text,
          fontSize: FontSize.md,
        }}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── EmptyState ───────────────────────────────────────────
interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}
export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const colors = useThemeColors();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 40 }}>
      <Ionicons name={icon} size={56} color={colors.textTertiary} />
      <Text style={{ fontSize: FontSize.lg, fontWeight: '600', color: colors.text, marginTop: 16, textAlign: 'center' }}>
        {title}
      </Text>
      {description && (
        <Text style={{ fontSize: FontSize.md, color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} style={{ marginTop: 20 }} icon="add" />
      )}
    </View>
  );
}

// ── LoadingScreen ────────────────────────────────────────
export function LoadingScreen() {
  const colors = useThemeColors();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

// ── Chip / Filter ────────────────────────────────────────
interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}
export function Chip({ label, active, onPress }: ChipProps) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: BorderRadius.full,
        backgroundColor: active ? colors.primary : colors.surface,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
      }}
    >
      <Text style={{
        fontSize: FontSize.sm,
        fontWeight: active ? '600' : '400',
        color: active ? '#fff' : colors.textSecondary,
      }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── FAB ──────────────────────────────────────────────────
interface FABProps {
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}
export function FAB({ icon = 'add', onPress }: FABProps) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <Ionicons name={icon} size={28} color="#fff" />
    </TouchableOpacity>
  );
}

// ── Section ──────────────────────────────────────────────
interface SectionProps {
  title: string;
  action?: { label: string; onPress: () => void };
  children: React.ReactNode;
}
export function Section({ title, action, children }: SectionProps) {
  const colors = useThemeColors();
  return (
    <View style={{ marginTop: Spacing.xl }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
        <Text style={{ fontSize: FontSize.lg, fontWeight: '700', color: colors.text }}>{title}</Text>
        {action && (
          <TouchableOpacity onPress={action.onPress}>
            <Text style={{ fontSize: FontSize.sm, color: colors.primary, fontWeight: '500' }}>{action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

// ── Divider ──────────────────────────────────────────────
export function Divider() {
  const colors = useThemeColors();
  return <View style={{ height: 1, backgroundColor: colors.border, marginVertical: Spacing.md }} />;
}

// ── ListItem ─────────────────────────────────────────────
interface ListItemProps {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onPress?: () => void;
  bottomBorder?: boolean;
}
export function ListItem({ title, subtitle, left, right, onPress, bottomBorder = true }: ListItemProps) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: bottomBorder ? 1 : 0,
        borderBottomColor: colors.border,
        gap: Spacing.md,
      }}
    >
      {left}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: FontSize.md, fontWeight: '500', color: colors.text }}>{title}</Text>
        {subtitle && <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 2 }}>{subtitle}</Text>}
      </View>
      {right || (onPress && <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />)}
    </TouchableOpacity>
  );
}

// ── Avatar ───────────────────────────────────────────────
interface AvatarProps {
  name: string;
  size?: number;
  color?: string;
}
export function Avatar({ name, size = 40, color }: AvatarProps) {
  const colors = useThemeColors();
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const bgColor = color || colors.primary;

  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: bgColor + '20',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: size * 0.38, fontWeight: '700', color: bgColor }}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
