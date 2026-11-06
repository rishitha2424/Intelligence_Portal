import React, { useState, useEffect, useRef } from 'react';

export default function ProductEditModal({ isOpen, onClose, accountData, countryName, onSave }) {
  const parseCompetitionItem = (item) => {
    if (typeof item === 'object' && item !== null) {
      return { name: item.name || item.text || '', selected: item.selected !== false };
    }
    return { name: String(item || ''), selected: true };
  };

  const [formData, setFormData] = useState(() => {
    if (accountData?.productSection) {
      return {
        mobileumProducts: [...(accountData.productSection.mobileumProducts || [])],
        productGaps: [...(accountData.productSection.productGaps || [])],
        competitionProducts: (accountData.productSection.competitionProducts || []).map(parseCompetitionItem),
        replaceableCompetitors: [...(accountData.productSection.replaceableCompetitors || [])],
        managedServicesPossibility: [...(accountData.productSection.managedServicesPossibility || [])],
        finalStrategies: (accountData.productSection.finalStrategies || []).map(s => typeof s === 'string' ? { text: s, rtpStatus: 'Not Requested', engagementType: 'Product' } : { ...s })
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
    if (accountData?.productSection) {
      setFormData({
        mobileumProducts: [...(accountData.productSection.mobileumProducts || [])],
        productGaps: [...(accountData.productSection.productGaps || [])],
        competitionProducts: (accountData.productSection.competitionProducts || []).map(parseCompetitionItem),
        replaceableCompetitors: [...(accountData.productSection.replaceableCompetitors || [])],
        managedServicesPossibility: [...(accountData.productSection.managedServicesPossibility || [])],
        finalStrategies: (accountData.productSection.finalStrategies || []).map(s => typeof s === 'string' ? { text: s, rtpStatus: 'Not Requested', engagementType: 'Product' } : { ...s })
      });
    }
  }, [accountData]);

  if (!isOpen || !formData) return null;

  const handleArrayChange = (field, index, value) => {
    const newList = [...formData[field]];
    newList[index] = value;
    setFormData(prev => ({ ...prev, [field]: newList }));
  };

  const handleCompetitionChange = (index, key, value) => {
    const newList = [...formData.competitionProducts];
    newList[index] = { ...newList[index], [key]: value };
    setFormData(prev => ({ ...prev, competitionProducts: newList }));
  };

  const handleArrayAdd = (field) => {
    if (field === 'competitionProducts') {
      setFormData(prev => ({ ...prev, competitionProducts: [...prev.competitionProducts, { name: '', selected: true }] }));
    } else {
      setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
    }
  };

  const handleArrayRemove = (field, index) => {
    const newList = formData[field].filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, [field]: newList }));
  };

  const handleStrategyChange = (index, field, value) => {
    const newStrats = [...formData.finalStrategies];
    newStrats[index] = { ...newStrats[index], [field]: value };
    setFormData(prev => ({ ...prev, finalStrategies: newStrats }));
  };

  const handleStrategyAdd = () => {
    setFormData(prev => ({
      ...prev,
      finalStrategies: [...prev.finalStrategies, { text: '', rtpStatus: 'Not Requested', engagementType: 'Product' }]
    }));
  };

  const handleStrategyRemove = (index) => {
    const newStrats = formData.finalStrategies.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, finalStrategies: newStrats }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...accountData,
      productSection: {
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
          <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={val}
              onChange={(e) => handleArrayChange(field, idx, e.target.value)}
              style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px' }}
            />
            <button type="button" onClick={() => handleArrayRemove(field, idx)} style={{ background: 'var(--red)', color: 'white', border: 'none', borderRadius: '6px', padding: '0 12px', height: '34px', cursor: 'pointer', flexShrink: 0 }}>✕</button>
          </div>
        ))}
        <button type="button" onClick={() => handleArrayAdd(field)} style={{ alignSelf: 'flex-start', background: 'var(--bg-card3)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>+ Add Item</button>
      </div>
    </div>
  );

  const renderCompetitionArrayEditor = () => (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text-primary)' }}>Competition Products</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {formData.competitionProducts.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={item.name}
              onChange={(e) => handleCompetitionChange(idx, 'name', e.target.value)}
              placeholder="Competitor product..."
              style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px' }}
            />
            {/* Same size Checkbox Action Box (34px x 34px) */}
            <button
              type="button"
              onClick={() => handleCompetitionChange(idx, 'selected', !item.selected)}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '6px',
                border: item.selected ? '1px solid #d97706' : '1px solid var(--border)',
                background: item.selected ? '#fef3c7' : 'var(--bg-card2)',
                color: item.selected ? '#d97706' : 'var(--text-muted)',
                fontSize: '15px',
                fontWeight: '900',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
              title={item.selected ? "Ticked (Gold status with tick mark)" : "Unticked (Red status)"}
            >
              {item.selected ? '✓' : ''}
            </button>

            {/* Same size Delete Action Box (34px x 34px) */}
            <button
              type="button"
              onClick={() => handleArrayRemove('competitionProducts', idx)}
              style={{
                width: '34px',
                height: '34px',
                background: 'var(--red)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              title="Delete item"
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" onClick={() => handleArrayAdd('competitionProducts')} style={{ alignSelf: 'flex-start', background: 'var(--bg-card3)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>+ Add Item</button>
      </div>
    </div>
  );

  return (
    <div className="generic-modal-overlay" style={{ zIndex: 9999 }} onClick={(e) => e.target.className === 'generic-modal-overlay' && onClose()}>
      <div className="generic-modal-card" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="generic-modal-header" style={{ flexShrink: 0 }}>
          <h3 className="generic-modal-title">Edit Product Section ({countryName})</h3>
          <button className="generic-modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              {renderStringArrayEditor('Mobileum Products', 'mobileumProducts')}
              {renderStringArrayEditor('Product Gaps', 'productGaps')}
              {renderStringArrayEditor('Managed Services Possibility', 'managedServicesPossibility')}
            </div>
            <div>
              {renderCompetitionArrayEditor()}
              {renderStringArrayEditor('Competitors to Replace', 'replaceableCompetitors')}
            </div>
          </div>

          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', color: 'var(--text-primary)' }}>Final Strategies</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {formData.finalStrategies.map((strat, idx) => (
                <div key={idx} style={{ background: 'var(--bg-card2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Strategy {idx + 1}</span>
                    <button type="button" onClick={() => handleStrategyRemove(idx)} style={{ background: 'transparent', color: 'var(--red)', border: 'none', cursor: 'pointer', fontSize: '11px' }}>Remove</button>
                  </div>
                  <input
                    type="text"
                    value={strat.text}
                    onChange={(e) => handleStrategyChange(idx, 'text', e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}
                    placeholder="Strategy description..."
                  />
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>RTP Status</label>
                      <select
                        value={strat.rtpStatus}
                        onChange={(e) => handleStrategyChange(idx, 'rtpStatus', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', background: 'var(--bg-card)' }}
                      >
                        <option value="Not Requested">Not Requested</option>
                        <option value="Pending">Pending</option>
                        <option value="Granted">Granted</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>Engagement Type</label>
                      <select
                        value={strat.engagementType}
                        onChange={(e) => handleStrategyChange(idx, 'engagementType', e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', background: 'var(--bg-card)' }}
                      >
                        <option value="Product">Product</option>
                        <option value="Managed Service">Managed Service</option>
                        <option value="Product + Service">Product + Service</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={handleStrategyAdd} style={{ alignSelf: 'flex-start', background: 'var(--blue)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>+ Add Strategy</button>
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
