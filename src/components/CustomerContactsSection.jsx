import React, { useState, useEffect } from 'react';

const BUSINESS_UNITS = [
  'Roaming',
  'Signaling',
  'Network Security',
  'Customer Intelligence'
];

// Initial mock contacts for key operators to provide instant realistic demonstration
const INITIAL_MOCK_CONTACTS = {
  'BSNL': {
    'Roaming': [
      { id: 'bsnl-r1', name: 'Rajesh Sharma', position: 'GM - Roaming & International Business', email: 'rajesh.sharma@bsnl.co.in', mobile: '+91 94123 45678', decisionAuthority: 'Yes' }
    ],
    'Signaling': [
      { id: 'bsnl-s1', name: 'Anil Kumar', position: 'DGM - Signaling & Network Infrastructure', email: 'anil.kumar@bsnl.co.in', mobile: '+91 94987 65432', decisionAuthority: 'No' }
    ],
    'Network Security': [
      { id: 'bsnl-ns1', name: 'Priya Sundaram', position: 'Chief Security Officer', email: 'priya.sundaram@bsnl.co.in', mobile: '+91 94321 09876', decisionAuthority: 'Yes' }
    ],
    'Customer Intelligence': [
      { id: 'bsnl-ci1', name: 'Sanjay Patel', position: 'AGM - Data Analytics & Insights', email: 'sanjay.patel@bsnl.co.in', mobile: '+91 94567 89012', decisionAuthority: 'No' }
    ]
  },
  'STC': {
    'Roaming': [
      { id: 'stc-r1', name: 'Tariq Al-Mansoor', position: 'VP - Roaming & Wholesale', email: 'tariq.mansoor@stc.com.sa', mobile: '+966 50 123 4567', decisionAuthority: 'Yes' }
    ],
    'Signaling': [
      { id: 'stc-s1', name: 'Fahad Al-Harbi', position: 'Director - Core Network & Signaling', email: 'fahad.harbi@stc.com.sa', mobile: '+966 55 987 6543', decisionAuthority: 'Yes' }
    ],
    'Network Security': [
      { id: 'stc-ns1', name: 'Sara Al-Otaibi', position: 'Cybersecurity Operations Lead', email: 'sara.otaibi@stc.com.sa', mobile: '+966 54 321 0987', decisionAuthority: 'No' }
    ],
    'Customer Intelligence': [
      { id: 'stc-ci1', name: 'Khalid Al-Zahrani', position: 'Head of Customer Analytics', email: 'khalid.zahrani@stc.com.sa', mobile: '+966 56 456 7890', decisionAuthority: 'Yes' }
    ]
  }
};

