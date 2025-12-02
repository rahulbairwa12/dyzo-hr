import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Swal from 'sweetalert2';
import DyzoLogo from '@/assets/images/logo/dyzo-ai-logo.png';

const DeveloperDashboard = () => {
  const navigate = useNavigate();
  const [developer, setDeveloper] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [stats, setStats] = useState({ totalKeys: 0, activeKeys: 0, totalRequests: 0 });
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);
  const [visibleKeys, setVisibleKeys] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('developer_token');
    const developerData = localStorage.getItem('developer_user');
    
    if (!token || !developerData) {
      navigate('/developer');
      return;
    }
    
    try {
      const parsedDeveloper = JSON.parse(developerData);
      setDeveloper(parsedDeveloper);
      fetchAPIKeys(parsedDeveloper._id, token);
    } catch (error) {
      navigate('/developer');
    }
  }, [navigate]);

  const fetchAPIKeys = async (developerId, token) => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_APP_DJANGO}/developer/api-keys/${developerId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      
      if (data.status === 1) {
        setApiKeys(data.api_keys || []);
        setStats({
          totalKeys: data.total_keys || 0,
          activeKeys: data.active_keys || 0,
          totalRequests: data.api_keys?.reduce((sum, key) => sum + (key.total_requests || 0), 0) || 0
        });
      }
    } catch (error) {
      setApiKeys([]);
      setStats({ totalKeys: 0, activeKeys: 0, totalRequests: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAPIKey = async () => {
    const { value: formValues } = await Swal.fire({
      title: '< Create API Key />',
      html: `
        <div style="text-align: left; padding: 8px;">
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-weight: 600; font-size: 13px; color: #9ca3af; margin-bottom: 8px; font-family: monospace;">
              Name
            </label>
            <input 
              id="key-name" 
              style="width: 100%; padding: 10px 12px; background: #1f2937; border: 1px solid #374151; border-radius: 6px; font-size: 14px; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;"
              placeholder="Production API Key" 
              required
            >
          </div>
          
          <div>
            <label style="display: block; font-weight: 600; font-size: 13px; color: #9ca3af; margin-bottom: 8px; font-family: monospace;">
              Description <span style="color: #6b7280; font-weight: 400;">(optional)</span>
            </label>
            <textarea 
              id="key-description" 
              style="width: 100%; padding: 10px 12px; background: #1f2937; border: 1px solid #374151; border-radius: 6px; font-size: 14px; min-height: 80px; resize: vertical; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;"
              placeholder="What will this key be used for?"
            ></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Create key',
      cancelButtonText: 'Cancel',
      background: '#111827',
      color: '#ffffff',
      customClass: {
        popup: 'swal-developer-modern',
        confirmButton: 'swal-confirm-developer',
        cancelButton: 'swal-cancel-developer'
      },
      buttonsStyling: false,
      width: '480px',
      didOpen: () => {
        const style = document.createElement('style');
        style.textContent = `
          .swal-developer-modern {
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border: 1px solid #374151;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          .swal-developer-modern .swal2-title {
            font-size: 18px;
            font-weight: 600;
            color: #ffffff;
            padding: 20px 24px 12px;
            font-family: monospace;
          }
          .swal-developer-modern .swal2-html-container {
            padding: 0 24px 20px;
            margin: 0;
          }
          .swal-developer-modern .swal2-actions {
            padding: 0 24px 24px;
            gap: 8px;
          }
          .swal-confirm-developer {
            background: #10b981 !important;
            color: white !important;
            border: none !important;
            padding: 10px 20px !important;
            border-radius: 6px !important;
            font-weight: 500 !important;
            font-size: 14px !important;
          }
          .swal-confirm-developer:hover {
            background: #059669 !important;
          }
          .swal-cancel-developer {
            background: #1f2937 !important;
            color: #9ca3af !important;
            border: 1px solid #374151 !important;
            padding: 10px 20px !important;
            border-radius: 6px !important;
            font-weight: 500 !important;
            font-size: 14px !important;
          }
          .swal-cancel-developer:hover {
            background: #374151 !important;
            color: #ffffff !important;
          }
        `;
        document.head.appendChild(style);
      },
      preConfirm: () => {
        const name = document.getElementById('key-name').value;
        const description = document.getElementById('key-description').value;
        
        if (!name || name.trim() === '') {
          Swal.showValidationMessage('Please enter a name for the API key');
          return false;
        }
        
        return { name: name.trim(), description: description.trim() };
      }
    });

    if (!formValues) return;

    try {
      const token = localStorage.getItem('developer_token');
      const response = await fetch(`${import.meta.env.VITE_APP_DJANGO}/developer/api-keys/${developer._id}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formValues)
      });

      const data = await response.json();

      if (data.status === 1) {
        const apiKeyValue = data.api_key.key;
        
        await Swal.fire({
          html: `
            <div style="padding: 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="width: 48px; height: 48px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h3 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 6px 0;">✓ API Key Created</h3>
                <p style="color: #9ca3af; font-size: 14px; margin: 0;">Your key has been generated successfully</p>
              </div>

              <div style="margin-bottom: 20px;">
                <div style="display: flex; padding: 10px 14px; background: rgba(31, 41, 55, 0.5); border: 1px solid #374151; border-radius: 6px; margin-bottom: 6px;">
                  <span style="color: #9ca3af; font-size: 13px; min-width: 80px; font-family: monospace;">Name</span>
                  <span style="color: #ffffff; font-size: 13px; font-weight: 500;">${data.api_key.name}</span>
                </div>
                ${data.api_key.description ? `
                <div style="display: flex; padding: 10px 14px; background: rgba(31, 41, 55, 0.5); border: 1px solid #374151; border-radius: 6px; margin-bottom: 6px;">
                  <span style="color: #9ca3af; font-size: 13px; min-width: 80px; font-family: monospace;">Description</span>
                  <span style="color: #ffffff; font-size: 13px; font-weight: 500;">${data.api_key.description}</span>
                </div>
                ` : ''}
                <div style="display: flex; padding: 10px 14px; background: rgba(31, 41, 55, 0.5); border: 1px solid #374151; border-radius: 6px;">
                  <span style="color: #9ca3af; font-size: 13px; min-width: 80px; font-family: monospace;">Created</span>
                  <span style="color: #ffffff; font-size: 13px; font-weight: 500;">${new Date(data.api_key.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>

              <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <label style="color: #ffffff; font-size: 13px; font-weight: 600; font-family: monospace;">API Key</label>
                  <button id="copyKeyBtn" style="background: #1f2937; border: 1px solid #374151; color: #9ca3af; padding: 6px 12px; border-radius: 6px; font-size: 13px; cursor: pointer; display: flex; align-items: center; font-weight: 500; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="9" y="9" width="13" height="13" rx="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span>Copy</span>
                  </button>
                </div>
                <div style="background: rgba(0, 0, 0, 0.3); border: 1px solid #374151; border-radius: 6px; padding: 14px;">
                  <code style="color: #10b981; font-family: 'Monaco', monospace; font-size: 12px; word-break: break-all; line-height: 1.6;">${data.api_key.key}</code>
                </div>
              </div>

              <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 6px; padding: 14px; display: flex; gap: 10px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" style="flex-shrink: 0; margin-top: 2px;">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <div>
                  <p style="color: #fbbf24; font-size: 13px; font-weight: 600; margin: 0 0 4px 0;">Make sure to copy your API key</p>
                  <p style="color: #d97706; font-size: 12px; margin: 0; line-height: 1.5;">You won't be able to see it again.</p>
                </div>
              </div>
            </div>
          `,
          showConfirmButton: true,
          confirmButtonText: 'Done',
          background: '#111827',
          color: '#ffffff',
          customClass: {
            popup: 'swal-success-developer',
            confirmButton: 'swal-confirm-developer'
          },
          buttonsStyling: false,
          width: '500px',
          padding: 0,
          didOpen: () => {
            const style = document.createElement('style');
            style.textContent = `
              .swal-success-developer {
                border-radius: 12px;
                border: 1px solid #374151;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
              }
              .swal-success-developer .swal2-html-container { margin: 0; padding: 0; }
              .swal-success-developer .swal2-actions { padding: 0 32px 32px; }
              #copyKeyBtn:hover {
                background: #374151 !important;
                color: #ffffff !important;
              }
            `;
            document.head.appendChild(style);
            
            // Add copy button functionality
            const copyBtn = document.getElementById('copyKeyBtn');
            if (copyBtn) {
              copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(apiKeyValue);
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = `
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span style="color: #10b981;">Copied</span>
                `;
                setTimeout(() => {
                  copyBtn.innerHTML = originalHTML;
                }, 2000);
              });
            }
          }
        });
        
        const token = localStorage.getItem('developer_token');
        fetchAPIKeys(developer._id, token);
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: '⚠ Error',
        text: 'Failed to create API key',
        background: '#111827',
        color: '#ffffff',
        confirmButtonColor: '#dc2626',
        customClass: {
          popup: 'swal-developer-modern'
        }
      });
    }
  };

  const handleDeleteAPIKey = async (keyId, keyName) => {
    const result = await Swal.fire({
      title: '⚠ Delete API Key?',
      text: `Are you sure you want to delete "${keyName}"? This action cannot be undone.`,
      icon: 'warning',
      background: '#111827',
      color: '#ffffff',
      showCancelButton: true,
      confirmButtonText: 'Delete Key',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'swal-developer-modern',
        confirmButton: 'swal-delete-developer',
        cancelButton: 'swal-cancel-developer'
      },
      buttonsStyling: false,
      didOpen: () => {
        const style = document.createElement('style');
        style.textContent = `
          .swal-delete-developer {
            background: #dc2626 !important;
            color: white !important;
            border: none !important;
            padding: 10px 20px !important;
            border-radius: 6px !important;
            font-weight: 500 !important;
            font-size: 14px !important;
          }
          .swal-delete-developer:hover {
            background: #b91c1c !important;
          }
        `;
        document.head.appendChild(style);
      }
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem('developer_token');
      const response = await fetch(`${import.meta.env.VITE_APP_DJANGO}/developer/api-keys/${developer._id}/${keyId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.status === 1) {
        Swal.fire({ 
          icon: 'success', 
          title: '✓ Deleted Successfully', 
          text: 'API key has been removed',
          timer: 2000, 
          showConfirmButton: false,
          background: '#111827',
          color: '#ffffff',
          customClass: {
            popup: 'swal-developer-modern'
          }
        });
        fetchAPIKeys(developer._id, token);
      }
    } catch (error) {
      Swal.fire({ 
        icon: 'error', 
        title: '⚠ Error', 
        text: 'Failed to delete API key',
        background: '#111827',
        color: '#ffffff',
        confirmButtonColor: '#dc2626',
        customClass: {
          popup: 'swal-developer-modern'
        }
      });
    }
  };

  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleKeyVisibility = (keyId) => {
    setVisibleKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const handleLogout = () => {
    localStorage.removeItem('developer_token');
    localStorage.removeItem('developer_refresh_token');
    localStorage.removeItem('developer_user');
    navigate('/developer');
  };

  if (loading || !developer) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-950/50 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src={DyzoLogo} alt="Dyzo" className="h-8 w-auto" />
              <div className="h-6 w-px bg-gray-700"></div>
              <div>
                <h1 className="text-lg font-semibold text-white font-mono">&lt;/&gt; Developer Portal</h1>
                <p className="text-xs text-gray-500 font-mono">{developer.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/api-documentation')}
                className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white text-sm font-medium transition-colors border border-gray-700 hover:border-gray-600 rounded-lg"
              >
                <Icon icon="heroicons:book-open" className="w-4 h-4" />
                Docs
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-red-400 text-sm font-medium transition-colors border border-gray-700 hover:border-red-500/50 rounded-lg"
              >
                <Icon icon="heroicons:arrow-right-on-rectangle" className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1 font-mono">Total Keys</p>
                <p className="text-3xl font-semibold text-white">{stats.totalKeys}</p>
              </div>
              <div className="w-10 h-10 bg-green-500/10 border border-green-500/30 rounded flex items-center justify-center">
                <Icon icon="heroicons:key" className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1 font-mono">Active Keys</p>
                <p className="text-3xl font-semibold text-white">{stats.activeKeys}</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/30 rounded flex items-center justify-center">
                <Icon icon="heroicons:bolt" className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1 font-mono">API Requests</p>
                <p className="text-3xl font-semibold text-white">{stats.totalRequests.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/30 rounded flex items-center justify-center">
                <Icon icon="heroicons:chart-bar" className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg mb-8">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white font-mono">&lt; API Keys /&gt;</h2>
            <button
              onClick={handleCreateAPIKey}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500 transition-colors"
            >
              <Icon icon="heroicons:plus" className="w-4 h-4" />
              Create Key
            </button>
          </div>

          {apiKeys.length === 0 ? (
            <div className="text-center py-12">
              <Icon icon="heroicons:key" className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No API keys yet</p>
              <p className="text-gray-500 text-xs mt-1">Create your first key to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
                      API Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
                      Requests
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
                      Last Used
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {apiKeys.map((apiKey) => (
                    <tr key={apiKey.id} className="hover:bg-gray-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Icon icon="heroicons:key" className="w-4 h-4 text-green-400" />
                          <div>
                            <div className="text-sm font-medium text-white">{apiKey.name}</div>
                            {apiKey.description && (
                              <div className="text-xs text-gray-500 mt-0.5">{apiKey.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-black/30 border border-gray-700 rounded px-2 py-1">
                            <code className="text-xs font-mono text-green-400">
                              {visibleKeys[apiKey.id] 
                                ? apiKey.key 
                                : `${apiKey.key.substring(0, 12)}...${apiKey.key.substring(apiKey.key.length - 8)}`
                              }
                            </code>
                          </div>
                          <button
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                            className="p-1 hover:bg-gray-700 rounded transition-colors"
                            title={visibleKeys[apiKey.id] ? "Hide key" : "Show key"}
                          >
                            <Icon 
                              icon={visibleKeys[apiKey.id] ? "heroicons:eye-slash" : "heroicons:eye"} 
                              className="w-4 h-4 text-gray-400 hover:text-white" 
                            />
                          </button>
                          <button
                            onClick={() => handleCopyKey(apiKey.key)}
                            className="p-1 hover:bg-gray-700 rounded transition-colors"
                            title="Copy to clipboard"
                          >
                            <Icon 
                              icon={copiedKey === apiKey.key ? "heroicons:check" : "heroicons:clipboard-document"} 
                              className="w-4 h-4 text-gray-400 hover:text-white" 
                            />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {apiKey.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium rounded-full">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-700 text-gray-400 text-xs font-medium rounded-full">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300 font-mono">
                          {apiKey.total_requests?.toLocaleString() || 0}
                        </div>
                        <div className="text-xs text-gray-500">total calls</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-400 font-mono">
                          {new Date(apiKey.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-400 font-mono">
                          {apiKey.last_used_at 
                            ? new Date(apiKey.last_used_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })
                            : 'Never'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteAPIKey(apiKey.id, apiKey.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors border border-transparent hover:border-red-500/30 text-sm font-medium"
                        >
                          <Icon icon="heroicons:trash" className="w-4 h-4" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Getting Started Guide - Show only if no API keys */}
        {apiKeys.length === 0 && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg mb-8">
            <div className="px-8 py-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white mb-2 font-mono">&lt; Getting Started /&gt;</h2>
              <p className="text-base text-gray-300">
                Welcome to the Dyzo Developer Portal! Our APIs give you programmatic access to project management, 
                team collaboration, and time tracking features.
              </p>
            </div>

            <div className="p-8">
              {/* Quick Steps */}
              <div className="space-y-6 mb-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center text-base font-bold text-green-400 font-mono">
                    01
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white mb-2">Create an API Key</h3>
                    <p className="text-base text-gray-300 leading-relaxed">
                      Click "Create Key" above to generate your first API key. Give it a descriptive name to identify its purpose.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center text-base font-bold text-green-400 font-mono">
                    02
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white mb-2">Make Your First Request</h3>
                    <p className="text-base text-gray-300 mb-4 leading-relaxed">
                      Use your API key in the Authorization header. Here's a quick example:
                    </p>
                    <div className="bg-black/30 border border-gray-700 rounded-lg p-4 overflow-x-auto">
                      <code className="text-sm text-green-400 font-mono leading-loose">
                        <span className="text-blue-400">curl</span> https://api.dyzo.com/api/tasks/ \<br />
                        {'  '}-H <span className="text-yellow-300">"Authorization: Bearer YOUR_API_KEY"</span> \<br />
                        {'  '}-H <span className="text-yellow-300">"Content-Type: application/json"</span>
                      </code>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center text-base font-bold text-green-400 font-mono">
                    03
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white mb-2">Explore the Documentation</h3>
                    <p className="text-base text-gray-300 leading-relaxed">
                      Check out our comprehensive API documentation for detailed endpoints, request/response formats, and examples.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="border-t border-gray-700 pt-6">
                <p className="text-base font-semibold text-white mb-4 font-mono">// Quick Links</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => navigate('/api-documentation')}
                    className="flex items-center gap-3 px-5 py-4 bg-gray-900/50 border border-gray-700 rounded-lg hover:border-green-500/50 hover:bg-gray-900/70 transition-all text-left group"
                  >
                    <Icon icon="heroicons:book-open" className="w-6 h-6 text-green-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-base font-medium text-white mb-0.5">API Documentation</p>
                      <p className="text-sm text-gray-400">Complete reference</p>
                    </div>
                  </button>
                  
                  <div className="flex items-center gap-3 px-5 py-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                    <Icon icon="heroicons:shield-check" className="w-6 h-6 text-blue-400" />
                    <div>
                      <p className="text-base font-medium text-white mb-0.5">Secure & Reliable</p>
                      <p className="text-sm text-gray-400">JWT-based auth</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 px-5 py-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                    <Icon icon="heroicons:bolt" className="w-6 h-6 text-purple-400" />
                    <div>
                      <p className="text-base font-medium text-white mb-0.5">Fast Response</p>
                      <p className="text-sm text-gray-400">Average &lt;100ms</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API Documentation Section */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white font-mono">&lt; API Documentation /&gt;</h2>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Documentation CTA */}
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="heroicons:book-open" className="w-5 h-5 text-green-400" />
                    <h3 className="text-base font-semibold text-white">
                      Complete API Documentation
                    </h3>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed mb-3">
                    Explore our comprehensive API documentation with detailed endpoints, request/response examples, and authentication guides.
                  </p>
                  
                  {/* Quick Stats */}
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-300">
                      <Icon icon="heroicons:check-badge" className="w-4 h-4 text-green-400" />
                      <span className="font-mono">19 API Categories</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-300">
                      <Icon icon="heroicons:code-bracket" className="w-4 h-4 text-blue-400" />
                      <span className="font-mono">Code Examples</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-300">
                      <Icon icon="heroicons:rocket-launch" className="w-4 h-4 text-purple-400" />
                      <span className="font-mono">Quick Start</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => navigate('/api-documentation')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500 transition-colors whitespace-nowrap"
                >
                  View Documentation
                  <Icon icon="heroicons:arrow-right" className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Security Best Practices */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Icon icon="heroicons:shield-check" className="w-5 h-5 text-green-400" />
                <h3 className="text-sm font-semibold text-white font-mono">
                  Security Best Practices
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Never share API keys publicly or commit to Git',
                  'Store keys in environment variables',
                  'Use HTTPS only - never send over HTTP',
                  'Rotate keys periodically for security',
                  'Use different keys per environment',
                  'Monitor "Last Used" for unusual activity',
                  'Delete unused keys immediately',
                  'Keep API keys out of client-side code'
                ].map((practice, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 bg-gray-900/30 border border-gray-700 rounded hover:border-gray-600 transition-colors">
                    <Icon icon="heroicons:check-circle" className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{practice}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DeveloperDashboard;
