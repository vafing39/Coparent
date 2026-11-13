import { Utf8Decoder, Utf8Encoder } from '../textCodec';

const { realtimeUrl } =
  jest.requireActual<typeof import('../realtime')>('../realtime');

test('UTF-8 : octets attendus', () => {
  const encoder = new Utf8Encoder();
  expect(Array.from(encoder.encode('a'))).toEqual([0x61]);
  expect(Array.from(encoder.encode('é'))).toEqual([0xc3, 0xa9]);
  expect(Array.from(encoder.encode('€'))).toEqual([0xe2, 0x82, 0xac]);
  expect(Array.from(encoder.encode('🙂'))).toEqual([0xf0, 0x9f, 0x99, 0x82]);
});

test.each(['Bonjour', 'Léa a oublié son kimono', 'Merci 🙂', '€ ‑ 中文'])(
  'UTF-8 : « %s » encodé puis décodé',
  text => {
    const bytes = new Utf8Encoder().encode(text);
    expect(new Utf8Decoder().decode(bytes)).toBe(text);
    expect(new Utf8Decoder().decode(bytes.buffer as ArrayBuffer)).toBe(text);
  },
);

test('adresse du WebSocket tirée de celle de l’API', () => {
  expect(realtimeUrl('http://localhost:8080')).toBe('ws://localhost:8080/ws');
  expect(realtimeUrl('https://api.exemple.fr/')).toBe(
    'wss://api.exemple.fr/ws',
  );
});
