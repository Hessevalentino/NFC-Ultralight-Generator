// JSZip is only used in generateNfcData/download flows, not in the pure
// functions under test. Stub it so the class can be instantiated in Node.
global.JSZip = class {};

const NfcGenerator = require('../js/nfcGenerator');

describe('NfcGenerator', () => {
    let gen;

    beforeEach(() => {
        gen = new NfcGenerator();
    });

    describe('formatHex', () => {
        test('pads single digits to two chars', () => {
            expect(gen.formatHex(0)).toBe('00');
            expect(gen.formatHex(1)).toBe('01');
            expect(gen.formatHex(15)).toBe('0F');
        });

        test('uppercases hex letters', () => {
            expect(gen.formatHex(255)).toBe('FF');
            expect(gen.formatHex(171)).toBe('AB');
        });
    });

    describe('calculateBcc', () => {
        test('matches the README worked example', () => {
            // 0D XOR D3 XOR 28 XOR 65 = 93
            expect(gen.calculateBcc('0D D3 28 65 19 C2 40')).toBe('93');
        });

        test('is zero when the first four bytes XOR to zero', () => {
            expect(gen.calculateBcc('AA AA AA AA 00 00 00')).toBe('00');
        });

        test('ignores bytes past the fourth', () => {
            const a = gen.calculateBcc('01 02 03 04 00 00 00');
            const b = gen.calculateBcc('01 02 03 04 FF FF FF');
            expect(a).toBe(b);
        });
    });

    describe('incrementUid', () => {
        test('adds one to the last byte without carry', () => {
            expect(gen.incrementUid('00 00 00 00 00 00 00'))
                .toBe('00 00 00 00 00 00 01');
        });

        test('carries over when the last byte overflows', () => {
            expect(gen.incrementUid('00 00 00 00 00 00 FF'))
                .toBe('00 00 00 00 00 01 00');
        });

        test('carries through multiple bytes', () => {
            expect(gen.incrementUid('00 00 00 00 00 FF FF'))
                .toBe('00 00 00 00 01 00 00');
        });

        test('wraps to all zeros when the UID is at max', () => {
            expect(gen.incrementUid('FF FF FF FF FF FF FF'))
                .toBe('00 00 00 00 00 00 00');
        });
    });

    describe('validateUid', () => {
        test('accepts a well-formed UID', () => {
            expect(gen.validateUid('04 12 A5 F7 22 D9 81')).toBe(true);
        });

        test('accepts lowercase hex', () => {
            expect(gen.validateUid('04 12 a5 f7 22 d9 81')).toBe(true);
        });

        test('rejects the wrong number of bytes', () => {
            expect(gen.validateUid('04 12 A5 F7 22 D9')).toBe(false);
            expect(gen.validateUid('04 12 A5 F7 22 D9 81 00')).toBe(false);
        });

        test('rejects single-char bytes', () => {
            expect(gen.validateUid('4 12 A5 F7 22 D9 81')).toBe(false);
        });

        test('rejects non-hex characters', () => {
            expect(gen.validateUid('04 12 A5 F7 22 D9 ZZ')).toBe(false);
        });
    });

    describe('generateRandomUid', () => {
        test('returns 7 space-separated hex bytes', () => {
            const uid = gen.generateRandomUid();
            expect(gen.validateUid(uid)).toBe(true);
        });
    });
});
