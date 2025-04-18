/**
 * API Client for NFC Generator
 * Handles communication with the backend API
 */
class ApiClient {
    /**
     * Constructor
     * @param {string} baseUrl - Base URL for the API
     */
    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
    }
    
    /**
     * Generate NFC cards
     * @param {Object} params - Generation parameters
     * @param {number} params.count - Number of cards to generate
     * @param {string} params.mode - Generation mode (random or sequential)
     * @param {string} [params.startUid] - Starting UID for sequential mode
     * @returns {Promise<Object>} - API response
     */
    async generateCards(params) {
        try {
            const response = await fetch(`${this.baseUrl}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(params)
            });
            
            // Check if response is OK
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }
            
            // Parse and return response data
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API error:', error);
            throw error;
        }
    }
}
