# NFC-Ultralight-Generator

![image](https://github.com/user-attachments/assets/d7cd937e-26fd-4bd0-b03a-127c764f6554)


generate full ultralight card data for Flipper Zero NFC emulating

Random UID generator for NXP Mifare Ultraligt NFC cards. Simple Python for bulk or sequential UID generation of 7byte ID cards

![image](https://github.com/user-attachments/assets/135f18f4-c1ba-43cb-b657-a829412aaf84)

![image](https://github.com/user-attachments/assets/7539aa87-5a47-47cc-ab5e-f20458e31ae2)

# NFC Ultralight Generator - Documentation

## Description

NFC Ultralight Generator is a Python script for generating simulated NFC cards of the NTAG/Ultralight type. This tool is useful for testing and developing applications that work with NFC technology, especially in conjunction with the Flipper Zero device.

## Features

- Generation of random or sequential UIDs for NFC cards
- Creation of .nfc files with complete card data
- Generation of a list of created cards
- User-friendly interface with colored output

## Requirements

- Python 3.6 or higher
- Operating system supporting ANSI escape codes for colored output (most Unix-like systems, Windows 10 with newer terminal)

## Installation

1. Download the `nfc_generator.py` script to your computer.
2. Ensure that you have Python 3.6 or higher installed.

## Usage

1. Open a terminal or command prompt.
2. Navigate to the directory where the script is saved.
3. Run the script with the command:
   ```
   python nfc_generator.py
   ```
4. Follow the on-screen instructions:
   - Select the generation mode (random or sequential)
   - Enter the number of cards to generate
   - For sequential mode, you can enter a starting UID or let it generate a random one

## Output

- The script will create an `nfc_cards` directory if it doesn't already exist.
- Generated .nfc files will be stored in this directory.
- A `generated_cards_list.txt` file will be created with a list of all generated cards.

## How It Works

1. **UID Generation**: 
   - In random mode, a new random UID is generated for each card.
   - In sequential mode, the UID is incremented for each subsequent card.

2. **Card Structure**:
   - Each card contains a standard header with device type information, version, etc.
   - The UID is split between Page 0 and Page 1.
   - BCC (Block Check Character) is calculated and added at the end of Page 1.
   - Page 2 contains random data.
   - Other pages are set according to the standard NTAG/Ultralight format.

3. **Data Saving**:
   - Each card is saved as a separate .nfc file.
   - The filename corresponds to the card's UID.

4. **Card List**:
   - A text file is created with a list of all generated cards in a format suitable for Flipper Zero.

## Tips

- For generating a large number of cards, we recommend using sequential mode, which ensures a unique UID for each card.
- Generated files can be directly used with an NFC card emulator or imported into a Flipper Zero device.

## Troubleshooting

- If colors are not displaying correctly, make sure your terminal supports ANSI escape codes.
- In case of a "Permission denied" error when creating files, check the permissions in the directory where the script is running.
