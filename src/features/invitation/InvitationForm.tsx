import React, { useCallback, useState } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { ErrorText } from '../../components/ErrorText';
import {
  CheckIcon,
  CopyIcon,
  InfoIcon,
  ShareIcon,
} from '../../components/icons';
import { TextField } from '../../components/TextField';
import { invitationErrorMessage } from '../../api/family';
import type { Family } from '../../api/types';
import { useAuth } from '../../hooks/useAuth';
import { useFamily } from '../../hooks/useFamily';
import { useResetOnUnmount } from '../../hooks/useResetOnUnmount';
import { APP_NAME } from '../../lib/app';
import {
  invitationSchema,
  InvitationInput,
  InvitationValues,
} from '../../schemas/invitation';
import { useTheme } from '../../theme/ThemeProvider';
import { ParentAvatars } from './ParentAvatars';

const renderShareIcon = (color: string) => <ShareIcon color={color} />;
const renderCopyIcon = (color: string) => <CopyIcon color={color} />;

type Props = {
  family: Family;
  /** Fin de la première connexion (lien partagé ou étape passée), ou retour (renvoi). */
  onDone: () => void;
  /**
   * onboarding : étape 5 (titre, « Passer cette étape ») ; resend : page « Inviter l'autre
   * parent » en mode solo (prénom déjà envoyé repris, pas d'étape à passer).
   */
  variant?: 'onboarding' | 'resend';
  /** Remplace les avatars et le titre (variante resend). */
  intro?: React.ReactNode;
};

/** Lien créé, et le prénom pour lequel il l'a été (un autre prénom en crée un nouveau). */
type CreatedLink = { firstName: string; link: string };

/**
 * Étape 5 : prénom de l'autre parent, puis lien d'invitation à partager ou à copier.
 * Le lien n'est créé qu'au premier partage ou à la première copie.
 */
export function InvitationForm({
  family,
  onDone,
  variant = 'onboarding',
  intro,
}: Props) {
  const { t } = useTranslation();
  const { color } = useTheme();
  const { user } = useAuth();
  const {
    createInvitation,
    isCreatingInvitation,
    createInvitationError,
    resetCreateInvitation,
  } = useFamily();
  useResetOnUnmount(resetCreateInvitation);
  const [created, setCreated] = useState<CreatedLink | null>(null);
  const [copied, setCopied] = useState(false);
  const { control, handleSubmit } = useForm<
    InvitationInput,
    unknown,
    InvitationValues
  >({
    resolver: zodResolver(invitationSchema),
    defaultValues: { firstName: family.invitation?.inviteeFirstName ?? '' },
  });

  const renderCopiedIcon = useCallback(
    () => <CheckIcon color={color('validated')} />,
    [color],
  );
  const myName = user?.firstName ?? '';

  /** Lance l'action avec le lien du prénom saisi, en le créant d'abord s'il le faut. */
  const withLink = (action: (link: string) => void) =>
    handleSubmit(({ firstName }) => {
      if (isCreatingInvitation) {
        return;
      }
      if (created?.firstName === firstName) {
        action(created.link);
        return;
      }
      setCopied(false);
      createInvitation(firstName, {
        onSuccess: invitation => {
          setCreated({ firstName, link: invitation.link });
          action(invitation.link);
        },
      });
    });

  const share = withLink(link => {
    // Partage annulé ou impossible : rien à signaler, le lien reste copiable.
    Share.share({
      message: t('onboarding.invitation.shareMessage', {
        name: myName,
        appName: APP_NAME,
        link,
      }),
    }).catch(() => undefined);
  });

  const copy = withLink(link => {
    Clipboard.setString(link);
    setCopied(true);
    AccessibilityInfo.announceForAccessibility(
      t('onboarding.invitation.copiedAnnouncement'),
    );
  });

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerClassName="grow px-6 pt-6 pb-8 gap-5"
        keyboardShouldPersistTaps="handled"
      >
        {variant === 'resend' ? (
          intro
        ) : (
          <>
            <ParentAvatars initial={myName} role={family.myRole} />

            <View className="gap-1.5">
              <Text
                accessibilityRole="header"
                className="font-extrabold text-[28px] leading-[34px] text-text"
              >
                {t('onboarding.invitation.title')}
              </Text>
              <Text className="font-regular text-[15px] leading-[21px] text-text-secondary">
                {t('onboarding.invitation.subtitle')}
              </Text>
            </View>
          </>
        )}

        <Controller
          control={control}
          name="firstName"
          render={({ field, fieldState }) => (
            <TextField
              ref={field.ref}
              label={t('onboarding.invitation.firstName.label')}
              placeholder={t('onboarding.invitation.firstName.placeholder')}
              value={field.value}
              onChangeText={value => {
                field.onChange(value);
                setCopied(false);
              }}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              autoCapitalize="words"
              autoComplete="off"
              returnKeyType="done"
            />
          )}
        />

        <View className="gap-2.5">
          {createInvitationError ? (
            <ErrorText text={invitationErrorMessage(createInvitationError)} />
          ) : null}
          <Button
            label={t('onboarding.invitation.share')}
            onPress={share}
            loading={isCreatingInvitation}
            icon={renderShareIcon}
          />
          <Button
            label={t(
              copied
                ? 'onboarding.invitation.copied'
                : 'onboarding.invitation.copy',
            )}
            variant="neutral"
            compact
            onPress={copy}
            disabled={isCreatingInvitation}
            icon={copied ? renderCopiedIcon : renderCopyIcon}
          />
        </View>

        <View className="flex-row gap-2 rounded-md bg-card px-3.5 py-3">
          <InfoIcon size={16} color={color('primary')} />
          <Text className="flex-1 font-regular text-[13px] leading-[18px] text-text">
            {variant === 'resend' && family.invitation && !created
              ? `${t('onboarding.invitation.validity')} ${t('invite.replaces')}`
              : t('onboarding.invitation.validity')}
          </Text>
        </View>

        <View className="mt-auto items-center gap-1">
          {created ? (
            <View className="self-stretch">
              <Button
                label={t(
                  variant === 'resend'
                    ? 'invite.done'
                    : 'onboarding.invitation.done',
                )}
                onPress={onDone}
              />
            </View>
          ) : variant === 'resend' ? null : (
            <>
              <Pressable
                onPress={onDone}
                accessibilityRole="button"
                accessibilityHint={t('onboarding.invitation.skipHint')}
                className="min-h-[48px] justify-center px-4 active:opacity-60"
              >
                <Text className="font-extrabold text-[15px] text-primary">
                  {t('onboarding.invitation.skip')}
                </Text>
              </Pressable>
              <Text className="text-center font-regular text-[13px] text-text-secondary">
                {t('onboarding.invitation.skipHint')}
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
