import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { scheduleProposalErrorMessage } from '../../api/schedules';
import type { CustodySchedule, Family, FamilyRole } from '../../api/types';
import { Button } from '../../components/Button';
import { DetailRow } from '../../components/DetailRow';
import { ErrorText } from '../../components/ErrorText';
import { formatTime } from '../../lib/dates';
import { fromSchedule, previewNights } from '../../schemas/custody';
import { CustodyPreview } from './CustodyPreview';
import { parentOf } from './parents';

type Props = {
  schedule: CustodySchedule;
  family: Family;
  isAccepting: boolean;
  acceptError: Error | null;
  onAccept: () => void;
  onModify: () => void;
};

/**
 * Le rythme proposé : qui le propose, l'aperçu de deux semaines, le passage de garde et les
 * vacances. L'autre parent le valide ou propose une modification ; celui qui l'a proposé attend.
 */
export function ScheduleProposalDetails({
  schedule,
  family,
  isAccepting,
  acceptError,
  onAccept,
  onModify,
}: Props) {
  const { t } = useTranslation();
  const otherRole: FamilyRole =
    family.myRole === 'PARENT_A' ? 'PARENT_B' : 'PARENT_A';
  const me = parentOf(family, family.myRole);
  const other = parentOf(family, otherRole);
  const myUserId = family.members.find(m => m.role === family.myRole)?.userId;
  const mine =
    schedule.proposedById !== null && schedule.proposedById === myUserId;
  const pending = schedule.status === 'PROPOSED';
  const draft = fromSchedule(schedule, family.myRole).schedule;

  let status: string;
  if (!pending) {
    status = t('scheduleProposal.decided');
  } else if (mine) {
    status = t('scheduleProposal.fromMe', { name: other.name });
  } else {
    status = t('scheduleProposal.fromOther', {
      name: schedule.proposedByFirstName ?? other.name,
    });
  }

  return (
    <View className="gap-4">
      <Text className="font-regular text-[15px] leading-[21px] text-text">
        {status}
      </Text>

      <CustodyPreview
        nights={previewNights(draft)}
        handoverWeekday={draft.handoverWeekday}
        myRole={family.myRole}
        myName={me.name}
      />

      <View className="rounded-[20px] border border-border bg-card px-4">
        {schedule.proposedByFirstName ? (
          <DetailRow
            label={t('scheduleProposal.proposedBy')}
            value={schedule.proposedByFirstName}
          />
        ) : null}
        <DetailRow
          divider={schedule.proposedByFirstName !== null}
          label={t('scheduleProposal.pattern')}
          value={t(`onboarding.schedule.patterns.${schedule.pattern}.label`)}
        />
        <DetailRow
          divider
          label={t('scheduleProposal.handover')}
          value={t('scheduleProposal.handoverValue', {
            weekday: t(`weekdays.long.${draft.handoverWeekday}`),
            time: formatTime(schedule.handoverTime),
          })}
        />
        {schedule.holidayFirstHalfEvenYears ? (
          <DetailRow
            divider
            label={t('scheduleProposal.shortBreaks')}
            value={t('scheduleProposal.shortBreaksValue', {
              name: parentOf(family, schedule.holidayFirstHalfEvenYears).name,
            })}
          />
        ) : null}
        {schedule.summerSplit ? (
          <DetailRow
            divider
            label={t('scheduleProposal.summer')}
            value={t(`onboarding.holidays.summer.${schedule.summerSplit}`)}
          />
        ) : null}
      </View>

      {acceptError ? (
        <ErrorText text={scheduleProposalErrorMessage(acceptError)} />
      ) : null}

      {pending && !mine ? (
        <View className="gap-3">
          <Button
            label={t('scheduleProposal.accept')}
            loading={isAccepting}
            onPress={onAccept}
          />
          <Button
            label={t('scheduleProposal.modify')}
            variant="secondary"
            disabled={isAccepting}
            onPress={onModify}
          />
          <Text className="mx-1 font-regular text-[13px] leading-[18px] text-text-secondary">
            {t('scheduleProposal.modifyHint', { name: other.name })}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
