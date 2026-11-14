import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Family, FamilyDocument } from '../../api/types';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  FileIcon,
} from '../../components/icons';
import { useTheme } from '../../theme/ThemeProvider';
import { DocumentHistory } from './DocumentHistory';
import { documentDeleted, documentMeta } from './documentText';

type Props = {
  family: Family;
  document: FamilyDocument;
  divider: boolean;
  expanded: boolean;
  busy: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onDelete: () => void;
};

/**
 * Un document : titre, catégorie, auteur et date. Déplié : « Ouvrir le document », les
 * consultations, et « Supprimer » pour son auteur. Supprimé : la mention, sans bouton.
 */
export function DocumentRow({
  family,
  document,
  divider,
  expanded,
  busy,
  onToggle,
  onOpen,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const deleted = documentDeleted(family, document);
  const meta = documentMeta(family, document);
  const Chevron = expanded ? ChevronUpIcon : ChevronDownIcon;

  return (
    <View className={divider ? 'border-t border-border' : ''}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={[document.title, meta, deleted]
          .filter(Boolean)
          .join(', ')}
        className="min-h-[64px] flex-row items-center gap-3 py-2"
      >
        <View className="h-10 w-10 items-center justify-center rounded-[12px] bg-background">
          <FileIcon color={color(deleted ? 'text-secondary' : 'primary')} />
        </View>
        <View className="min-w-0 flex-1">
          <Text
            className={`font-bold text-[15px] ${
              deleted ? 'text-text-secondary line-through' : 'text-text'
            }`}
          >
            {document.title}
          </Text>
          <Text className="font-regular text-[13px] text-text-secondary">
            {meta}
          </Text>
          {deleted ? (
            <Text className="font-bold text-[13px] text-text-secondary">
              {deleted}
            </Text>
          ) : null}
        </View>
        <Chevron color={color('text-secondary')} />
      </Pressable>

      {expanded ? (
        <View className="mb-3.5 ml-[52px] gap-2.5">
          {deleted ? null : (
            <Pressable
              onPress={onOpen}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={t('documents.row.openLabel', {
                title: document.title,
              })}
              className={`min-h-[44px] flex-row items-center gap-1.5 self-start rounded-full border-[1.5px] border-primary px-4 ${
                busy ? 'opacity-50' : ''
              }`}
            >
              <EyeIcon size={18} color={color('primary')} />
              <Text className="font-extrabold text-[15px] text-primary">
                {t('documents.row.open')}
              </Text>
            </Pressable>
          )}
          <DocumentHistory family={family} document={document} />
          {document.canDelete ? (
            <Pressable
              onPress={onDelete}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={t('documents.row.deleteLabel', {
                title: document.title,
              })}
              className="min-h-[44px] justify-center self-start"
            >
              <Text className="font-bold text-[14px] text-error">
                {t('documents.row.delete')}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
