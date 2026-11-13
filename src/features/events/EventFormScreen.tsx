import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { eventErrorMessage } from '../../api/events';
import { SwitchRow } from '../../components/SwitchRow';
import { ChevronRightIcon } from '../../components/icons';
import { ErrorText } from '../../components/ErrorText';
import { TextField } from '../../components/TextField';
import { useEvents } from '../../hooks/useEvents';
import { useFamily } from '../../hooks/useFamily';
import { useResetOnUnmount } from '../../hooks/useResetOnUnmount';
import { formatShortDate, formatTime } from '../../lib/dates';
import type { AppScreenProps } from '../../navigation/types';
import { EventInput, EventValues, eventSchema } from '../../schemas/event';
import { useTheme } from '../../theme/ThemeProvider';
import { TimeField } from '../custody/TimeField';
import { ChildChip } from './ChildChip';
import { ChipGroup } from './ChipGroup';
import { DateField } from './DateField';
import { RepeatForm } from './RepeatForm';
import { repeatSummary } from './repeatText';
import {
  defaults,
  REMINDERS,
  toBody,
  TYPES,
  VISIBILITIES,
} from './eventFormValues';

/**
 * Nouvel événement, ou modification d'un événement (cahier des charges, 5). « Répéter » ouvre le
 * sous-réglage de la répétition (RepeatForm). Pour une séance d'une série, `scope` dit quelles
 * séances changent ; « cet événement seulement » en fait un événement unique (pas de « Répéter »).
 * Le rappel est enregistré ; il sera envoyé quand les notifications existeront.
 */
