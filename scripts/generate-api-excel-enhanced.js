import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import { execSync } from 'child_process';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const srcDirectory = path.join(__dirname, '../src');
const outputFile = path.join(__dirname, '../api-endpoints-detailed.xlsx');
const apiDocsFile = path.join(__dirname, '../API_DOCUMENTATION.md');
const apiPathsFile = path.join(__dirname, '../apipaths.txt');

// Patterns to search for API calls, including more complex patterns
const apiPatterns = [
  // Axios and fetch patterns
  { regex: /\.get\(\s*['"`]([^'"`]*?)['"`]/g, method: 'GET' },
  { regex: /\.post\(\s*['"`]([^'"`]*?)['"`]/g, method: 'POST' },
  { regex: /\.put\(\s*['"`]([^'"`]*?)['"`]/g, method: 'PUT' },
  { regex: /\.delete\(\s*['"`]([^'"`]*?)['"`]/g, method: 'DELETE' },
  { regex: /\.patch\(\s*['"`]([^'"`]*?)['"`]/g, method: 'PATCH' },
  
  // Project-specific patterns
  { regex: /fetchGET\(\s*['"`]([^'"`]*?)['"`]/g, method: 'GET' },
  { regex: /fetchPOST\(\s*['"`]([^'"`]*?)['"`]/g, method: 'POST' },
  { regex: /fetchAuthPost\(\s*['"`]([^'"`]*?)['"`]/g, method: 'POST' },
  { regex: /fetchAuthGET\(\s*['"`]([^'"`]*?)['"`]/g, method: 'GET' },
  { regex: /fetchAPI\(\s*['"`]([^'"`]*?)['"`]/g, method: 'GET' },
  { regex: /fetchAPIOption\(\s*['"`]([^'"`]*?)['"`]/g, method: 'GET' },
  { regex: /fetchAuthAPI\(\s*['"`]([^'"`]*?)['"`]/g, method: 'GET' },
  
  // API request hooks
  { regex: /useGet\(\s*['"`]([^'"`]*?)['"`]/g, method: 'GET' },
  { regex: /usePost\(\s*['"`]([^'"`]*?)['"`]/g, method: 'POST' },
  { regex: /usePut\(\s*['"`]([^'"`]*?)['"`]/g, method: 'PUT' },
  { regex: /useDelete\(\s*['"`]([^'"`]*?)['"`]/g, method: 'DELETE' },
  { regex: /usePatch\(\s*['"`]([^'"`]*?)['"`]/g, method: 'PATCH' },
  
  // More specific patterns
  { regex: /apiRequest\(\s*\{[^}]*endpoint:\s*['"`]([^'"`]*?)['"`]/g, method: 'UNKNOWN' },
  { regex: /apiRequest\(\s*\{[^}]*method:\s*['"`](GET|POST|PUT|DELETE|PATCH)['"`][^}]*endpoint:\s*['"`]([^'"`]*?)['"`]/g, methodGroup: 1, endpointGroup: 2 }
];

// Dynamic endpoint extraction patterns - these are more complex and might include variables
const dynamicPatterns = [
  { regex: /`([^`]*?${[^}]*?}[^`]*?)`/g, contextLines: 5 },
  { regex: /['"]([^'"]*?\$\{[^}]*?\}[^'"]*?)['"]/g, contextLines: 5 }
];

// Read API endpoints from apipaths.txt if available
function readApiPaths() {
  if (!fs.existsSync(apiPathsFile)) {
    return [];
  }

  const content = fs.readFileSync(apiPathsFile, 'utf8');
  const paths = [];
  
  // Extract URL patterns
  const pathRegex = /^\s*(\S+?\/)\s+\[name=/gm;
  let match;
  
  while ((match = pathRegex.exec(content)) !== null) {
    if (match[1] && !match[1].startsWith('admin')) {
      paths.push(match[1].trim());
    }
  }
  
  return paths;
}

// Function to read the content of API_DOCUMENTATION.md
function readApiDocs() {
  if (!fs.existsSync(apiDocsFile)) {
    return {};
  }
  
  const content = fs.readFileSync(apiDocsFile, 'utf8');
  const endpointDocs = {};
  
  // Extract endpoint documentation using regex
  const endpointPattern = /-\s+\*\*URL\*\*:\s*`?([^`\n]+)`?\s*\n-\s+\*\*Method\*\*:\s*`([^`]+)`\s*\n-\s+\*\*Description\*\*:\s*([^\n]+)/g;
  
  let match;
  while ((match = endpointPattern.exec(content)) !== null) {
    const [_, url, method, description] = match;
    const cleanUrl = url.trim();
    
    if (!endpointDocs[cleanUrl]) {
      endpointDocs[cleanUrl] = {};
    }
    
    endpointDocs[cleanUrl][method.trim()] = description.trim();
  }
  
  return endpointDocs;
}

// Extract context around a match
function extractContext(content, index, contextLines = 3) {
  const lines = content.substring(0, index).split('\n');
  const startLine = Math.max(0, lines.length - contextLines);
  const endLine = lines.length + contextLines;
  
  const contentLines = content.split('\n');
  const context = contentLines.slice(startLine, endLine).join('\n');
  
  return context;
}

// Function to scan files for API endpoints
function findApiEndpoints() {
  const endpoints = new Map();
  const apiDocs = readApiDocs();
  const apiPaths = readApiPaths();
  
  // Find all JS/JSX/TS/TSX files
  const command = `find ${srcDirectory} -type f -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx"`;
  const files = execSync(command).toString().split('\n').filter(Boolean);
  
  // Add documented API paths
  apiPaths.forEach(path => {
    if (!endpoints.has(path)) {
      endpoints.set(path, {
        endpoint: path,
        files: new Set(['From API_PATHS.txt']),
        methods: new Set(['UNKNOWN']),
        description: 'From API_PATHS.txt',
        isDynamic: false,
        context: '',
      });
    }
  });
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(path.join(__dirname, '..'), file);
      
      // Check each API pattern
      apiPatterns.forEach(pattern => {
        const { regex, method, methodGroup, endpointGroup } = pattern;
        regex.lastIndex = 0; // Reset regex state
        
        let match;
        while ((match = regex.exec(content)) !== null) {
          let endpoint, httpMethod;
          
          if (methodGroup && endpointGroup) {
            httpMethod = match[methodGroup];
            endpoint = match[endpointGroup].trim();
          } else {
            endpoint = match[1].trim();
            httpMethod = method;
          }

          if (endpoint) {
            const isDynamic = endpoint.includes('${') || endpoint.includes(':');
            
            if (!endpoints.has(endpoint)) {
              endpoints.set(endpoint, {
                endpoint,
                files: new Set(),
                methods: new Set(),
                description: '',
                isDynamic,
                context: '',
              });
            }
            
            // Add file to the list
            endpoints.get(endpoint).files.add(relativePath);
            endpoints.get(endpoint).methods.add(httpMethod);
            
            // Extract context
            if (isDynamic && !endpoints.get(endpoint).context) {
              endpoints.get(endpoint).context = extractContext(content, match.index);
            }
            
            // Add description from API docs if available
            if (apiDocs[endpoint]) {
              const methods = Array.from(endpoints.get(endpoint).methods);
              for (const m of methods) {
                if (apiDocs[endpoint][m]) {
                  endpoints.get(endpoint).description = apiDocs[endpoint][m];
                  break;
                }
              }
            }
          }
        }
      });
      
      // Also look for dynamic endpoints with more complex patterns
      dynamicPatterns.forEach(({ regex, contextLines }) => {
        regex.lastIndex = 0;
        let match;
        while ((match = regex.exec(content)) !== null) {
          const dynamicEndpoint = match[1].trim();
          
          if (dynamicEndpoint && (
              dynamicEndpoint.includes('${') || 
              dynamicEndpoint.includes(':') ||
              dynamicEndpoint.startsWith('/api/') ||
              dynamicEndpoint.startsWith('/') && dynamicEndpoint.length > 3
          )) {
            if (!endpoints.has(dynamicEndpoint)) {
              endpoints.set(dynamicEndpoint, {
                endpoint: dynamicEndpoint,
                files: new Set(),
                methods: new Set(['UNKNOWN']), // We can't reliably determine the method
                description: 'Dynamic endpoint',
                isDynamic: true,
                context: extractContext(content, match.index, contextLines),
              });
            }
            
            endpoints.get(dynamicEndpoint).files.add(relativePath);
          }
        }
      });
      
    } catch (error) {
      console.error(`Error processing file ${file}:`, error.message);
    }
  });
  
  // Convert to array for Excel processing
  return Array.from(endpoints.values()).map(({endpoint, files, methods, description, isDynamic, context}) => ({
    Endpoint: endpoint,
    Methods: Array.from(methods).join(', '),
    Description: description,
    Files: Array.from(files).join(', '),
    IsDynamic: isDynamic ? 'Yes' : 'No',
    Context: context
  }));
}

// Group endpoints by domain/category
function categorizeEndpoints(endpoints) {
  const categories = new Map();
  
  endpoints.forEach(endpoint => {
    let category = 'Other';
    
    const path = endpoint.Endpoint;
    
    // Categorize based on path patterns
    if (path.includes('/api/project') || path.includes('/project/')) {
      category = 'Projects';
    } else if (path.includes('/api/task') || path.includes('/task/')) {
      category = 'Tasks';
    } else if (path.includes('/api/client') || path.includes('/client/')) {
      category = 'Clients';
    } else if (path.includes('/employee/') || path.includes('/user/')) {
      category = 'Users & Employees';
    } else if (path.includes('/api/dashboard') || path.includes('/dashboard/')) {
      category = 'Dashboard';
    } else if (path.includes('/report/') || path.includes('summary')) {
      category = 'Reports';
    } else if (path.includes('/login') || path.includes('/auth')) {
      category = 'Authentication';
    }
    
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    
    categories.get(category).push(endpoint);
  });
  
  return categories;
}

// Main function
async function main() {

  const endpoints = findApiEndpoints();

  
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Create main worksheet with all endpoints
  const mainWs = XLSX.utils.json_to_sheet(endpoints);
  
  // Set column widths for main sheet
  const mainColWidths = [
    { wch: 40 }, // Endpoint
    { wch: 15 }, // Methods
    { wch: 50 }, // Description
    { wch: 60 }, // Files
    { wch: 10 }, // IsDynamic
    { wch: 70 }  // Context
  ];
  
  mainWs['!cols'] = mainColWidths;
  
  // Add main worksheet
  XLSX.utils.book_append_sheet(wb, mainWs, 'All API Endpoints');
  
  // Group endpoints by category and create separate sheets
  const categories = categorizeEndpoints(endpoints);
  
  categories.forEach((categoryEndpoints, category) => {
    if (categoryEndpoints.length > 0) {
      const categoryWs = XLSX.utils.json_to_sheet(categoryEndpoints);
      categoryWs['!cols'] = mainColWidths;
      XLSX.utils.book_append_sheet(wb, categoryWs, category);
    }
  });
  
  // Write to file
  XLSX.writeFile(wb, outputFile);

}

main().catch(error => {
  console.error('Error generating Excel file:', error);
  process.exit(1);
}); 