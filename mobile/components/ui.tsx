import React from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle, RefreshControl, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, useIsDark } from '@/lib/utils';
import { BorderRadius, FontSize, Spacing, FontWeight } from '@/lib/theme';

// ── StatusBadge (matches frontend StatusBadge with dot) ──
interface StatusBadgeProps {
  label: string;
  dotColor: string;
  textColor: string;
  bgColor: string;
  size?: 'sm' | 'md';
}
export function StatusBadge({ label, dotColor, textColor, bgColor, size = 'sm' }: StatusBadgeProps) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: bgColor,
      borderRadius: BorderRadius.full,
      paddingHorizontal: size === 'sm' ? 8 : 12,
      paddingVertical: size === 'sm' ? 3 : 5,
      alignSelf: 'flex-start',
    }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor }} />
      <Text style={{
        fontSize: size === 'sm' ? FontSize.xs : FontSize.sm,
        fontWeight: FontWeight.medium,
        color: textColor,
        textTransform: 'capitalize',
      }}>{label}</Text>
    </View>
  );
}

// ── Badge (simple variant) ───────────────────────────────
interface BadgeProps {
  label: string;
  color: string;
  bgColor?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}
export function Badge({ label, color, bgColor, size = 'sm', style }: BadgeProps) {
  return (
    <View style={[styles.badge, {
      backgroundColor: bgColor || color + '15',
      paddingHorizontal: size === 'sm' ? 8 : 12,
      paddingVertical: size === 'sm' ? 2 : 4,
    }, style]}>
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
    borderRadius: BorderRadius.lg,    // rounded-xl (12)
    padding: Spacing.xxl,             // p-6 (24)
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

// ── StatCard (matches frontend stat card with icon bg) ───
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
    <Card onPress={onPress} style={{ flex: 1, minWidth: 140, padding: Spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: FontSize.sm, fontWeight: FontWeight.normal, color: colors.textSecondary }}>
            {title}
          </Text>
          <Text style={{ fontSize: FontSize.xxl, fontWeight: FontWeight.semibold, color: colors.text, marginTop: 4 }}>
            {value}
          </Text>
        </View>
        <View style={{
          width: 44, height: 44, borderRadius: BorderRadius.md,
          backgroundColor: colors.iconBg,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
      </View>
    </Card>
  );
}

// ── Button (matches frontend: neutral-900/white primary) ─
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
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
    secondary: colors.card,
    danger: colors.danger,
    ghost: 'transparent',
    outline: 'transparent',
  };
  const textMap = {
    primary: colors.primaryText,
    secondary: colors.text,
    danger: '#ffffff',
    ghost: colors.text,
    outline: colors.text,
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
        borderRadius: BorderRadius.lg,     // rounded-xl
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: size === 'lg' ? Spacing.xxl : Spacing.lg,
        gap: 6,
        opacity: disabled ? 0.5 : 1,
        borderWidth: variant === 'secondary' || variant === 'outline' ? 1 : 0,
        borderColor: colors.border,
      }, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textMap[variant]} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={textMap[variant]} />}
          <Text style={{ color: textMap[variant], fontSize: fontMap[size], fontWeight: FontWeight.medium }}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ── Input (matches frontend input style) ─────────────────
