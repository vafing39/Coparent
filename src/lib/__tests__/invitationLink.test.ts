import { parseInvitationToken } from '../invitationLink';
import { INVITATION_TOKEN } from '../../test-utils/invitationFixtures';

test('lien coparent:// : jeton lu', () => {
  expect(
    parseInvitationToken(`coparent://invitation?token=${INVITATION_TOKEN}`, ''),
  ).toBe(INVITATION_TOKEN);
});

test('lien https du domaine configuré : jeton lu', () => {
  expect(
    parseInvitationToken(
      `https://coparent.fr/invitation?utm=x&token=${INVITATION_TOKEN}`,
      'coparent.fr',
    ),
  ).toBe(INVITATION_TOKEN);
});

test('autre domaine, ou https sans domaine configuré : ignoré', () => {
  const url = `https://autre.fr/invitation?token=${INVITATION_TOKEN}`;
  expect(parseInvitationToken(url, 'coparent.fr')).toBeNull();
  expect(
    parseInvitationToken(
      `https://coparent.fr/invitation?token=${INVITATION_TOKEN}`,
      '',
    ),
  ).toBeNull();
});

test('autre chemin, jeton absent ou mal formé : ignoré', () => {
  expect(
    parseInvitationToken(`coparent://autre?token=${INVITATION_TOKEN}`, ''),
  ).toBeNull();
  expect(parseInvitationToken('coparent://invitation', '')).toBeNull();
  expect(
    parseInvitationToken('coparent://invitation?token=<script>', ''),
  ).toBeNull();
  expect(
    parseInvitationToken('coparent://invitation?token=%E0', ''),
  ).toBeNull();
});
