import { useState } from 'react';
import { Operation, ExecState, methodColors, getExample } from '../Interfaces';

interface EndpointCardProps {
  path: string;
  method: string;
  operation: Operation;
  idx: number;
  getExecState: (key: string) => ExecState;
  setExecState: (key: string, state: Partial<ExecState>) => void;
  execute: (path: string, method: string, operation: Operation, key: string) => Promise<void>;
  expandedEndpoints: Set<string>;
  toggleEndpoint: (key: string) => void;
}

const JsonViewer: React.FC<{ data: unknown }> = ({ data }) => {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapse = (path: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderValue = (value: unknown, path: string, isLast: boolean): React.ReactNode => {
    if (value === null) return <span className="text-rose-400">null</span>;
    if (typeof value === 'boolean') return <span className="text-amber-400">{String(value)}</span>;
    if (typeof value === 'number') return <span className="text-blue-400">{String(value)}</span>;
    if (typeof value === 'string') return <span className="text-emerald-300">"{value}"</span>;

    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-gray-400">[]</span>;
      const isCollapsed = collapsed.has(path);
      return (
        <span>
          <button onClick={() => toggleCollapse(path)} className="text-gray-400 hover:text-gray-300 mr-1 text-xs">
            {isCollapsed ? '▶' : '▼'}
          </button>
          <span className="text-gray-500">[{isCollapsed ? '...' : ''}</span>
          {!isCollapsed && value.map((item, i) => (
            <div key={i} className="ml-4 pl-2 border-l border-gray-600">
              {renderValue(item, `${path}[${i}]`, i === value.length - 1)}
              {i < value.length - 1 && <span className="text-gray-500">,</span>}
            </div>
          ))}
          <span className="text-gray-500">]{!isCollapsed && !isLast && ','}</span>
        </span>
      );
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>);
      if (entries.length === 0) return <span className="text-gray-400">{'{}'}</span>;
      const isCollapsed = collapsed.has(path);
      return (
        <span>
          <button onClick={() => toggleCollapse(path)} className="text-gray-400 hover:text-gray-300 mr-1 text-xs">
            {isCollapsed ? '▶' : '▼'}
          </button>
          <span className="text-gray-500">{'{'}{isCollapsed ? '...' : ''}</span>
          {!isCollapsed && entries.map(([k, v], i) => (
            <div key={k} className="ml-4 pl-2 border-l border-gray-600">
              <span className="text-purple-400">"{k}"</span>
              <span className="text-gray-500">: </span>
              {renderValue(v, `${path}.${k}`, i === entries.length - 1)}
            </div>
          ))}
          <span className="text-gray-500">{'}'}{!isCollapsed && !isLast && ','}</span>
        </span>
      );
    }
    return null;
  };

  return (
    <div className="relative group font-mono text-sm">
      <button
        onClick={copyToClipboard}
        className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? '✓ Copied' : '📋 Copy'}
      </button>
      <pre className="text-sm leading-relaxed">
        {renderValue(data, 'root', true)}
      </pre>
    </div>
  );
};

export const EndpointCard: React.FC<EndpointCardProps> = ({
  path,
  method,
  operation,
  idx,
  getExecState,
  setExecState,
  execute,
  expandedEndpoints,
  toggleEndpoint,
}) => {
  const key = `${path}-${method}-${idx}`;
  const state = getExecState(key);
  const isExpanded = expandedEndpoints.has(key);
  const contentType = Object.keys(operation.requestBody?.content || {})[0];
  const isMultipart = contentType?.includes('multipart/form-data');

  return (
    <article className="relative border rounded-xl dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
      <button
        onClick={() => toggleEndpoint(key)}
        className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${methodColors[method]}`}>
          {method}
        </span>
        <div className="flex-1 min-w-0">
          <code className="text-base font-mono text-gray-700 dark:text-gray-300 block truncate">
            {path}
          </code>
          <h4 className="text-base font-serif font-semibold text-gray-900 dark:text-white truncate">
            {operation.summary}
          </h4>
        </div>
        <span className="text-lg text-gray-400 dark:text-gray-500">
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700">
          {operation.description && (
            <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed mt-4 mb-4">
              {operation.description}
            </p>
          )}

          {operation.parameters && operation.parameters.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3">
                Parameters
              </h5>
              <div className="space-y-2">
                {operation.parameters.map((param, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200">
                        {param.name}
                      </code>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{param.in}</span>
                      {param.required && <span className="text-xs text-rose-500">required</span>}
                    </div>
                    {param.description && (
                      <span className="text-gray-500 dark:text-gray-400 sm:ml-auto">{param.description}</span>
                    )}
                    {param.in !== 'path' && (
                      <input
                        type="text"
                        placeholder="value"
                        value={state.params[param.name] || ''}
                        onChange={e => setExecState(key, { params: { ...state.params, [param.name]: e.target.value } })}
                        className="px-3 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 w-full sm:w-36"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {operation.requestBody && (
            <div className="mb-4">
              <h5 className="text-sm uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3">
                Request Body
              </h5>
              {isMultipart ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">📎 Upload File</label>
                    <input
                      type="file"
                      onChange={e => setExecState(key, { file: e.target.files?.[0] || null })}
                      className="w-full px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    {state.file && <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">✓ Selected: {state.file.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Additional JSON (optional)</label>
                    <textarea
                      value={state.body || '{}'}
                      onChange={e => setExecState(key, { body: e.target.value })}
                      rows={3}
                      placeholder='{"title": "My Story"}'
                      className="w-full px-4 py-3 text-sm font-mono rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-800 dark:bg-gray-900 text-emerald-400 resize-y"
                    />
                  </div>
                </div>
              ) : (
                <textarea
                  value={state.body || JSON.stringify(getExample(operation), null, 2)}
                  onChange={e => setExecState(key, { body: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 text-sm font-mono rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-800 dark:bg-gray-900 text-emerald-400 resize-y"
                />
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => execute(path, method, operation, key)}
              disabled={state.loading}
              className="px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm"
            >
              {state.loading ? 'Sending...' : 'Try it'}
            </button>
            {state.response && (
              <span className={`text-sm ${
                state.response.status >= 200 && state.response.status < 300 ? 'text-emerald-600 dark:text-emerald-400' :
                state.response.status >= 400 ? 'text-rose-600 dark:text-rose-400' :
                'text-amber-600 dark:text-amber-400'
              }`}>
                {state.response.status} {state.response.statusText} · {state.response.time}ms
              </span>
            )}
          </div>

          {state.response?.body && (
            <div className="mt-4">
              <h5 className="text-sm uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3">Response</h5>
              <div className="bg-gray-800 dark:bg-gray-950 p-4 rounded-xl max-h-128 overflow-auto">
                <JsonViewer data={state.response.body} />
              </div>
            </div>
          )}
          {operation.responses && (
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(operation.responses).map(([code, response]) => (
                <span key={code} className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                  code.startsWith('2') ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' :
                  code.startsWith('4') ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' :
                  code.startsWith('5') ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  <span className="font-mono">{code}</span>
                  {response.description && <span>{response.description}</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
};

export default EndpointCard;