import React from 'react';
import {
  Text,
  TextInput,
  TextInputInstance,
  TextInputProps,
  View,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type Props = Omit<TextInputProps, 'className' | 'placeholderTextColor'> & {
  label: string;
  error?: string;
  ref?: React.Ref<TextInputInstance>;
};

/** Champ de saisie du design system : libellé au-dessus, erreur en dessous. */
export function TextField({ label, error, ref, ...inputProps }: Props) {
  const { color } = useTheme();

  return (
    <View className="gap-1.5">
      <Text className="font-bold text-[13px] text-text">{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={error}
        aria-invalid={!!error}
        placeholderTextColor={color('text-secondary')}
        className={`min-h-[52px] rounded-md border-[1.5px] bg-surface px-4 font-regular text-[15px] text-text ${
          error ? 'border-error' : 'border-text-secondary'
        }`}
        {...inputProps}
      />
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          className="font-semibold text-[13px] leading-[18px] text-error"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
