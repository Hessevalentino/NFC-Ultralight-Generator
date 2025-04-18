# NFC Generator for Flipper Zero v2.0

<p align="center">
  <img src="assets/img/nfclogo.png" alt="NFC Generator Logo" width="300">
</p>

This application generates NFC Ultralight card files compatible with Flipper Zero. It is a refactored version 2.0 with improved architecture and correct BCC (Block Check Character) calculation.

**DEMO**: [https://nug.hardwired.dev/](https://nug.hardwired.dev/)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Features

- Generate random or sequential NFC Ultralight cards
- Specify the number of cards to generate
- Optionally set a starting UID for sequential generation
- Proper BCC (Block Check Character) calculation
- Download generated cards as a ZIP file
- Copy UIDs to clipboard
- View generation logs
- Playlist file generation for Flipper Zero

## Understanding MIFARE Ultralight Cards and BCC

### Card Structure

MIFARE Ultralight cards have a specific memory structure:

- **Page 0**: First 4 bytes of the UID
- **Page 1**: Last 3 bytes of the UID followed by BCC (Block Check Character)
- **Page 2**: Internal data
- **Page 3**: Lock bytes
- **Pages 4-35**: User memory (all zeros in a fresh card)
- **Pages 36-40**: Configuration pages

### BCC Calculation

The BCC (Block Check Character) is a checksum byte that is calculated as the XOR (exclusive OR) of the first 4 bytes of the UID. This is an important security feature of MIFARE Ultralight cards.

For example, if the UID is `0D D3 28 65 19 C2 40`, the BCC is calculated as:

```
0D XOR D3 XOR 28 XOR 65 = 93
```

In decimal:
```
13 XOR 211 XOR 40 XOR 101 = 147 (93 in hex)
```

The XOR operation works by comparing each bit position of the two numbers:
- If both bits are the same (both 0 or both 1), the result is 0
- If the bits are different, the result is 1

This application correctly calculates the BCC for each generated card, ensuring compatibility with real MIFARE Ultralight cards and proper functioning with Flipper Zero.

## Project Structure

The project is organized into the following components:

### Main Application
- Located in the root directory
- Provides a user-friendly interface for generating cards
- Handles all the NFC generation logic client-side

### Backend API (Optional)
- Located in the `/api/` directory
- Can be used for server-side generation if needed

## Installation

1. Clone this repository to your web server
2. Access the application through your web browser by opening `index.html`
3. (Optional) If you want to use the PHP API:
   - Make sure PHP 7.4 or higher is installed
   - Navigate to the `/api/` directory and run `composer install`
   - Ensure the web server has write permissions for the `/logs/` directory

## Usage

1. Open the application in your web browser
2. Select the generation mode (random or sequential)
3. Enter the number of cards to generate
4. Optionally enter a starting UID for sequential mode
5. Click "Generate Cards"
6. Once generation is complete, click "Download ZIP" to download the generated cards
7. Follow the instructions in the "Help" section to use the cards with your Flipper Zero

### Using Generated Cards with Flipper Zero

1. After generating and downloading the ZIP file, extract it to your computer
2. Connect your Flipper Zero to your computer via USB
3. Copy all the .nfc files to the following path on your Flipper Zero's SD card: `/ext/nfc/`
4. Create a folder called 'nfc_playlist' in the /ext/ directory if it doesn't exist: `/ext/nfc_playlist/`
5. Copy the 'generated_cards_list.txt' file to the nfc_playlist folder
6. On your Flipper Zero:
   - Open the NFC app
   - Press the LEFT button to access the 'More' menu
   - Select 'Playlist' option
   - Choose the uploaded list
7. You can now use the UP/DOWN buttons to browse through all generated cards and use them for emulation without having to go back to the file browser.

## Development

### JavaScript Components
- `nfcGenerator.js` - Core logic for generating NFC cards
- `ui.js` - UI management and event handling
- `api.js` - API client for communicating with the backend (if used)

### CSS
- `assets/css/style.css` - Styling for the application

### Backend API (Optional)
- `api/index.php` - Main entry point for the API
- `api/src/Services/NfcGenerator.php` - Core logic for generating NFC cards
- `api/src/Controllers/NfcController.php` - API endpoint handling

## Technical Details

### BCC Calculation Implementation

The BCC calculation is implemented in both JavaScript and PHP:

**JavaScript (nfcGenerator.js):**
```javascript
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
```

**PHP (NfcGenerator.php):**
```php
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
```

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

Copyright 2025 NFC Generator Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
