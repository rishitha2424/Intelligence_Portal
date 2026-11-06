import React, { useState } from 'react';

/**
 * CollapsibleList - Reusable component to limit list display to a threshold (e.g. top 4)
 * with a 'More' / 'Show Less' trigger to expand/collapse the rest.
 */
export default function CollapsibleList({
  items = [],
  renderItem,
  initialCount = 4,
  moreLabel = 'More',
  lessLabel = 'Show Less',
  className = '',
  style = {},
  listStyle = null
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!items || items.length === 0) return null;

  const visibleItems = isExpanded ? items : items.slice(0, initialCount);
  const hiddenCount = items.length - initialCount;
  const hasMore = items.length > initialCount;

  const defaultListStyle = { display: 'flex', flexDirection: 'column', gap: '6px' };

  return (
    <div className={`collapsible-list-container ${className}`} style={{ width: '100%', display: 'flex', flexDirection: 'column', ...style }}>
      <div style={listStyle || defaultListStyle}>
        {visibleItems.map((item, idx) => renderItem(item, idx))}
      </div>
      {hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '6px' }}>
          <button
            type="button"
            className="collapsible-more-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(prev => !prev);
            }}
            style={{
              background: 'rgba(37, 99, 235, 0.06)',
              border: '1px dashed var(--blue)',
              color: 'var(--blue)',
              fontSize: '10px',
              fontWeight: '700',
              cursor: 'pointer',
              padding: '3px 10px',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--blue)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(37, 99, 235, 0.06)';
              e.currentTarget.style.color = 'var(--blue)';
            }}
          >
            {isExpanded ? (
              <>▲ {lessLabel}</>
            ) : (
              <>▼ {moreLabel} ({hiddenCount} more)</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
