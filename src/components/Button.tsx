import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import type { ColorToken } from '../theme/tokens';

type Variant = 'primary' | 'secondary' | 'inverse' | 'neutral';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  /** Texte 15 px au lieu de 17 px (boutons côte à côte). */
  compact?: boolean;
  loading?: boolean;
  disabled?: boolean;
  /** Icône décorative à gauche du libellé ; reçoit la couleur du texte. */
  icon?: (color: string) => React.ReactNode;
  /** Par défaut, le libellé visible. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

const styles: Record<
  Variant,
  { container: string; label: string; content: ColorToken }
> = {
  primary: {
    container: 'bg-primary',
    label: 'text-on-primary',
    content: 'on-primary',
  },
  secondary: {
    container: 'bg-surface border-[1.5px] border-primary',
    label: 'text-primary',
    content: 'primary',
  },
  inverse: {
    container: 'bg-text',
    label: 'text-background',
    content: 'background',
  },
  neutral: {
    container: 'bg-surface border-[1.5px] border-text-secondary',
    label: 'text-text',
    content: 'text',
  },
};

/** Bouton pilule du design system (hauteur 52, cible tactile ≥ 44). */
export function Button({
  label,
  onPress,
  variant = 'primary',
  compact = false,
  loading = false,
  disabled = false,
  icon,
  accessibilityLabel,
  accessibilityHint,
}: Props) {
  const { color } = useTheme();
  const style = styles[variant];
  const contentColor = color(style.content);
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      className={`min-h-[52px] flex-row items-center justify-center gap-2.5 rounded-full px-5 active:opacity-80 ${
        style.container
      } ${disabled && !loading ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={contentColor} />
      ) : (
        <>
          {icon ? (
            <View
              accessible={false}
              importantForAccessibility="no-hide-descendants"
            >
              {icon(contentColor)}
            </View>
          ) : null}
          <Text
            className={`font-extrabold text-center ${
              compact ? 'text-[15px]' : 'text-[17px]'
            } ${style.label}`}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
