import React from 'react';
import ReactMarkdown from 'react-markdown';

const components = {
  h1: ({ children }) => <h1 className="mb-3 mt-5 text-2xl font-heading font-bold text-foreground first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-5 text-xl font-heading font-bold text-emerald-glow first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-4 text-base font-bold text-gold first:mt-0">{children}</h3>,
  p: ({ children }) => <p className="mb-3 leading-relaxed last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  blockquote: ({ children }) => <blockquote className="mb-3 border-l-2 border-emerald-glow/50 bg-emerald-glow/[0.04] px-4 py-2 italic text-foreground/80 last:mb-0">{children}</blockquote>,
  strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-glow underline decoration-emerald-glow/40 underline-offset-2 hover:text-foreground">{children}</a>,
  hr: () => <hr className="my-5 border-border" />,
  code: ({ children, className }) => className
    ? <code className="block overflow-x-auto rounded border border-border bg-black/40 p-3 font-mono text-xs text-emerald-200">{children}</code>
    : <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[0.9em] text-emerald-200">{children}</code>,
  pre: ({ children }) => <pre className="mb-3 overflow-x-auto last:mb-0">{children}</pre>,
};

export default function MarkdownContent({ children, className = '' }) {
  if (!children) return null;
  return <div className={className}><ReactMarkdown components={components}>{String(children)}</ReactMarkdown></div>;
}
