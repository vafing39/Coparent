import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { InvitationPreview } from '../../api/types';
import { formatDayMonth, formatTime, isoWeekday } from '../../lib/dates';
import { joinNames } from '../../lib/text';
import type { Weekday } from '../../schemas/custody';
import { ParentAvatars } from './ParentAvatars';

type Props = {
  preview: InvitationPreview;
  /** Boutons propres à l'écran (s'inscrire, se connecter, rejoindre). */
  actions: React.ReactNode;
  onIgnore: () => void;
};

/**
 * Aperçu d'une invitation, tel que le voit l'invité : qui invite, les enfants (prénom,
 * âge) et le rythme proposé. Rien d'autre n'est partagé avant l'acceptation.
 */
export function InvitationPreviewView({ preview, actions, onIgnore }: Props) {
  const { t } = useTranslation();
  const inviter = preview.inviterFirstName;
  const schedule = preview.custodySchedule;

  const childLabel = (child: InvitationPreview['children'][number]) =>
    child.age < 1
      ? t('invitation.preview.childBaby', { firstName: child.firstName })
      : t('invitation.preview.childAge', {
          firstName: child.firstName,
          count: child.age,
        });

  const scheduleLabel = () => {
    if (!schedule) {
      return null;
    }
    const pattern = t(`onboarding.schedule.patterns.${schedule.pattern}.label`);
    const weekday = isoWeekday(schedule.startDate) as Weekday;
    return t('invitation.preview.scheduleValue', {
      pattern: pattern.charAt(0).toLowerCase() + pattern.slice(1),
      weekday: t(`weekdays.long.${weekday}`),
      time: formatTime(schedule.handoverTime.slice(0, 5)),
    });
  };

  return (
    <ScrollView contentContainerClassName="grow px-6 pt-16 pb-8 gap-5">
      <ParentAvatars initial={inviter} role="PARENT_A" />

      <View className="gap-2">
        <Text
          accessibilityRole="header"
          className="font-extrabold text-[28px] leading-[34px] text-text"
        >
          {preview.children.length > 0
            ? t('invitation.preview.title', {
                inviter,
                children: joinNames(preview.children.map(c => c.firstName)),
              })
            : t('invitation.preview.titleNoChildren', { inviter })}
        </Text>
        <Text className="font-regular text-[15px] leading-[22px] text-text-secondary">
          {t('invitation.preview.subtitle')}
        </Text>
      </View>

      <View
        accessibilityLabel={t('invitation.preview.summaryLabel')}
        className="gap-2.5 rounded-2xl bg-card p-4"
      >
        <Text className="font-bold text-[13px] text-text-secondary">
          {t('invitation.preview.prepared', { inviter })}
        </Text>
        {preview.children.length > 0 ? (
          <Text className="font-regular text-[15px] text-text">
            <Text className="font-bold">
              {t('invitation.preview.children')}
            </Text>{' '}
            {preview.children.map(childLabel).join(', ')}
          </Text>
        ) : null}
        {schedule ? (
          <>
            <Text className="font-regular text-[15px] text-text">
              <Text className="font-bold">
                {t('invitation.preview.schedule')}
              </Text>{' '}
              {scheduleLabel()}
            </Text>
            <Text className="font-regular text-[13px] leading-[18px] text-text-secondary">
              {t('invitation.preview.scheduleNote')}
            </Text>
          </>
        ) : null}
      </View>

      <View className="mt-auto gap-2.5">
        {actions}
        <Text className="mt-1 text-center font-regular text-[13px] leading-[18px] text-text-secondary">
          {t('invitation.preview.validity', {
            date: formatDayMonth(preview.expiresAt),
          })}
        </Text>
        <Pressable
          onPress={onIgnore}
          accessibilityRole="button"
          className="min-h-[48px] items-center justify-center active:opacity-60"
        >
          <Text className="font-bold text-[15px] text-primary">
            {t('invitation.preview.ignore')}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
