import Report from '../models/Report';
import User from '../models/User';
import Listing from '../models/Listing';
import { NotificationService } from './notification.service';

class HttpError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

export class ReportService {
    /**
     * Submits a report against a user or a listing.
     * @param reporterId The ID of the user submitting the report.
     * @param reporterUsername The username of the user submitting the report.
     * @param contentType The type of content being reported ('User' or 'Listing').
     * @param contentId The ID of the content being reported.
     * @param reason The reason for the report.
     * @param details Additional details about the report.
     */
    public static async submitReport(
        reporterId: string,
        reporterUsername: string,
        contentType: 'User' | 'Listing',
        contentId: string,
        reason: string,
        details: string
    ): Promise<void> {
        // 1. Validate the content being reported
        let contentExists = null;
        if (contentType === 'Listing') {
            contentExists = await Listing.findById(contentId);
        } else if (contentType === 'User') {
            if (reporterId === contentId) {
                throw new HttpError("You cannot report yourself.", 400);
            }
            contentExists = await User.findById(contentId);
        } else {
            throw new HttpError(`Invalid content type "${contentType}" for reporting.`, 400);
        }

        if (!contentExists) {
            throw new HttpError(`The ${contentType} you are trying to report does not exist.`, 404);
        }

        // 2. Create and save the new report
        const newReport = new Report({
            reporter: reporterId,
            reportedContentType: contentType,
            reportedContentId: contentId,
            reason,
            details,
        });
        await newReport.save();

        // 3. Notify all admins
        const admins = await User.find({ role: 'admin' }).select('_id');
        const notificationPromises = admins.map(admin =>
            NotificationService.createAndEmitNotification(
                admin._id.toString(),
                'admin_alert',
                `New report by ${reporterUsername} for ${contentType}. Reason: ${reason}`,
                { type: 'profile', id: admin._id.toString() } // Link to admin dashboard/reports page
            )
        );
        await Promise.all(notificationPromises);
    }
}
