import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bagErrorMessage } from '../../api/bag';
import type { Bag, BagItem } from '../../api/types';
import { LoadError } from '../../components/LoadError';
import { TextField } from '../../components/TextField';
import { CheckIcon, ChevronLeftIcon, PlusIcon } from '../../components/icons';
import { useBag } from '../../hooks/useBag';
import { useCustody } from '../../hooks/useCustody';
import { useFamily } from '../../hooks/useFamily';
import { useResetOnUnmount } from '../../hooks/useResetOnUnmount';
import {
  formatShortDate,
  formatTime,
  splitLocalDateTime,
} from '../../lib/dates';
import type { AppScreenProps } from '../../navigation/types';
import {
  bagItemSchema,
  type BagItemInput,
  type BagItemValues,
} from '../../schemas/bag';
import { useTheme } from '../../theme/ThemeProvider';
import { parentOf } from './parents';

/**
 * « Sac à préparer » pour le prochain passage de garde : une liste par enfant, partagée par
 * les deux parents. Chacun ajoute, coche, décoche ou supprime (appui long) un élément ;
 * les cases repartent à zéro après chaque passage (backend).
 */
export function SacAPreparerScreen({
  navigation,
}: AppScreenProps<'SacAPreparer'>) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const { family } = useFamily();
  const { custody } = useCustody();
  const { bag, bagError, reloadBag } = useBag();
  const handover = custody?.nextHandover;

  let subtitle: string | null = null;
  if (family && handover) {
    const { date, time } = splitLocalDateTime(handover.at);
    subtitle = t('home.bag.handover', {
      date: formatShortDate(date),
      time: formatTime(time),
      from: parentOf(family, handover.from).name,
      to: parentOf(family, handover.to).name,
    });
  }

  let body: React.ReactNode;
  if (bag) {
    body = <BagContent bag={bag} />;
  } else if (bagError) {
    body = <LoadError message={t('home.bag.loadFailed')} onRetry={reloadBag} />;
  } else {
    body = (
      <View
        accessible
        accessibilityLabel={t('common.loading')}
        className="gap-3 px-4 pt-2"
      >
        <View className="h-[21px] w-1/3 rounded-md bg-surface" />
        <View className="h-[160px] rounded-[20px] bg-surface" />
        <View className="h-[52px] rounded-md bg-surface" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center gap-1 pb-1 pl-2 pr-4 pt-6">
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          className="h-12 w-12 items-center justify-center rounded-full"
        >
          <ChevronLeftIcon color={color('text')} />
        </Pressable>
        <View className="flex-1">
          <Text
            accessibilityRole="header"
            className="font-extrabold text-[24px] leading-[30px] text-text"
          >
            {t('home.bag.title')}
          </Text>
          {subtitle ? (
            <Text className="font-regular text-[13px] text-text-secondary">
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {body}
    </SafeAreaView>
  );
}

/** Le sac chargé : le compte, une carte par enfant, l'ajout d'un élément. */
function BagContent({ bag }: { bag: Bag }) {
  const { t } = useTranslation();
  const {
    deleteBagItem,
    deleteBagItemError,
    resetDeleteBagItem,
    setBagItemChecked,
    setBagItemCheckedError,
    resetSetBagItemChecked,
  } = useBag();
  useResetOnUnmount(resetDeleteBagItem, resetSetBagItemChecked);
  const canCheck = bag.handoverAt !== null;
  const actionError = setBagItemCheckedError ?? deleteBagItemError;

  const toggle = (item: BagItem) => {
    resetDeleteBagItem();
    setBagItemChecked({ itemId: item.id, checked: !item.checked });
  };
  const confirmDelete = (item: BagItem) => {
    Alert.alert(
      t('home.bag.deleteConfirm', { label: item.label }),
      t('home.bag.deleteBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('home.bag.delete'),
          style: 'destructive',
          onPress: () => {
            resetSetBagItemChecked();
            deleteBagItem(item.id);
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="gap-3 px-4 pt-2 pb-8"
    >
      {bag.total > 0 ? (
        <Text className="mx-1 font-bold text-[15px] text-text">
          {t('home.bag.count', {
            checked: bag.checkedCount,
            total: bag.total,
          })}
        </Text>
      ) : (
        <View className="rounded-[20px] border border-border bg-card p-[18px]">
          <Text className="font-regular text-[15px] leading-[21px] text-text-secondary">
            {t('home.bag.empty')}
          </Text>
        </View>
      )}

      {bag.total > 0 && !canCheck ? (
        <Text className="mx-1 font-regular text-[13px] leading-[18px] text-text-secondary">
          {t('home.bag.noHandover')}
        </Text>
      ) : null}

      {bag.children
        .filter(child => child.items.length > 0)
        .map(child => (
          <View
            key={child.childId}
            className="rounded-[20px] border border-border bg-card px-4 py-1.5"
          >
            <Text
              accessibilityRole="header"
              className="mb-0.5 mt-2 font-bold text-[17px] text-text"
            >
              {child.firstName}
            </Text>
            {child.items.map(item => (
              <BagItemRow
                key={item.id}
                item={item}
                disabled={!canCheck}
                onToggle={() => toggle(item)}
                onDelete={() => confirmDelete(item)}
              />
            ))}
          </View>
        ))}

      {actionError ? (
        <Text
          accessibilityRole="alert"
          className="mx-1 font-semibold text-[13px] leading-[18px] text-error"
        >
          {bagErrorMessage(actionError)}
        </Text>
      ) : null}

      <AddItemForm bag={bag} />

      <Text className="mx-1 font-regular text-[13px] leading-[18px] text-text-secondary">
        {t('home.bag.shared')}
      </Text>
    </ScrollView>
  );
}

type RowProps = {
  item: BagItem;
  disabled: boolean;
  onToggle: () => void;
  onDelete: () => void;
};

/** Une case à cocher ; appui long (ou action d'accessibilité) pour supprimer. */
function BagItemRow({ item, disabled, onToggle, onDelete }: RowProps) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const checkedBy =
    item.checked && item.checkedBy
      ? t('home.bag.checkedBy', { firstName: item.checkedBy })
      : null;

  return (
    <Pressable
      onPress={onToggle}
      onLongPress={onDelete}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: item.checked, disabled }}
      accessibilityLabel={item.label}
      accessibilityHint={t('home.bag.itemHint')}
      accessibilityActions={[{ name: 'delete', label: t('home.bag.delete') }]}
      onAccessibilityAction={event => {
        if (event.nativeEvent.actionName === 'delete') {
          onDelete();
        }
      }}
      className="min-h-[52px] flex-row items-center gap-3"
    >
      <View
        className={`h-[26px] w-[26px] items-center justify-center rounded-lg border-2 ${
          item.checked
            ? 'border-primary bg-primary'
            : `border-text-secondary bg-card ${disabled ? 'opacity-50' : ''}`
        }`}
      >
        {item.checked ? <CheckIcon color={color('on-primary')} /> : null}
      </View>
      <Text className="flex-1 font-bold text-[15px] text-text">
        {item.label}
      </Text>
      {checkedBy ? (
        <Text className="font-regular text-[13px] text-text-secondary">
          {checkedBy}
        </Text>
      ) : null}
    </Pressable>
  );
}

/** « Ajouter un élément » : l'enfant (s'il y en a plusieurs), le libellé, « + ». */
function AddItemForm({ bag }: { bag: Bag }) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const { addBagItem, isAddingBagItem, resetAddBagItem } = useBag();
  useResetOnUnmount(resetAddBagItem);
  const [childId, setChildId] = useState(bag.children[0]?.childId);
  const selectedChild = bag.children.find(c => c.childId === childId);
  const { control, handleSubmit, reset, setError } = useForm<
    BagItemInput,
    unknown,
    BagItemValues
  >({
    resolver: zodResolver(bagItemSchema),
    defaultValues: { label: '' },
  });

  if (!childId) {
    return null;
  }

  const onSubmit = handleSubmit(({ label }) => {
    addBagItem(
      { childId, label },
      {
        onSuccess: () => reset({ label: '' }),
        onError: error =>
          setError(
            'label',
            { message: bagErrorMessage(error) },
            { shouldFocus: true },
          ),
      },
    );
  });
  const submit = () => {
    onSubmit();
  };

  return (
    <View className="gap-2">
      {bag.children.length > 1 ? (
        <Text
          accessible={false}
          importantForAccessibility="no"
          className="font-bold text-[13px] text-text"
        >
          {t('home.bag.childLegend')}
        </Text>
      ) : null}
      {bag.children.length > 1 ? (
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={t('home.bag.childLegend')}
          className="flex-row flex-wrap gap-2"
        >
          {bag.children.map(child => {
            const selected = child.childId === childId;
            return (
              <Pressable
                key={child.childId}
                onPress={() => setChildId(child.childId)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={child.firstName}
                className={`min-h-[44px] justify-center rounded-full px-4 ${
                  selected
                    ? 'border-2 border-primary bg-primary-soft'
                    : 'border-[1.5px] border-border bg-surface'
                }`}
              >
                <Text className="font-bold text-[15px] text-text">
                  {child.firstName}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <View className="flex-row items-start gap-2">
        <View className="flex-1">
          <Controller
            control={control}
            name="label"
            render={({ field, fieldState }) => (
              <TextField
                ref={field.ref}
                label={t('home.bag.label.label', {
                  firstName: selectedChild?.firstName,
                })}
                placeholder={t('home.bag.label.placeholder')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                returnKeyType="done"
                submitBehavior="submit"
                onSubmitEditing={submit}
              />
            )}
          />
        </View>
        <Pressable
          onPress={submit}
          disabled={isAddingBagItem}
          accessibilityRole="button"
          accessibilityLabel={t('home.bag.add')}
          accessibilityState={{
            disabled: isAddingBagItem,
            busy: isAddingBagItem,
          }}
          className="mt-[26px] h-12 w-12 items-center justify-center rounded-full bg-primary active:opacity-80"
        >
          <PlusIcon color={color('on-primary')} />
        </Pressable>
      </View>
    </View>
  );
}