interface InputProps {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  editable?: boolean;
  style?: ViewStyle;
}
export function Input({
  label, value, onChangeText, placeholder, multiline, numberOfLines,
  keyboardType, secureTextEntry, autoCapitalize, icon, error, editable = true, style,
}: InputProps) {
  const colors = useThemeColors();
  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text style={{ fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: colors.textSecondary }}>
          {label}
        </Text>
      )}
      <View style={[{
        flexDirection: 'row', alignItems: multiline ? 'flex-start' : 'center',
        backgroundColor: colors.inputBg,
        borderRadius: BorderRadius.lg,
        borderWidth: error ? 1.5 : 1,
        borderColor: error ? colors.danger : colors.border,
        paddingHorizontal: Spacing.lg,
        minHeight: multiline ? (numberOfLines ? numberOfLines * 24 + 24 : 100) : 48,
      }, style]}>
        {icon && <Ionicons name={icon} size={18} color={colors.textTertiary} style={{ marginRight: 10 }} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
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
      backgroundColor: colors.inputBg,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.lg, height: 44,
    }}>
      <Ionicons name="search" size={16} color={colors.textTertiary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        style={{
          flex: 1,
          marginLeft: 10,
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
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}
export function EmptyState({ icon, title, description, message, actionLabel, onAction }: EmptyStateProps) {
  const colors = useThemeColors();
  const desc = description || message;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 64, paddingHorizontal: 40 }}>
      <View style={{
        width: 64, height: 64, borderRadius: BorderRadius.xl,
        backgroundColor: colors.iconBg,
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
      }}>
        <Ionicons name={icon} size={28} color={colors.textTertiary} />
      </View>
      <Text style={{ fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: colors.text, marginBottom: 8, textAlign: 'center' }}>
        {title}
      </Text>
      {desc && (
        <Text style={{ fontSize: FontSize.md, color: colors.textSecondary, textAlign: 'center', maxWidth: 280 }}>
          {desc}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} style={{ marginTop: 24 }} icon="add" />
      )}
    </View>
  );
}

// ── LoadingScreen ────────────────────────────────────────
export function LoadingScreen() {
  const colors = useThemeColors();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.text} />
    </View>
  );
}

// ── Chip / Filter (matches frontend Tabs active/inactive) ─
interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  color?: string;
}
export function Chip({ label, active, onPress }: ChipProps) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: BorderRadius.md,
        backgroundColor: active ? colors.primary : colors.surface,
        borderWidth: active ? 0 : 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{
        fontSize: FontSize.sm,
        fontWeight: active ? FontWeight.medium : FontWeight.normal,
        color: active ? colors.primaryText : colors.textSecondary,
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
        bottom: 24,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <Ionicons name={icon} size={26} color={colors.primaryText} />
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
    <View style={{ marginTop: Spacing.xxl }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
        <Text style={{ fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: colors.text }}>{title}</Text>
        {action && (
          <TouchableOpacity onPress={action.onPress}>
            <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, fontWeight: FontWeight.medium }}>{action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

// ── Divider ──────────────────────────────────────────────
export function Divider({ style }: { style?: ViewStyle }) {
  const colors = useThemeColors();
  return <View style={[{ height: 1, backgroundColor: colors.border, marginVertical: Spacing.md }, style]} />;
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
        <Text style={{ fontSize: FontSize.md, fontWeight: FontWeight.medium, color: colors.text }}>{title}</Text>
        {subtitle && <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 2 }}>{subtitle}</Text>}
      </View>
      {right || (onPress && <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />)}
    </TouchableOpacity>
  );
}

// ── Avatar (matching frontend colored initials) ──────────
interface AvatarProps {
  name: string;
  size?: number;
  color?: string;
}
export function Avatar({ name, size = 40, color }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Generate consistent color from name if no color provided
  const bgColor = color || generateAvatarColor(name);

  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: bgColor,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: size * 0.36, fontWeight: FontWeight.semibold, color: '#ffffff' }}>
        {initials}
      </Text>
    </View>
  );
}

// Generate consistent avatar bg color (matching frontend dynamic colors)
function generateAvatarColor(name: string): string {
  const avatarColors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

// ── ProgressBar (matching frontend) ──────────────────────
interface ProgressBarProps {
  value: number;
  color?: string;
  height?: number;
}
export function ProgressBar({ value, color, height = 4 }: ProgressBarProps) {
  const colors = useThemeColors();
  return (
    <View style={{ height, backgroundColor: colors.border, borderRadius: height / 2 }}>
      <View style={{
        height, borderRadius: height / 2,
        backgroundColor: color || colors.primary,
        width: `${Math.min(Math.max(value, 0), 100)}%`,
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontWeight: FontWeight.medium,
    textTransform: 'capitalize',
  },
});