export default function CustomerContactsSection({ selectedOperator, selectedCountry, accountData }) {
  // Determine operator identifier key for storage and data separation
  const opName = selectedOperator || (accountData && accountData.name) || (typeof selectedCountry === 'string' ? selectedCountry : 'Default_Operator');
  const storageKey = `customer_contacts_${opName.replace(/\s+/g, '_')}`;

  // Helper to load initial contacts state
  const loadContacts = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load contacts from localStorage:', e);
    }

    // Check if we have pre-defined mock contacts for this operator name (e.g. STC, BSNL)
    const matchedKey = Object.keys(INITIAL_MOCK_CONTACTS).find(k => opName.toLowerCase().includes(k.toLowerCase()));
    if (matchedKey) {
      return INITIAL_MOCK_CONTACTS[matchedKey];
    }

    // Default structure with empty arrays for all 4 business units
    return {
      'Roaming': [],
      'Signaling': [],
      'Network Security': [],
      'Customer Intelligence': []
    };
  };

  const [contactsByBU, setContactsByBU] = useState(loadContacts);
  const [editingContactId, setEditingContactId] = useState(null);
  const [draftContact, setDraftContact] = useState(null);
  const [addingToBU, setAddingToBU] = useState(null);
  const [emailError, setEmailError] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Reload contacts when operator selection changes
  useEffect(() => {
    setContactsByBU(loadContacts());
    setEditingContactId(null);
    setDraftContact(null);
    setAddingToBU(null);
    setEmailError('');
    setSaveSuccessMsg('');
  }, [opName]);

  const isValidEmail = (email) => {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  };

  const saveToLocalStorage = (updatedData) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedData));
      setSaveSuccessMsg('Contacts saved successfully!');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (e) {
      console.error('Error saving contacts:', e);
    }
  };

  const handleStartAdd = (bu) => {
    setAddingToBU(bu);
    setEditingContactId(null);
    setDraftContact({
      id: `c_${Date.now()}`,
      name: '',
      position: '',
      email: '',
      mobile: '',
      decisionAuthority: 'No'
    });
    setEmailError('');
  };

  const handleStartEdit = (bu, contact) => {
    setAddingToBU(null);
    setEditingContactId(contact.id);
    setDraftContact({ ...contact });
    setEmailError('');
  };

  const handleCancelDraft = () => {
    setAddingToBU(null);
    setEditingContactId(null);
    setDraftContact(null);
    setEmailError('');
  };

  const handleSaveContact = (bu) => {
    if (!draftContact) return;

    if (!draftContact.name.trim()) {
      alert('Please enter a Contact Name.');
      return;
    }

    if (draftContact.email && !isValidEmail(draftContact.email)) {
      setEmailError('Please enter a valid email address (e.g. user@domain.com).');
      return;
    }

    setEmailError('');

    const currentList = contactsByBU[bu] || [];
    let updatedList;

    if (addingToBU === bu) {
      updatedList = [...currentList, draftContact];
    } else {
      updatedList = currentList.map(item => item.id === draftContact.id ? draftContact : item);
    }

    const updatedBU = {
      ...contactsByBU,
      [bu]: updatedList
    };

    setContactsByBU(updatedBU);
    saveToLocalStorage(updatedBU);
    handleCancelDraft();
  };

  const handleDeleteContact = (bu, contactId) => {
    if (window.confirm('Are you sure you want to remove this contact?')) {
      const currentList = contactsByBU[bu] || [];
      const updatedList = currentList.filter(c => c.id !== contactId);
      const updatedBU = {
        ...contactsByBU,
        [bu]: updatedList
      };
      setContactsByBU(updatedBU);
      saveToLocalStorage(updatedBU);
      if (editingContactId === contactId) {
        handleCancelDraft();
      }
    }
  };

  return (
    <div
      id="customer-contacts-section"
      className="section customer-contacts-section"
      style={{
        scrollMarginTop: '90px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '12px 16px',
        margin: '0 0 10px 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
      }}
    >
      {/* Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Customer Contacts Section</span>
          <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', background: 'var(--bg-card2)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '12px' }}>
            {opName}
          </span>
        </div>
        {saveSuccessMsg && (
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--green)', background: 'rgba(16, 185, 129, 0.15)', padding: '3px 10px', borderRadius: '6px', animation: 'fadeIn 0.2s ease-in' }}>
            ✓ {saveSuccessMsg}
          </span>
        )}
      </div>

      {/* Grid of Business Unit Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
        {BUSINESS_UNITS.map(bu => {
          const contacts = contactsByBU[bu] || [];
          const isAdding = addingToBU === bu;

          return (
            <div
              key={bu}
              style={{
                background: 'var(--bg-card2)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              {/* BU Sub-Group Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {bu}
                </span>
                <span style={{ fontSize: '9px', fontWeight: '700', background: 'var(--bg-card3)', color: 'var(--blue)', border: '1px solid var(--border)', padding: '1px 6px', borderRadius: '10px' }}>
                  {contacts.length} {contacts.length === 1 ? 'Contact' : 'Contacts'}
                </span>
              </div>

              {/* Contacts List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {contacts.map(c => {
                  const isEditing = editingContactId === c.id;

                  if (isEditing) {
                    return (
                      <ContactEditFormRow
                        key={c.id}
                        draft={draftContact}
                        setDraft={setDraftContact}
                        emailError={emailError}
                        onSave={() => handleSaveContact(bu)}
                        onCancel={handleCancelDraft}
                      />
                    );
                  }

                  return (
                    <div
                      key={c.id}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)' }}>
                            {c.name}
                          </div>
                          {c.position && (
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                              {c.position}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <span
                            style={{
                              fontSize: '8.5px',
                              fontWeight: '800',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: c.decisionAuthority === 'Yes' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card3)',
                              color: c.decisionAuthority === 'Yes' ? 'var(--green)' : 'var(--text-muted)',
                              border: `1px solid ${c.decisionAuthority === 'Yes' ? 'rgba(16, 185, 129, 0.3)' : 'var(--border)'}`
                            }}
                            title="Decision Authority"
                          >
                            Auth: {c.decisionAuthority || 'No'}
                          </span>
                          <button
                            onClick={() => handleStartEdit(bu, c)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--blue)',
                              cursor: 'pointer',
                              fontSize: '11px',
                              padding: '2px 4px'
                            }}
                            title="Edit Contact"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteContact(bu, c.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--red)',
                              cursor: 'pointer',
                              fontSize: '11px',
                              padding: '2px 4px'
                            }}
                            title="Delete Contact"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* Contact Details */}
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                        {c.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>✉</span>
                            <a
                              href={`mailto:${c.email.trim()}`}
                              style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: '600' }}
                              onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                            >
                              {c.email.trim()}
                            </a>
                          </div>
                        )}
                        {c.mobile && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>📞</span>
                            <span>{c.mobile}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Form row for adding new contact */}
                {isAdding && (
                  <ContactEditFormRow
                    draft={draftContact}
                    setDraft={setDraftContact}
                    emailError={emailError}
                    onSave={() => handleSaveContact(bu)}
                    onCancel={handleCancelDraft}
                  />
                )}

                {/* Empty State */}
                {contacts.length === 0 && !isAdding && (
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
                    No contacts added yet.
                  </div>
                )}
              </div>

              {/* Add Contact Button */}
              {!isAdding && (
                <button
                  onClick={() => handleStartAdd(bu)}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px dashed var(--blue)',
                    color: 'var(--blue)',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '10px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    marginTop: '4px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(37, 99, 235, 0.08)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                >
                  <span>+</span> Add Contact
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContactEditFormRow({ draft, setDraft, emailError, onSave, onCancel }) {
  if (!draft) return null;

  return (
    <div
      style={{
        background: 'var(--bg-card3)',
        border: '1px solid var(--blue)',
        borderRadius: '6px',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <div>
          <label style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
            Contact Name *
          </label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g. John Doe"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '4px 6px',
              fontSize: '10px',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
            Position
          </label>
          <input
            type="text"
            value={draft.position}
            onChange={(e) => setDraft({ ...draft, position: e.target.value })}
            placeholder="e.g. VP Operations"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '4px 6px',
              fontSize: '10px',
              color: 'var(--text-primary)'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <div>
          <label style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
            Email ID *
          </label>
          <input
            type="email"
            value={draft.email}
            onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            placeholder="john@operator.com"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'var(--bg-card)',
              border: emailError ? '1px solid var(--red)' : '1px solid var(--border)',
              borderRadius: '4px',
              padding: '4px 6px',
              fontSize: '10px',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
            Mobile Number
          </label>
          <input
            type="text"
            value={draft.mobile}
            onChange={(e) => setDraft({ ...draft, mobile: e.target.value })}
            placeholder="+966 50 123 4567"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '4px 6px',
              fontSize: '10px',
              color: 'var(--text-primary)'
            }}
          />
        </div>
      </div>

      <div>
        <label style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
          Decision Authority
        </label>
        <select
          value={draft.decisionAuthority}
          onChange={(e) => setDraft({ ...draft, decisionAuthority: e.target.value })}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '4px 6px',
            fontSize: '10px',
            color: 'var(--text-primary)'
          }}
        >
          <option value="Yes">Yes (Decision Maker)</option>
          <option value="No">No</option>
        </select>
      </div>

      {emailError && (
        <div style={{ fontSize: '9px', color: 'var(--red)', fontWeight: '600' }}>
          {emailError}
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '2px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            borderRadius: '4px',
            padding: '3px 8px',
            fontSize: '9.5px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          style={{
            background: 'var(--blue)',
            border: 'none',
            color: '#ffffff',
            borderRadius: '4px',
            padding: '3px 10px',
            fontSize: '9.5px',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          Save Contact
        </button>
      </div>
    </div>
  );
}
