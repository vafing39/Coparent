import React from 'react';
import { Alert, Linking } from 'react-native';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { pick } from '@react-native-documents/picker';
import { launchImageLibrary } from 'react-native-image-picker';
import { DocumentFormScreen } from '../DocumentFormScreen';
import { FamilleOngletScreen } from '../../../screens/tabs/FamilleOngletScreen';
import { ApiError } from '../../../api/errors';
import type { Family } from '../../../api/types';
import { DocumentsProvider } from '../../../context/DocumentsContext';
import { FamilyProvider } from '../../../context/FamilyContext';
import { useSession } from '../../../stores/session';
import { authResponse } from '../../../test-utils/authFixtures';
import { document } from '../../../test-utils/documentFixtures';
import { documentApi, familyApi } from '../../../test-utils/fakeApiClient';
import { family } from '../../../test-utils/familyFixtures';
import { renderWithProviders } from '../../../test-utils/render';

jest.mock('../../../api/client', () =>
  jest.requireActual('../../../test-utils/fakeApiClient'),
);

const TWO_PARENTS: Family = family({
  solo: false,
  members: [
    { userId: 'u1', firstName: 'Camille', role: 'PARENT_A' },
    { userId: 'u2', firstName: 'Julien', role: 'PARENT_B' },
  ],
  children: [
    { id: 'c1', firstName: 'Léa', birthDate: '2018-03-03' },
    { id: 'c2', firstName: 'Hugo', birthDate: '2020-05-12' },
  ],
});

const JUGEMENT = document({
  history: [
    {
      kind: 'VIEWED',
      role: 'PARENT_B',
      firstName: 'Julien',
      at: '2026-11-09T20:04:00Z',
    },
  ],
});
const PASSEPORT = document({
  id: 'doc-2',
  title: 'Passeport de Hugo',
  category: 'IDENTITY',
  childId: 'c2',
  childFirstName: 'Hugo',
  authorRole: 'PARENT_B',
  authorFirstName: 'Julien',
  canDelete: false,
  createdAt: '2026-06-18T08:00:00Z',
});
const SUPPRIME = document({
  id: 'doc-3',
  title: 'Ancienne attestation',
  category: 'INSURANCE',
  canDelete: false,
  deletedAt: '2026-11-12T09:00:00Z',
  deletedByRole: 'PARENT_A',
  history: [
    {
      kind: 'DELETED',
      role: 'PARENT_A',
      firstName: 'Camille',
      at: '2026-11-12T09:00:00Z',
    },
  ],
});

const navigate = jest.fn();
const goBack = jest.fn();

function props<P>(name: string): P {
  return {
    navigation: { navigate, goBack },
    route: { key: name, name },
  } as unknown as P;
}

async function render(ui: React.ReactElement, header: string) {
  await renderWithProviders(
    <FamilyProvider>
      <DocumentsProvider>{ui}</DocumentsProvider>
    </FamilyProvider>,
  );
  await screen.findByRole('header', { name: header });
}

const renderTab = () =>
  render(
    <FamilleOngletScreen
      {...props<React.ComponentProps<typeof FamilleOngletScreen>>('Famille')}
    />,
    'Famille',
  );

const renderForm = () =>
  render(
    <DocumentFormScreen
      {...props<React.ComponentProps<typeof DocumentFormScreen>>(
        'DocumentForm',
      )}
    />,
    'Nouveau document',
  );

beforeEach(async () => {
  navigate.mockReset();
  goBack.mockReset();
  familyApi.fetchMyFamily.mockResolvedValue(TWO_PARENTS);
  documentApi.list.mockReset().mockResolvedValue([]);
  documentApi.upload.mockReset().mockResolvedValue(document());
  documentApi.open.mockReset();
  documentApi.remove.mockReset().mockResolvedValue(undefined);
  await useSession.getState().signIn(authResponse());
});

