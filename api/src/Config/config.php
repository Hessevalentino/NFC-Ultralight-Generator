<?php
/**
 * Configuration file for NFC Generator API
 */

// Define constants
define('MAX_CARDS', 1000); // Maximum number of cards that can be generated in one request
define('DEFAULT_CARD_COUNT', 10); // Default number of cards to generate
define('DEFAULT_MODE', 'random'); // Default generation mode (random or sequential)

// Rate limiting settings
define('RATE_LIMIT_ENABLED', true); // Enable/disable rate limiting
define('RATE_LIMIT_MAX_REQUESTS', 10); // Maximum number of requests per time window
define('RATE_LIMIT_WINDOW', 60); // Time window in seconds

// Logging settings
define('LOG_ENABLED', true); // Enable/disable logging
define('LOG_FILE', __DIR__ . '/../../../logs/api.log'); // Log file path
