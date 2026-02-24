const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    // ==================== CORE ATTRIBUTES [Section 8 - 2 Marks] ====================
    // All events must store these attributes
    
    // Event Name [cite: 82]
    title: { 
        type: String, 
        required: true, // Always required, even for drafts
        trim: true,
        minlength: 3,
        maxlength: 100
    },
    
    // Event Description [cite: 82]
    description: { 
        type: String, 
        required: function() { return this.status === 'Published'; }, // Only required for published events
        minlength: 10,
        maxlength: 1000
    },
    
    // Event Type [Section 7 - cite: 74, 75]
    // Types: 'Normal' (Individual participation) OR 'Merchandise' (Individual purchase only)
    eventType: {
        type: String,
        enum: ['Normal', 'Merchandise'],
        required: function() { return this.status === 'Published'; } // Only required for published events
    },

    // Eligibility criteria for participation [cite: 82]
    eligibility: {
        type: String,
        enum: ['IIIT', 'NonIIIT', 'Everyone'],
        default: 'Everyone'
    },

    // Registration Deadline [cite: 82]
    registrationDeadline: {
        type: Date,
        required: function() { return this.status === 'Published'; } // Only required for published events
    },

    // Event Start Date [cite: 82]
    startDate: { 
        type: Date, 
        required: function() { return this.status === 'Published'; } // Only required for published events
    },

    // Event End Date [cite: 82]
    endDate: { 
        type: Date, 
        required: function() { return this.status === 'Published'; } // Only required for published events
    },

    // Registration Limit [cite: 82]
    registrationLimit: {
        type: Number,
        required: function() { return this.status === 'Published'; }, // Only required for published events
        min: 1
    },

    // Organizer ID [cite: 82]
    organizer: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },

    // Event Status [Section 9.9 - 4 Marks]
    // Controls visibility and editability of the event
    status: {
        type: String,
        enum: ['Draft', 'Published', 'Closed', 'Completed'],
        default: 'Draft'
    },

    // Event Tags [cite: 82]
    tags: [{
        type: String,
        trim: true,
        maxlength: 50
    }],

    // ==================== NORMAL EVENT SPECIFIC [cite: 82-83] ====================
    // Custom Registration Form (Dynamic Form Builder)
    registrationForm: {
        type: [{
            fieldName: {
                type: String,
                required: function() { return this.parent().parent().eventType === 'Normal'; }
            },
            fieldType: {
                type: String,
                enum: ['text', 'email', 'number', 'date', 'select', 'checkbox', 'textarea'],
                required: function() { return this.parent().parent().eventType === 'Normal'; }
            },
            isRequired: {
                type: Boolean,
                default: false
            },
            options: [String]  // For select/checkbox types
        }],
        required: function() { return this.eventType === 'Normal'; }
    },

    // Registration Fee [cite: 82]
    registrationFee: {
        type: Number,
        default: 0,
        required: function() { return this.eventType === 'Normal'; }
    },

    // Category for Normal events
    category: { 
        type: String,
        enum: ['Workshop', 'Talk', 'Competition', 'Other'],
        required: function() { return this.eventType === 'Normal'; }
    },

    // Location for Normal events
    location: { 
        type: String, 
        required: function() { return this.eventType === 'Normal'; }
    },

    // Capacity for Normal events
    capacity: { 
        type: Number, 
        required: function() { return this.eventType === 'Normal'; }
    },

    // ==================== MERCHANDISE SPECIFIC [cite: 82-83] ====================
    // Item Details with variants (size, color, etc.)
    merchandiseItems: {
        type: [{
            name: {
                type: String,
                required: function() { return this.parent().parent().eventType === 'Merchandise'; }
            },
            size: {
                type: [String],  // e.g., ['XS', 'S', 'M', 'L', 'XL', 'XXL']
                required: function() { return this.parent().parent().eventType === 'Merchandise'; }
            },
            color: {
                type: [String],  // e.g., ['Black', 'White', 'Red']
                required: function() { return this.parent().parent().eventType === 'Merchandise'; }
            },
            variants: [{
                size: String,
                color: String,
                stock: {
                    type: Number,
                    min: 0
                },
                price: {
                    type: Number,
                    required: true
                }
            }]
        }],
        required: function() { return this.eventType === 'Merchandise'; }
    },

    // Stock quantity total [cite: 82]
    totalStock: {
        type: Number,
        required: function() { return this.eventType === 'Merchandise'; }
    },

    // Configurable purchase limit per participant [cite: 82]
    purchaseLimitPerParticipant: {
        type: Number,
        default: 1,
        min: 1,
        required: function() { return this.eventType === 'Merchandise'; }
    },

    // Price for merchandise
    price: { 
        type: Number, 
        required: function() { return this.eventType === 'Merchandise'; }
    },

    // Merchandise type
    merchandiseType: { 
        type: String, 
        enum: ['T-Shirt', 'Hoodie', 'Kit', 'Other'],
        required: function() { return this.eventType === 'Merchandise'; }
    },

    // Quantity (total items available)
    quantity: { 
        type: Number, 
        required: function() { return this.eventType === 'Merchandise'; }
    },

    // Payment Instructions for Merchandise (Payment Approval Feature)
    paymentInstructions: {
        upiId: String,
        accountNumber: String,
        accountHolderName: String,
        additionalNotes: String // e.g., "Pay to club treasurer at Room 123"
    },

    // ==================== COMMON FIELDS ====================
    // Event Status
    status: {
        type: String,
        enum: ['Scheduled', 'Ongoing', 'Completed', 'Cancelled'],
        default: 'Scheduled'
    },

    // Registrations (populated later when users register)
    registrations: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Registration'
    }],

    // Timestamps
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// ==================== VALIDATION HOOKS ====================

// Pre-save validation
EventSchema.pre('save', function(next) {
    // Validate date logic
    if (this.registrationDeadline && this.startDate && this.registrationDeadline > this.startDate) {
        throw new Error('Registration deadline must be before event start date');
    }
    
    if (this.startDate && this.endDate && this.startDate > this.endDate) {
        throw new Error('Start date must be before end date');
    }

    // Validate event-type specific fields
    if (this.eventType === 'Normal') {
        if (!this.registrationForm || this.registrationForm.length === 0) {
            throw new Error('Normal events must have at least one registration form field');
        }
        if (this.registrationFee === undefined || this.registrationFee === null) {
            throw new Error('Normal events must have a registration fee');
        }
    }

    if (this.eventType === 'Merchandise') {
        if (!this.merchandiseItems || this.merchandiseItems.length === 0) {
            throw new Error('Merchandise events must have at least one merchandise item');
        }
        if (this.purchaseLimitPerParticipant === undefined || this.purchaseLimitPerParticipant === null) {
            throw new Error('Merchandise events must have a purchase limit per participant');
        }
    }

    // Update timestamp
    this.updatedAt = Date.now();
    next();
});

// Instance method to check if a participant can purchase more merchandise
EventSchema.methods.canPurchaseMore = function(currentPurchaseCount) {
    if (this.eventType !== 'Merchandise') return false;
    return currentPurchaseCount < this.purchaseLimitPerParticipant;
};

// Instance method to get available stock
EventSchema.methods.getAvailableStock = function() {
    if (this.eventType !== 'Merchandise') return 0;
    return this.merchandiseItems.reduce((total, item) => {
        return total + item.variants.reduce((itemTotal, variant) => itemTotal + variant.stock, 0);
    }, 0);
};

module.exports = mongoose.model('Event', EventSchema);
