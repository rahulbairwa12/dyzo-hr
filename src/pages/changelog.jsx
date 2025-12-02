import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import changelogData from "../data/changelog.json";
import DyzoLogo from "../assets/images/logo/dyzo-ai-logo.png";
import { updateUserVersion, getCurrentAppVersion } from "../services/versionService";
import { Helmet } from "react-helmet-async";

export default function Changelog() {
  const [selectedVersion, setSelectedVersion] = useState(changelogData[0]);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const userInfo = useSelector((state) => state.auth.user);
  
  // State for section visibility
  const [expandedSections, setExpandedSections] = useState({
    features: true,
    improvements: true,
    bugFixes: true
  });

  // State for individual item descriptions
  const [expandedItems, setExpandedItems] = useState({});

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Track version when user visits changelog page
  useEffect(() => {
    const trackVersionVisit = async () => {
      if (userInfo?._id) {
        try {
          const currentVersion = getCurrentAppVersion();
          await updateUserVersion(userInfo._id, 'web-task-app', currentVersion);

        } catch (error) {
          console.error('Error tracking version visit:', error);
        }
      }
    };

    trackVersionVisit();
  }, [userInfo?._id]);

  // Handle URL parameter changes and auto-navigate to latest version
  useEffect(() => {
    const versionParam = searchParams.get('version');
    
    if (versionParam) {
      // If version parameter exists, try to find and select that version
      const version = changelogData.find(v => v.version === versionParam);
      if (version) {
        setSelectedVersion(version);
      } else {
        // If version parameter exists but is invalid, redirect to latest version
        const latestVersion = changelogData[0];
        setSelectedVersion(latestVersion);
        setSearchParams({ version: latestVersion.version }, { replace: true });
      }
    } else {
      // If no version parameter, automatically navigate to latest version
      const latestVersion = changelogData[0];
      setSelectedVersion(latestVersion);
      setSearchParams({ version: latestVersion.version }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Function to handle version selection and update URL
  const handleVersionSelect = (version) => {
    setSelectedVersion(version);
    setSearchParams({ version: version.version });
  };

  // Function to scroll to a specific section
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }
  };

  // Function to toggle section visibility
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Function to toggle individual item description
  const toggleItemDescription = (section, index) => {
    const key = `${section}-${index}`;
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Helper function to check if item has description
  const hasDescription = (item) => {
    return typeof item === 'object' && item.description;
  };

  // Helper function to get item title
  const getItemTitle = (item) => {
    return typeof item === 'object' ? item.title : item;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTotalChanges = (version) => {
    const bugFixes = version.bugFixes?.length || 0;
    const improvements = version.improvements?.length || 0;
    const features = version.features?.length || 0;
    return bugFixes + improvements + features;
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
      <Helmet>
        <title>Dyzo v{selectedVersion.version} Changelog | What's New</title>
        <meta
          name="description"
          content={`Explore the latest Dyzo updates — version ${selectedVersion.version} released on ${formatDate(
            selectedVersion.date
          )}. See new features, improvements, and bug fixes.`}
        />
        <meta property="og:title" content={`Dyzo v${selectedVersion.version} Changelog`} />
        <meta
          property="og:url"
          content={`https://dyzo.ai/changelog?version=${selectedVersion.version}`}
        />
        <link
          rel="canonical"
          href={`https://dyzo.ai/changelog?version=${selectedVersion.version}`}
        />
      </Helmet>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="mx-auto px-4 sm:px-6 lg:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link to="/dashboard" className="flex items-center space-x-2 sm:space-x-3">
                <img src={DyzoLogo} alt="Dyzo Logo" className="h-6 sm:h-8 w-auto" />
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Dyzo Release Notes</h1>
              </Link>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-500">
              <Link to="/dashboard" className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
                <Icon icon="mdi:home" className="text-sm" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <Icon icon="mdi:chevron-right" className="text-xs" />
              <span className="text-gray-700 hidden sm:inline">Changelog</span>
              <Icon icon="mdi:chevron-right" className="text-xs" />
              <span className="text-blue-600 font-medium">v{selectedVersion.version}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex flex-col lg:flex-row">
        {/* Left Sidebar */}
        <div className="w-full lg:w-72 bg-white border-r-0 lg:border-r border-gray-200 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-4 pt-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Icon icon="mdi:history" className="text-lg text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Release History</h2>
            </div>
            <div className="space-y-2">
              {changelogData.map((version, index) => (
                <button
                  key={version.version}
                  onClick={() => handleVersionSelect(version)}
                  className={`w-full text-left p-3 sm:p-2 rounded-lg border transition-all duration-200 hover:shadow-md group ${selectedVersion.version === version.version ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-gray-50/50 border-gray-200 hover:border-blue-200 hover:bg-blue-50/30'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className='font-bold text-base text-gray-900'>
                        v{version.version}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{formatDate(version.date)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-medium">{getTotalChanges(version)} changes</span>
                    <div className="flex items-center space-x-1">
                      {version.features?.length > 0 && (
                        <div className="flex items-center space-x-1 text-blue-600">
                          <Icon icon="mdi:rocket-launch-outline" className="text-xs" />
                          <span className="text-xs font-semibold">{version.features.length}</span>
                        </div>
                      )}
                      {version.improvements?.length > 0 && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <Icon icon="mdi:progress-wrench" className="text-xs" />
                          <span className="text-xs font-semibold">{version.improvements.length}</span>
                        </div>
                      )}
                      {version.bugFixes?.length > 0 && (
                        <div className="flex items-center space-x-1 text-red-600">
                          <Icon icon="mdi:bug-outline" className="text-xs" />
                          <span className="text-xs font-semibold">{version.bugFixes.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 bg-white">
          <div className="p-4 sm:p-6 pt-6">
            {/* Version Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Icon icon="mdi:rocket-launch-outline" className="text-xl text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Dyzo {selectedVersion.version}</h1>
                  <p className="text-gray-600">Released on {formatDate(selectedVersion.date)}</p>
                </div>
              </div>

              {/* Overview Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                {selectedVersion.features && selectedVersion.features.length > 0 && (
                  <div 
                    className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-2xl border border-blue-200  transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                    onClick={() => scrollToSection('features-section')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-200/60 flex items-center justify-center">
                          <Icon icon="mdi:rocket-launch-outline" className="text-blue-700 text-lg sm:text-2xl" />
                        </div>
                        <span className="font-semibold text-blue-900 text-base sm:text-lg">New Features</span>
                        </div>
                      <div className="flex items-center space-x-2">
                        <p className="text-xl sm:text-2xl leading-none font-extrabold text-blue-700">{selectedVersion.features.length}</p>
                        <Icon icon="mdi:chevron-right" className="text-blue-600 text-base sm:text-lg" />
                      </div>
                    </div>
                  </div>
                )}

                {selectedVersion.improvements && selectedVersion.improvements.length > 0 && (
                  <div 
                    className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-2xl border border-green-200  transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                    onClick={() => scrollToSection('improvements-section')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-200/60 flex items-center justify-center">
                          <Icon icon="mdi:progress-wrench" className="text-green-700 text-lg sm:text-2xl" />
                        </div>
                        <span className="font-semibold text-green-900 text-base sm:text-lg">Improvements</span>
                        </div>
                      <div className="flex items-center space-x-2">
                        <p className="text-xl sm:text-2xl leading-none font-extrabold text-green-700">{selectedVersion.improvements.length}</p>
                        <Icon icon="mdi:chevron-right" className="text-green-600 text-base sm:text-lg" />
                      </div>
                    </div>
                  </div>
                )}

                {selectedVersion.bugFixes && selectedVersion.bugFixes.length > 0 && (
                  <div 
                    className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-2xl border border-red-200  transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                    onClick={() => scrollToSection('bugfixes-section')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-red-200/60 flex items-center justify-center">
                          <Icon icon="mdi:bug-outline" className="text-red-700 text-lg sm:text-2xl" />
                        </div>
                        <span className="font-semibold text-red-900 text-base sm:text-lg">Bug Fixes</span>
                        </div>
                      <div className="flex items-center space-x-2">
                        <p className="text-xl sm:text-2xl leading-none font-extrabold text-red-700">{selectedVersion.bugFixes.length}</p>
                        <Icon icon="mdi:chevron-right" className="text-red-600 text-base sm:text-lg" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Release Notes Content */}
            <div className="space-y-8">
              {/* New Features */}
              {selectedVersion.features && selectedVersion.features.length > 0 && (
                <section id="features-section">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Icon icon="mdi:rocket-launch-outline" className="text-blue-600 text-lg sm:text-2xl" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">New Features</h2>
                    </div>
                    <button
                      onClick={() => toggleSection('features')}
                      className="flex items-center space-x-2 px-2 sm:px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Icon 
                        icon={expandedSections.features ? "mdi:chevron-up" : "mdi:chevron-down"} 
                        className="text-blue-600 text-sm sm:text-base transition-transform duration-200" 
                      />
                    </button>
                  </div>
                  {expandedSections.features && (
                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                      {selectedVersion.features.map((feature, index) => {
                        const itemKey = `features-${index}`;
                        const isExpanded = expandedItems[itemKey];
                        const hasDesc = hasDescription(feature);
                        
                        return (
                          <div key={index} className="bg-blue-50/50 rounded-xl border border-blue-200 hover:bg-blue-100/50 transition-all duration-200 hover:shadow-sm">
                            <div 
                              className={`flex items-start space-x-3 p-4 ${hasDesc ? 'cursor-pointer' : ''}`}
                              onClick={hasDesc ? () => toggleItemDescription('features', index) : undefined}
                            >
                        <Icon icon="mdi:plus" className="text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-gray-700 leading-relaxed font-medium text-sm sm:text-base">
                                  {getItemTitle(feature)}
                                </p>
                                {hasDesc && (
                                  <div className="mt-2 flex items-center space-x-2 text-blue-600">
                                    <Icon 
                                      icon={isExpanded ? "mdi:chevron-up" : "mdi:chevron-down"} 
                                      className="text-sm transition-transform duration-200" 
                                    />
                                    <span className="text-xs sm:text-sm font-medium">
                                      {isExpanded ? 'Hide details' : 'Show details'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {hasDesc && (
                              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                              }`}>
                                <div className="px-4 pb-4 pt-0">
                                  <div className="pl-6 border-l-2 border-blue-200">
                                    <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
                                      {feature.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                      </div>
                        );
                      })}
                  </div>
                  )}
                </section>
              )}

              {/* Improvements */}
              {selectedVersion.improvements && selectedVersion.improvements.length > 0 && (
                <section id="improvements-section">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Icon icon="mdi:progress-wrench" className="text-green-600 text-lg sm:text-2xl" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Improvements</h2>
                    </div>
                    <button
                      onClick={() => toggleSection('improvements')}
                      className="flex items-center space-x-2 px-2 sm:px-3 py-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                    >
                      <Icon 
                        icon={expandedSections.improvements ? "mdi:chevron-up" : "mdi:chevron-down"} 
                        className="text-green-600 text-sm sm:text-base transition-transform duration-200" 
                      />
                    </button>
                  </div>
                  {expandedSections.improvements && (
                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                      {selectedVersion.improvements.map((improvement, index) => {
                        const itemKey = `improvements-${index}`;
                        const isExpanded = expandedItems[itemKey];
                        const hasDesc = hasDescription(improvement);
                        
                        return (
                          <div key={index} className="bg-green-50/50 rounded-xl border border-green-200 hover:bg-green-100/50 transition-all duration-200 hover:shadow-sm">
                            <div 
                              className={`flex items-start space-x-3 p-4 ${hasDesc ? 'cursor-pointer' : ''}`}
                              onClick={hasDesc ? () => toggleItemDescription('improvements', index) : undefined}
                            >
                        <Icon icon="mdi:arrow-up" className="text-green-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-gray-700 leading-relaxed font-medium text-sm sm:text-base">
                                  {getItemTitle(improvement)}
                                </p>
                                {hasDesc && (
                                  <div className="mt-2 flex items-center space-x-2 text-green-600">
                                    <Icon 
                                      icon={isExpanded ? "mdi:chevron-up" : "mdi:chevron-down"} 
                                      className="text-sm transition-transform duration-200" 
                                    />
                                    <span className="text-xs sm:text-sm font-medium">
                                      {isExpanded ? 'Hide details' : 'Show details'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {hasDesc && (
                              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                              }`}>
                                <div className="px-4 pb-4 pt-0">
                                  <div className="pl-6 border-l-2 border-green-200">
                                    <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
                                      {improvement.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                      </div>
                        );
                      })}
                  </div>
                  )}
                </section>
              )}

              {/* Bug Fixes */}
              {selectedVersion.bugFixes && selectedVersion.bugFixes.length > 0 && (
                <section id="bugfixes-section">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <Icon icon="mdi:bug-outline" className="text-red-600 text-lg sm:text-2xl" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Bug Fixes</h2>
                    </div>
                    <button
                      onClick={() => toggleSection('bugFixes')}
                      className="flex items-center space-x-2 px-2 sm:px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Icon 
                        icon={expandedSections.bugFixes ? "mdi:chevron-up" : "mdi:chevron-down"} 
                        className="text-red-600 text-sm sm:text-base transition-transform duration-200" 
                      />
                    </button>
                  </div>
                  {expandedSections.bugFixes && (
                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                      {selectedVersion.bugFixes.map((bugFix, index) => {
                        const itemKey = `bugFixes-${index}`;
                        const isExpanded = expandedItems[itemKey];
                        const hasDesc = hasDescription(bugFix);
                        
                        return (
                          <div key={index} className="bg-red-50/50 rounded-xl border border-red-200 hover:bg-red-100/50 transition-all duration-200 hover:shadow-sm">
                            <div 
                              className={`flex items-start space-x-3 p-4 ${hasDesc ? 'cursor-pointer' : ''}`}
                              onClick={hasDesc ? () => toggleItemDescription('bugFixes', index) : undefined}
                            >
                        <Icon icon="mdi:check" className="text-red-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-gray-700 leading-relaxed font-medium text-sm sm:text-base">
                                  {getItemTitle(bugFix)}
                                </p>
                                {hasDesc && (
                                  <div className="mt-2 flex items-center space-x-2 text-red-600">
                                    <Icon 
                                      icon={isExpanded ? "mdi:chevron-up" : "mdi:chevron-down"} 
                                      className="text-sm transition-transform duration-200" 
                                    />
                                    <span className="text-xs sm:text-sm font-medium">
                                      {isExpanded ? 'Hide details' : 'Show details'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {hasDesc && (
                              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                              }`}>
                                <div className="px-4 pb-4 pt-0">
                                  <div className="pl-6 border-l-2 border-red-200">
                                    <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
                                      {bugFix.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                      </div>
                        );
                      })}
                  </div>
                  )}
                </section>
              )}
            </div>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
              <p>© 2025 Dyzo – All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
