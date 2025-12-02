import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';

/**
 * Dynamic Endpoint Component
 * Renders API endpoint documentation dynamically from backend data
 */
const DynamicEndpoint = ({ endpoint, category }) => {
  const [copiedId, setCopiedId] = useState(null);
  const [activeTab, setActiveTab] = useState({});

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Syntax highlighting for JSON
  const formatJSON = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  // Method color mapping with HTTP status codes
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

  // Syntax-highlighted JSON code block
  const SyntaxHighlightedJSON = ({ code }) => {
    const formatted = formatJSON(code);
    
    return (
      <pre className="text-sm leading-relaxed overflow-x-auto">
        <code className="language-json">
          {formatted.split('\n').map((line, i) => (
            <div key={i} className="flex">
              <span className="select-none text-slate-600 pr-4 text-right w-10 flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-slate-300 font-mono">
                {line.split(/("[^"]*"|\d+|true|false|null|[{}[\],:])/g).map((part, j) => {
                  if (part.startsWith('"') && part.endsWith('"')) {
                    // Property keys (with colon after)
                    if (line.includes(part + ':')) {
                      return <span key={j} className="text-sky-400">{part}</span>;
                    }
                    // String values
                    return <span key={j} className="text-emerald-400">{part}</span>;
                  } else if (/^\d+$/.test(part)) {
                    // Numbers
                    return <span key={j} className="text-purple-400">{part}</span>;
                  } else if (part === 'true' || part === 'false') {
                    // Booleans
                    return <span key={j} className="text-amber-400">{part}</span>;
                  } else if (part === 'null') {
                    // Null
                    return <span key={j} className="text-rose-400">{part}</span>;
                  } else if (['{', '}', '[', ']', ',', ':'].includes(part)) {
                    // Syntax
                    return <span key={j} className="text-slate-500">{part}</span>;
                  }
                  return <span key={j}>{part}</span>;
                })}
              </span>
            </div>
          ))}
        </code>
      </pre>
    );
  };

  // cURL code generation
  const generateCURL = (method, url, requestPayload) => {
    const baseUrl = 'https://api.dyzo.ai';
    let curl = `curl -X ${method} "${baseUrl}${url}" \\\n`;
    curl += `  -H "Authorization: Bearer YOUR_API_KEY" \\\n`;
    curl += `  -H "Content-Type: application/json"`;
    
    if (requestPayload && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      curl += ` \\\n  -d '${formatJSON(requestPayload)}'`;
    }
    
    return curl;
  };

  // EndpointCard Component with enhanced design
  const EndpointCard = ({ method, url, title, description, requestPayload, responsePayload, methodId }) => {
    const [viewMode, setViewMode] = useState('request');
    
    return (
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

        {/* Tab Navigation */}
        <div className="bg-slate-900/50 border-b border-slate-700/50">
          <div className="flex items-center">
            {requestPayload && (
              <button
                onClick={() => setViewMode('request')}
                className={`px-4 py-3 text-sm font-semibold transition-all relative ${
                  viewMode === 'request'
                    ? 'text-blue-400 bg-slate-800/50'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
                }`}
              >
                <Icon icon="heroicons:arrow-up-tray" className="inline h-4 w-4 mr-2" />
                Request
                {viewMode === 'request' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></div>
                )}
              </button>
            )}
            {responsePayload && (
              <button
                onClick={() => setViewMode('response')}
                className={`px-4 py-3 text-sm font-semibold transition-all relative ${
                  viewMode === 'response'
                    ? 'text-emerald-400 bg-slate-800/50'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
                }`}
              >
                <Icon icon="heroicons:arrow-down-tray" className="inline h-4 w-4 mr-2" />
                Response
                {viewMode === 'response' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400"></div>
                )}
              </button>
            )}
            <button
              onClick={() => setViewMode('curl')}
              className={`px-4 py-3 text-sm font-semibold transition-all relative ${
                viewMode === 'curl'
                  ? 'text-amber-400 bg-slate-800/50'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
              }`}
            >
              <Icon icon="heroicons:terminal" className="inline h-4 w-4 mr-2" />
              cURL
              {viewMode === 'curl' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400"></div>
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-slate-950/50">
          {/* Request Body */}
          {viewMode === 'request' && requestPayload && (
            <div>
              <div className="flex items-center justify-between px-4 py-3 bg-slate-900/50 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-mono rounded border border-blue-500/30">
                    JSON
                  </span>
                  <span className="text-xs font-semibold text-slate-400">Request Body</span>
                </div>
                <button
                  onClick={() => copyToClipboard(requestPayload, `req-${methodId}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors border border-slate-700"
                >
                  <Icon 
                    icon={copiedId === `req-${methodId}` ? "heroicons:check" : "heroicons:clipboard-document"} 
                    className="h-3.5 w-3.5" 
                  />
                  {copiedId === `req-${methodId}` ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="p-4 overflow-x-auto">
                <SyntaxHighlightedJSON code={requestPayload} />
              </div>
            </div>
          )}

          {/* Response */}
          {viewMode === 'response' && responsePayload && (
            <div>
              <div className="flex items-center justify-between px-4 py-3 bg-slate-900/50 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-mono rounded border border-emerald-500/30">
                    JSON
                  </span>
                  <span className="text-xs font-semibold text-slate-400">Response (200 OK)</span>
                </div>
                <button
                  onClick={() => copyToClipboard(responsePayload, `res-${methodId}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors border border-slate-700"
                >
                  <Icon 
                    icon={copiedId === `res-${methodId}` ? "heroicons:check" : "heroicons:clipboard-document"} 
                    className="h-3.5 w-3.5" 
                  />
                  {copiedId === `res-${methodId}` ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="p-4 overflow-x-auto">
                <SyntaxHighlightedJSON code={responsePayload} />
              </div>
            </div>
          )}

          {/* cURL */}
          {viewMode === 'curl' && (
            <div>
              <div className="flex items-center justify-between px-4 py-3 bg-slate-900/50 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-mono rounded border border-amber-500/30">
                    bash
                  </span>
                  <span className="text-xs font-semibold text-slate-400">cURL Command</span>
                </div>
                <button
                  onClick={() => copyToClipboard(generateCURL(method, url, requestPayload), `curl-${methodId}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors border border-slate-700"
                >
                  <Icon 
                    icon={copiedId === `curl-${methodId}` ? "heroicons:check" : "heroicons:clipboard-document"} 
                    className="h-3.5 w-3.5" 
                  />
                  {copiedId === `curl-${methodId}` ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="p-4 overflow-x-auto">
                <pre className="text-sm font-mono text-amber-300 leading-relaxed">
                  {generateCURL(method, url, requestPayload)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Enhanced Overview Card
  const OverviewCard = () => (
    <div className="border border-slate-700/50 rounded-lg overflow-hidden bg-gradient-to-br from-slate-900/80 to-slate-800/50 shadow-xl">
      <div className="bg-slate-900/80 border-b border-slate-700/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
            <Icon icon="heroicons:information-circle" className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">API Overview</h3>
            <p className="text-xs text-slate-400">Capabilities and features</p>
          </div>
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        <div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {endpoint.overview.description}
          </p>
        </div>
        
        {endpoint.overview.capabilities && endpoint.overview.capabilities.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Icon icon="heroicons:check-badge" className="h-4 w-4 text-emerald-400" />
              Key Features
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {endpoint.overview.capabilities.map((capability, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2.5 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-colors">
                  <Icon icon="heroicons:check-circle" className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-300">{capability}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // If endpoint has no methods, just show overview
  if (!endpoint.methods || endpoint.methods.length === 0) {
    return (
      <div className="space-y-6">
        {endpoint.overview && <OverviewCard />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* API Overview */}
      {endpoint.overview && <OverviewCard />}

      {/* Render Methods */}
      {endpoint.methods.map((methodData, idx) => (
        <div key={methodData.id || idx} id={methodData.id} className="scroll-mt-20">
          <EndpointCard
            method={methodData.method}
            url={methodData.url}
            title={methodData.title}
            description={methodData.description}
            requestPayload={methodData.requestPayload}
            responsePayload={methodData.responsePayload}
            methodId={methodData.id || idx}
          />
        </div>
      ))}
    </div>
  );
};

export default DynamicEndpoint;

