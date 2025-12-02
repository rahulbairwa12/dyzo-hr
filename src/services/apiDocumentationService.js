import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_APP_DJANGO || 'https://api.dyzo.ai';

/**
 * API Documentation Service
 * Fetches dynamic API documentation from backend
 */
class ApiDocumentationService {
  /**
   * Fetch API documentation from backend
   * @returns {Promise<Object>} API documentation object
   */
  async getDocumentation() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/documentation/`);
      
      if (response.data.status === 1) {
        return response.data.documentation;
      } else {
        throw new Error('Failed to fetch documentation');
      }
    } catch (error) {
      console.error('Error fetching API documentation:', error);
      
      // Return fallback/mock data for development
      return this.getMockDocumentation();
    }
  }

  /**
   * Mock/Fallback documentation data
   * Used when API is unavailable or during development
   * 
   * NOTE: This is temporary fallback data. Backend will provide full data.
   */
  getMockDocumentation() {
    return {
      version: '2.0.0',
      lastUpdated: '2024-10-29',
      baseUrl: 'https://api.dyzo.ai',
      description: 'Complete Dyzo API Documentation - Project Management, Team Collaboration & Time Tracking Platform',
      categories: [
        {
          id: 'core',
          name: 'Core APIs',
          description: 'Essential APIs for authentication and getting started',
          icon: 'heroicons:star',
          endpoints: [
            {
              id: 'getting-started',
              label: 'Getting Started',
              icon: 'heroicons:rocket-launch',
              hasSubSections: false,
              overview: {
                title: 'Getting Started with Dyzo API',
                description: 'Welcome to the Dyzo API documentation. This comprehensive guide will help you integrate our powerful project management, team collaboration, and time tracking APIs.',
                capabilities: [
                  'Authenticate using API keys or JWT tokens',
                  'Manage projects, tasks, and team members',
                  'Track time, attendance, and leaves',
                  'Generate reports and analytics',
                  'Real-time notifications and updates'
                ]
              }
            },
            {
              id: 'authentication',
              label: 'Authentication',
              icon: 'heroicons:shield-check',
              hasSubSections: true,
              subSections: [
                { id: 'api-key-auth', label: 'API Key Authentication' },
                { id: 'jwt-auth', label: 'JWT Token Authentication' },
                { id: 'otp-login', label: 'OTP Login' }
              ],
              overview: {
                title: 'Authentication API',
                description: 'Comprehensive authentication system supporting API Keys, JWT tokens, OTP, and social login.',
                capabilities: [
                  'Generate and manage API keys',
                  'JWT token authentication with auto-refresh',
                  'OTP-based login',
                  'Google OAuth and Apple Sign-In',
                  'Rate limiting and token expiration'
                ]
              }
            }
          ]
        }
      ],
      errorCodes: {
        NO_ACCESS_TOKEN: 'Missing Authorization header',
        TOKEN_EXPIRED_NO_REFRESH: 'Access token expired, no refresh token',
        INVALID_API_KEY: 'API key not found or inactive',
        RATE_LIMIT_EXCEEDED: 'Too many requests (HTTP 429)',
        USER_INACTIVE: 'User account is inactive',
        USER_NOT_FOUND: 'User not found',
        AUTHENTICATION_REQUIRED: 'Authentication required',
        INVALID_ACCESS_TOKEN: 'Invalid access token',
        API_KEY_EXPIRED: 'API key has expired'
      },
      responseHeaders: {
        'X-New-Access-Token': 'New access token after auto-refresh',
        'X-RateLimit-Remaining': 'Remaining API calls for current period',
        'X-Total-Count': 'Total records count in paginated responses',
        'X-Request-Id': 'Unique request identifier for debugging'
      }
    };
  }

  /**
   * Transform backend data structure to component-friendly format
   * @param {Object} documentation - Raw documentation from API
   * @returns {Object} Transformed documentation
   */
  transformDocumentation(documentation) {
    return {
      ...documentation,
      // Any additional transformations needed
      categories: documentation.categories.map(category => ({
        ...category,
        endpoints: category.endpoints.map(endpoint => ({
          ...endpoint,
          // Ensure sub-sections exist
          subSections: endpoint.subSections || [],
          // Ensure methods exist
          methods: endpoint.methods || []
        }))
      }))
    };
  }
}

export default new ApiDocumentationService();
