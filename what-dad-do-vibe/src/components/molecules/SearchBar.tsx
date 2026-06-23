import React, { useMemo } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../context/ThemeContext';
import { radius, spacing, typography } from '../../styles/tokens';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
}

export function SearchBar({ placeholder = '搜索...', value, onChangeText }: SearchBarProps) {
  const colors = useColors();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      paddingHorizontal: spacing.md + 2,
      paddingVertical: spacing.sm + 2,
      backgroundColor: colors.bg,
      borderRadius: radius.md,
      borderWidth: 0.5,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    icon: {
      fontSize: 16,
    },
    input: {
      flex: 1,
      ...typography.callout,
      color: colors.fg,
      padding: 0,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <Ionicons name="search" size={16} color={colors.muted} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}


export default SearchBar;