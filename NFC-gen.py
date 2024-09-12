import random
import os
import time

# ANSI escape codes for text formatting
ORANGE = '\033[93m'
GREEN = '\033[92m'
BOLD = '\033[1m'
RESET = '\033[0m'

def orange_bold(text):
    return f"{ORANGE}{BOLD}{text}{RESET}"

def green_bold(text):
    return f"{GREEN}{BOLD}{text}{RESET}"

def print_ascii_art():
    art = f"""{ORANGE}{BOLD}
 _   _ _____ ____   _   _ _ _             _     _       _     _    ____            
| \ | |  ___/ ___| | | | | | |_ _ __ __ _| |   (_) __ _| |__ | |_ / ___| ___ _ __  
|  \| | |_ | |     | | | | | __| '__/ _` | |   | |/ _` | '_ \| __| |  _ / _ \ '_ \ 
| |\  |  _|| |     | |_| | | |_| | | (_| | |___| | (_| | | | | |_| |_| |  __/ | | |
|_| \_|_|   \____|  \___/|_|\__|_|  \__,_|_____|_|\__, |_| |_|\__|\____|\___|_| |_|
                                                  |___/                            
{RESET}"""
    print(art)

def print_progress_bar(iteration, total, prefix='', suffix='', decimals=1, length=50, fill='█', print_end="\r"):
    percent = ("{0:." + str(decimals) + "f}").format(100 * (iteration / float(total)))
    filled_length = int(length * iteration // total)
    bar = fill * filled_length + '-' * (length - filled_length)
    print(f'\r{ORANGE}{BOLD}{prefix} |{bar}| {percent}% {suffix}{RESET}', end=print_end)
    if iteration == total:
        print()

def generate_random_uid():
    return ' '.join([format(random.randint(0, 255), '02X') for _ in range(7)])

def calculate_bcc(uid):
    uid_bytes = [int(x, 16) for x in uid.split()]
    bcc = 0
    for byte in uid_bytes:
        bcc ^= byte
    return format(bcc, '02X')

def generate_signature():
    return ' '.join([format(random.randint(0, 255), '02X') for _ in range(32)])

def generate_nfc_data(uid):
    bcc = calculate_bcc(uid)
    uid_parts = uid.split()
    signature = generate_signature()
    
    data = [
        "Filetype: Flipper NFC device",
        "Version: 4",
        "Device type: NTAG/Ultralight",
        f"UID: {uid}",
        "ATQA: 00 44",
        "SAK: 00",
        "Data format version: 2",
        "NTAG/Ultralight type: Mifare Ultralight 21",
        f"Signature: {signature}",
        "Mifare version: 00 04 03 01 01 00 0E 03",
        "Counter 0: 0",
        "Tearing 0: BD",
        "Counter 1: 0",
        "Tearing 1: BD",
        "Counter 2: 0",
        "Tearing 2: BD",
        "Pages total: 41",
        "Pages read: 41"
    ]
    
    # Generating data for pages
    data.append(f"Page 0: {' '.join(uid_parts[:4])}")
    data.append(f"Page 1: {' '.join(uid_parts[4:])} {bcc}")
    data.append(f"Page 2: {' '.join([format(random.randint(0, 255), '02X') for _ in range(4)])}")
    data.append("Page 3: 00 00 00 00")
    
    for i in range(4, 36):
        data.append(f"Page {i}: 00 00 00 00")
    
    data.append("Page 36: 00 00 00 BD")
    data.append("Page 37: 00 00 00 FF")
    data.append("Page 38: 00 05 00 00")
    data.append("Page 39: FF FF FF FF")
    data.append("Page 40: 00 00 00 00")
    
    data.append("Failed authentication attempts: 0")
    
    return '\n'.join(data)

def generate_and_save_cards(num_cards, start_uid=None, sequential=False):
    if not os.path.exists('nfcgen'):
        os.makedirs('nfcgen')

    current_uid = start_uid if start_uid else generate_random_uid()
    generated_cards = []

    print(orange_bold("\nGenerating cards:"))
    for i in range(num_cards):
        nfc_data = generate_nfc_data(current_uid)
        uid = current_uid.replace(' ', '')
        
        filename = f"nfcgen/{uid}.nfc"
        with open(filename, 'w') as f:
            f.write(nfc_data)
        
        generated_cards.append(f"/ext/nfc/nfcgen/{uid}.nfc")
        print_progress_bar(i + 1, num_cards, prefix='Progress:', suffix='Complete', length=40)
        time.sleep(0.1)  # For visual effect
        
        if sequential:
            current_uid = increment_uid(current_uid)
        else:
            current_uid = generate_random_uid()

    return generated_cards

def increment_uid(uid):
    uid_int = int(''.join(uid.split()), 16)
    uid_int += 1
    return ' '.join([format((uid_int >> (i * 8)) & 0xFF, '02X') for i in range(6, -1, -1)])

def save_card_list(card_list):
    with open('generated_cards_list.txt', 'w') as f:
        for card in card_list:
            f.write(f"{card}\n")
    print(orange_bold("\nThe list of generated cards has been saved to 'generated_cards_list.txt'"))

def main():
    print_ascii_art()
    print(orange_bold("Welcome to the NFC Ultralight Card Generator! By RaZ0rBlad3"))
    print(orange_bold("=" * 50))
    
    while True:
        mode = input(orange_bold("Select generation mode:\n1 - Random\n2 - Sequential\nYour choice: "))
        if mode in ['1', '2']:
            break
        print(orange_bold("Invalid choice. Enter 1 for random or 2 for sequential generation."))

    while True:
        try:
            num_cards = int(input(orange_bold("Enter the number of cards to generate: ")))
            if num_cards > 0:
                break
            print(orange_bold("The number of cards must be a positive integer."))
        except ValueError:
            print(orange_bold("Invalid input. Please enter a whole number."))

    if mode == "2":
        start_uid = input(orange_bold("Enter the starting UID (14 hexadecimal characters separated by spaces) or leave blank for a random start: "))
        if start_uid and len(start_uid.replace(' ', '')) != 14:
            print(orange_bold("Invalid UID. It must be exactly 14 hexadecimal characters."))
            return
        if not start_uid:
            start_uid = generate_random_uid()
        generated_cards = generate_and_save_cards(num_cards, start_uid, sequential=True)
    else:
        generated_cards = generate_and_save_cards(num_cards)

    save_card_list(generated_cards)
    print(orange_bold(f"\nGenerated {num_cards} cards. Files are saved in the '1' folder with .nfc extension."))
    print(orange_bold("=" * 50))
    print(orange_bold("Thank you for using the NFC Ultralight Generator!"))
    print(green_bold("\nA PlayList for Flipper Zero has been generated."))

if __name__ == "__main__":
    main()
