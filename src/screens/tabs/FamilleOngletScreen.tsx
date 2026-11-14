import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ComingSoonCard } from '../../features/documents/ComingSoonCard';
import { DocumentsSection } from '../../features/documents/DocumentsSection';
import { FamilyHeader } from '../../features/documents/FamilyHeader';
import {
  FamilySection,
  FamilySectionSwitcher,
} from '../../features/documents/FamilySectionSwitcher';
import { useFamily } from '../../hooks/useFamily';
import type { TabScreenProps } from '../../navigation/types';

/**
 * Onglet Famille : sélecteur « Fil / Enfants / Documents ». Seuls les documents existent pour
 * l'instant : la section s'ouvre par défaut, Fil et Enfants annoncent leur contenu.
 */
export function FamilleOngletScreen({ navigation }: TabScreenProps<'Famille'>) {
  const { t } = useTranslation();
  const { family } = useFamily();
  const [section, setSection] = useState<FamilySection>('documents');

  if (!family) {
    return null;
  }
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerClassName="gap-3.5 px-4 pt-5 pb-8">
        <FamilyHeader
          onAddDocument={
            section === 'documents'
              ? () => navigation.navigate('DocumentForm')
              : undefined
          }
          onOpenAccount={() => navigation.navigate('CompteFamille')}
        />
        <FamilySectionSwitcher value={section} onChange={setSection} />
        {section === 'documents' ? (
          <DocumentsSection family={family} />
        ) : (
          <ComingSoonCard
            text={
              section === 'feed'
                ? t('familyTab.feedSoon')
                : t('familyTab.childrenSoon')
            }
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
