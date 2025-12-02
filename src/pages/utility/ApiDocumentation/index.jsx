import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import DyzoLogo from '@/assets/images/logo/dyzo-ai-logo.png';
import apiDocumentationService from '@/services/apiDocumentationService';
import DynamicEndpoint from './components/DynamicEndpoint';
import GettingStartedDynamic from './components/GettingStartedDynamic';
import AuthenticationAPI from './components/AuthenticationAPI';

const ApiDocumentation = () => {
  // Add custom scrollbar styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(15, 23, 42, 0.5);
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(71, 85, 105, 0.5);
        border-radius: 3px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(71, 85, 105, 0.8);
      }
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(71, 85, 105, 0.5) rgba(15, 23, 42, 0.5);
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('getting-started');
  const [activeSubSection, setActiveSubSection] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Dynamic documentation state
  const [documentation, setDocumentation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch API documentation on mount
  useEffect(() => {
    const fetchDocumentation = async () => {
      try {
        setLoading(true);
        const data = await apiDocumentationService.getDocumentation();
        const transformedData = apiDocumentationService.transformDocumentation(data);
        setDocumentation(transformedData);
        setError(null);
      } catch (err) {
        console.error('Failed to load API documentation:', err);
        setError('Failed to load documentation. Please try again later.');
      } finally {
        setLoading(false);
        setIsLoaded(true);
      }
    };

    fetchDocumentation();
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSubSection(sectionId);
    }
  };

  // Get sub-sections for active endpoint
  const getSubSections = (endpointId) => {
    if (!documentation) return [];
    
    for (const category of documentation.categories) {
      const endpoint = category.endpoints.find(ep => ep.id === endpointId);
      if (endpoint && endpoint.subSections) {
        return endpoint.subSections;
      }
    }
    return [];
  };

  // Build tabs from dynamic documentation
  const buildTabs = () => {
    if (!documentation) return [];

    const tabs = [];

    documentation.categories.forEach(category => {
      category.endpoints.forEach(endpoint => {
        tabs.push({
          id: endpoint.id,
          label: endpoint.label,
          icon: endpoint.icon,
          category: category.name,
          categoryId: category.id,
          hasSubSections: endpoint.hasSubSections || false,
          endpoint: endpoint
        });
      });
    });

    return tabs;
  };

  const tabs = buildTabs();
  const activeTabInfo = tabs.find(tab => tab.id === activeTab);

  // Group tabs by category
  const groupedTabs = documentation?.categories.map(category => ({
    id: category.id,
    name: category.name,
    icon: category.icon,
    tabs: tabs.filter(tab => tab.categoryId === category.id)
  })) || [];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading API Documentation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !documentation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Icon icon="heroicons:exclamation-triangle" className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Failed to Load Documentation</h2>
          <p className="text-slate-400 mb-4">{error || 'An unexpected error occurred'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
      {/* Header */}
      <div className="bg-slate-900/95 backdrop-blur-md shadow-2xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Title */}
            <div className="flex items-center gap-4">
              <img src={DyzoLogo} alt="Dyzo Logo" className="h-9 w-auto" />
              <div className="border-l border-slate-700 pl-4">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 text-lg font-bold tracking-tight">&lt;</span>
                  <h1 className="text-white text-lg font-bold tracking-tight">Dyzo API</h1>
                  <span className="text-emerald-400 text-lg font-bold tracking-tight">/&gt;</span>
                </div>
                <p className="text-xs text-slate-400 font-medium -mt-0.5">REST API Documentation</p>
              </div>
            </div>

            {/* Version + Actions */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/30">
                <Icon icon="heroicons:sparkles" className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">v{documentation.version}</span>
              </div>
              <button
                onClick={() => navigate('/developer/dashboard')}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-blue-600 text-white text-sm font-semibold rounded-lg hover:from-emerald-500 hover:to-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Icon icon="heroicons:key" className="h-4 w-4" />
                Get API Key
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-72 bg-slate-900/80 backdrop-blur-md border-r border-slate-700/50 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-6">
            {/* Sidebar Header */}
            <div className="pb-3 border-b border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-500/10 rounded border border-blue-500/30">
                  <Icon icon="heroicons:book-open" className="h-4 w-4 text-blue-400" />
                </div>
                <h2 className="text-sm font-bold text-white tracking-tight">
                  API Reference
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon icon="heroicons:clock" className="h-3 w-3 text-slate-500" />
                <p className="text-xs text-slate-500 font-medium">
                  Updated {new Date(documentation.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Navigation by Category */}
            {groupedTabs.map((group) => (
              <div key={group.id}>
                {/* Category Header */}
                <div className="mb-3 flex items-center gap-2 px-2">
                  <div className="p-1 bg-slate-800 rounded">
                    <Icon icon={group.icon} className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {group.name}
                  </h3>
                </div>

                {/* Category Tabs */}
                <div className="space-y-1.5">
                  {group.tabs.map((tab) => (
                    <div key={tab.id}>
                      <button
                        onClick={() => {
                          setActiveTab(tab.id);
                          if (!tab.hasSubSections) {
                            setActiveSubSection(null);
                          }
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden ${
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-emerald-600/20 to-blue-600/20 text-white border border-emerald-500/30 shadow-lg'
                            : 'bg-slate-800/30 text-slate-400 hover:bg-slate-800/60 hover:text-white border border-transparent hover:border-slate-700'
                        }`}
                      >
                        {activeTab === tab.id && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-blue-400"></div>
                        )}
                        <span className="font-semibold text-sm ml-1">{tab.label}</span>
                      </button>

                      {/* Sub-sections */}
                      {tab.hasSubSections && activeTab === tab.id && (
                        <div className="ml-3 mt-2 space-y-1 border-l-2 border-emerald-500/20 pl-3">
                          {getSubSections(tab.id).map((subSection) => (
                            <button
                              key={subSection.id}
                              onClick={() => scrollToSection(subSection.id)}
                              className={`w-full text-left px-3 py-2 rounded-md transition-all duration-200 group ${
                                activeSubSection === subSection.id
                                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-emerald-400 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Icon 
                                  icon="heroicons:chevron-right" 
                                  className={`h-3 w-3 transition-transform ${
                                    activeSubSection === subSection.id ? 'rotate-90' : ''
                                  }`} 
                                />
                                <span className="text-xs font-medium">{subSection.label}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto h-[calc(100vh-64px)] custom-scrollbar">
          <div className="max-w-5xl mx-auto">
            {/* Page Header */}
            <div className="mb-8 border-b border-slate-700/50 pb-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                      {activeTabInfo?.label || 'API Documentation'}
                    </h1>
                    <div className="px-2.5 py-1 bg-blue-500/10 rounded-md border border-blue-500/30">
                      <span className="text-xs font-bold text-blue-400">REST</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                    {documentation.description}
                  </p>
                </div>
                
                {/* Quick Stats */}
                <div className="hidden lg:flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-slate-500 font-medium">Base URL</div>
                    <code className="text-xs text-emerald-400 font-mono">api.dyzo.ai</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            {activeTab === 'getting-started' ? (
              <GettingStartedDynamic 
                endpoint={activeTabInfo?.endpoint}
                documentation={documentation}
              />
            ) : activeTab === 'authentication' ? (
              <AuthenticationAPI />
            ) : (
              <DynamicEndpoint 
                endpoint={activeTabInfo?.endpoint} 
                category={activeTabInfo?.categoryId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocumentation;