export function EventFormScreen({
  navigation,
  route,
}: AppScreenProps<'EventForm'>) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const { family } = useFamily();
  const editing = route.params?.event;
  const scope = editing?.repeat ? route.params?.scope : undefined;
  const [choosingRepeat, setChoosingRepeat] = useState(false);
  const {
    createEvent,
    isCreatingEvent,
    resetCreateEvent,
    updateEvent,
    isUpdatingEvent,
    resetUpdateEvent,
  } = useEvents();
  useResetOnUnmount(resetCreateEvent, resetUpdateEvent);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saving = isCreatingEvent || isUpdatingEvent;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EventInput, unknown, EventValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      ...defaults(family, editing, route.params?.date),
      ...(scope === 'ONE' && { repeat: null }),
    },
  });
  const allDay = watch('allDay');
  const visibility = watch('visibility');
  const date = watch('date');
  const repeat = watch('repeat');

  const onSubmit = handleSubmit(values => {
    setSaveError(null);
    const onError = (error: Error) => setSaveError(eventErrorMessage(error));
    if (editing) {
      updateEvent(
        {
          id: editing.id,
          body: toBody(values),
          ...(scope && { scope, date: editing.date }),
        },
        {
          onSuccess: event => navigation.popTo('EventDetail', { event }),
          onError,
        },
      );
    } else {
      createEvent(toBody(values), {
        onSuccess: () => navigation.goBack(),
        onError,
      });
    }
  });
  const save = () => {
    if (!saving) {
      onSubmit();
    }
  };

  const children = family?.children ?? [];

  if (choosingRepeat && family) {
    const startTime = watch('startTime');
    return (
      <RepeatForm
        family={family}
        initial={repeat}
        date={date}
        subtitle={t('events.repeat.subtitle', {
          title: watch('title').trim() || t('events.repeat.untitled'),
          when: allDay
            ? formatShortDate(date)
            : `${formatShortDate(date)}, ${formatTime(startTime)}`,
        })}
        childNames={children
          .filter(child => watch('childIds').includes(child.id))
          .map(child => child.firstName)}
        onCancel={() => setChoosingRepeat(false)}
        onDone={chosen => {
          setValue('repeat', chosen);
          setChoosingRepeat(false);
        }}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between px-3 pb-1.5 pt-4">
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          className="min-h-[48px] justify-center px-2"
        >
          <Text className="font-bold text-[15px] text-text">
            {t('common.cancel')}
          </Text>
        </Pressable>
        <Text
          accessibilityRole="header"
          className="font-extrabold text-[17px] text-text"
        >
          {t(editing ? 'events.editTitle' : 'events.newTitle')}
        </Text>
        <Pressable
          onPress={save}
          disabled={saving}
          accessibilityRole="button"
          accessibilityState={{ disabled: saving, busy: saving }}
          className={`min-h-[44px] justify-center rounded-full bg-primary px-4 ${
            saving ? 'opacity-60' : ''
          }`}
        >
          <Text className="font-extrabold text-[15px] text-on-primary">
            {t('events.save')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-4 px-4 pt-1.5 pb-8"
      >
        {saveError ? <ErrorText text={saveError} /> : null}

        <Controller
          control={control}
          name="title"
          render={({ field, fieldState }) => (
            <TextField
              ref={field.ref}
              label={t('events.title.label')}
              placeholder={t('events.title.placeholder')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              returnKeyType="done"
            />
          )}
        />

        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <ChipGroup
              label={t('events.type.label')}
              options={TYPES.map(type => ({
                value: type,
                label: t(`events.type.${type}`),
              }))}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="childIds"
          render={({ field, fieldState }) => (
            <View className="gap-1.5">
              <Text className="font-bold text-[13px] text-text">
                {t('events.children.label', { count: children.length })}
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                {children.map(child => {
                  const checked = field.value.includes(child.id);
                  return (
                    <ChildChip
                      key={child.id}
                      label={child.firstName}
                      checked={checked}
                      onPress={() =>
                        field.onChange(
                          checked
                            ? field.value.filter(id => id !== child.id)
                            : [...field.value, child.id],
                        )
                      }
                    />
                  );
                })}
              </View>
              {fieldState.error ? (
                <ErrorText text={fieldState.error.message} />
              ) : null}
            </View>
          )}
        />

        <View className="gap-3 rounded-[18px] border border-border bg-card p-3.5">
          <Controller
            control={control}
            name="allDay"
            render={({ field }) => (
              <SwitchRow
                label={t('events.allDay')}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="date"
            render={({ field }) => (
              <DateField
                label={t('events.date')}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {allDay ? null : (
            <View className="gap-1.5">
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Controller
                    control={control}
                    name="startTime"
                    render={({ field }) => (
                      <TimeField
                        label={t('events.startTime')}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </View>
                <View className="flex-1">
                  <Controller
                    control={control}
                    name="endTime"
                    render={({ field }) => (
                      <TimeField
                        label={t('events.endTime')}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </View>
              </View>
              {errors.endTime ? (
                <ErrorText text={errors.endTime.message} />
              ) : null}
            </View>
          )}
          {scope === 'ONE' || !family ? null : (
            <Pressable
              onPress={() => setChoosingRepeat(true)}
              accessibilityRole="button"
              accessibilityHint={t('events.repeat.rowHint')}
              className="min-h-[44px] flex-row items-center gap-2 border-t border-border pt-2"
            >
              <Text className="font-bold text-[15px] text-text">
                {t('events.repeat.label')}
              </Text>
              <Text
                numberOfLines={2}
                className="flex-1 text-right font-regular text-[13px] text-text-secondary"
              >
                {repeat
                  ? repeatSummary(
                      repeat,
                      date,
                      family,
                      children
                        .filter(child => watch('childIds').includes(child.id))
                        .map(child => child.firstName),
                    )
                  : t('events.repeat.NONE')}
              </Text>
              <ChevronRightIcon size={16} color={color('text-secondary')} />
            </Pressable>
          )}
        </View>

        <Controller
          control={control}
          name="location"
          render={({ field, fieldState }) => (
            <TextField
              ref={field.ref}
              label={t('events.location.label')}
              placeholder={t('events.location.placeholder')}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="reminder"
          render={({ field }) => (
            <ChipGroup
              label={t('events.reminder.label')}
              options={REMINDERS.map(reminder => ({
                value: reminder,
                label: t(`events.reminder.${reminder}`),
              }))}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="visibility"
          render={({ field }) => (
            <View className="gap-2">
              <Text className="font-bold text-[13px] text-text">
                {t('events.visibility.label')}
              </Text>
              <View
                accessibilityRole="radiogroup"
                accessibilityLabel={t('events.visibility.label')}
                className="flex-row gap-1 rounded-full border border-border bg-card p-1"
              >
                {VISIBILITIES.map(option => {
                  const selected = field.value === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => field.onChange(option)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      className={`min-h-[40px] flex-1 items-center justify-center rounded-full ${
                        selected ? 'bg-primary' : ''
                      }`}
                    >
                      <Text
                        className={`font-bold text-[13px] ${
                          selected ? 'text-on-primary' : 'text-text'
                        }`}
                      >
                        {t(`events.visibility.${option}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        />
        <Text className="font-regular text-[13px] leading-[18px] text-text-secondary">
          {t(
            visibility === 'SHARED'
              ? 'events.visibility.sharedHint'
              : 'events.visibility.privateHint',
          )}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
