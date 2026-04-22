import { useState, useEffect } from 'react';
import { EndpointCard } from '../components/EndpointCard';
import {
  OpenAPISchema,
  PathItem,
  Operation,
  Parameter,
  SchemaObject,
  ExecState,
  methodColors,
  getExample,
} from '../Interfaces';

const SwaggerView: React.FC = () => {
  const [spec, setSpec] = useState<OpenAPISchema | null>(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [execStates, setExecStates] = useState<Record<string, ExecState>>({});
  const [baseUrl, setBaseUrl] = useState('');
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('darkMode', darkMode.toString());
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

  const loadFromPath = async (path: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error('Failed to load spec');
      const data = await res.json();
      setSpec(data);
      setBaseUrl(data.servers?.[0]?.url || '');
      setUrl(path);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load spec');
    } finally {
      setLoading(false);
    }
  };

  const loadSpec = async (specUrl: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(specUrl);
      if (!res.ok) throw new Error('Failed to fetch spec');
      const data = await res.json();
      setSpec(data);
      setBaseUrl(data.servers?.[0]?.url || '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load spec');
    } finally {
      setLoading(false);
    }
  };

  const loadDemo = () => {
    const demoSpec: OpenAPISchema = {
      openapi: '3.0.0',
      info: {
        title: 'The Enchanted Story API 🦄',
        version: '1.0.0',
        description: 'A magical API for weaving and sharing stories.',
      },
      servers: [{ url: 'https://api.storyapp.io/v1', description: 'Production Server' }],
      tags: [
        { name: 'Getting Started', description: 'Begin your journey ✨' },
        { name: 'Stories', description: 'Create, read, update, and share 📖' },
        { name: 'Collections', description: 'Group related stories 📚' },
      ],
      paths: {
        '/stories': {
          get: {
            tags: ['Stories'],
            summary: 'Browse all your stories 📚',
            description: 'Fetch a list of all your stories with pagination.',
            parameters: [
              { name: 'limit', in: 'query', description: 'Maximum stories to return' },
              { name: 'offset', in: 'query', description: 'Number of stories to skip' },
            ],
            responses: {
              '200': { description: 'Here are your stories ✨' },
              '401': { description: 'You need to sign in first 🔐' },
            },
          },
          post: {
            tags: ['Stories'],
            summary: 'Create a new story ✨',
            description: 'Begin a new journey by creating your first story.',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  example: { title: 'My First Chapter', content: 'It was a dark and stormy night...', status: 'draft' },
                },
              },
            },
            responses: {
              '201': { description: 'Your story has been created ✨' },
              '400': { description: 'Something went wrong 😢' },
            },
          },
        },
        '/stories/{storyId}': {
          get: {
            tags: ['Stories'],
            summary: 'Read a specific story 📖',
            description: 'Retrieve a single story by its unique ID.',
            parameters: [
              { name: 'storyId', in: 'path', required: true, description: 'The unique ID of the story' },
            ],
            responses: {
              '200': { description: 'Here is your story 📄' },
              '404': { description: 'This story doesn\'t exist 🤔' },
            },
          },
          put: {
            tags: ['Stories'],
            summary: 'Update a story ✏️',
            description: 'Revise an existing story.',
            parameters: [
              { name: 'storyId', in: 'path', required: true, description: 'The unique ID of the story' },
            ],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  example: { title: 'Revised Title', content: 'Updated content here...' },
                },
              },
            },
            responses: {
              '200': { description: 'Your changes have been saved 💾' },
              '404': { description: 'Story not found 😢' },
            },
          },
          delete: {
            tags: ['Stories'],
            summary: 'Delete a story 🗑️',
            description: 'Permanently delete a story.',
            parameters: [
              { name: 'storyId', in: 'path', required: true, description: 'The unique ID of the story' },
            ],
            responses: {
              '204': { description: 'The story has been removed 🌀' },
              '404': { description: 'Nothing to remove here 🤔' },
            },
          },
        },
        '/collections': {
          get: {
            tags: ['Collections'],
            summary: 'Browse all collections 📚',
            description: 'See all the collections you have created.',
            responses: {
              '200': { description: 'Here are your collections 🎨' },
            },
          },
          post: {
            tags: ['Collections'],
            summary: 'Create a new collection 📁',
            description: 'Start a new collection to group your stories.',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  example: { name: 'Summer Memories', description: 'Stories from our vacation' },
                },
              },
            },
            responses: {
              '201': { description: 'A new collection is born 🎉' },
            },
          },
        },
        '/upload': {
          post: {
            tags: ['Stories'],
            summary: 'Upload a story file 📎',
            description: 'Upload a story file to import it.',
            requestBody: {
              required: true,
              content: {
                'multipart/form-data': {
                  schema: {
                    type: 'object',
                    properties: {
                      file: { type: 'string', format: 'binary', description: 'Your story file' },
                      title: { type: 'string', description: 'Optional title' },
                    },
                    required: ['file'],
                  },
                },
              },
            },
            responses: {
              '200': { description: 'Your story has been imported ✨' },
              '400': { description: 'Could not read the file 😢' },
            },
          },
        },
      },
      components: {
        schemas: {
          Story: {
            type: 'object',
            required: ['title', 'content'],
            properties: {
              id: { type: 'integer' },
              title: { type: 'string', example: 'My Amazing Story' },
              content: { type: 'string', example: 'Once upon a time...' },
              status: { type: 'string', enum: ['draft', 'published', 'archived'] },
            },
          },
        },
      },
    };
    setSpec(demoSpec);
    setBaseUrl('https://api.storyapp.io/v1');
  };

  const getExecState = (key: string): ExecState => {
    return execStates[key] || { params: {}, body: '', file: null, loading: false, response: null };
  };

  const setExecState = (key: string, state: Partial<ExecState>) => {
    setExecStates(prev => ({ ...prev, [key]: { ...getExecState(key), ...state } }));
  };

  const execute = async (path: string, method: string, operation: Operation, key: string) => {
    const state = getExecState(key);
    const serverUrl = baseUrl || 'https://api.example.com';
    let finalUrl = serverUrl + path;

    Object.entries(state.params).forEach(([param, value]) => {
      if (value) {
        finalUrl = finalUrl.replace(`{${param}}`, encodeURIComponent(value));
        if (!finalUrl.includes(`{${param}}`)) {
          finalUrl += (finalUrl.includes('?') ? '&' : '?') + `${param}=${encodeURIComponent(value)}`;
        }
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
      if (state.file) {
        formData.append('file', state.file);
      }
      if (state.body) {
        try {
          const jsonBody = JSON.parse(state.body);
          Object.entries(jsonBody).forEach(([k, v]) => {
            if (k !== 'file' && v !== undefined) {
              formData.append(k, String(v));
            }
          });
        } catch {}
      }
      options.body = formData;
    } else if (isJsonMethod) {
      const requestBody = state.body || JSON.stringify(getExample(operation), null);
      if (requestBody && requestBody !== '{}') {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = requestBody;
      }
    }

    try {
      const res = await fetch(finalUrl, options);
      let body: unknown = null;
      try { body = await res.json(); } catch { body = await res.text(); }

      setExecState(key, {
        loading: false,
        response: { status: res.status, statusText: res.statusText, body, time: Date.now() - startTime },
      });
    } catch (e) {
      setExecState(key, {
        loading: false,
        response: { status: 0, statusText: e instanceof Error ? e.message : 'Request failed', body: null, time: Date.now() - startTime },
      });
    }
  };

  const getExample = (operation: Operation): unknown => {
    const content = operation.requestBody?.content;
    const types = ['application/json', 'multipart/form-data', 'application/x-www-form-urlencoded'];
    for (const type of types) {
      const body = content?.[type];
      if (body?.example) return body.example;
      if (body?.schema?.example) return body.schema.example;
      if (body?.schema?.properties) {
        const obj: Record<string, unknown> = {};
        Object.entries(body.schema.properties).forEach(([key, prop]) => {
          if (prop.example) obj[key] = prop.example;
          else if (prop.enum?.length) obj[key] = prop.enum[0];
          else if (prop.type === 'integer') obj[key] = 0;
          else if (prop.type === 'boolean') obj[key] = false;
          else if (prop.type === 'array') obj[key] = [];
          else obj[key] = '';
        });
        return obj;
      }
    }
    return {};
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
      } catch {
        setError('Invalid JSON file');
      }
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

  return (
    <>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <button
          onClick={toggleDarkMode}
          className="fixed top-4 right-4 p-3 w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors z-50 cursor-pointer"
          aria-label="Toggle dark mode"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-gray-900 dark:text-white tracking-tight">
              API Documentation 📚
            </h1>
            <p className="text-xl text-gray-500 dark:text-gray-400 mb-8 max-w-xl mx-auto leading-relaxed">
              Your complete guide to integrating with our magical platform 🌟
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-lg mx-auto">
              <input
                type="text"
                placeholder="Paste your OpenAPI URL here..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="flex-1 px-5 py-4 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4D76C6] focus:border-transparent outline-none"
              />
              <button
                onClick={() => loadSpec(url)}
                disabled={!url || loading}
                className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Loading...' : 'Load Spec'}
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-4">
              <label className="cursor-pointer px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm">
                Upload file
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
              <span className="text-gray-400 dark:text-gray-500">or</span>
              <button
                onClick={() => loadFromPath('/swagger/swagger.json')}
                disabled={loading}
                className="text-gray-600 dark:text-gray-300 hover:text-[#4D76C6] text-sm"
              >
                Load demo file
              </button>
            </div>

            <button
              onClick={loadDemo}
              className="mt-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline underline-offset-4"
            >
              Or explore with our demo
            </button>

            {error && <p className="mt-4 text-rose-600 dark:text-rose-400">{error}</p>}
          </div>

          {spec && (
            <article className="space-y-16">
              <header className="text-center mb-16">
                <p className="text-sm uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
                  {spec.info.version}
                </p>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-4">
                  {spec.info.title}
                </h2>
                {spec.info.description && (
                  <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    {spec.info.description}
                  </p>
                )}
                <div className="mt-6 flex justify-center">
                  <input
                    type="text"
                    placeholder="Base URL"
                    value={baseUrl}
                    onChange={e => setBaseUrl(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm w-full sm:w-64"
                  />
                </div>
              </header>

              {(spec.tags || []).map(tag => (
                <section key={tag.name} className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2">
                      {tag.name}
                    </h3>
                    {tag.description && (
                      <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
                        {tag.description}
                      </p>
                    )}
                  </div>
                  <div className="space-y-4">
                    {grouped[tag.name]?.map(({ path, method, operation }, idx) => (
                      <EndpointCard
                        key={`${path}-${method}-${idx}`}
                        path={path}
                        method={method}
                        operation={operation}
                        idx={idx}
                        getExecState={getExecState}
                        setExecState={(key, state) => setExecState(key, state)}
                        execute={execute}
                        expandedEndpoints={expandedEndpoints}
                        toggleEndpoint={toggleEndpoint}
                      />
                    ))}
                  </div>
                </section>
              ))}

              {(!spec.tags || spec.tags.length === 0) && (
                <section className="space-y-4">
                  {grouped.other.map(({ path, method, operation }, idx) => (
                    <EndpointCard
                      key={`${path}-${method}-${idx}-untagged`}
                      path={path}
                      method={method}
                      operation={operation}
                      idx={idx}
                      getExecState={getExecState}
                      setExecState={(key, state) => setExecState(key, state)}
                      execute={execute}
                      expandedEndpoints={expandedEndpoints}
                      toggleEndpoint={toggleEndpoint}
                    />
                  ))}
                </section>
              )}
            </article>
          )}

          {!spec && !loading && !error && (
            <div className="text-center py-20">
              <p className="text-xl text-gray-400 dark:text-gray-500">
                Load a spec above to explore the documentation.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SwaggerView;