describe('onglet Famille', () => {
  test('Documents ouvert par défaut ; Fil et Enfants annoncés', async () => {
    await renderTab();
    expect(await screen.findByText('Aucun document')).toBeTruthy();
    expect(
      screen.getByText('Ajoutez un document pour le partager avec Julien.'),
    ).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Documents' })).toBeSelected();

    await fireEvent.press(
      screen.getByRole('button', { name: 'Ajouter un document' }),
    );
    expect(navigate).toHaveBeenCalledWith('DocumentForm');

    await fireEvent.press(screen.getByRole('tab', { name: 'Enfants' }));
    expect(screen.getByText(/la fiche de chaque enfant/)).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'Ajouter un document' }),
    ).toBeNull();
  });

  test('liste, filtres et historique des consultations', async () => {
    documentApi.list.mockResolvedValue([JUGEMENT, PASSEPORT, SUPPRIME]);
    await renderTab();
    expect(await screen.findByText('Jugement du 14 mars 2025')).toBeTruthy();
    expect(
      screen.getByText('Jugement · ajouté par Camille, 2 sept.'),
    ).toBeTruthy();
    expect(
      screen.getByText('Identité · Hugo · ajouté par Julien, 18 juin'),
    ).toBeTruthy();
    expect(screen.getByText('Supprimé par Camille, 12 nov.')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Identité' }));
    expect(screen.queryByText('Jugement du 14 mars 2025')).toBeNull();
    expect(screen.getByText('Passeport de Hugo')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'École' }));
    expect(
      screen.getByText('Aucun document dans cette catégorie'),
    ).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Tous' }));

    await fireEvent.press(
      screen.getByRole('button', { name: /^Jugement du 14 mars 2025/ }),
    );
    // Consultations repliées au départ, dépliées puis repliées d'un appui
    expect(screen.queryByText('Julien · lun. 9 nov., 21 h 04')).toBeNull();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Consultations (1)' }),
    );
    expect(screen.getByText('Julien · lun. 9 nov., 21 h 04')).toBeTruthy();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Consultations (1)' }),
    );
    expect(screen.queryByText('Julien · lun. 9 nov., 21 h 04')).toBeNull();

    // Le document de Julien : pas de « Supprimer » ; le supprimé : pas de « Ouvrir »
    await fireEvent.press(
      screen.getByRole('button', { name: /^Passeport de Hugo/ }),
    );
    expect(screen.getByText('Aucune consultation')).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'Supprimer Passeport de Hugo' }),
    ).toBeNull();
    await fireEvent.press(
      screen.getByRole('button', { name: /^Ancienne attestation/ }),
    );
    expect(
      screen.queryByRole('button', { name: 'Ouvrir Ancienne attestation' }),
    ).toBeNull();
    await fireEvent.press(
      screen.getAllByRole('button', { name: /^Consultations \(/ }).at(-1)!,
    );
    expect(
      screen.getByText('Supprimé par Camille · jeu. 12 nov., 10 h 00'),
    ).toBeTruthy();
  });

  test('ouvrir : la consultation est enregistrée, puis le lien temporaire s’ouvre', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    documentApi.list.mockResolvedValue([JUGEMENT]);
    documentApi.open.mockResolvedValue({
      path: '/api/v1/document-files/abc.def',
      expiresAt: '2026-11-14T10:05:00Z',
    });
    await renderTab();
    await fireEvent.press(
      await screen.findByRole('button', { name: /^Jugement du 14 mars 2025/ }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Ouvrir Jugement du 14 mars 2025' }),
    );
    await waitFor(() =>
      expect(openURL).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/document-files/abc.def',
      ),
    );
    expect(documentApi.open).toHaveBeenCalledWith(TWO_PARENTS.id, 'doc-1');
    openURL.mockRestore();
  });

  test('supprimer son document, après confirmation', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    documentApi.list.mockResolvedValue([JUGEMENT]);
    await renderTab();
    await fireEvent.press(
      await screen.findByRole('button', { name: /^Jugement du 14 mars 2025/ }),
    );
    await fireEvent.press(
      screen.getByRole('button', {
        name: 'Supprimer Jugement du 14 mars 2025',
      }),
    );
    expect(alert.mock.calls[0][0]).toBe('Supprimer ce document ?');
    const buttons = alert.mock.calls[0][2] ?? [];
    await act(async () => {
      buttons.find(b => b.text === 'Supprimer')?.onPress?.();
    });
    await waitFor(() =>
      expect(documentApi.remove).toHaveBeenCalledWith(TWO_PARENTS.id, 'doc-1'),
    );
    alert.mockRestore();
  });
});

