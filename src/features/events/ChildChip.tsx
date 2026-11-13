import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CheckIcon } from '../../components/icons';
import { useTheme } from '../../theme/ThemeProvider';

/** Enfant concerné : une pastille cochable. */
export function ChildChip({
  label,
  checked,
  onPress,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
}) {
  const { color } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      className={`min-h-[44px] flex-row items-center gap-2 rounded-full pl-2 pr-3.5 ${
        checked
          ? 'border-2 border-primary bg-primary-soft'
          : 'border-[1.5px] border-border bg-card'
      }`}
    >
      <View
        className={`h-[26px] w-[26px] items-center justify-center rounded-full border-2 bg-card ${
          checked ? 'border-primary' : 'border-text-secondary'
        }`}
      >
        {checked ? (
          <CheckIcon size={14} color={color('primary')} strokeWidth={3} />
        ) : null}
      </View>
      <Text className="font-bold text-[15px] text-text">{label}</Text>
    </Pressable>
  );
}
