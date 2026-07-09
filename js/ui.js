/**
 * UI Manager
 * Handles the user interface for the NFC Generator
 */
class UiManager {
    /**
     * Constructor
     * @param {NfcGenerator} nfcGenerator - NFC Generator instance
     */
    constructor(nfcGenerator) {
        this.nfcGenerator = nfcGenerator;
        
        // DOM elements
        this.logOutput = document.getElementById('logOutput');
        this.cardList = document.getElementById('cardList');
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
        this.cardCount = document.getElementById('cardCount');
        this.startUid = document.getElementById('startUid');
        this.generateBtn = document.getElementById('generateBtn');
        this.randomUidBtn = document.getElementById('randomUidBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.copyUidBtn = document.getElementById('copyUidBtn');
        this.aboutBtn = document.getElementById('aboutBtn');
        this.helpBtn = document.getElementById('helpBtn');
        
        // State
        this.generatedFiles = [];
        this.selectedCardIndex = -1;
        this.zip = new JSZip();
        
        // Initialize
        this.initEventListeners();
        this.log("NFC Ultralight Generator ready to use");
        this.log("Select generation mode and number of cards, then click 'Generate Cards'");
    }
    
    /**
     * Initialize event listeners
     */
    initEventListeners() {
        this.randomUidBtn.addEventListener('click', () => this.setRandomUid());
        this.generateBtn.addEventListener('click', () => this.startGeneration());
        this.downloadBtn.addEventListener('click', () => this.downloadZip());
        this.copyUidBtn.addEventListener('click', () => this.copySelectedUid());
        this.aboutBtn.addEventListener('click', () => this.showAbout());
        this.helpBtn.addEventListener('click', () => this.showHelp());
        
        this.cardList.addEventListener('click', (e) => {
            if (e.target.classList.contains('card-item')) {
                // Deselect previous selection
                const previousSelected = this.cardList.querySelector('.selected');
                if (previousSelected) {
                    previousSelected.classList.remove('selected');
                }
                
                // Select the clicked item
                e.target.classList.add('selected');
                this.selectedCardIndex = Array.from(this.cardList.children).indexOf(e.target);
                this.copyUidBtn.disabled = false;
            }
        });
    }
    
    /**
     * Add a log message
     * @param {string} message - Message to log
     */
    log(message) {
        const timestamp = new Date().toTimeString().split(' ')[0];
        const logEntry = document.createElement('div');
        logEntry.textContent = `[${timestamp}] ${message}`;
        this.logOutput.appendChild(logEntry);
        this.logOutput.scrollTop = this.logOutput.scrollHeight;
    }
    
    /**
     * Set a random UID in the input field
     */
    setRandomUid() {
        this.startUid.value = this.nfcGenerator.generateRandomUid();
    }
    
    /**
     * Update progress bar
     * @param {number} progress - Progress value (0-100)
     */
    updateProgress(progress) {
        this.progressBar.value = progress;
        this.progressText.textContent = `${Math.round(progress)}%`;
    }
    
    /**
     * Start the generation process
     */
    async startGeneration() {
        try {
            // Input validation
            const numCards = parseInt(this.cardCount.value);
            if (isNaN(numCards) || numCards <= 0) {
                alert("Number of cards must be a positive number.");
                return;
            }
            
            // Get generation mode
            const mode = document.querySelector('input[name="mode"]:checked').value;
            
            // Validate initial UID if provided and in sequential mode
            const startUid = this.startUid.value.trim();
            if (mode === "sequential" && startUid && !this.nfcGenerator.validateUid(startUid)) {
                alert("Invalid UID format. Enter 7 pairs of hexadecimal values separated by spaces (e.g., 04 12 A5 F7 22 D9 81).");
                return;
            }
            
            // Reset UI
            this.updateProgress(0);
            this.generatedFiles = [];
            this.cardList.innerHTML = '';
            this.selectedCardIndex = -1;
            this.copyUidBtn.disabled = true;
            this.downloadBtn.disabled = true;
            this.zip = new JSZip();
            
            // Disable generate button during generation
            this.generateBtn.disabled = true;
            
            this.log(`Starting generation of ${numCards} cards in ${mode === 'random' ? 'random' : 'sequential'} mode`);
            
            // Determine initial UID
            let currentUid = startUid || this.nfcGenerator.generateRandomUid();
            const sequential = (mode === "sequential");
            
            this.log(`Starting UID: ${currentUid}`);
            this.log("Generating cards...");
            
            // Generate cards
            for (let i = 0; i < numCards; i++) {
                // Update progress
                const progress = ((i + 1) / numCards) * 100;
                this.updateProgress(progress);
                
                // Generate card data
                const nfcData = this.nfcGenerator.generateNfcData(currentUid);
                const uid = currentUid.replace(/\s/g, '');
                const filename = `${uid}.nfc`;
                
                // Add to ZIP
                this.zip.file(filename, nfcData);
                
                // Add to generated files list
                this.generatedFiles.push({ uid, filename });
                
                // Add to card list in UI
                const cardItem = document.createElement('div');
                cardItem.className = 'card-item';
                cardItem.textContent = `${uid} - ${filename}`;
                this.cardList.appendChild(cardItem);
                
                // Increment UID for sequential mode
                if (sequential) {
                    currentUid = this.nfcGenerator.incrementUid(currentUid);
                } else {
                    currentUid = this.nfcGenerator.generateRandomUid();
                }
                
                // Allow UI to update
                await new Promise(resolve => setTimeout(resolve, 0));
            }
            
            // Generate list file
            let listContent = '';
            for (const card of this.generatedFiles) {
                listContent += `/ext/nfc/${card.filename}\n`;
            }
            this.zip.file("generated_cards_list.txt", listContent);
            
            this.log(`Completed! Generated ${numCards} cards.`);
            this.log(`Card list saved to: generated_cards_list.txt`);
            
            // Enable download button
            this.downloadBtn.disabled = false;
            this.generateBtn.disabled = false;
        } catch (error) {
            this.log(`Error: ${error.message}`);
            console.error(error);
            this.generateBtn.disabled = false;
        }
    }
    
    /**
     * Download the generated ZIP file
     */
    async downloadZip() {
        this.log("Creating ZIP archive...");
        
        try {
            const zipBlob = await this.zip.generateAsync({type: 'blob'});
            saveAs(zipBlob, "nfc_cards.zip");
            this.log("ZIP archive created and ready for download");
        } catch (error) {
            this.log(`Error creating ZIP: ${error.message}`);
            console.error(error);
        }
    }
    
    /**
     * Copy the selected UID to clipboard
     */
    copySelectedUid() {
        if (this.selectedCardIndex === -1) {
            alert("Please select a card from the list first.");
            return;
        }
        
        const uid = this.generatedFiles[this.selectedCardIndex].uid;
        
        // Copy to clipboard
        navigator.clipboard.writeText(uid)
            .then(() => {
                this.log(`UID ${uid} copied to clipboard`);
            })
            .catch((error) => {
                this.log(`Error copying to clipboard: ${error.message}`);
                console.error(error);
            });
    }
    
    /**
     * Show the about dialog
     */
    showAbout() {
        alert(
            "NFC Ultralight Generator\n" +
            "Version 1.0 Web\n\n" +
            "Created based on script by RaZ0rBlad3\n\n" +
            "This tool generates NFC Ultralight files\n" +
            "compatible with Flipper Zero.\n\n" +
            "© 2025 - All rights reserved"
        );
    }
    
    /**
     * Show the help dialog
     */
    showHelp() {
        alert(
            "HOW TO USE GENERATED NFC FILES\n\n" +
            "1. After generating and downloading the ZIP file, extract it to your computer\n\n" +
            "2. Connect your Flipper Zero to your computer via USB\n\n" +
            "3. Copy all the .nfc files to the following path on your Flipper Zero's SD card:\n" +
            "   /ext/nfc/\n\n" +
            "4. Create a folder called 'nfc_playlist' in the /ext/ directory if it doesn't exist:\n" +
            "   /ext/nfc_playlist/\n\n" +
            "5. Copy the 'generated_cards_list.txt' file to the nfc_playlist folder\n\n" +
            "6. On your Flipper Zero:\n" +
            "   - Open the NFC app\n" +
            "   - Press the LEFT button to access the 'More' menu\n" +
            "   - Select 'Playlist' option\n" +
            "   - Choose the uploaded list\n\n" +
            "7. You can now use the UP/DOWN buttons to browse through all generated cards\n" +
            "   and use them for emulation without having to go back to the file browser."
        );
    }
}
