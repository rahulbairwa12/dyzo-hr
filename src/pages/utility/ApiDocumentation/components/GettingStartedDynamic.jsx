import React, { useState } from 'react';
import Icon from '@/components/ui/Icon';

/**
 * Dynamic Getting Started Component
 * Renders from backend documentation data
 */
const GettingStartedDynamic = ({ endpoint, documentation }) => {
  const [copiedCode, setCopiedCode] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Enhanced Code Block with Line Numbers
  const CodeBlock = ({ code, language, id }) => (
    <div className="border border-slate-700/50 rounded-lg overflow-hidden bg-slate-900/30">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/50 border-b border-slate-700/50">
        <span className={`px-2 py-0.5 text-xs font-mono rounded border ${
          language === 'cURL' || language === 'bash'
            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        }`}>
          {language}
        </span>
        <button
          onClick={() => copyToClipboard(code, id)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors border border-slate-700"
        >
          <Icon 
            icon={copiedCode === id ? "heroicons:check" : "heroicons:clipboard-document"} 
            className="h-3.5 w-3.5" 
          />
          {copiedCode === id ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="p-4 overflow-x-auto bg-slate-950/50">
        <pre className="text-sm leading-relaxed">
          <code>
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
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Section - Enhanced */}
      {endpoint?.overview && (
        <div className="border border-blue-700/30 rounded-lg overflow-hidden bg-gradient-to-br from-blue-900/30 to-purple-900/20 shadow-xl">
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-blue-700/30 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <Icon icon="heroicons:rocket-launch" className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{endpoint.overview.title}</h2>
                <p className="text-xs text-blue-300">Let's build something amazing</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-300 leading-relaxed">
              {endpoint.overview.description}
            </p>
          </div>
        </div>
      )}

      {/* Base URL - Enhanced */}
      {documentation?.baseUrl && (
        <div className="border border-slate-700/50 rounded-lg overflow-hidden bg-slate-900/30 shadow-xl">
          <div className="bg-slate-900/80 border-b border-slate-700/50 px-5 py-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/10 rounded border border-emerald-500/30">
                <Icon icon="heroicons:globe-alt" className="h-4 w-4 text-emerald-400" />
              </div>
              Base URL
            </h3>
          </div>
          <div className="p-4 bg-slate-950/50">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <code className="text-sm text-emerald-400 font-mono font-bold">{documentation.baseUrl}</code>
            </div>
            <p className="text-xs text-slate-400 mt-3 flex items-start gap-2">
              <Icon icon="heroicons:information-circle" className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
              <span>All API requests should be made to this base URL followed by the endpoint path.</span>
            </p>
          </div>
        </div>
      )}

      {/* Quick Start - Enhanced */}
      <div className="border border-slate-700/50 rounded-lg overflow-hidden bg-slate-900/30 shadow-xl">
        <div className="bg-slate-900/80 border-b border-slate-700/50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <Icon icon="heroicons:bolt" className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Quick Start Guide</h3>
              <p className="text-xs text-slate-400">Get up and running in 3 easy steps</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 text-white flex items-center justify-center font-bold shadow-lg">
              1
            </div>
            <div className="flex-1 pt-1">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Icon icon="heroicons:key" className="h-4 w-4 text-blue-400" />
                Get your API Key
              </h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Navigate to API Key Management and generate a new API key or use JWT authentication via login.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-500 text-white flex items-center justify-center font-bold shadow-lg">
              2
            </div>
            <div className="flex-1 pt-1">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Icon icon="heroicons:paper-airplane" className="h-4 w-4 text-emerald-400" />
                Make Your First Request
              </h4>
              <p className="text-sm text-slate-400 mb-3 leading-relaxed">
                Use your API key or JWT token to authenticate requests.
              </p>
              <CodeBlock 
                language="cURL"
                code={`curl -X GET "${documentation?.baseUrl || 'https://api.dyzo.ai'}/tasks/" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
                id="quick-start-curl"
              />
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-500 text-white flex items-center justify-center font-bold shadow-lg">
              3
            </div>
            <div className="flex-1 pt-1">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Icon icon="heroicons:book-open" className="h-4 w-4 text-purple-400" />
                Explore the Documentation
              </h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Browse through the sidebar to explore all available endpoints and their capabilities.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Capabilities - Enhanced */}
      {endpoint?.overview?.capabilities && endpoint.overview.capabilities.length > 0 && (
        <div className="border border-slate-700/50 rounded-lg overflow-hidden bg-slate-900/30 shadow-xl">
          <div className="bg-slate-900/80 border-b border-slate-700/50 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                <Icon icon="heroicons:star" className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">What You Can Build</h3>
                <p className="text-xs text-slate-400">Powerful features at your fingertips</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {endpoint.overview.capabilities.map((capability, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-emerald-500/30 hover:bg-slate-800/50 transition-all">
                  <Icon icon="heroicons:check-circle" className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-300">{capability}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error Codes - Enhanced */}
      {documentation?.errorCodes && (
        <div className="border border-slate-700/50 rounded-lg overflow-hidden bg-slate-900/30 shadow-xl">
          <div className="bg-slate-900/80 border-b border-slate-700/50 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/30">
                <Icon icon="heroicons:exclamation-triangle" className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Common Error Codes</h3>
                <p className="text-xs text-slate-400">Handle errors gracefully</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="space-y-2">
              {Object.entries(documentation.errorCodes).map(([code, description]) => (
                <div key={code} className="flex items-start gap-3 p-3 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-amber-500/30 transition-colors">
                  <code className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded border border-rose-500/30 whitespace-nowrap">
                    {code}
                  </code>
                  <span className="text-sm text-slate-400 flex-1">{description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Response Headers - Enhanced */}
      {documentation?.responseHeaders && (
        <div className="border border-slate-700/50 rounded-lg overflow-hidden bg-slate-900/30 shadow-xl">
          <div className="bg-slate-900/80 border-b border-slate-700/50 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <Icon icon="heroicons:information-circle" className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Important Response Headers</h3>
                <p className="text-xs text-slate-400">Track and debug API responses</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="space-y-2">
              {Object.entries(documentation.responseHeaders).map(([header, description]) => (
                <div key={header} className="flex items-start gap-3 p-3 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-blue-500/30 transition-colors">
                  <code className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded border border-sky-500/30 whitespace-nowrap">
                    {header}
                  </code>
                  <span className="text-sm text-slate-400 flex-1">{description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Next Steps - Enhanced */}
      <div className="border border-emerald-700/30 rounded-lg overflow-hidden bg-gradient-to-br from-emerald-900/20 to-blue-900/10 shadow-xl">
        <div className="bg-gradient-to-r from-emerald-900/50 to-blue-900/30 border-b border-emerald-700/30 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
              <Icon icon="heroicons:arrow-right-circle" className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Next Steps</h3>
              <p className="text-xs text-emerald-300">Continue your journey</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <ul className="space-y-3">
            <li className="flex items-start gap-3 p-3 bg-slate-950/30 rounded-lg border border-slate-700/50 hover:border-emerald-500/30 transition-all hover:bg-slate-900/50">
              <div className="flex-shrink-0 w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <Icon icon="heroicons:arrow-right" className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-sm text-slate-300">
                Explore the <strong className="text-white">Authentication</strong> section to learn about API Keys and JWT tokens
              </span>
            </li>
            <li className="flex items-start gap-3 p-3 bg-slate-950/30 rounded-lg border border-slate-700/50 hover:border-emerald-500/30 transition-all hover:bg-slate-900/50">
              <div className="flex-shrink-0 w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <Icon icon="heroicons:arrow-right" className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-sm text-slate-300">
                Check out <strong className="text-white">Projects</strong> and <strong className="text-white">Tasks</strong> APIs to start building
              </span>
            </li>
            <li className="flex items-start gap-3 p-3 bg-slate-950/30 rounded-lg border border-slate-700/50 hover:border-emerald-500/30 transition-all hover:bg-slate-900/50">
              <div className="flex-shrink-0 w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <Icon icon="heroicons:arrow-right" className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-sm text-slate-300">
                Review rate limits and error handling best practices
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GettingStartedDynamic;


