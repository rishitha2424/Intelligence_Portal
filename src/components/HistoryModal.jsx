import React, { useState, useEffect } from 'react';

export default function HistoryModal({ isOpen, onClose, countryName, operatorName, onRestore }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState(null);

  useEffect(() => {
    if (isOpen && countryName) {
      setLoading(true);
      fetch(`/api/get-history?countryId=${encodeURIComponent(countryName)}&operatorId=${encodeURIComponent(operatorName || 'Global')}`)
        .then(res => res.json())
        .then(data => {
          setHistory(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch history:", err);
          setLoading(false);
        });
    }
  }, [isOpen, countryName, operatorName]);

  const handleRestore = async (entry) => {
    console.log('Restore clicked:', {
      countryId: countryName,
      operatorId: operatorName || 'Global',
      section: entry.section,
      fieldName: entry.field_name,
      valueToRestore: entry.old_value
    });

    setRestoringId(entry.id || entry.created_at); // using created_at as fallback if no id
    try {
      const res = await fetch('/api/restore-value', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryId: countryName,
          operatorId: operatorName || 'Global',
          section: entry.section,
          fieldName: entry.field_name,
          valueToRestore: entry.old_value,
          updatedBy: 'Local User (Restore)'
        })
      });
      if (res.ok) {
        // We trigger the re-fetch
        onRestore(entry.section, entry.field_name, entry.old_value); 
        // We re-fetch history so it appears at top without closing modal immediately
        fetch(`/api/get-history?countryId=${encodeURIComponent(countryName)}&operatorId=${encodeURIComponent(operatorName || 'Global')}`)
          .then(r => r.json())
          .then(data => setHistory(Array.isArray(data) ? data : []));
      } else {
        console.error("Restore failed:", await res.text());
      }
    } catch (err) {
      console.error("Restore error", err);
    }
    setRestoringId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="generic-modal-overlay" style={{ zIndex: 9999 }} onClick={(e) => e.target.className === 'generic-modal-overlay' && onClose()}>
      <div className="generic-modal-card" style={{ maxWidth: '700px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="generic-modal-header" style={{ flexShrink: 0 }}>
          <h3 className="generic-modal-title">Change History ({countryName}{operatorName ? ` - ${operatorName}` : ''})</h3>
          <button className="generic-modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: 'var(--bg-main)' }}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading history...</div>
          ) : history.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No changes found for this region.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.map((entry, idx) => (
                <div key={entry.id || idx} style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {entry.field_name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>in {entry.section.replace(/([A-Z])/g, ' $1')}</span>
                      {entry.is_restore && (
                        <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--amber)', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}>Restored</span>
                      )}
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        {new Date(entry.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {(() => {
                        const isArrOld = Array.isArray(entry.old_value);
                        const isArrNew = Array.isArray(entry.new_value);
                        
                        if (isArrOld && isArrNew) {
                          // Compare arrays
                          const oldItems = entry.old_value.map(item => typeof item === 'object' ? item.text || JSON.stringify(item) : String(item));
                          const newItems = entry.new_value.map(item => typeof item === 'object' ? item.text || JSON.stringify(item) : String(item));
                          
                          const added = newItems.filter(item => !oldItems.includes(item));
                          const removed = oldItems.filter(item => !newItems.includes(item));
                          
                          if (added.length === 0 && removed.length === 0) return <div>No changes detected.</div>;
                          
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {added.length > 0 && added.map((item, i) => (
                                <div key={`add-${i}`} style={{ color: 'var(--green)' }}>+ Added: '{item}'</div>
                              ))}
                              {removed.length > 0 && removed.map((item, i) => (
                                <div key={`rem-${i}`} style={{ color: 'var(--red)' }}>- Removed: '{item}'</div>
                              ))}
                            </div>
                          );
                        } else if (typeof entry.old_value !== 'object' && typeof entry.new_value !== 'object') {
                          return (
                            <div>
                              Changed from '{String(entry.old_value || 'None')}' to '{String(entry.new_value || 'None')}'
                            </div>
                          );
                        }
                        return (
                           <div style={{ display: 'flex', gap: '16px', fontSize: '12px', marginTop: '8px' }}>
                             <div style={{ flex: 1, background: 'rgba(239, 68, 68, 0.05)', padding: '8px', borderRadius: '4px', borderLeft: '2px solid var(--red)' }}>
                               <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Old Value</div>
                               <div style={{ color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
                                 {typeof entry.old_value === 'object' ? JSON.stringify(entry.old_value) : String(entry.old_value)}
                               </div>
                             </div>
                             <div style={{ flex: 1, background: 'rgba(16, 185, 129, 0.05)', padding: '8px', borderRadius: '4px', borderLeft: '2px solid var(--green)' }}>
                               <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>New Value</div>
                               <div style={{ color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
                                 {typeof entry.new_value === 'object' ? JSON.stringify(entry.new_value) : String(entry.new_value)}
                               </div>
                             </div>
                           </div>
                        );
                      })()}
                    </div>
                  </div>
                  <div style={{ marginLeft: '16px' }}>
                    <button 
                      onClick={() => handleRestore(entry)}
                      disabled={restoringId === (entry.id || idx)}
                      style={{ 
                        background: 'var(--bg-card3)', 
                        border: '1px solid var(--border)', 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        fontSize: '11px', 
                        cursor: 'pointer',
                        color: 'var(--text-primary)'
                      }}
                    >
                      {restoringId === (entry.id || idx) ? 'Restoring...' : 'Restore'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
