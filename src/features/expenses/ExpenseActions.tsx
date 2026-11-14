import React from 'react';
import { View } from 'react-native';
import { Button } from '../../components/Button';

export type ExpenseAction = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'neutral';
  disabled?: boolean;
};

/**
 * Deux boutons côte à côte sous une dépense (« Accepter » / « Contester », « Corriger » /
 * « Retirer »). Leur nom accessible cite la dépense : « Accepter : Cantine de novembre ».
 */
export function ExpenseActions({
  expenseLabel,
  actions,
}: {
  expenseLabel: string;
  actions: [ExpenseAction, ExpenseAction];
}) {
  return (
    <View className="flex-row gap-2 pl-[52px]">
      {actions.map(action => (
        <View key={action.label} className="flex-1">
          <Button
            label={action.label}
            accessibilityLabel={`${action.label} : ${expenseLabel}`}
            onPress={action.onPress}
            variant={action.variant ?? 'neutral'}
            disabled={action.disabled}
            compact
          />
        </View>
      ))}
    </View>
  );
}
