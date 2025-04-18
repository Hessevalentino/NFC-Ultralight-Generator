/**
 * NFC Generator
 * Handles the logic for generating NFC cards
 */
class NfcGenerator {
    /**
     * Constructor
     */
    constructor() {
        this.zip = new JSZip();
    }

    /**
     * Format a number as a 2-digit hexadecimal string
     * @param {number} value - Value to format
     * @returns {string} - Formatted hexadecimal string
     */
    formatHex(value) {
        return value.toString(16).toUpperCase().padStart(2, '0');
    }

    /**
     * Generate a random UID
     * @returns {string} - Random UID
     */
    generateRandomUid() {
        return Array.from({length: 7}, () => this.formatHex(Math.floor(Math.random() * 256))).join(' ');
    }

    /**
     * Calculate BCC (Block Check Character) for a UID
     * @param {string} uid - UID to calculate BCC for
     * @returns {string} - BCC as a 2-digit hexadecimal string
     */
    calculateBcc(uid) {
        // For MIFARE Ultralight, BCC is calculated as XOR of the first 4 bytes of the UID
        const uidBytes = uid.split(' ').map(x => parseInt(x, 16));
        // Take only the first 4 bytes for BCC calculation
        const firstFourBytes = uidBytes.slice(0, 4);
        let bcc = 0;
        for (const byte of firstFourBytes) {
            bcc ^= byte;
        }
        return this.formatHex(bcc);
    }

    /**
     * Generate a random signature
     * @returns {string} - Random signature as a space-separated hexadecimal string
     */
    generateSignature() {
        return Array.from({length: 32}, () => this.formatHex(Math.floor(Math.random() * 256))).join(' ');
    }

    /**
     * Increment a UID by 1
     * @param {string} uid - UID to increment
     * @returns {string} - Incremented UID
     */
    incrementUid(uid) {
        // Convert the UID string to an array of bytes
        const uidBytes = uid.split(' ').map(byte => parseInt(byte, 16));

        // Increment with carry - start from the last byte
        for (let i = uidBytes.length - 1; i >= 0; i--) {
            uidBytes[i] = (uidBytes[i] + 1) % 256;
            if (uidBytes[i] !== 0) {
                // If we didn't overflow, we're done
                break;
            }
            // If we reach here, we had an overflow and need to carry to the next byte
        }

        // Convert back to formatted UID string
        return uidBytes.map(byte => this.formatHex(byte)).join(' ');
    }

    /**
     * Validate a UID string
     * @param {string} uid - UID to validate
     * @returns {boolean} - True if valid, false otherwise
     */
    validateUid(uid) {
        const parts = uid.split(' ');
        if (parts.length !== 7) {
            return false;
        }

        for (const part of parts) {
            if (part.length !== 2 || !/^[0-9A-Fa-f]{2}$/.test(part)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Generate NFC data for a UID
     * @param {string} uid - UID to generate data for
     * @returns {string} - Generated NFC data
     */
    generateNfcData(uid) {
        // Calculate BCC (Block Check Character) - XOR of first 4 bytes of UID
        const bcc = this.calculateBcc(uid);
        const uidParts = uid.split(' ');
        const signature = this.generateSignature();

        const data = [
            "Filetype: Flipper NFC device",
            "Version: 4",
            "Device type: NTAG/Ultralight",
            `UID: ${uid}`,
            "ATQA: 00 44",
            "SAK: 00",
            "Data format version: 2",
            "NTAG/Ultralight type: Mifare Ultralight 21",
            `Signature: ${signature}`,
            "Mifare version: 00 04 03 01 01 00 0E 03",
            "Counter 0: 0",
            "Tearing 0: BD",
            "Counter 1: 0",
            "Tearing 1: BD",
            "Counter 2: 0",
            "Tearing 2: BD",
            "Pages total: 41",
            "Pages read: 41"
        ];

        // Generate page data
        // Page 0: First 4 bytes of UID
        data.push(`Page 0: ${uidParts.slice(0, 4).join(' ')}`);

        // Page 1: Last 3 bytes of UID followed by BCC
        data.push(`Page 1: ${uidParts.slice(4).join(' ')} ${bcc}`);

        // Page 2: Random data (internal data)
        data.push(`Page 2: ${Array.from({length: 4}, () => this.formatHex(Math.floor(Math.random() * 256))).join(' ')}`);

        // Page 3: Usually contains lock bytes
        data.push("Page 3: 00 00 00 00");

        // Pages 4-35: User memory (all zeros in a fresh card)
        for (let i = 4; i < 36; i++) {
            data.push(`Page ${i}: 00 00 00 00`);
        }

        // Configuration pages
        data.push("Page 36: 00 00 00 BD");
        data.push("Page 37: 00 00 00 FF");
        data.push("Page 38: 00 05 00 00");
        data.push("Page 39: FF FF FF FF");
        data.push("Page 40: 00 00 00 00");

        data.push("Failed authentication attempts: 0");

        return data.join('\n');
    }
}
