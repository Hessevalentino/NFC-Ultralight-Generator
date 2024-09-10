import random
import os

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
    
    # Generování dat pro stránky
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
    if not os.path.exists('nfc_cards'):
        os.makedirs('nfc_cards')

    current_uid = start_uid if start_uid else generate_random_uid()

    for i in range(num_cards):
        nfc_data = generate_nfc_data(current_uid)
        uid = current_uid.replace(' ', '')
        
        filename = f"nfc_cards/{uid}.nfc"
        with open(filename, 'w') as f:
            f.write(nfc_data)
        
        print(f"Vygenerována karta: {uid}, uložena jako {filename}")
        
        if sequential:
            current_uid = increment_uid(current_uid)
        else:
            current_uid = generate_random_uid()

def increment_uid(uid):
    uid_int = int(''.join(uid.split()), 16)
    uid_int += 1
    return ' '.join([format((uid_int >> (i * 8)) & 0xFF, '02X') for i in range(6, -1, -1)])

def main():
    print("Vítejte v generátoru NFC Ultralight karet!")
    
    while True:
        mode = input("Vyberte režim generování (1 - náhodné, 2 - sekvenční): ")
        if mode in ['1', '2']:
            break
        print("Neplatná volba. Zadejte 1 pro náhodné nebo 2 pro sekvenční generování.")

    while True:
        try:
            num_cards = int(input("Zadejte počet karet k vygenerování: "))
            if num_cards > 0:
                break
            print("Počet karet musí být kladné číslo.")
        except ValueError:
            print("Neplatný vstup. Zadejte celé číslo.")

    if mode == "2":
        start_uid = input("Zadejte počáteční UID (14 hexadecimálních znaků oddělených mezerami) nebo nechte prázdné pro náhodný start: ")
        if start_uid and len(start_uid.replace(' ', '')) != 14:
            print("Neplatné UID. Musí mít přesně 14 hexadecimálních znaků.")
            return
        if not start_uid:
            start_uid = generate_random_uid()
        generate_and_save_cards(num_cards, start_uid, sequential=True)
    else:
        generate_and_save_cards(num_cards)

    print(f"Vygenerováno {num_cards} karet. Soubory jsou uloženy ve složce 'nfc_cards' s příponou .nfc.")

if __name__ == "__main__":
    main()
