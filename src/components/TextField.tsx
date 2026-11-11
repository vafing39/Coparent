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
  /** Aide sous le champ (ex. règle du mot de passe), remplacée par l'erreur s'il y en a une. */
  hint?: string;
  ref?: React.Ref<TextInputInstance>;
};

/** Champ de saisie du design system : libellé au-dessus, erreur en dessous. */
export function TextField({ label, error, hint, ref, ...inputProps }: Props) {
  const { color } = useTheme();

  return (
    <View className="gap-1.5">
      <Text className="font-bold text-[13px] text-text">{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
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
      ) : hint ? (
        <Text className="font-regular text-[13px] leading-[18px] text-text-secondary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
