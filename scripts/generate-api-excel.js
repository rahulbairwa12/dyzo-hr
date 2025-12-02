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
const outputFile = path.join(__dirname, '../api-endpoints.xlsx');
const apiDocsFile = path.join(__dirname, '../API_DOCUMENTATION.md');

// Patterns to search for API calls
const apiPatterns = [
  /\.get\(['"]([^'"]*)['"]/g,
  /\.post\(['"]([^'"]*)['"]/g,
  /\.put\(['"]([^'"]*)['"]/g,
  /\.delete\(['"]([^'"]*)['"]/g,
  /\.patch\(['"]([^'"]*)['"]/g,
  /fetchGET\(['"]([^'"]*)['"]/g,
  /fetchPOST\(['"]([^'"]*)['"]/g,
  /fetchAuthPost\(['"]([^'"]*)['"]/g,
  /fetchAuthGET\(['"]([^'"]*)['"]/g,
  /fetchAPI\(['"]([^'"]*)['"]/g,
  /fetchAPIOption\(['"]([^'"]*)['"]/g,
  /fetchAuthAPI\(['"]([^'"]*)['"]/g,
  /apiRequest\(\{[^}]*endpoint:\s*['"]([^'"]*)['"]/g,
  /useGet\(['"]([^'"]*)['"]/g, 
  /usePost\(['"]([^'"]*)['"]/g,
  /usePut\(['"]([^'"]*)['"]/g,
  /useDelete\(['"]([^'"]*)['"]/g,
  /usePatch\(['"]([^'"]*)['"]/g,
];

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

// Function to scan files for API endpoints
function findApiEndpoints() {
  const endpoints = new Map();
  const apiDocs = readApiDocs();
  
  // Find all JS/JSX/TS/TSX files
  const command = `find ${srcDirectory} -type f -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx"`;
  const files = execSync(command).toString().split('\n').filter(Boolean);
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(path.join(__dirname, '..'), file);
      
      // Check each API pattern
      apiPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const endpoint = match[1].trim();
          if (endpoint && !endpoint.includes('${')) { // Skip dynamic endpoints for simplicity
            if (!endpoints.has(endpoint)) {
              endpoints.set(endpoint, {
                endpoint,
                files: new Set(),
                methods: new Set(),
                description: ''
              });
            }
            
            // Add file to the list
            endpoints.get(endpoint).files.add(relativePath);
            
            // Try to determine HTTP method from the pattern
            const patternStr = pattern.toString();
            if (patternStr.includes('.get') || patternStr.includes('GET') || patternStr.includes('useGet')) {
              endpoints.get(endpoint).methods.add('GET');
            } else if (patternStr.includes('.post') || patternStr.includes('POST') || patternStr.includes('usePost')) {
              endpoints.get(endpoint).methods.add('POST');
            } else if (patternStr.includes('.put') || patternStr.includes('PUT') || patternStr.includes('usePut')) {
              endpoints.get(endpoint).methods.add('PUT');
            } else if (patternStr.includes('.delete') || patternStr.includes('DELETE') || patternStr.includes('useDelete')) {
              endpoints.get(endpoint).methods.add('DELETE');
            } else if (patternStr.includes('.patch') || patternStr.includes('PATCH') || patternStr.includes('usePatch')) {
              endpoints.get(endpoint).methods.add('PATCH');
            }
            
            // Add description from API docs if available
            if (apiDocs[endpoint]) {
              const methods = Array.from(endpoints.get(endpoint).methods);
              for (const method of methods) {
                if (apiDocs[endpoint][method]) {
                  endpoints.get(endpoint).description = apiDocs[endpoint][method];
                  break;
                }
              }
            }
          }
        }
      });
    } catch (error) {
      console.error(`Error processing file ${file}:`, error.message);
    }
  });
  
  // Convert to array for Excel processing
  return Array.from(endpoints.values()).map(({endpoint, files, methods, description}) => ({
    Endpoint: endpoint,
    Methods: Array.from(methods).join(', '),
    Description: description,
    Files: Array.from(files).join(', ')
  }));
}

// Main function
async function main() {

  const endpoints = findApiEndpoints();

  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(endpoints);
  
  // Set column widths
  const colWidths = [
    { wch: 40 }, // Endpoint
    { wch: 15 }, // Methods
    { wch: 50 }, // Description
    { wch: 60 }  // Files
  ];
  
  ws['!cols'] = colWidths;
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'API Endpoints');
  
  // Write to file
  XLSX.writeFile(wb, outputFile);

}

main().catch(error => {
  console.error('Error generating Excel file:', error);
  process.exit(1);
}); 