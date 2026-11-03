import React from 'react';

interface ChatMarkdownProps {
  content: string;
}

export const ChatMarkdown: React.FC<ChatMarkdownProps> = ({ content }) => {
  // Process content line by line or block by block
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let i = 0;
  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeaders: string[] = [];

  const renderInline = (text: string): React.ReactNode => {
    // Replace **bold**
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[11px]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const flushTable = () => {
    if (tableHeaders.length > 0 || tableRows.length > 0) {
      elements.push(
        <div key={`table-${i}`} className="overflow-x-auto my-3 rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            {tableHeaders.length > 0 && (
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  {tableHeaders.map((th, hIdx) => (
                    <th key={hIdx} className="py-2 px-3 border-r border-slate-200 last:border-r-0">
                      {renderInline(th)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-100">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/50">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-2 px-3 border-r border-slate-100 last:border-r-0 text-slate-700">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableHeaders = [];
      tableRows = [];
      inTable = false;
    }
  };

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Check for table row
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());

      // Is it a divider like | --- | :--- |?
      const isDivider = cells.every((c) => /^:?-+:?$/.test(c));

      if (isDivider) {
        // Just divider, ignore
      } else if (!inTable && tableHeaders.length === 0) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      i++;
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-sm sm:text-base font-bold text-slate-900 mt-3 mb-1.5 flex items-center gap-1.5">
          {renderInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-base sm:text-lg font-bold text-slate-900 mt-4 mb-2">
          {renderInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-lg sm:text-xl font-extrabold text-slate-900 mt-4 mb-2">
          {renderInline(line.slice(2))}
        </h1>
      );
    }
    // Blockquote
    else if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={i}
          className="border-l-3 border-emerald-500 bg-emerald-50/60 rounded-r-lg px-3 py-1.5 my-2 text-xs italic text-emerald-900"
        >
          {renderInline(line.slice(2))}
        </blockquote>
      );
    }
    // Bullet list
    else if (/^[-*•]\s+/.test(line)) {
      const content = line.replace(/^[-*•]\s+/, '');
      elements.push(
        <div key={i} className="flex items-start gap-2 my-1 pl-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
          <div className="flex-1 text-slate-700 leading-relaxed text-xs sm:text-sm">
            {renderInline(content)}
          </div>
        </div>
      );
    }
    // Numbered list
    else if (/^\d+\.\s+/.test(line)) {
      const match = line.match(/^(\d+)\.\s+(.*)/);
      const num = match ? match[1] : '1';
      const content = match ? match[2] : line;
      elements.push(
        <div key={i} className="flex items-start gap-2 my-1 pl-1">
          <span className="font-semibold text-emerald-700 font-mono text-xs shrink-0 mt-0.5">
            {num}.
          </span>
          <div className="flex-1 text-slate-700 leading-relaxed text-xs sm:text-sm">
            {renderInline(content)}
          </div>
        </div>
      );
    }
    // Empty line
    else if (line === '') {
      elements.push(<div key={i} className="h-1.5" />);
    }
    // Regular paragraph
    else {
      elements.push(
        <p key={i} className="text-slate-700 leading-relaxed my-1 text-xs sm:text-sm">
          {renderInline(rawLine)}
        </p>
      );
    }

    i++;
  }

  if (inTable) {
    flushTable();
  }

  return <div className="space-y-0.5 text-slate-800">{elements}</div>;
};
