import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  highContrast?: boolean;
  largeText?: boolean;
}

export function MarkdownRenderer({ content, highContrast = false, largeText = false }: MarkdownRendererProps) {
  const fontSize = largeText ? 'text-lg' : 'text-base';
  const borderColor = highContrast ? 'border-yellow-400' : 'border-gray-300 dark:border-gray-600';
  const textColor = highContrast ? 'text-yellow-400' : '';
  
  return (
    <div className={`markdown-body ${fontSize}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Header 1 for "Subject" - styled to look distinct
          h1: ({ children }) => (
            <h1 className={`${largeText ? 'text-2xl' : 'text-xl'} font-bold mb-3 pb-2 border-b-2 ${borderColor} ${highContrast ? 'border-2' : ''}`}>
              {children}
            </h1>
          ),
          // Paragraphs for "Detail"
          p: ({ children }) => (
            <p className={`mb-2 last:mb-0 ${largeText ? 'leading-loose' : 'leading-relaxed'} ${textColor}`}>
              {children}
            </p>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-2 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-2 space-y-1">
              {children}
            </ol>
          ),
          // Code blocks
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !className;
            
            return isInline ? (
              <code className={`${highContrast ? 'bg-yellow-400 border-2 border-black' : 'bg-gray-200 dark:bg-gray-700'} px-1 py-0.5 rounded ${largeText ? 'text-base' : 'text-sm'} font-mono ${highContrast ? 'text-black' : 'text-pink-600 dark:text-pink-400'}`} {...props}>
                {children}
              </code>
            ) : (
              <div className={`${highContrast ? 'bg-black border-2 border-yellow-400' : 'bg-gray-900'} ${highContrast ? 'text-yellow-400' : 'text-gray-100'} p-3 rounded-md my-3 overflow-x-auto ${largeText ? 'text-base' : 'text-sm'} font-mono`}>
                <code className={className} {...props}>
                  {children}
                </code>
              </div>
            );
          },
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className={`border-l-4 ${highContrast ? 'border-yellow-400 border-2' : 'border-gray-400'} pl-3 italic my-2 ${highContrast ? 'text-yellow-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {children}
            </blockquote>
          ),
          // Links
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className={`${highContrast ? 'text-yellow-400 underline' : 'text-blue-600 dark:text-blue-400'} hover:underline`}>
              {children}
            </a>
          ),
          // Horizontal Rule
          hr: () => (
            <hr className={`my-4 ${highContrast ? 'border-yellow-400 border-2' : 'border-gray-300 dark:border-gray-600'}`} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
