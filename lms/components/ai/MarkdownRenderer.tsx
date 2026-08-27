"use client";

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

// Preprocess LaTeX math delimiters to ensure remark-math catches them
function preprocessMath(text: string): string {
  if (!text) return "";
  
  // Replace \( ... \) with $ ... $
  let processed = text.replace(/\\+\(/g, "$").replace(/\\+\)/g, "$");
  
  // Replace \[ ... \] with $$ ... $$
  processed = processed.replace(/\\+\[/g, "$$").replace(/\\+\]/g, "$$");
  
  // Wrap raw \boxed{...} (including nested braces like \boxed{\ce{...}}) in $...$
  // Supports one level of brace nesting inside \boxed
  processed = processed.replace(
    /(?<!\$)\\boxed\{((?:[^{}]|\{[^{}]*\})*)\}(?!\$)/g,
    "$\\boxed{$1}$"
  );
  
  // Wrap raw braced \ce{...} in $...$ if not already wrapped
  processed = processed.replace(
    /(?<!\$)\\ce\{([^{}]*)\}(?!\$)/g,
    "$\\ce{$1}$"
  );
  
  // Wrap raw unbraced \ce (e.g. \ce2ZnS...) in $...$ with braces
  processed = processed.replace(
    /(?<!\$)\\ce\s*([a-zA-Z0-9+\-=><\s\(\)\[\]]+)(?!\$)/g,
    "$\\ce{$1}$"
  );
  
  return processed;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Load mhchem extension once on client
    require("katex/dist/contrib/mhchem.min.js");
    setIsMounted(true);
  }, []);

  const processedContent = preprocessMath(content);

  // During SSR / before mount, render plain text to avoid KaTeX errors with \ce
  if (!isMounted) {
    return <span className="whitespace-pre-wrap text-xs text-slate-700">{content}</span>;
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath, remarkGfm]}
      rehypePlugins={[rehypeKatex]}
      components={{
        h1: ({ children }) => <h1 className="text-sm font-bold text-violet-700 mt-4 mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xs font-bold text-violet-650 mt-3 mb-1.5">{children}</h2>,
        h3: ({ children }) => <h3 className="text-[11px] font-bold text-violet-600 mt-2 mb-1">{children}</h3>,
        p: ({ children }) => <p className="text-xs leading-relaxed text-slate-700 my-1 whitespace-pre-wrap">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-1 text-slate-700 text-xs">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-1 text-slate-700 text-xs">{children}</ol>,
        li: ({ children }) => <li className="pl-1">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
        em: ({ children }) => <em className="italic text-slate-655">{children}</em>,
        code: ({ className, children, ...props }) => {
          const isInline = !className && !String(children).includes('\n');
          return isInline ? (
            <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] font-mono text-violet-755 border border-slate-200" {...props}>
              {children}
            </code>
          ) : (
            <pre className="bg-slate-50 border border-slate-200 p-3 rounded-lg my-1.5 overflow-x-auto text-[10px] font-mono text-violet-755">
              <code className={className} {...props}>{children}</code>
            </pre>
          );
        },
        table: ({ children }) => (
          <div className="overflow-x-auto my-2 rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-[10px] text-left">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-slate-50 text-slate-700 font-semibold">{children}</thead>,
        tbody: ({ children }) => <tbody className="divide-y divide-slate-200">{children}</tbody>,
        tr: ({ children }) => <tr className="hover:bg-slate-50/50">{children}</tr>,
        th: ({ children }) => <th className="px-3 py-2 border-b border-slate-200 font-bold">{children}</th>,
        td: ({ children }) => <td className="px-3 py-2 text-slate-650">{children}</td>,
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
}
