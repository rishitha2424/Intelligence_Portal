import React, { useState, useEffect, useRef } from 'react';

export default function GenericFormModal({
  isOpen,
  onClose,
  onSubmit,
  title = "Form Submission",
  initialData = {}
}) {
  const [formData, setFormData] = useState(() => ({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    companyName: initialData?.companyName || '',
    requirements: initialData?.requirements || ''
  }));
  const [errors, setErrors] = useState({});

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setFormData({
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      companyName: initialData?.companyName || '',
      requirements: initialData?.requirements || ''
    });
    setErrors({});
  }, [initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.requirements.trim()) newErrors.requirements = 'Requirements / Description is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
      onClose();
    }
  };

  return (
    <div className="generic-modal-overlay" onClick={(e) => e.target.className === 'generic-modal-overlay' && onClose()}>
      <div className="generic-modal-card">
        <div className="generic-modal-header">
          <h3 className="generic-modal-title">{title}</h3>
          <button className="generic-modal-close-btn" onClick={onClose} aria-label="Close modal">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="generic-modal-form">
          <div className="form-group">
            <label htmlFor="form-name">Name <span className="required-star">*</span></label>
            <input
              type="text"
              id="form-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
              className={errors.name ? 'input-error' : ''}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="form-email">Email Address <span className="required-star">*</span></label>
            <input
              type="email"
              id="form-email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@company.com"
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="form-phone">Phone Number</label>
            <input
              type="tel"
              id="form-phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div className="form-group">
            <label htmlFor="form-company">Company Name <span className="required-star">*</span></label>
            <input
              type="text"
              id="form-company"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Company Inc."
              className={errors.companyName ? 'input-error' : ''}
            />
            {errors.companyName && <span className="error-text">{errors.companyName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="form-requirements">Requirements / Description <span className="required-star">*</span></label>
            <textarea
              id="form-requirements"
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              placeholder="Provide details about requirements..."
              rows="4"
              className={errors.requirements ? 'input-error' : ''}
            ></textarea>
            {errors.requirements && <span className="error-text">{errors.requirements}</span>}
          </div>

          <div className="generic-modal-footer">
            <button type="button" className="form-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="form-btn-submit">Submit Details</button>
          </div>
        </form>
      </div>
    </div>
  );
}
