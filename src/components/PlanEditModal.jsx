import React, { useState, useEffect, useRef } from 'react';

export default function PlanEditModal({ isOpen, onClose, accountData, countryName, onSave }) {
  const [formData, setFormData] = useState(() => {
    if (accountData?.plan2026) {
      return {
        productsFocusedOn: [...(accountData.plan2026.productsFocusedOn || [])],
        valueOfOpportunities: accountData.plan2026.valueOfOpportunities || '',
        pocOrDemoGiven: accountData.plan2026.pocOrDemoGiven || '',
        consultingTrialsGiven: accountData.plan2026.consultingTrialsGiven || '',
        winProbability: accountData.plan2026.winProbability || '',
        weightedPipelineValue: accountData.plan2026.weightedPipelineValue || '',
        quarterlyMilestoneBreakdown: accountData.plan2026.quarterlyMilestoneBreakdown || '',
        topTargetAccounts: [...(accountData.plan2026.topTargetAccounts || [])]
      };
    }
    return null;
  });

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (accountData?.plan2026) {
      setFormData({
        productsFocusedOn: [...(accountData.plan2026.productsFocusedOn || [])],
        valueOfOpportunities: accountData.plan2026.valueOfOpportunities || '',
        pocOrDemoGiven: accountData.plan2026.pocOrDemoGiven || '',
        consultingTrialsGiven: accountData.plan2026.consultingTrialsGiven || '',
        winProbability: accountData.plan2026.winProbability || '',
        weightedPipelineValue: accountData.plan2026.weightedPipelineValue || '',
        quarterlyMilestoneBreakdown: accountData.plan2026.quarterlyMilestoneBreakdown || '',
        topTargetAccounts: [...(accountData.plan2026.topTargetAccounts || [])]
      });
    }
  }, [accountData]);

  if (!isOpen || !formData) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (field, index, value) => {
    const newList = [...formData[field]];
    newList[index] = value;
    setFormData(prev => ({ ...prev, [field]: newList }));
  };

  const handleArrayAdd = (field) => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const handleArrayRemove = (field, index) => {
    const newList = formData[field].filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, [field]: newList }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...accountData,
      plan2026: {
        ...formData
      }
    });
    onClose();
  };

  const renderStringArrayEditor = (title, field) => (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text-primary)' }}>{title}</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {formData[field].map((val, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={val}
              onChange={(e) => handleArrayChange(field, idx, e.target.value)}
              style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px' }}
            />
            <button type="button" onClick={() => handleArrayRemove(field, idx)} style={{ background: 'var(--red)', color: 'white', border: 'none', borderRadius: '6px', padding: '0 12px', cursor: 'pointer' }}>✕</button>
          </div>
        ))}
        <button type="button" onClick={() => handleArrayAdd(field)} style={{ alignSelf: 'flex-start', background: 'var(--bg-card3)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>+ Add Item</button>
      </div>
    </div>
  );

  return (
    <div className="generic-modal-overlay" style={{ zIndex: 9999 }} onClick={(e) => e.target.className === 'generic-modal-overlay' && onClose()}>
      <div className="generic-modal-card" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="generic-modal-header" style={{ flexShrink: 0 }}>
          <h3 className="generic-modal-title">Edit Plan for 2026 ({countryName})</h3>
          <button className="generic-modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text-primary)' }}>Value of Opportunities</label>
                <input type="text" name="valueOfOpportunities" value={formData.valueOfOpportunities} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text-primary)' }}>PoC / Demo Delivered</label>
                <input type="text" name="pocOrDemoGiven" value={formData.pocOrDemoGiven} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text-primary)' }}>Consulting Trials & Next Steps</label>
                <input type="text" name="consultingTrialsGiven" value={formData.consultingTrialsGiven} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px' }} />
              </div>
              {renderStringArrayEditor('Products Focused On', 'productsFocusedOn')}
            </div>
            
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text-primary)' }}>Win Probability (%)</label>
                <input type="text" name="winProbability" value={formData.winProbability} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px' }} placeholder="e.g. 75%" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text-primary)' }}>Weighted Pipeline Value</label>
                <input type="text" name="weightedPipelineValue" value={formData.weightedPipelineValue} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px' }} placeholder="e.g. $1.5M" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text-primary)' }}>Quarterly Milestone Breakdown</label>
                <textarea name="quarterlyMilestoneBreakdown" value={formData.quarterlyMilestoneBreakdown} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', minHeight: '80px' }} placeholder="e.g. Q1: Scoping, Q2: PoC..."></textarea>
              </div>
              {renderStringArrayEditor('Top Target Accounts', 'topTargetAccounts')}
            </div>
          </div>

        </form>
        <div className="generic-modal-footer" style={{ flexShrink: 0, padding: '20px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button type="button" className="form-btn-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="form-btn-submit" onClick={handleSubmit}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
