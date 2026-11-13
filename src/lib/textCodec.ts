/* eslint-disable no-bitwise -- encodage UTF-8 octet par octet */
// TextEncoder / TextDecoder (UTF-8) pour @stomp/stompjs, ajoutés seulement si le moteur
// JavaScript ne les fournit pas (selon la version de Hermes). Importé par src/lib/realtime.ts.

class Utf8Encoder {
  readonly encoding = 'utf-8';

  encode(text = ''): Uint8Array {
    const bytes: number[] = [];
    for (const char of text) {
      const code = char.codePointAt(0) ?? 0;
      if (code < 0x80) {
        bytes.push(code);
      } else if (code < 0x800) {
        bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
      } else if (code < 0x10000) {
        bytes.push(
          0xe0 | (code >> 12),
          0x80 | ((code >> 6) & 0x3f),
          0x80 | (code & 0x3f),
        );
      } else {
        bytes.push(
          0xf0 | (code >> 18),
          0x80 | ((code >> 12) & 0x3f),
          0x80 | ((code >> 6) & 0x3f),
          0x80 | (code & 0x3f),
        );
      }
    }
    return new Uint8Array(bytes);
  }
}

class Utf8Decoder {
  readonly encoding = 'utf-8';

  decode(input?: ArrayBuffer | ArrayBufferView): string {
    if (!input) {
      return '';
    }
    const bytes =
      input instanceof ArrayBuffer
        ? new Uint8Array(input)
        : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    let text = '';
    let i = 0;
    while (i < bytes.length) {
      const byte = bytes[i];
      let code: number;
      let extra: number;
      if (byte < 0x80) {
        code = byte;
        extra = 0;
      } else if (byte >= 0xf0) {
        code = byte & 0x07;
        extra = 3;
      } else if (byte >= 0xe0) {
        code = byte & 0x0f;
        extra = 2;
      } else {
        code = byte & 0x1f;
        extra = 1;
      }
      for (let k = 1; k <= extra; k++) {
        code = (code << 6) | ((bytes[i + k] ?? 0) & 0x3f);
      }
      text += String.fromCodePoint(code);
      i += extra + 1;
    }
    return text;
  }
}

const scope = globalThis as Record<string, unknown>;
if (typeof scope.TextEncoder === 'undefined') {
  scope.TextEncoder = Utf8Encoder;
}
if (typeof scope.TextDecoder === 'undefined') {
  scope.TextDecoder = Utf8Decoder;
}

export { Utf8Decoder, Utf8Encoder };
