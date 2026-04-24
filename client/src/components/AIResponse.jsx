import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function AIResponse({ title, content, loading }) {
  if (loading) {
    return (
      <div className="ai-response">
        <div className="ai-loading">
          <div className="spinner"></div>
          AI is analyzing... Please wait.
        </div>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="ai-response">
      <div className="ai-response-header">
        <span className="ai-badge">AI</span>
        <h3>{title || 'AI Analysis'}</h3>
      </div>
      <div className="ai-response-content">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
