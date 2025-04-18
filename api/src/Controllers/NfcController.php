<?php
namespace Controllers;

use Services\NfcGenerator;

/**
 * NfcController
 * Handles HTTP requests for NFC card generation
 */
class NfcController {
    /**
     * @var NfcGenerator
     */
    private $nfcGenerator;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->nfcGenerator = new NfcGenerator();
    }
    
    /**
     * Generate NFC cards
     * Handles the /generate endpoint
     */
    public function generate(): void {
        try {
            // Check if request method is POST
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $this->sendErrorResponse(405, 'Method not allowed');
                return;
            }
            
            // Get request body
            $requestBody = file_get_contents('php://input');
            $data = json_decode($requestBody, true);
            
            // Check if request body is valid JSON
            if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
                $this->sendErrorResponse(400, 'Invalid JSON: ' . json_last_error_msg());
                return;
            }
            
            // Apply rate limiting if enabled
            if (defined('RATE_LIMIT_ENABLED') && RATE_LIMIT_ENABLED) {
                if (!$this->checkRateLimit()) {
                    $this->sendErrorResponse(429, 'Rate limit exceeded');
                    return;
                }
            }
            
            // Generate cards
            $result = $this->nfcGenerator->generate($data ?? []);
            
            // Log the operation if logging is enabled
            if (defined('LOG_ENABLED') && LOG_ENABLED) {
                $this->logOperation('generate', $data ?? [], $result['metadata']);
            }
            
            // Send response
            $this->sendSuccessResponse($result);
        } catch (\InvalidArgumentException $e) {
            // Handle validation errors
            $this->sendErrorResponse(400, $e->getMessage());
        } catch (\Exception $e) {
            // Handle other errors
            $this->sendErrorResponse(500, 'Internal server error: ' . $e->getMessage());
        }
    }
    
    /**
     * Send a success response
     * 
     * @param array $data Response data
     */
    private function sendSuccessResponse(array $data): void {
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'data' => $data
        ]);
    }
    
    /**
     * Send an error response
     * 
     * @param int $statusCode HTTP status code
     * @param string $message Error message
     */
    private function sendErrorResponse(int $statusCode, string $message): void {
        http_response_code($statusCode);
        echo json_encode([
            'status' => 'error',
            'message' => $message
        ]);
    }
    
    /**
     * Check if the request is within rate limits
     * 
     * @return bool True if within limits, false otherwise
     */
    private function checkRateLimit(): bool {
        // Simple in-memory rate limiting using session
        // In a production environment, you would use Redis or similar
        session_start();
        
        $now = time();
        $window = defined('RATE_LIMIT_WINDOW') ? RATE_LIMIT_WINDOW : 60;
        $maxRequests = defined('RATE_LIMIT_MAX_REQUESTS') ? RATE_LIMIT_MAX_REQUESTS : 10;
        
        // Initialize or clean up old requests
        if (!isset($_SESSION['rate_limit_requests'])) {
            $_SESSION['rate_limit_requests'] = [];
        }
        
        // Remove requests outside the current window
        $_SESSION['rate_limit_requests'] = array_filter(
            $_SESSION['rate_limit_requests'],
            function($timestamp) use ($now, $window) {
                return $timestamp > ($now - $window);
            }
        );
        
        // Check if we're over the limit
        if (count($_SESSION['rate_limit_requests']) >= $maxRequests) {
            return false;
        }
        
        // Add current request to the list
        $_SESSION['rate_limit_requests'][] = $now;
        
        return true;
    }
    
    /**
     * Log an operation
     * 
     * @param string $operation Operation name
     * @param array $request Request data
     * @param array $metadata Response metadata
     */
    private function logOperation(string $operation, array $request, array $metadata): void {
        if (!defined('LOG_FILE')) {
            return;
        }
        
        $logDir = dirname(LOG_FILE);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        $logEntry = [
            'timestamp' => date('c'),
            'operation' => $operation,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'request' => $request,
            'metadata' => $metadata
        ];
        
        file_put_contents(
            LOG_FILE,
            json_encode($logEntry) . "\n",
            FILE_APPEND
        );
    }
}
