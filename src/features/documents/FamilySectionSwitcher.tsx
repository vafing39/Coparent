import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export type FamilySection = 'feed' | 'children' | 'documents';
const SECTIONS: FamilySection[] = ['feed', 'children', 'documents'];

/** Sélecteur « Fil / Enfants / Documents » de l'onglet Famille. */
export function FamilySectionSwitcher({
  value,
  onChange,
}: {
  value: FamilySection;
  onChange: (section: FamilySection) => void;
}) {
  const { t } = useTranslation();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={t('familyTab.sections.label')}
      className="flex-row gap-1 rounded-full bg-card p-1"
    >
      {SECTIONS.map(section => {
        const selected = value === section;
        return (
          <Pressable
            key={section}
            onPress={() => onChange(section)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            className={`min-h-[40px] flex-1 items-center justify-center rounded-full ${
              selected ? 'bg-primary' : ''
            }`}
          >
            <Text
              className={`font-bold text-[13px] ${
                selected ? 'text-on-primary' : 'text-text'
              }`}
            >
              {t(`familyTab.sections.${section}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
