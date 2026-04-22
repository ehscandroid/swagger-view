import { useState } from 'react';

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

export default  JsonViewer