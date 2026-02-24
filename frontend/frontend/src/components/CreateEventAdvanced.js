import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/CreateEventAdvanced.css';

const CreateEventAdvanced = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [eventType, setEventType] = useState('Normal');

    // ==================== CORE FIELDS ====================
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        eligibility: 'Everyone',
        registrationDeadline: '',
        startDate: '',
        endDate: '',
        registrationLimit: '',
        tags: ''
    });

    // ==================== NORMAL EVENT FIELDS ====================
    const [normalFields, setNormalFields] = useState({
        category: 'Workshop',
        location: '',
        capacity: '',
        registrationFee: 0,
        registrationForm: []
    });

    // ==================== MERCHANDISE EVENT FIELDS ====================
    const [merchandiseFields, setMerchandiseFields] = useState({
        merchandiseType: 'T-Shirt',
        price: '',
        quantity: '',
        totalStock: '',
        purchaseLimitPerParticipant: 1,
        merchandiseItems: [
            {
                name: 'T-Shirt Bundle',  // Add merchandise item name
                size: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
                color: ['Black', 'White'],
                variants: []
            }
        ]
    });

    // ==================== DYNAMIC FORM BUILDER ====================
    const [currentFormField, setCurrentFormField] = useState({
        fieldName: '',
        fieldType: 'text',
        isRequired: false,
        options: ''
    });

    // ==================== HANDLERS ====================

    const handleCoreChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNormalChange = (e) => {
        const { name, value } = e.target;
        setNormalFields(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleMerchandiseChange = (e) => {
        const { name, value } = e.target;
        setMerchandiseFields(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Update merchandise item name
    const updateMerchandiseItemName = (value) => {
        setMerchandiseFields(prev => ({
            ...prev,
            merchandiseItems: [{
                ...prev.merchandiseItems[0],
                name: value
            }]
        }));
    };

    // Add field to registration form
    const addFormField = () => {
        if (!currentFormField.fieldName || !currentFormField.fieldType) {
            alert('Please fill in field name and type');
            return;
        }

        const newField = {
            fieldName: currentFormField.fieldName,
            fieldType: currentFormField.fieldType,
            isRequired: currentFormField.isRequired,
            options: currentFormField.fieldType === 'select' || currentFormField.fieldType === 'checkbox'
                ? currentFormField.options.split(',').map(opt => opt.trim())
                : []
        };

        setNormalFields(prev => ({
            ...prev,
            registrationForm: [...prev.registrationForm, newField]
        }));

        setCurrentFormField({
            fieldName: '',
            fieldType: 'text',
            isRequired: false,
            options: ''
        });
    };

    // Remove form field
    const removeFormField = (index) => {
        setNormalFields(prev => ({
            ...prev,
            registrationForm: prev.registrationForm.filter((_, i) => i !== index)
        }));
    };

    // Add merchandise variant
    const addMerchandiseVariant = () => {
        const item = merchandiseFields.merchandiseItems[0];
        
        const newVariant = {
            size: 'M',
            color: 'Black',
            stock: 0,
            price: merchandiseFields.price
        };

        setMerchandiseFields(prev => ({
            ...prev,
            merchandiseItems: [{
                ...item,
                variants: [...item.variants, newVariant]
            }]
        }));
    };

    const updateVariant = (index, field, value) => {
        const item = merchandiseFields.merchandiseItems[0];
        const variants = [...item.variants];
        variants[index] = {
            ...variants[index],
            [field]: field === 'stock' || field === 'price' ? parseInt(value) : value
        };

        setMerchandiseFields(prev => ({
            ...prev,
            merchandiseItems: [{
                ...item,
                variants
            }]
        }));
    };

    const removeVariant = (index) => {
        const item = merchandiseFields.merchandiseItems[0];
        setMerchandiseFields(prev => ({
            ...prev,
            merchandiseItems: [{
                ...item,
                variants: item.variants.filter((_, i) => i !== index)
            }]
        }));
    };

    // ==================== SUBMIT HANDLER ====================

    const handleSubmit = async (e, status = 'Published') => {
        e.preventDefault();

        try {
            // For drafts, only require a title
            if (status === 'Draft') {
                if (!formData.title) {
                    alert('Please provide at least a title to save as draft');
                    return;
                }
            } else {
                // For published events, validate all required fields
                if (!formData.title || !formData.description || !formData.registrationDeadline || !formData.startDate || !formData.endDate) {
                    alert('Please fill in all core required fields');
                    return;
                }
            }

            const startDate = new Date(formData.startDate);
            const endDate = new Date(formData.endDate);
            const deadline = new Date(formData.registrationDeadline);

            // Only validate dates for published events
            if (status === 'Published') {
                if (deadline >= startDate) {
                    alert('Registration deadline must be before event start date');
                    return;
                }

                if (startDate >= endDate) {
                    alert('Start date must be before end date');
                    return;
                }
            }

            let payload = {
                title: formData.title,
                description: formData.description,
                eventType,
                eligibility: formData.eligibility,
                registrationDeadline: formData.registrationDeadline,
                startDate: formData.startDate,
                endDate: formData.endDate,
                registrationLimit: parseInt(formData.registrationLimit) || 1000,
                tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
                status // Add the status to the payload
            };

            if (eventType === 'Normal') {
                // For published events, validate form fields
                if (status === 'Published') {
                    if (normalFields.registrationForm.length === 0) {
                        alert('Please add at least one registration form field');
                        return;
                    }

                    if (!normalFields.location || !normalFields.capacity) {
                        alert('Please fill in location and capacity for Normal events');
                        return;
                    }
                }

                payload = {
                    ...payload,
                    category: normalFields.category,
                    location: normalFields.location,
                    capacity: parseInt(normalFields.capacity) || 0,
                    registrationFee: parseInt(normalFields.registrationFee) || 0,
                    registrationForm: normalFields.registrationForm
                };
            }

            if (eventType === 'Merchandise') {
                // For published events, validate merchandise fields
                if (status === 'Published') {
                    if (!merchandiseFields.price || !merchandiseFields.quantity || !merchandiseFields.totalStock) {
                        alert('Please fill in price, quantity, and total stock');
                        return;
                    }

                    if (merchandiseFields.merchandiseItems[0].variants.length === 0) {
                        alert('Please add at least one merchandise variant');
                        return;
                    }
                }

                payload = {
                    ...payload,
                    merchandiseType: merchandiseFields.merchandiseType,
                    price: parseInt(merchandiseFields.price),
                    quantity: parseInt(merchandiseFields.quantity),
                    totalStock: parseInt(merchandiseFields.totalStock),
                    purchaseLimitPerParticipant: parseInt(merchandiseFields.purchaseLimitPerParticipant),
                    merchandiseItems: merchandiseFields.merchandiseItems
                };
            }

            await axios.post('/api/events/create', payload, {
                headers: { 'x-auth-token': token }
            });

            alert(`Event ${status === 'Draft' ? 'saved as draft' : 'published'} successfully!`);
            navigate('/dashboard');
        } catch (err) {
            console.error(err.response?.data || err.message);
            alert(err.response?.data?.msg || 'Error creating event');
        }
    };

    return (
        <div className="create-event-advanced">
            <div className="container">
                <h2>Create Event [Section 8 - Event Attributes]</h2>

                <form onSubmit={handleSubmit}>
                    {/* ==================== CORE SECTION ==================== */}
                    <div className="form-section">
                        <h3>📋 Core Event Information</h3>

                        <div className="form-group">
                            <label>Event Name *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleCoreChange}
                                placeholder="e.g., React Workshop, Felicity T-Shirt"
                                maxLength="100"
                                required
                            />
                            <small>{formData.title.length}/100 characters</small>
                        </div>

                        <div className="form-group">
                            <label>Event Description *</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleCoreChange}
                                placeholder="e.g., Learn React fundamentals including hooks, context, and state management"
                                minLength="10"
                                maxLength="1000"
                                rows="4"
                                required
                            />
                            <small>{formData.description.length}/1000 characters</small>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Event Type *</label>
                                <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
                                    <option value="Normal">Normal (Workshop/Talk/Competition)</option>
                                    <option value="Merchandise">Merchandise (T-Shirt/Hoodie/Kit)</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Eligibility *</label>
                                <select name="eligibility" value={formData.eligibility} onChange={handleCoreChange}>
                                    <option value="Everyone">Everyone</option>
                                    <option value="IIIT">IIIT Students Only</option>
                                    <option value="NonIIIT">Non-IIIT Students Only</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Registration Deadline *</label>
                                <input
                                    type="datetime-local"
                                    name="registrationDeadline"
                                    value={formData.registrationDeadline}
                                    onChange={handleCoreChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Event Start Date *</label>
                                <input
                                    type="datetime-local"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleCoreChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Event End Date *</label>
                                <input
                                    type="datetime-local"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleCoreChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Registration Limit *</label>
                                <input
                                    type="number"
                                    name="registrationLimit"
                                    value={formData.registrationLimit}
                                    onChange={handleCoreChange}
                                    placeholder="e.g., 50"
                                    min="1"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Event Tags</label>
                            <input
                                type="text"
                                name="tags"
                                value={formData.tags}
                                onChange={handleCoreChange}
                                placeholder="e.g., React, Workshop, Beginner-Friendly (comma separated)"
                            />
                        </div>
                    </div>

                    {/* ==================== NORMAL EVENT SECTION ==================== */}
                    {eventType === 'Normal' && (
                        <div className="form-section">
                            <h3>📚 Normal Event Details</h3>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Category *</label>
                                    <select name="category" value={normalFields.category} onChange={handleNormalChange}>
                                        <option value="Workshop">Workshop</option>
                                        <option value="Talk">Talk</option>
                                        <option value="Competition">Competition</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Location *</label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={normalFields.location}
                                        onChange={handleNormalChange}
                                        placeholder="e.g., Lab Building A, Room 101 or https://zoom.us/..."
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Event Capacity *</label>
                                    <input
                                        type="number"
                                        name="capacity"
                                        value={normalFields.capacity}
                                        onChange={handleNormalChange}
                                        placeholder="e.g., 50"
                                        min="1"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Registration Fee (₹)</label>
                                    <input
                                        type="number"
                                        name="registrationFee"
                                        value={normalFields.registrationFee}
                                        onChange={handleNormalChange}
                                        placeholder="e.g., 100 (0 for free)"
                                        min="0"
                                    />
                                </div>
                            </div>

                            {/* Dynamic Registration Form Builder */}
                            <div className="form-group">
                                <h4>📝 Dynamic Registration Form Builder *</h4>
                                <p className="help-text">Create custom fields that participants must fill when registering</p>

                                <div className="form-builder-container">
                                    <div className="form-builder-input">
                                        <input
                                            type="text"
                                            placeholder="Field Name (e.g., Full Name, Email)"
                                            value={currentFormField.fieldName}
                                            onChange={(e) => setCurrentFormField(prev => ({
                                                ...prev,
                                                fieldName: e.target.value
                                            }))}
                                        />

                                        <select
                                            value={currentFormField.fieldType}
                                            onChange={(e) => setCurrentFormField(prev => ({
                                                ...prev,
                                                fieldType: e.target.value,
                                                options: ''
                                            }))}
                                        >
                                            <option value="text">Text</option>
                                            <option value="email">Email</option>
                                            <option value="number">Number</option>
                                            <option value="date">Date</option>
                                            <option value="select">Select (Dropdown)</option>
                                            <option value="checkbox">Checkbox (Multiple)</option>
                                            <option value="textarea">Textarea</option>
                                        </select>

                                        {(currentFormField.fieldType === 'select' || currentFormField.fieldType === 'checkbox') && (
                                            <input
                                                type="text"
                                                placeholder="Options (comma separated: Option1, Option2)"
                                                value={currentFormField.options}
                                                onChange={(e) => setCurrentFormField(prev => ({
                                                    ...prev,
                                                    options: e.target.value
                                                }))}
                                            />
                                        )}

                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={currentFormField.isRequired}
                                                onChange={(e) => setCurrentFormField(prev => ({
                                                    ...prev,
                                                    isRequired: e.target.checked
                                                }))}
                                            />
                                            Required Field
                                        </label>

                                        <button type="button" onClick={addFormField} className="btn-add">
                                            Add Field
                                        </button>
                                    </div>

                                    <div className="form-preview">
                                        <h5>Form Preview:</h5>
                                        {normalFields.registrationForm.length === 0 ? (
                                            <p className="empty">No fields added yet</p>
                                        ) : (
                                            <div className="field-list">
                                                {normalFields.registrationForm.map((field, index) => (
                                                    <div key={index} className="field-item">
                                                        <div className="field-info">
                                                            <strong>{field.fieldName}</strong>
                                                            <span className="field-type">{field.fieldType}</span>
                                                            {field.isRequired && <span className="required">*</span>}
                                                            {field.options.length > 0 && (
                                                                <span className="options">{field.options.join(', ')}</span>
                                                            )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFormField(index)}
                                                            className="btn-remove"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ==================== MERCHANDISE EVENT SECTION ==================== */}
                    {eventType === 'Merchandise' && (
                        <div className="form-section">
                            <h3>🛍️ Merchandise Details</h3>

                            <div className="form-group">
                                <label>Merchandise Item Name *</label>
                                <input
                                    type="text"
                                    value={merchandiseFields.merchandiseItems[0].name}
                                    onChange={(e) => updateMerchandiseItemName(e.target.value)}
                                    placeholder="e.g., Felicity T-Shirt Bundle"
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Merchandise Type *</label>
                                    <select name="merchandiseType" value={merchandiseFields.merchandiseType} onChange={handleMerchandiseChange}>
                                        <option value="T-Shirt">T-Shirt</option>
                                        <option value="Hoodie">Hoodie</option>
                                        <option value="Kit">Kit</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Price per Item (₹) *</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={merchandiseFields.price}
                                        onChange={handleMerchandiseChange}
                                        placeholder="e.g., 399"
                                        min="0"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Total Quantity *</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={merchandiseFields.quantity}
                                        onChange={handleMerchandiseChange}
                                        placeholder="e.g., 500"
                                        min="1"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Total Stock *</label>
                                    <input
                                        type="number"
                                        name="totalStock"
                                        value={merchandiseFields.totalStock}
                                        onChange={handleMerchandiseChange}
                                        placeholder="e.g., 500"
                                        min="1"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Purchase Limit per Participant</label>
                                    <input
                                        type="number"
                                        name="purchaseLimitPerParticipant"
                                        value={merchandiseFields.purchaseLimitPerParticipant}
                                        onChange={handleMerchandiseChange}
                                        placeholder="e.g., 3"
                                        min="1"
                                    />
                                </div>
                            </div>

                            {/* Merchandise Variants */}
                            <div className="form-group">
                                <h4>📦 Merchandise Variants (Size, Color, Stock, Price)</h4>

                                <div className="variants-container">
                                    {merchandiseFields.merchandiseItems[0].variants.length === 0 ? (
                                        <p className="empty">No variants added yet. Click "Add Variant" to start.</p>
                                    ) : (
                                        <table className="variants-table">
                                            <thead>
                                                <tr>
                                                    <th>Size</th>
                                                    <th>Color</th>
                                                    <th>Stock</th>
                                                    <th>Price (₹)</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {merchandiseFields.merchandiseItems[0].variants.map((variant, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            <select
                                                                value={variant.size}
                                                                onChange={(e) => updateVariant(index, 'size', e.target.value)}
                                                            >
                                                                {merchandiseFields.merchandiseItems[0].size.map(size => (
                                                                    <option key={size} value={size}>{size}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <select
                                                                value={variant.color}
                                                                onChange={(e) => updateVariant(index, 'color', e.target.value)}
                                                            >
                                                                {merchandiseFields.merchandiseItems[0].color.map(color => (
                                                                    <option key={color} value={color}>{color}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                value={variant.stock}
                                                                onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                                                                min="0"
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                value={variant.price}
                                                                onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                                                min="0"
                                                            />
                                                        </td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeVariant(index)}
                                                                className="btn-remove-small"
                                                            >
                                                                Remove
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}

                                    <button type="button" onClick={addMerchandiseVariant} className="btn-add">
                                        + Add Variant
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ==================== SUBMIT SECTION ==================== */}
                    <div className="form-section form-actions">
                        <button type="button" onClick={(e) => handleSubmit(e, 'Draft')} className="btn-draft">
                            Save as Draft
                        </button>
                        <button type="submit" onClick={(e) => handleSubmit(e, 'Published')} className="btn-submit">
                            Publish Event
                        </button>
                        <button type="button" onClick={() => navigate('/dashboard')} className="btn-cancel">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEventAdvanced;
