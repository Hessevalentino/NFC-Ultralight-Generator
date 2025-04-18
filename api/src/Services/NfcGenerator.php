<?php
namespace Services;

/**
 * NfcGenerator Service
 * Handles the core logic for generating NFC cards
 */
class NfcGenerator {
    /**
     * Generate NFC cards based on provided parameters
     *
     * @param array $params Parameters for generation
     * @return array Generated cards data
     */
    public function generate(array $params): array {
        // Extract and validate parameters
        $count = isset($params['count']) ? (int)$params['count'] : DEFAULT_CARD_COUNT;
        $mode = isset($params['mode']) ? $params['mode'] : DEFAULT_MODE;
        $startUid = isset($params['startUid']) ? $params['startUid'] : null;

        // Validate count
        if ($count <= 0 || $count > MAX_CARDS) {
            throw new \InvalidArgumentException("Invalid card count. Must be between 1 and " . MAX_CARDS);
        }

        // Validate mode
        if ($mode !== 'random' && $mode !== 'sequential') {
            throw new \InvalidArgumentException("Invalid mode. Must be 'random' or 'sequential'");
        }

        // Validate startUid if provided
        if ($startUid !== null && !$this->validateUid($startUid)) {
            throw new \InvalidArgumentException("Invalid UID format. Must be 7 pairs of hexadecimal values separated by spaces");
        }

        // Generate cards
        $cards = $this->generateCards($count, $mode, $startUid);

        // Return result
        return [
            'cards' => $cards,
            'metadata' => [
                'generatedAt' => date('c'),
                'count' => $count,
                'mode' => $mode
            ]
        ];
    }

    /**
     * Generate the specified number of cards
     *
     * @param int $count Number of cards to generate
     * @param string $mode Generation mode (random or sequential)
     * @param string|null $startUid Starting UID for sequential mode
     * @return array Array of generated card data
     */
    private function generateCards(int $count, string $mode, ?string $startUid): array {
        $cards = [];
        $currentUid = $startUid ?: $this->generateRandomUid();

        for ($i = 0; $i < $count; $i++) {
            // Generate card data
            $nfcData = $this->generateNfcData($currentUid);
            $uid = str_replace(' ', '', $currentUid);
            $filename = "{$uid}.nfc";

            // Add to result
            $cards[] = [
                'uid' => $uid,
                'filename' => $filename,
                'data' => $nfcData
            ];

            // Update UID for next iteration
            if ($mode === 'sequential') {
                $currentUid = $this->incrementUid($currentUid);
            } else {
                $currentUid = $this->generateRandomUid();
            }
        }

        return $cards;
    }

    /**
     * Generate random UID
     *
     * @return string Randomly generated UID
     */
    private function generateRandomUid(): string {
        $uid = [];
        for ($i = 0; $i < 7; $i++) {
            $uid[] = $this->formatHex(mt_rand(0, 255));
        }
        return implode(' ', $uid);
    }

    /**
     * Format a number as a 2-digit hexadecimal string
     *
     * @param int $value Value to format
     * @return string Formatted hexadecimal string
     */
    private function formatHex(int $value): string {
        return strtoupper(str_pad(dechex($value), 2, '0', STR_PAD_LEFT));
    }

    /**
     * Calculate BCC (Block Check Character) for a UID
     *
     * @param string $uid UID to calculate BCC for
     * @return string BCC as a 2-digit hexadecimal string
     */
    private function calculateBcc(string $uid): string {
        // For MIFARE Ultralight, BCC is calculated as XOR of the first 4 bytes of the UID
        $uidBytes = array_map('hexdec', explode(' ', $uid));
        // Take only the first 4 bytes for BCC calculation
        $firstFourBytes = array_slice($uidBytes, 0, 4);
        $bcc = array_reduce($firstFourBytes, function($carry, $byte) {
            return $carry ^ $byte;
        }, 0);

        return $this->formatHex($bcc);
    }

    /**
     * Generate a random signature
     *
     * @return string Random signature as a space-separated hexadecimal string
     */
    private function generateSignature(): string {
        $signature = [];
        for ($i = 0; $i < 32; $i++) {
            $signature[] = $this->formatHex(mt_rand(0, 255));
        }
        return implode(' ', $signature);
    }

    /**
     * Increment a UID by 1
     *
     * @param string $uid UID to increment
     * @return string Incremented UID
     */
    private function incrementUid(string $uid): string {
        $uidBytes = array_map('hexdec', explode(' ', $uid));

        // Increment with carry - start from the last byte
        for ($i = count($uidBytes) - 1; $i >= 0; $i--) {
            $uidBytes[$i] = ($uidBytes[$i] + 1) % 256;
            if ($uidBytes[$i] !== 0) {
                // If we didn't overflow, we're done
                break;
            }
            // If we reach here, we had an overflow and need to carry to the next byte
        }

        // Convert back to formatted UID string
        return implode(' ', array_map([$this, 'formatHex'], $uidBytes));
    }

    /**
     * Validate a UID string
     *
     * @param string $uid UID to validate
     * @return bool True if valid, false otherwise
     */
    private function validateUid(string $uid): bool {
        $parts = explode(' ', $uid);
        if (count($parts) !== 7) {
            return false;
        }

        foreach ($parts as $part) {
            if (strlen($part) !== 2 || !ctype_xdigit($part)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Generate NFC data for a UID
     *
     * @param string $uid UID to generate data for
     * @return string Generated NFC data
     */
    private function generateNfcData(string $uid): string {
        // Calculate BCC (Block Check Character) - XOR of first 4 bytes of UID
        $bcc = $this->calculateBcc($uid);
        $uidParts = explode(' ', $uid);
        $signature = $this->generateSignature();

        $data = [
            "Filetype: Flipper NFC device",
            "Version: 4",
            "Device type: NTAG/Ultralight",
            "UID: {$uid}",
            "ATQA: 00 44",
            "SAK: 00",
            "Data format version: 2",
            "NTAG/Ultralight type: Mifare Ultralight 21",
            "Signature: {$signature}",
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
        $data[] = "Page 0: " . implode(' ', array_slice($uidParts, 0, 4));

        // Page 1: Last 3 bytes of UID followed by BCC
        $data[] = "Page 1: " . implode(' ', array_slice($uidParts, 4)) . " {$bcc}";

        // Page 2: Random data (internal data)
        $page2 = [];
        for ($i = 0; $i < 4; $i++) {
            $page2[] = $this->formatHex(mt_rand(0, 255));
        }
        $data[] = "Page 2: " . implode(' ', $page2);

        // Page 3: Usually contains lock bytes
        $data[] = "Page 3: 00 00 00 00";

        // Pages 4-35: User memory (all zeros in a fresh card)
        for ($i = 4; $i < 36; $i++) {
            $data[] = "Page {$i}: 00 00 00 00";
        }

        // Configuration pages
        $data[] = "Page 36: 00 00 00 BD";
        $data[] = "Page 37: 00 00 00 FF";
        $data[] = "Page 38: 00 05 00 00";
        $data[] = "Page 39: FF FF FF FF";
        $data[] = "Page 40: 00 00 00 00";

        $data[] = "Failed authentication attempts: 0";

        return implode("\n", $data);
    }
}
