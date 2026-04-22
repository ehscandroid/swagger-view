import { useState } from 'react';
import JsonViewer from './JsonViewer';
import { Operation, ExecState, getExample } from '../Interfaces';

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
  darkMode?: boolean;
}

export const EndpointCard: React.FC<EndpointCardProps> = ({
  path, method, operation, idx, getExecState, setExecState, execute, expandedEndpoints, toggleEndpoint, darkMode = true,
}) => {
  const key = `${path}-${method}-${idx}`;
  const state = getExecState(key);
  const isExpanded = expandedEndpoints.has(key);
  const contentType = Object.keys(operation.requestBody?.content || {})[0];
  const isMultipart = contentType?.includes('multipart/form-data');
  const [showCurl, setShowCurl] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateCurl = () => {
    const baseUrl = 'http://localhost:3000';
    const lines: string[] = [];
    const params = Object.entries(state.params).filter(([, v]) => v);
    let fullUrl = baseUrl + path;
    if (params.length > 0) fullUrl += '?' + params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    lines.push(`curl -X ${method.toUpperCase()} '${fullUrl}'`);
    if (isMultipart && state.file) {
      lines.push(`  -F file=@${state.file.name}`);
    } else if (!['get', 'delete'].includes(method)) {
      const bodyContent = state.body || JSON.stringify(getExample(operation));
      const jsonBody = bodyContent.trim();
      if (jsonBody && jsonBody.startsWith('{')) {
        lines.push(`  -H 'Content-Type: application/json'`);
        try {
          const parsed = JSON.parse(jsonBody);
          const formatted = JSON.stringify(parsed, null, 2);
          const indented = formatted.split('\n').map((l, i) => i === 0 ? l : `  ${l}`).join('\n');
          lines.push(`  -d '${indented.replace(/'/g, "'\\''")}'`);
        } catch { lines.push(`  -d '${jsonBody.replace(/'/g, "'\\''")}'`); }
      } else if (jsonBody) {
        lines.push(`  -H 'Content-Type: application/json'`);
        lines.push(`  -d '${jsonBody.replace(/'/g, "'\\''")}'`);
      }
    }
    return lines.join(' \\\n');
  };

  const handleCopyCurl = () => { navigator.clipboard.writeText(generateCurl()); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const border = darkMode ? 'border-gray-600' : 'border-gray-200';
  const text = darkMode ? 'text-white' : 'text-gray-900';
  const text2 = darkMode ? 'text-gray-300' : 'text-gray-600';
  const text3 = darkMode ? 'text-gray-400' : 'text-gray-500';
  const bg = darkMode ? 'bg-gray-600' : 'bg-gray-200';
  const bg2 = darkMode ? 'bg-gray-700' : 'bg-white';
  const bg3 = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const methodColor = method === 'get' ? 'text-blue-400' : method === 'post' ? 'text-green-400' : method === 'put' ? 'text-orange-400' : method === 'delete' ? 'text-red-400' : 'text-gray-400';
  const methodBg = method === 'get' ? 'bg-blue-500' : method === 'post' ? 'bg-green-500' : method === 'put' ? 'bg-orange-500' : method === 'delete' ? 'bg-red-500' : 'bg-gray-500';

  const ExpandedView = () => {

    return (<div className={`mt-6 pt-6 border-t ${border}`}>
      {operation.parameters && operation.parameters.length > 0 && (
        <div className="mb-6">
          <h5 className={`text-sm font-medium mb-3 ${text}`}>Parameters</h5>
          <div className="space-y-4">
            {operation.parameters.map((param, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-2">
                <div className="flex items-center gap-2 min-w-[150px]">
                  <code className={`text-sm px-2 py-1 rounded ${bg2} ${text}`}>{param.name}</code>
                  <span className={`text-xs ${text3}`}>{param.in}</span>
                  {param.required && <span className="text-xs text-rose-400">required</span>}
                </div>
                {param.description && <span className={text3}>{param.description}</span>}
                {param.in !== 'path' && (
                  <input type="text" placeholder="value" value={state.params[param.name] || ''} onChange={e => setExecState(key, { params: { ...state.params, [param.name]: e.target.value } })} className={`px-3 py-2 text-sm rounded border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} w-full sm:w-48`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {operation.requestBody && (
        <div className="mb-6">
          <h5 className={`text-sm font-medium mb-3 ${text}`}>Request Body</h5>
          {isMultipart ? (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm mb-2 ${text2}`}>File</label>
                <input type="file" onChange={e => setExecState(key, { file: e.target.files?.[0] || null })} className={`w-full px-4 py-3 text-sm rounded-lg border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'}`} />
                {state.file && <p className="mt-2 text-sm text-green-400">Selected: {state.file.name}</p>}
              </div>
              <div>
                <label className={`block text-sm mb-2 ${text2}`}>Additional JSON (optional)</label>
                <textarea value={state.body || '{}'} onChange={e => setExecState(key, { body: e.target.value })} rows={4} className={`w-full px-4 py-3 text-sm font-mono rounded-lg border resize-y ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'}`} />
              </div>
            </div>
          ) : (
            <textarea value={state.body || JSON.stringify(getExample(operation), null, 2)} onChange={e => setExecState(key, { body: e.target.value })} rows={6} className={`w-full px-4 py-3 text-sm font-mono rounded-lg border resize-y ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'}`} />
          )}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button onClick={() => execute(path, method, operation, key)} disabled={state.loading} className={`px-6 py-3 rounded-lg font-medium transition-colors text-sm ${darkMode ? 'bg-white text-gray-900 hover:bg-gray-200' : 'bg-gray-800 text-white hover:bg-gray-700'} disabled:opacity-50`}>
          {state.loading ? 'Sending...' : 'Try it'}
        </button>
        <button onClick={() => setShowCurl(!showCurl)} className={`px-4 py-2 text-sm transition-colors ${text3} hover:${text}`}>{showCurl ? 'Hide cURL' : 'Copy cURL'}</button>
        {state.response && <span className={`text-sm ${state.response.status >= 200 && state.response.status < 300 ? 'text-green-400' : state.response.status >= 400 ? 'text-red-400' : 'text-yellow-400'}`}>{state.response.status} {state.response.statusText} · {state.response.time}ms</span>}
      </div>

      {showCurl && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2"><h5 className={`text-sm font-medium ${text}`}>cURL</h5><button onClick={handleCopyCurl} className={`text-xs ${text3} hover:${text}`}>{copied ? '✓ Copied!' : 'Copy'}</button></div>
          <div className={`w-full py-3 px-4 rounded-xl ${bg3} overflow-x-auto`}><pre className={`font-mono text-sm whitespace-pre-wrap ${text}`}><code>{generateCurl()}</code></pre></div>
        </div>
      )}

      {state.response?.body && (<div className="mt-6"><h5 className={`text-sm font-medium mb-3 ${text}`}>Response</h5><div className={`p-4 rounded-lg max-h-96 overflow-auto ${bg3}`}><JsonViewer data={state.response.body} /></div></div>)}
      {operation.responses && (
        <div className="mt-6 flex flex-wrap gap-2">
          {Object.entries(operation.responses).map(([code, response]) => (
            <span key={code} className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${code.startsWith('2') ? (darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800') : code.startsWith('4') ? (darkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-800') : code.startsWith('5') ? (darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800') : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800')}`}>
              <span className="font-medium">{code}</span>
              {response.description && <span>{response.description}</span>}
            </span>
          ))}
        </div>
      )}
    </div>)
  }

  const MainView = () => {
    return (<button onClick={() => toggleEndpoint(key)} className="w-full text-left group flex gap-4">
      <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${methodBg}`} />
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <span className={`text-xs font-medium uppercase tracking-wider ${methodColor}`}>{method}</span>
          <span className={`text-sm font-mono ${text3}`}>{path}</span>
          <span className={`ml-auto text-sm ${text3}`}>{isExpanded ? '▲ Less' : '▼ More'}</span>
        </div>
        <h4 className={`text-xl font-serif font-semibold mb-2 ${text} group-hover:text-blue-400 transition-colors`}>{operation.summary}</h4>
        {operation.description && <p className={`${text2} text-lg leading-relaxed mb-6`}>{operation.description}</p>}
      </div>
    </button>)
  }

  return (
    <article className={`border-b ${border} pb-8 mb-8 last:border-0`}>

      <MainView />
      {isExpanded && <ExpandedView />}
    </article>
  );
};

export default EndpointCard;