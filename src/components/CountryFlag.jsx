import React from 'react';
import { getFlagImgUrl } from '../utils/exportReport';

export default function CountryFlag({ iso, country = '', size = 'medium', style = {} }) {
  const url = getFlagImgUrl(iso);

  const dim = {
    small: { w: 16, h: 11 },
    medium: { w: 22, h: 15 },
    large: { w: 28, h: 19 }
  }[size] || { w: 22, h: 15 };

  if (!url) {
    return <span style={{ fontSize: '14px', ...style }}>🌐</span>;
  }

  return (
    <img
      src={url}
      alt={country || iso || 'Flag'}
      style={{
        width: `${dim.w}px`,
        height: `${dim.h}px`,
        borderRadius: '3px',
        objectFit: 'cover',
        display: 'inline-block',
        verticalAlign: 'middle',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(0, 0, 0, 0.12)',
        flexShrink: 0,
        ...style
      }}
      onError={(e) => {
        e.target.onerror = null;
        e.target.style.display = 'none';
      }}
    />
  );
}