describe('nouveau document', () => {
  test('un fichier est obligatoire', async () => {
    await renderForm();
    await fireEvent.changeText(
      screen.getByLabelText('Nom du document'),
      'Attestation',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Envoyer' }));
    expect(
      await screen.findByText('Choisissez un fichier ou prenez une photo.'),
    ).toBeTruthy();
    expect(documentApi.upload).not.toHaveBeenCalled();
  });

  test('un PDF choisi : nom repris du fichier, puis envoi avec catégorie et enfant', async () => {
    jest.mocked(pick).mockResolvedValueOnce([
      {
        uri: 'file:///tmp/attestation-assurance-2026.pdf',
        name: 'attestation-assurance-2026.pdf',
        type: 'application/pdf',
        size: 248_000,
        error: null,
        nativeType: 'com.adobe.pdf',
        isVirtual: false,
        convertibleToMimeTypes: null,
        hasRequestedType: true,
      },
    ]);
    await renderForm();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Choisir un fichier' }),
    );
    expect(
      await screen.findByText('attestation-assurance-2026.pdf'),
    ).toBeTruthy();
    // iOS ne reconnaît que les types Apple (UTI) : avec des MIME, tout est grisé.
    expect(pick).toHaveBeenCalledWith({
      type: ['com.adobe.pdf', 'public.jpeg', 'public.png'],
      mode: 'import',
    });
    expect(screen.getByText('242 Ko')).toBeTruthy();
    expect(screen.getByDisplayValue('attestation-assurance-2026')).toBeTruthy();
    expect(
      screen.getByText(
        "Visible par Julien. Chaque ouverture sera enregistrée dans l'historique.",
      ),
    ).toBeTruthy();

    await fireEvent.changeText(
      screen.getByLabelText('Nom du document'),
      "Attestation d'assurance scolaire",
    );
    await fireEvent.press(screen.getByRole('radio', { name: 'Assurance' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Léa' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Envoyer' }));

    await waitFor(() =>
      expect(documentApi.upload).toHaveBeenCalledWith(TWO_PARENTS.id, [
        expect.objectContaining({
          fieldName: 'file',
          uri: 'file:///tmp/attestation-assurance-2026.pdf',
          type: 'application/pdf',
          name: 'attestation-assurance-2026.pdf',
        }),
        expect.objectContaining({
          fieldName: 'title',
          string: "Attestation d'assurance scolaire",
        }),
        expect.objectContaining({ fieldName: 'category', string: 'INSURANCE' }),
        expect.objectContaining({ fieldName: 'childId', string: 'c1' }),
      ]),
    );
    expect(goBack).toHaveBeenCalled();
  });

  test('une photo de la photothèque, pour tous les enfants ; refus du serveur affiché', async () => {
    jest.mocked(launchImageLibrary).mockResolvedValueOnce({
      assets: [
        {
          uri: 'file:///tmp/IMG_7.jpg',
          type: 'image/jpeg',
          fileName: 'IMG_7.jpg',
        },
      ],
    });
    documentApi.upload.mockRejectedValue(
      new ApiError(
        400,
        'Le document doit être un PDF ou une photo (JPEG ou PNG).',
      ),
    );
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await renderForm();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Photographier' }),
    );
    const buttons = alert.mock.calls[0][2] ?? [];
    await act(async () => {
      buttons.find(b => b.text === 'Choisir dans la photothèque')?.onPress?.();
    });
    alert.mockRestore();
    expect(await screen.findByText('IMG_7.jpg')).toBeTruthy();
    expect(screen.getByText('Photo')).toBeTruthy();

    await fireEvent.changeText(
      screen.getByLabelText('Nom du document'),
      'Carnet de vaccination',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Envoyer' }));
    expect(
      await screen.findByText(
        'Le document doit être un PDF ou une photo (JPEG ou PNG).',
      ),
    ).toBeTruthy();
    const parts = documentApi.upload.mock.calls[0][1] as {
      fieldName: string;
    }[];
    expect(parts.map(part => part.fieldName)).toEqual([
      'file',
      'title',
      'category',
    ]);
    expect(goBack).not.toHaveBeenCalled();
  });
});
