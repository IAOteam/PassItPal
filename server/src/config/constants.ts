export const OTP_EXPIRY_MINUTES = 10; // OTP valid for 10 minutes
export const EMAIL_VERIFICATION_SUBJECT = 'PassItPal: Verify Your Email Address';
export const MOBILE_VERIFICATION_SUBJECT = 'PassItPal: Verify Your Mobile Number';
export const SMS_VERIFICATION_MESSAGE = "Your PassItPal verification OTP is: ";
export const OTP_LENGTH = parseInt(process.env.OTP_LENGTH || '6');


export const LISTING_STATUS = {
    ACTIVE: 'active',
    PENDING: 'pending',
    SOLD: 'sold',
    EXPIRED: 'expired',
    DRAFT: 'draft'
};

export const ORDER_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

export const PAYMENT_STATUS = {
    PENDING: 'pending',
    PAID: 'paid', // Changed 'completed' to 'paid' 
    FAILED: 'failed',
    REFUNDED: 'refunded'
};
export const NOTIFICATION_TYPES = {
    LISTING_CREATED: 'listing_created',
    LISTING_UPDATED: 'listing_updated',
    LISTING_DELETED: 'listing_deleted',
    NEW_ORDER: 'new_order',
    ORDER_STATUS_UPDATE: 'order_status_update',
    // will add more as needed
};