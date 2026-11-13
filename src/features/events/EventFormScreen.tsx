import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { eventErrorMessage } from '../../api/events';
import type {
  CalendarEvent,
  EventBody,
  EventReminder,
  EventType,
  EventVisibility,
  Family,
} from '../../api/types';
import { ErrorText } from '../../components/ErrorText';
import { TextField } from '../../components/TextField';
import { CheckIcon } from '../../components/icons';
import { useEvents } from '../../hooks/useEvents';
import { useFamily } from '../../hooks/useFamily';
import { useResetOnUnmount } from '../../hooks/useResetOnUnmount';
import { todayInParis } from '../../lib/dates';
import type { AppScreenProps } from '../../navigation/types';
import { EventInput, EventValues, eventSchema } from '../../schemas/event';
import { useTheme } from '../../theme/ThemeProvider';
import { TimeField } from '../custody/TimeField';
import { DateField } from './DateField';

const TYPES: EventType[] = ['APPOINTMENT', 'ACTIVITY', 'SCHOOL', 'OTHER'];
const REMINDERS: EventReminder[] = [
  'NONE',
  'ONE_HOUR',
  'DAY_BEFORE',
  'TWO_DAYS',
];
const VISIBILITIES: EventVisibility[] = ['SHARED', 'PRIVATE'];

/** Valeurs de départ : l'événement à modifier, ou un nouvel événement le jour donné. */
function defaults(
  family: Family | null,
  event: CalendarEvent | undefined,
  date: string | undefined,
): EventInput {
  if (event) {
    return {
      title: event.title,
      type: event.type,
      childIds: event.children.map(child => child.id),
      allDay: event.allDay,
      date: event.date,
      startTime: event.startTime?.slice(0, 5) ?? '09:00',
      endTime: event.endTime?.slice(0, 5) ?? '10:00',
      location: event.location ?? '',
      reminder: event.reminder,
      visibility: event.visibility,
    };
  }
  const children = family?.children ?? [];
  return {
    title: '',
    type: 'APPOINTMENT',
    childIds: children.length === 1 ? [children[0].id] : [],
    allDay: false,
    date: date ?? todayInParis(),
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    reminder: 'NONE',
    visibility: 'SHARED',
  };
}

function toBody(values: EventValues): EventBody {
  return {
    title: values.title,
    type: values.type,
    childIds: values.childIds,
    date: values.date,
    allDay: values.allDay,
    startTime: values.allDay ? null : values.startTime,
    endTime: values.allDay ? null : values.endTime,
    location: values.location === '' ? null : values.location,
    reminder: values.reminder,
    visibility: values.visibility,
  };
}

/**
 * Nouvel événement, ou modification d'un événement (cahier des charges, 5), sans répétition
 * pour l'instant. Le rappel est enregistré ; il sera envoyé quand les notifications existeront.
 */
export function EventFormScreen({
  navigation,
  route,
}: AppScreenProps<'EventForm'>) {
  const { t } = useTranslation();
  const { family } = useFamily();
  const editing = route.params?.event;
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
    formState: { errors },
  } = useForm<EventInput, unknown, EventValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: defaults(family, editing, route.params?.date),
  });
  const allDay = watch('allDay');
  const visibility = watch('visibility');

  const onSubmit = handleSubmit(values => {
    setSaveError(null);
    const onError = (error: Error) => setSaveError(eventErrorMessage(error));
    if (editing) {
      updateEvent(
        { id: editing.id, body: toBody(values) },
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
              <AllDaySwitch
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

/** Choix unique en pastilles (type, rappel). */
function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="gap-1.5">
      <Text className="font-bold text-[13px] text-text">{label}</Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        className="flex-row flex-wrap gap-1.5"
      >
        {options.map(option => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              className={`min-h-[40px] justify-center rounded-full border px-3.5 ${
                selected ? 'border-primary bg-primary' : 'border-border bg-card'
              }`}
            >
              <Text
                className={`font-bold text-[13px] ${
                  selected ? 'text-on-primary' : 'text-text'
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Enfant concerné : une pastille cochable. */
function ChildChip({
  label,
  checked,
  onPress,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
}) {
  const { color } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      className={`min-h-[44px] flex-row items-center gap-2 rounded-full pl-2 pr-3.5 ${
        checked
          ? 'border-2 border-primary bg-primary-soft'
          : 'border-[1.5px] border-border bg-card'
      }`}
    >
      <View
        className={`h-[26px] w-[26px] items-center justify-center rounded-full border-2 bg-card ${
          checked ? 'border-primary' : 'border-text-secondary'
        }`}
      >
        {checked ? (
          <CheckIcon size={14} color={color('primary')} strokeWidth={3} />
        ) : null}
      </View>
      <Text className="font-bold text-[15px] text-text">{label}</Text>
    </Pressable>
  );
}

/** « Toute la journée » : interrupteur. */
function AllDaySwitch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      className="min-h-[44px] flex-row items-center"
    >
      <Text className="flex-1 font-bold text-[15px] text-text">{label}</Text>
      <View
        className={`h-7 w-12 justify-center rounded-full px-[3px] ${
          value ? 'items-end bg-primary' : 'items-start bg-text-secondary'
        }`}
      >
        <View className="h-[22px] w-[22px] rounded-full bg-card" />
      </View>
    </Pressable>
  );
}
