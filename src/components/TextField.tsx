import React, { useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  TextInputInstance,
  TextInputProps,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { EyeIcon, EyeOffIcon } from './icons';

type Props = Omit<TextInputProps, 'className' | 'placeholderTextColor'> & {
  label: string;
  error?: string;
  /** Aide sous le champ (ex. règle du mot de passe), remplacée par l'erreur s'il y en a une. */
  hint?: string;
  ref?: React.Ref<TextInputInstance>;
};

/**
 * Champ de saisie du design system : libellé au-dessus, erreur en dessous.
 * Avec secureTextEntry (mot de passe), un bouton « œil » permet d'afficher ou de masquer la saisie.
 */
export function TextField({
  label,
  error,
  hint,
  ref,
  secureTextEntry,
  ...inputProps
}: Props) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const [revealed, setRevealed] = useState(false);

  return (
    <View className="gap-1.5">
      <Text className="font-bold text-[13px] text-text">{label}</Text>
      <View className="justify-center">
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          aria-invalid={!!error}
          placeholderTextColor={color('text-secondary')}
          className={`min-h-[52px] rounded-md border-[1.5px] bg-surface px-4 font-regular text-[15px] text-text ${
            secureTextEntry ? 'pr-14' : ''
          } ${error ? 'border-error' : 'border-text-secondary'}`}
          secureTextEntry={secureTextEntry && !revealed}
          {...inputProps}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setRevealed(value => !value)}
            accessibilityRole="button"
            accessibilityLabel={t(
              revealed ? 'fields.password.hide' : 'fields.password.show',
            )}
            className="absolute right-1 h-11 w-11 items-center justify-center rounded-full active:opacity-60"
          >
            {revealed ? (
              <EyeOffIcon color={color('text-secondary')} />
            ) : (
              <EyeIcon color={color('text-secondary')} />
            )}
          </Pressable>
        ) : null}
      </View>
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
