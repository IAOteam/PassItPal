// server/src/models/Report.ts
import mongoose, { Document, Schema, Types } from 'mongoose';

export type ReportStatus = 'open' | 'under_review' | 'resolved_no_action' | 'resolved_action_taken';
export type ContentType = 'Listing' | 'User';

export interface IReport extends Document {
  reporter: Types.ObjectId; // User who submitted the report
  reportedContentId: Types.ObjectId; // The ID of the listing or user being reported
  reportedContentType: ContentType; // Specifies if it's a 'Listing' or 'User'
  reason: string; // The category of the report (e.g., 'scam', 'harassment')
  details?: string; // Additional text from the reporter
  status: ReportStatus; // The current status of the report
  adminNotes?: string; // Notes from the admin who handled the report
}

const ReportSchema: Schema = new Schema({
  reporter: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reportedContentId: {
    type: Schema.Types.ObjectId,
    required: true,
    // This ref will be dynamic based on the reportedContentType
  },
  reportedContentType: {
    type: String,
    enum: ['Listing', 'User'],
    required: true,
  },
  reason: {
    type: String,
    required: true,
    enum: [ // Predefined reasons for consistency
      'Misleading or Inaccurate Information',
      'Potential Scam or Fraud',
      'Inappropriate Content or Harassment',
      'Spam',
      'Item Not As Described',
      'Other'
    ],
  },
  details: {
    type: String,
    trim: true,
    maxlength: 2000,
  },
  status: {
    type: String,
    enum: ['open', 'under_review', 'resolved_no_action', 'resolved_action_taken'],
    default: 'open',
  },
  adminNotes: {
    type: String,
    trim: true,
  }
}, {
  timestamps: true,
});

// Index to help admins find open reports quickly
ReportSchema.index({ status: 1, createdAt: -1 });


const Report = mongoose.model<IReport>('Report', ReportSchema);

export default Report;