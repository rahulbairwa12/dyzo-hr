import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';

const AuthenticationAPI = () => {
  const [copiedId, setCopiedId] = useState(null);
  const [activeTab, setActiveTab] = useState('axios');
  const [activeJWTTab, setActiveJWTTab] = useState('interceptor');

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getMethodColor = (method) => {
    const colors = {
      'GET': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      'POST': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      'PUT': 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      'PATCH': 'text-orange-400 bg-orange-500/10 border-orange-500/30',
      'DELETE': 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    };
    return colors[method?.toUpperCase()] || 'text-slate-400 bg-slate-500/10 border-slate-500/30';
  };

  // Enhanced Code Block with Syntax Highlighting
  const SyntaxHighlightedCode = ({ code, language }) => {
    return (
      <pre className="text-sm leading-relaxed overflow-x-auto">
        <code className={`language-${language}`}>
          {code.split('\n').map((line, i) => (
            <div key={i} className="flex">
              <span className="select-none text-slate-600 pr-4 text-right w-10 flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-slate-300 font-mono">{line}</span>
            </div>
          ))}
        </code>
      </pre>
    );
  };

  const EndpointCard = ({ method, url, title, description, requestPayload, responsePayload, id: cardId }) => (
    <div className="border border-slate-700/50 rounded-lg overflow-hidden bg-gradient-to-br from-slate-900/50 to-slate-800/30 hover:border-slate-600/50 transition-all duration-300 shadow-xl">
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-slate-700/50 p-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`px-3 py-1.5 rounded-md border text-sm font-bold tracking-wider ${getMethodColor(method)}`}>
              {method}
            </span>
            <div className="flex items-center gap-2 bg-slate-950/50 px-3 py-1.5 rounded-md border border-slate-700">
              <Icon icon="heroicons:link" className="h-4 w-4 text-slate-500" />
              <code className="text-sm text-emerald-400 font-mono">{url}</code>
            </div>
          </div>
          
          {/* HTTP Status Badge */}
          <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/30">
            <span className="text-xs font-semibold text-emerald-400">200 OK</span>
          </div>
        </div>

        <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
        <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
      </div>

      {/* Content */}
      <div className="bg-slate-950/50">
        {requestPayload && (
          <div className="border-b border-slate-700/50">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/50">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-mono rounded border border-blue-500/30">
                  JSON
                </span>
                <span className="text-xs font-semibold text-slate-400">Request Body</span>
              </div>
              <button
                onClick={() => copyToClipboard(requestPayload, `req-${cardId}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors border border-slate-700"
              >
                <Icon 
                  icon={copiedId === `req-${cardId}` ? "heroicons:check" : "heroicons:clipboard-document"} 
                  className="h-3.5 w-3.5" 
                />
                {copiedId === `req-${cardId}` ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="p-4 overflow-x-auto">
              <pre className="text-sm text-slate-300 font-mono leading-relaxed">{requestPayload}</pre>
            </div>
          </div>
        )}

        {responsePayload && (
          <div>
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/50">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-mono rounded border border-emerald-500/30">
                  JSON
                </span>
                <span className="text-xs font-semibold text-slate-400">Response (200 OK)</span>
              </div>
              <button
                onClick={() => copyToClipboard(responsePayload, `res-${cardId}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors border border-slate-700"
              >
                <Icon 
                  icon={copiedId === `res-${cardId}` ? "heroicons:check" : "heroicons:clipboard-document"} 
                  className="h-3.5 w-3.5" 
                />
                {copiedId === `res-${cardId}` ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="p-4 overflow-x-auto">
              <pre className="text-sm text-slate-300 font-mono leading-relaxed">{responsePayload}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // API Key Code Examples Component with Enhanced Tabs
  const APIKeyCodeExamples = () => {
    const tabs = [
      { id: 'axios', label: 'JavaScript', icon: 'heroicons:code-bracket-square', lang: 'javascript' },
      { id: 'fetch', label: 'Fetch API', icon: 'heroicons:globe-alt', lang: 'javascript' },
      { id: 'python', label: 'Python', icon: 'heroicons:command-line', lang: 'python' },
      { id: 'curl', label: 'cURL', icon: 'heroicons:terminal', lang: 'bash' },
    ];

    const codeExamples = {
      axios: `// Using Axios
const axios = require('axios');

const API_KEY = 'your_api_key_here';
const BASE_URL = 'https://api.dyzo.ai';

// Set default header for all requests
axios.defaults.headers.common['X-API-Key'] = API_KEY;

// GET request
const getTasks = async () => {
  try {
    const response = await axios.get(\`\${BASE_URL}/tasks/\`);
    console.log('Tasks:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data);
  }
};

// POST request
const createTask = async (taskData) => {
  const response = await axios.post(\`\${BASE_URL}/create-task/1/\`, taskData, {
    headers: { 'X-API-Key': API_KEY }
  });
  return response.data;
};`,
      fetch: `const API_KEY = 'your_api_key_here';
const BASE_URL = 'https://api.dyzo.ai';

// GET request
fetch(\`\${BASE_URL}/tasks/\`, {
  method: 'GET',
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log('Tasks:', data))
  .catch(error => console.error('Error:', error));

// POST request
fetch(\`\${BASE_URL}/create-task/1/\`, {
  method: 'POST',
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'New Task',
    description: 'Task description'
  })
})
  .then(response => response.json())
  .then(data => console.log('Created:', data));`,
      python: `import requests

API_KEY = 'your_api_key_here'
BASE_URL = 'https://api.dyzo.ai'

# Set headers
headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
}

# GET request
response = requests.get(f'{BASE_URL}/tasks/', headers=headers)
if response.status_code == 200:
    tasks = response.json()
    print('Tasks:', tasks)

# POST request
task_data = {
    'title': 'New Task',
    'description': 'Task description'
}
response = requests.post(
    f'{BASE_URL}/create-task/1/',
    json=task_data,
    headers=headers
)
print('Created:', response.json())`,
      curl: `# GET request
curl -X GET "https://api.dyzo.ai/tasks/" \\
  -H "X-API-Key: your_api_key_here" \\
  -H "Content-Type: application/json"

# POST request
curl -X POST "https://api.dyzo.ai/create-task/1/" \\
  -H "X-API-Key: your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"New Task","description":"Task description"}'`
    };

    return (
      <div className="mt-4 border border-slate-700/50 rounded-lg overflow-hidden bg-slate-900/30">
        <div className="bg-slate-900/50 px-4 py-3 border-b border-slate-700/50">
          <h5 className="text-sm font-bold text-white flex items-center gap-2">
            <Icon icon="heroicons:code-bracket" className="h-4 w-4 text-blue-400" />
            Implementation Examples
          </h5>
        </div>
        
        {/* Tabs */}
        <div className="bg-slate-900/50 border-b border-slate-700/50">
          <div className="flex items-center">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-semibold transition-all relative ${
                  activeTab === tab.id
                    ? 'text-blue-400 bg-slate-800/50'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon icon={tab.icon} className="h-4 w-4" />
                  {tab.label}
                </div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Code Display with Language Badge */}
        <div className="bg-slate-950/50">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/50 border-b border-slate-700/50">
            <span className={`px-2 py-0.5 text-xs font-mono rounded border ${
              tabs.find(t => t.id === activeTab)?.lang === 'bash' 
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : tabs.find(t => t.id === activeTab)?.lang === 'python'
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {tabs.find(t => t.id === activeTab)?.lang}
            </span>
            <button
              onClick={() => copyToClipboard(codeExamples[activeTab], `code-${activeTab}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors border border-slate-700"
            >
              <Icon 
                icon={copiedId === `code-${activeTab}` ? "heroicons:check" : "heroicons:clipboard-document"} 
                className="h-3.5 w-3.5" 
              />
              {copiedId === `code-${activeTab}` ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="p-4 overflow-x-auto">
            <SyntaxHighlightedCode code={codeExamples[activeTab]} language={tabs.find(t => t.id === activeTab)?.lang} />
          </div>
        </div>
      </div>
    );
  };

  // JWT Token Implementation Examples Component with Enhanced Tabs
  const JWTTokenCodeExamples = () => {
    const tabs = [
      { id: 'interceptor', label: 'Auto-Refresh', icon: 'heroicons:arrow-path', lang: 'javascript' },
      { id: 'login', label: 'Login Handler', icon: 'heroicons:arrow-right-on-rectangle', lang: 'javascript' },
      { id: 'storage', label: 'Token Storage', icon: 'heroicons:archive-box', lang: 'javascript' },
    ];

    const codeExamples = {
      interceptor: `// Axios interceptor for automatic token refresh + retry
axios.interceptors.response.use(
  response => {
    // Check for new tokens in response headers
    const newAccessToken = response.headers['x-new-access-token'];
    const newRefreshToken = response.headers['x-new-refresh-token'];
    
    if (newAccessToken) {
      localStorage.setItem('access_token', newAccessToken);
      console.log('✅ New access token stored');
    }
    
    if (newRefreshToken) {
      localStorage.setItem('refresh_token', newRefreshToken);
      console.log('✅ New refresh token stored');
    }
    
    // Retry original request with new token
    if (newAccessToken) {
      const originalRequest = response.config;
      originalRequest.headers['Authorization'] = \`Bearer \${newAccessToken}\`;
      
      if (newRefreshToken) {
        originalRequest.headers['X-Refresh-Token'] = newRefreshToken;
      } else {
        const existingRefreshToken = localStorage.getItem('refresh_token');
        if (existingRefreshToken) {
          originalRequest.headers['X-Refresh-Token'] = existingRefreshToken;
        }
      }
      
      console.log('🔁 Retrying original request');
      return axios(originalRequest);
    }
    
    return response;
  }
);

// Add tokens to every request automatically
axios.interceptors.request.use(
  config => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (accessToken) {
      config.headers['Authorization'] = \`Bearer \${accessToken}\`;
    }
    
    if (refreshToken) {
      config.headers['X-Refresh-Token'] = refreshToken;
    }
    
    return config;
  }
);`,
      login: `// After successful login
const loginResponse = await axios.post('/login/', {
  email: 'user@example.com',
  password: 'password123'
});

// Store both tokens from login response
localStorage.setItem('access_token', loginResponse.data.access_token);
localStorage.setItem('refresh_token', loginResponse.data.refresh_token);

// Set as default headers for all future requests
axios.defaults.headers.common['Authorization'] = 
  \`Bearer \${loginResponse.data.access_token}\`;
axios.defaults.headers.common['X-Refresh-Token'] = 
  loginResponse.data.refresh_token;

console.log('✅ Login successful - tokens stored');`,
      storage: `// Token storage structure in LocalStorage
const tokenStorage = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',  // Expires: 1 hour
  refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Expires: 30 days
};

// Store tokens
localStorage.setItem('access_token', accessToken);
localStorage.setItem('refresh_token', refreshToken);

// Retrieve tokens
const accessToken = localStorage.getItem('access_token');
const refreshToken = localStorage.getItem('refresh_token');

// Clear tokens on logout
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');
// OR
localStorage.clear();`
    };

    return (
      <div className="border border-slate-700/50 rounded-lg overflow-hidden bg-slate-900/30">
        <div className="bg-slate-900/50 px-4 py-3 border-b border-slate-700/50">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Icon icon="heroicons:code-bracket" className="h-4 w-4 text-purple-400" />
            Client-Side Implementation
          </h4>
        </div>
        
        {/* Tabs */}
        <div className="bg-slate-900/50 border-b border-slate-700/50">
          <div className="flex items-center">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveJWTTab(tab.id)}
                className={`px-4 py-3 text-sm font-semibold transition-all relative ${
                  activeJWTTab === tab.id
                    ? 'text-purple-400 bg-slate-800/50'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon icon={tab.icon} className="h-4 w-4" />
                  {tab.label}
                </div>
                {activeJWTTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Code Display */}
        <div className="bg-slate-950/50">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/50 border-b border-slate-700/50">
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-mono rounded border border-emerald-500/30">
              javascript
            </span>
            <button
              onClick={() => copyToClipboard(codeExamples[activeJWTTab], `jwt-${activeJWTTab}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors border border-slate-700"
            >
              <Icon 
                icon={copiedId === `jwt-${activeJWTTab}` ? "heroicons:check" : "heroicons:clipboard-document"} 
                className="h-3.5 w-3.5" 
              />
              {copiedId === `jwt-${activeJWTTab}` ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="p-4 overflow-x-auto">
            <SyntaxHighlightedCode code={codeExamples[activeJWTTab]} language="javascript" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* API Overview - Enhanced */}
      <div className="border border-slate-700/50 rounded-lg overflow-hidden bg-gradient-to-br from-slate-900/80 to-slate-800/50 shadow-xl">
        <div className="bg-slate-900/80 border-b border-slate-700/50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <Icon icon="heroicons:shield-check" className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Authentication API</h3>
              <p className="text-xs text-slate-400">Secure access to your APIs</p>
            </div>
          </div>
        </div>
        
        <div className="p-5 space-y-4">
          <div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Comprehensive authentication system supporting API Keys, JWT tokens, OTP, and social login.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Icon icon="heroicons:check-badge" className="h-4 w-4 text-emerald-400" />
              Key Features
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {['Generate and manage API keys', 'JWT token authentication with auto-refresh', 'OTP-based login', 'Google OAuth and Apple Sign-In', 'Rate limiting and token expiration'].map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2.5 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-colors">
                  <Icon icon="heroicons:check-circle" className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Method 1: API Key Authentication */}
      <div id="api-key-auth" className="border border-blue-800/30 rounded-lg p-4 bg-blue-900/10 scroll-mt-20">
        <h3 className="text-lg font-bold text-blue-300 mb-2">Method 1: API Key Authentication</h3>
        <p className="text-sm text-slate-300 mb-4">
          Simple and permanent authentication for server-to-server integrations
        </p>

        <div className="bg-slate-900/50 rounded-lg p-4 mb-4 border border-slate-700">
          <h4 className="text-sm font-semibold text-white mb-2">Request Header:</h4>
          <code className="text-sm text-green-400 font-mono">X-API-Key: YOUR_API_KEY</code>
          
          <div className="mt-3">
            <h4 className="text-sm font-semibold text-white mb-2">Best for:</h4>
            <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
              <li>Automated scripts</li>
              <li>Third-party integrations</li>
              <li>Cron jobs</li>
            </ul>
          </div>

          <div className="mt-3">
            <h4 className="text-sm font-semibold text-white mb-2">Features:</h4>
            <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
              <li>Rate limiting</li>
              <li>Expiration dates</li>
              <li>Usage tracking</li>
            </ul>
          </div>
        </div>

        <APIKeyCodeExamples />

        <div className="space-y-3 mt-4">
          <EndpointCard
            method="POST"
            url="/api-keys/{user_id}/"
            title="Create API Key"
            description="Generate a new API key for programmatic access."
            id="create-api-key"
            requestPayload={`{
  "name": "Production Key",
  "expires_in_days": 365,
  "rate_limit": 1000
}`}
            responsePayload={`{
  "status": 1,
  "message": "API key created successfully",
  "api_key": {
    "id": 5,
    "name": "Production Key",
    "key": "dyzo_abc123...",
    "is_active": true,
    "rate_limit": 1000,
    "expires_at": "2025-10-29T00:00:00Z"
  }
}`}
          />

          <EndpointCard
            method="GET"
            url="/api-keys/{user_id}/"
            title="List API Keys"
            description="Get all API keys for a user."
            id="get-api-keys"
            responsePayload={`{
  "status": 1,
  "api_keys": [...]
}`}
          />

          <EndpointCard
            method="DELETE"
            url="/api-keys/{user_id}/"
            title="Delete API Key"
            description="Permanently delete an API key."
            id="delete-api-key"
            requestPayload={`{
  "key_id": 5
}`}
            responsePayload={`{
  "status": 1,
  "message": "API key deleted successfully"
}`}
          />
        </div>
      </div>

      {/* Method 2: JWT Token Authentication */}
      <div id="jwt-auth" className="border border-green-800/30 rounded-lg p-4 bg-green-900/10 scroll-mt-20">
        <h3 className="text-lg font-bold text-green-300 mb-2">Method 2: JWT Token Authentication</h3>
        <p className="text-sm text-slate-300 mb-4">
          Secure token-based authentication with automatic refresh for web and mobile applications
        </p>

        <div className="bg-slate-900/50 rounded-lg p-4 mb-4 border border-slate-700">
          <h4 className="text-sm font-semibold text-white mb-2">Request Headers:</h4>
          <div className="space-y-1 mb-3">
            <code className="text-sm text-green-400 font-mono block">Authorization: Bearer &lt;access_token&gt;</code>
            <code className="text-sm text-blue-400 font-mono block">X-Refresh-Token: &lt;refresh_token&gt;</code>
          </div>
          
          <div className="mt-3">
            <h4 className="text-sm font-semibold text-white mb-2">Best for:</h4>
            <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
              <li>Web applications</li>
              <li>Mobile apps</li>
              <li>User-specific operations</li>
            </ul>
          </div>

          <div className="mt-3">
            <h4 className="text-sm font-semibold text-white mb-2">Token Expiry:</h4>
            <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
              <li>Access Token: 1 hour</li>
              <li>Refresh Token: 30 days</li>
            </ul>
          </div>
        </div>

        {/* Complete Auto-Refresh + Retry Flow */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg p-4 mb-4 border border-purple-700/30">
          <h4 className="text-base font-semibold text-purple-300 mb-3">Complete Auto-Refresh + Retry Flow</h4>
          <p className="text-sm text-slate-300 mb-4">
            When your access token expires, the system automatically refreshes it and retries your original API call - no manual intervention required!
          </p>

          <div className="space-y-3">
            <h5 className="text-sm font-semibold text-white">Step-by-Step Automatic Flow:</h5>
            
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-2 bg-slate-900/50 rounded">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <p className="text-xs font-semibold text-blue-300">Client makes API request</p>
                  <code className="text-xs text-slate-400">GET /tasks/ with Authorization: Bearer &lt;expired_token&gt;</code>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2 bg-slate-900/50 rounded">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <p className="text-xs font-semibold text-yellow-300">Middleware detects token expiration</p>
                  <code className="text-xs text-slate-400">jwt.ExpiredSignatureError detected</code>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2 bg-slate-900/50 rounded">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <p className="text-xs font-semibold text-purple-300">Middleware uses refresh token</p>
                  <ul className="text-xs text-slate-400 list-disc list-inside">
                    <li>Checks for refresh token in header or cookie</li>
                    <li>Validates refresh token</li>
                    <li>Generates new access token</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2 bg-slate-900/50 rounded">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">4</span>
                <div>
                  <p className="text-xs font-semibold text-green-300">New token returned in response</p>
                  <code className="text-xs text-slate-400">X-New-Access-Token: &lt;new_access_token&gt;</code>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2 bg-slate-900/50 rounded">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">5</span>
                <div>
                  <p className="text-xs font-semibold text-blue-300">🔄 Client automatically retries original API call</p>
                  <code className="text-xs text-slate-400">GET /tasks/ with Authorization: Bearer &lt;new_access_token&gt;</code>
                  <p className="text-xs text-slate-500 mt-1">Same API endpoint, same request, but with the NEW access token!</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2 bg-slate-900/50 rounded">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">6</span>
                <div>
                  <p className="text-xs font-semibold text-green-300">✅ Request succeeds with new token</p>
                  <code className="text-xs text-slate-400">200 OK - Returns requested data</code>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded">
              <h6 className="text-xs font-semibold text-blue-300 mb-2">Key Benefits:</h6>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>✅ Zero user intervention required</li>
                <li>✅ Seamless experience - user never knows token expired</li>
                <li>✅ Original request automatically retried</li>
                <li>✅ Both access and refresh tokens stored in LocalStorage</li>
                <li>✅ Refresh token also stored for future refreshes</li>
              </ul>
            </div>
          </div>
        </div>

        <JWTTokenCodeExamples />

        <div className="space-y-3 mt-4">
          <EndpointCard
            method="POST"
            url="/login/"
            title="Employee Login"
            description="Authenticate an employee with email and password. Returns JWT access and refresh tokens."
            id="employee-login"
            requestPayload={`{
  "email": "user@company.com",
  "password": "securepassword123"
}`}
            responsePayload={`{
  "status": 1,
  "message": "Login successful",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "employee": {
    "_id": 10,
    "first_name": "John",
    "last_name": "Doe",
    "email": "user@company.com",
    "companyId": 1,
    "designation": "Software Engineer",
    "isActive": true
  }
}`}
          />

          <EndpointCard
            method="POST"
            url="/api/google-login/"
            title="Google OAuth Login"
            description="Authenticate using Google OAuth token."
            id="google-login"
            requestPayload={`{
  "token": "google_oauth_token_here",
  "email": "user@gmail.com"
}`}
            responsePayload={`{
  "status": 1,
  "access_token": "...",
  "employee": {...}
}`}
          />
        </div>

        {/* Security Best Practices */}
        <div className="mt-4 p-4 bg-yellow-900/10 border border-yellow-700/30 rounded-lg">
          <h4 className="text-sm font-semibold text-yellow-300 mb-2 flex items-center gap-2">
            <Icon icon="heroicons:exclamation-triangle" className="h-4 w-4" />
            Security Best Practices
          </h4>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>⚠️ LocalStorage is vulnerable to XSS attacks</li>
            <li>✅ Recommended: Use HTTP-only cookies for production</li>
            <li>✅ Always use HTTPS in production</li>
            <li>✅ Implement proper CORS policies</li>
            <li>✅ Rotate refresh tokens periodically</li>
            <li>✅ Implement token blacklisting on logout</li>
          </ul>
        </div>
      </div>

      {/* OTP Login */}
      <div id="otp-login" className="scroll-mt-20">
        <EndpointCard
          method="POST"
          url="/otp-login/"
          title="OTP Login"
          description="Login using OTP sent to mobile/email."
          id="otp-login-endpoint"
          requestPayload={`{
  "phone": "+1234567890",
  "otp": "123456"
}`}
          responsePayload={`{
  "status": 1,
  "access_token": "..."
}`}
        />
      </div>
    </div>
  );
};

export default AuthenticationAPI;


