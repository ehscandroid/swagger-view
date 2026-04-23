import { useState, useEffect } from 'react';
import { EndpointCard } from '../components/EndpointCard';
import { OpenAPISchema, Operation, ExecState, getExample } from '../Interfaces';

const SwaggerView: React.FC = () => {
  const [spec, setSpec] = useState<OpenAPISchema | null>(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [execStates, setExecStates] = useState<Record<string, ExecState>>({});
  const [baseUrl, setBaseUrl] = useState('');
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    document.body.className = darkMode ? 'bg-gray-800' : 'bg-gray-100';
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);
  const toggleEndpoint = (key: string) => {
    setExpandedEndpoints(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const fetchSpec = async (specUrl: string) => {
    const isExternal = specUrl.startsWith('http://') || specUrl.startsWith('https://');
    const fetchUrl = isExternal ? `/api/${specUrl}` : specUrl;
    const res = await fetch(fetchUrl);
    if (!res.ok) throw new Error('Failed to fetch spec');
    return await res.json();
  };

  const loadSpec = async (specUrl: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchSpec(specUrl);
      setSpec(data);
      setBaseUrl(data.servers?.[0]?.url || '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load spec');
    } finally {
      setLoading(false);
    }
  };

  const loadFromPath = async (path: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchSpec(path);
      setSpec(data);
      setBaseUrl(data.servers?.[0]?.url || '');
      setUrl(path);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load spec');
    } finally {
      setLoading(false);
    }
  };

  const loadDemo = () => {
    const demoSpec: OpenAPISchema = {
      openapi: '3.0.0',
      info: { title: 'The Enchanted Story API 🦄', version: '1.0.0', description: 'A magical API for weaving and sharing stories.' },
      servers: [{ url: 'https://api.storyapp.io/v1', description: 'Production Server' }],
      tags: [
        { name: 'Getting Started', description: 'Begin your journey ✨' },
        { name: 'Stories', description: 'Create, read, update, and share 📖' },
      ],
      paths: {
        '/stories': {
          get: { tags: ['Stories'], summary: 'Browse all your stories 📚', description: 'Fetch a list of all your stories with pagination.', responses: { '200': { description: 'Here are your stories ✨' } } },
          post: { tags: ['Stories'], summary: 'Create a new story ✨', description: 'Begin a new journey by creating your first story.', requestBody: { required: true, content: { 'application/json': { example: { title: 'My First Chapter', content: 'It was a dark and stormy night...', status: 'draft' } } } }, responses: { '201': { description: 'Your story has been created ✨' } } },
        },
        '/stories/{storyId}': {
          get: { tags: ['Stories'], summary: 'Read a specific story 📖', description: 'Retrieve a single story by its unique ID.', parameters: [{ name: 'storyId', in: 'path', required: true, description: 'The unique ID of the story' }], responses: { '200': { description: 'Here is your story 📄' } } },
        },
      },
    };
    setSpec(demoSpec);
    setBaseUrl('https://api.storyapp.io/v1');
  };

  const getExecState = (key: string): ExecState => execStates[key] || { params: {}, body: '', file: null, loading: false, response: null };
  const setExecState = (key: string, state: Partial<ExecState>) => setExecStates(prev => ({ ...prev, [key]: { ...getExecState(key), ...state } }));

  const execute = async (path: string, method: string, operation: Operation, key: string) => {
    const state = getExecState(key);
    const serverUrl = baseUrl || 'https://api.example.com';
    let finalUrl = serverUrl + path;
    Object.entries(state.params).forEach(([param, value]) => {
      if (value) {
        finalUrl = finalUrl.replace(`{${param}}`, encodeURIComponent(value));
        if (!finalUrl.includes(`{${param}}`)) finalUrl += (finalUrl.includes('?') ? '&' : '?') + `${param}=${encodeURIComponent(value)}`;
      }
    });
    setExecState(key, { loading: true });
    const startTime = Date.now();
    const isJsonMethod = ['post', 'put', 'patch'].includes(method.toLowerCase());
    const contentType = operation.requestBody?.content ? Object.keys(operation.requestBody.content)[0] : 'application/json';
    const isMultipart = contentType?.includes('multipart/form-data');
    const options: RequestInit = { method: method.toUpperCase() };
    if (isMultipart) {
      const formData = new FormData();
      if (state.file) formData.append('file', state.file);
      if (state.body) { try { JSON.parse(state.body).forEach(([k, v]) => { if (k !== 'file' && v !== undefined) formData.append(k, String(v)); }); } catch { } }
      options.body = formData;
    } else if (isJsonMethod) {
      const requestBody = state.body || JSON.stringify(getExample(operation));
      if (requestBody && requestBody !== '{}') { options.headers = { 'Content-Type': 'application/json' }; options.body = requestBody; }
    }
    try {
      const res = await fetch(finalUrl, options);
      let body: unknown = null;
      try { body = await res.json(); } catch { body = await res.text(); }
      setExecState(key, { loading: false, response: { status: res.status, statusText: res.statusText, body, time: Date.now() - startTime } });
    } catch (e) {
      setExecState(key, { loading: false, response: { status: 0, statusText: e instanceof Error ? e.message : 'Request failed', body: null, time: Date.now() - startTime } });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        setSpec(data);
        setBaseUrl(data.servers?.[0]?.url || '');
        setUrl(file.name);
      } catch { setError('Invalid JSON file'); }
    };
    reader.readAsText(file);
  };

  const groupByTag = () => {
    const grouped: Record<string, { path: string; method: string; operation: Operation }[]> = { other: [] };
    if (!spec?.paths) return grouped;
    Object.entries(spec.paths).forEach(([path, pathItem]) => {
      Object.entries(pathItem).forEach(([method, operation]) => {
        if (method === 'parameters') return;
        const op = operation as Operation;
        const operationTag = op.tags?.[0] || 'other';
        if (!grouped[operationTag]) grouped[operationTag] = [];
        grouped[operationTag].push({ path, method, operation: op });
      });
    });
    return grouped;
  };

  const grouped = groupByTag();
  const bg = darkMode ? 'bg-gray-800' : 'bg-gray-100';
  const bg2 = darkMode ? 'bg-gray-800' : 'bg-white';
  const text = darkMode ? 'text-white' : 'text-gray-900';
  const text2 = darkMode ? 'text-gray-300' : 'text-gray-600';
  const border = darkMode ? 'border-gray-700' : 'border-gray-200';

  const SideBar = () => {
    return (<aside className={`w-64 flex-shrink-0 flex flex-col ${bg2} ${text}`}>
      <nav className={`p-2 space-y-1 overflow-y-auto flex-1`}>
        <button onClick={() => setSelectedSection('')} className={`w-full text-left px-3 py-2 rounded-md transition-colors ${selectedSection === '' ? (darkMode ? 'bg-gray-700 font-medium' : 'bg-gray-200 font-medium') : (darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100')}`}>Overview</button>
        {spec && (spec.tags || []).map(tag => (
          <div key={tag.name}>
            <div className={`px-3 py-2 text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>{tag.name}</div>
            {Object.entries(spec.paths).map(([path, pathItem]) => {
              const methods = Object.entries(pathItem).filter(([m]) => m !== 'parameters' && (pathItem as Record<string, Operation>)[m]?.tags?.includes(tag.name));
              return methods.map(([method, operation]) => {
                const summary = (operation as Operation).summary || path;
                const key = `${path}::${method}`;
                return (
                  <button key={key} onClick={() => setSelectedSection(key)} className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${selectedSection === key ? (darkMode ? 'bg-gray-700 font-medium' : 'bg-gray-200 font-medium') : (darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100')}`}>
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${method === 'get' ? 'bg-blue-400' : method === 'post' ? 'bg-green-400' : method === 'put' ? 'bg-orange-400' : method === 'delete' ? 'bg-red-400' : 'bg-gray-400'}`} />
                    <span className="truncate">{summary.length > 20 ? summary.slice(0, 20) + '...' : summary}</span>
                  </button>
                );
              });
            })}
          </div>
        ))}
        {!spec?.tags && Object.entries(spec?.paths || {}).map(([path, pathItem]) => {
          const methods = Object.entries(pathItem).filter(([m]) => m !== 'parameters');
          return methods.map(([method, operation]) => {
            const summary = (operation as Operation).summary || path;
            const key = `${path}::${method}`;
            return (
              <button key={key} onClick={() => setSelectedSection(key)} className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${selectedSection === key ? (darkMode ? 'bg-gray-700 font-medium' : 'bg-gray-200 font-medium') : (darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100')}`}>
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${method === 'get' ? 'bg-blue-400' : method === 'post' ? 'bg-green-400' : method === 'put' ? 'bg-orange-400' : method === 'delete' ? 'bg-red-400' : 'bg-gray-400'}`} />
                <span className="truncate">{summary.length > 20 ? summary.slice(0, 20) + '...' : summary}</span>
              </button>
            );
          });
        })}
      </nav>
    </aside>)
  }

  const DarkModeToggle = () => {

    return (<button
      onClick={toggleDarkMode}
      className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${darkMode
        ? 'bg-gray-700 text-white hover:bg-gray-600'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
    >
      {darkMode ? '☀️' : '🌙'}
    </button>)
  }

  const UpsortedSVGSmall = () => {

    return (<button
      onClick={toggleDarkMode}
      className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${darkMode
        ? 'bg-gray-700 text-white hover:bg-gray-600'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
    >
      <svg width="48" height="48" version="1.1"  viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path className="fill-gray-400 dark:fill-gray-400" d="m24.128 5.2663v8.408e-4c-10.272-8.26e-5 -18.598 8.4051-18.598 18.774-0.085192 14.417 11.884 22.101 25.961 17.229 5.3743-1.546 3.5591-6.3083-0.11584-5.1986-14.999 6.0417-20.683-4.4561-20.909-12.03-3.67e-4 -7.7042 6.1283-13.95 13.69-13.95 6.2741 0.0024 12.256 4.0427 12.997 10.412 0.82673 3.1288-0.91666 9.4799-3.6329 7.5369-2.4055-3.3944-0.94503-5.8566-1.2019-9.8223-0.3473-3.3849-4.611-2.8937-4.7342 0.08183 0.13232 5.7302-0.57086 9.6725-3.3232 9.8888-4.0825-0.49856-2.8515-5.3682-3.1189-9.5983-0.05101-1.3896-1.1558-2.8008-2.5911-2.8008-1.4353 0-2.5904 1.1197-2.5904 2.5101-0.28976 4.4433-0.74476 11.937 3.7391 13.635 2.2219 1.0214 5.9792 1.3615 7.61-0.38732 1.1055-1.1852 1.5331-1.1276 3.2436 0.5385 1.7356 0.98047 3.0591 1.0905 4.8766 1.0661 6.974-1.4794 7.2961-8.6031 6.9496-12.676-1.1936-9.1068-9.2944-15.191-18.252-15.21z" />
      </svg>
    </button>)

  }

  const Header = () => {
  return (
    <header
      className={`h-16 flex items-center justify-between pl-3 pr-6 flex-shrink-0 ${bg2} ${border} border-b`} >
      <div className="flex items-center gap-3">
        <UpsortedSVGSmall />
        <h1 className={`text-lg font-semibold ${text}`}>
          Swagger View
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {spec && (
          <button
            onClick={() => setStartModalOpen(true)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
              darkMode
                ? 'bg-white text-gray-900 hover:bg-gray-200'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            New
          </button>
        )}

        <DarkModeToggle />
      </div>
    </header>
  );
};

  const Headers = () => {
    return (<header className={`h-16 flex items-center justify-between px-6 flex-shrink-0 ${bg2} ${border} border-b`}>
      <div />
      <div className="flex items-center gap-2">
        {spec && <button onClick={() => setStartModalOpen(true)} className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${darkMode ? 'bg-white text-gray-900 hover:bg-gray-200' : 'bg-gray-800 text-white hover:bg-gray-700'}`}>New</button>}
        <DarkModeToggle />
      </div>
    </header>)
  }

  const StartMode = () => {

    return (
      <div className="text-center py-20">
        <h2 className={`text-3xl font-bold mb-4 ${text}`}>Welcome to Swagger View</h2>
        <p className={`mb-8 ${text2}`}>Load an OpenAPI spec to explore the API documentation</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-lg mx-auto mb-6">
          <input type="text" placeholder="Paste your OpenAPI URL here..." value={url} onChange={e => setUrl(e.target.value)} className={`flex-1 px-5 py-3 rounded-lg border ${darkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none`} />
          <button onClick={() => loadSpec(url)} disabled={!url || loading} className={`px-6 py-3 rounded-lg font-medium hover:disabled:opacity-50 transition-colors ${darkMode ? 'bg-white text-gray-900 hover:bg-gray-200' : 'bg-gray-800 text-white hover:bg-gray-700'}`}>{loading ? 'Loading...' : 'Load Spec'}</button>
        </div>
        <div className="flex items-center justify-center gap-4">
          <label className={`cursor-pointer px-4 py-2 border rounded-lg transition-colors text-sm cursor-pointer ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}>Upload file<input type="file" accept=".json" onChange={handleFileUpload} className="hidden" /></label>
          <span className="text-gray-500">or</span>
          <button onClick={() => loadFromPath('/swagger/swagger.json')} disabled={loading} className={`hover:text-blue-400 text-sm ${text2}`}>Load demo file</button>
          <span className="text-gray-500">or</span>
          <button onClick={loadDemo} className={`hover:text-blue-400 text-sm ${text2}`}>Demo</button>
        </div>
        {error && <p className="mt-4 text-red-400">{error}</p>}
      </div>
    )
  }

  const StartModal = () => {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50"
        onClick={() => setStartModalOpen(false)}
      >
        <div
          className={`relative rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl ${bg2}`}
          onClick={(e) => e.stopPropagation()}
        >
          <StartMode />
          <button
            onClick={() => setStartModalOpen(false)}
            className={`absolute top-4 right-4 hover:${darkMode ? 'text-white' : 'text-gray-900'} ${text2}`}
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

return (
  <div className="flex flex-col min-h-screen overflow-x-hidden">
    {/* Header FULL WIDTH */}
    <Header />

    {/* Content BELOW header */}
    <div className="flex flex-1 overflow-hidden">
      {spec && <SideBar />}

      <main className={`flex-1 overflow-y-auto p-6 ${bg}`}>
        <div className="max-w-4xl mx-auto">
          {!spec && <StartMode />}

          {spec && selectedSection === '' && (
            <div className="space-y-8">
              <div className="text-center">
                <p className={`text-sm uppercase tracking-widest mb-2 ${text2}`}>
                  {spec.info.version}
                </p>
                <h2 className={`text-3xl font-bold mb-4 ${text}`}>
                  {spec.info.title}
                </h2>
                {spec.info.description && (
                  <p className={`max-w-2xl mx-auto ${text2}`}>
                    {spec.info.description}
                  </p>
                )}

                <div className="mt-4 flex justify-center">
                  <input
                    type="text"
                    placeholder="Base URL"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className={`px-4 py-2 rounded-lg border text-sm w-full sm:w-64 ${
                      darkMode
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(grouped).map(([tagName, endpoints]) => (
                  <div key={tagName}>
                    <h3 className={`text-xl font-bold mb-3 ${text}`}>
                      {tagName}
                    </h3>
                    <div className="space-y-3">
                      {endpoints.map(({ path, method, operation }, idx) => (
                        <EndpointCard
                          key={`${path}-${method}-${idx}`}
                          path={path}
                          method={method}
                          operation={operation}
                          idx={idx}
                          getExecState={getExecState}
                          setExecState={(k, s) => setExecState(k, s)}
                          execute={execute}
                          expandedEndpoints={expandedEndpoints}
                          toggleEndpoint={toggleEndpoint}
                          darkMode={darkMode}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {spec && selectedSection !== '' &&
            (() => {
              const [pathStr, methodStr] = selectedSection.split('::');
              const pathItem = spec.paths[pathStr];
              const operation = pathItem?.[methodStr] as Operation;
              if (!operation) return null;

              return (
                <EndpointCard
                  key={selectedSection}
                  path={pathStr}
                  method={methodStr}
                  operation={operation}
                  idx={0}
                  getExecState={getExecState}
                  setExecState={(k, s) => setExecState(k, s)}
                  execute={execute}
                  expandedEndpoints={expandedEndpoints}
                  toggleEndpoint={toggleEndpoint}
                  darkMode={darkMode}
                />
              );
            })()}
        </div>
      </main>
    </div>

    {startModalOpen && <StartModal />}
  </div>
);


  return (
    <div className="flex min-h-screen overflow-x-hidden">
      {spec && <SideBar />}
      <div className="flex flex-col flex-1">
        <Header />

        <main className={`flex-1 overflow-y-auto p-6 ${bg}`} style={{ minHeight: 'calc(100vh - 4rem)' }}>
          <div className="max-w-4xl mx-auto">
            {!spec && <StartMode />}

            {spec && selectedSection === '' && (
              <div className="space-y-8">
                <div className="text-center">
                  <p className={`text-sm uppercase tracking-widest mb-2 ${text2}`}>{spec.info.version}</p>
                  <h2 className={`text-3xl font-bold mb-4 ${text}`}>{spec.info.title}</h2>
                  {spec.info.description && <p className={`max-w-2xl mx-auto ${text2}`}>{spec.info.description}</p>}
                  <div className="mt-4 flex justify-center">
                    <input type="text" placeholder="Base URL" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} className={`px-4 py-2 rounded-lg border text-sm w-full sm:w-64 ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'}`} />
                  </div>
                </div>
                <div className="space-y-4">
                  {Object.entries(grouped).map(([tagName, endpoints]) => (
                    <div key={tagName}>
                      <h3 className={`text-xl font-bold mb-3 ${text}`}>{tagName}</h3>
                      <div className="space-y-3">
                        {endpoints.map(({ path, method, operation }, idx) => (
                          <EndpointCard key={`${path}-${method}-${idx}`} path={path} method={method} operation={operation} idx={idx} getExecState={getExecState} setExecState={(k, s) => setExecState(k, s)} execute={execute} expandedEndpoints={expandedEndpoints} toggleEndpoint={toggleEndpoint} darkMode={darkMode} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {spec && selectedSection !== '' && (() => {
              const [pathStr, methodStr] = selectedSection.split('::');
              const pathItem = spec.paths[pathStr];
              const operation = pathItem?.[methodStr] as Operation;
              if (!operation) return null;
              return <EndpointCard key={selectedSection} path={pathStr} method={methodStr} operation={operation} idx={0} getExecState={getExecState} setExecState={(k, s) => setExecState(k, s)} execute={execute} expandedEndpoints={expandedEndpoints} toggleEndpoint={toggleEndpoint} darkMode={darkMode} />;
            })()}
          </div>
        </main>
      </div>
      {startModalOpen && <StartModal />}
    </div>
  );
};

export default SwaggerView;