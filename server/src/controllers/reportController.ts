import { Request, Response } from 'express';
import { ReportService } from '../services/report.service';

const sendSuccess = (res: Response, message: string, data: object = {}, statusCode = 200) => {
    res.status(statusCode).json({ message, ...data });
};

const sendError = (res: Response, error: any, defaultMessage: string) => {
    console.error(`Error in ReportController: ${error.message}`);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || defaultMessage });
};

/**
 * @route   POST /api/reports/:contentType/:contentId
 * @desc    Submit a report against a listing or a user
 * @access  Private
 */
export const submitReport = async (req: Request, res: Response) => {
    try {
        const { contentType, contentId } = req.params;
        const { reason, details } = req.body;
        const reporterId = req.user?._id.toString();
        const reporterUsername = req.user?.username;

        if (!reporterId || !reporterUsername) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }

        await ReportService.submitReport(
            reporterId,
            reporterUsername,
            contentType as 'User' | 'Listing',
            contentId,
            reason,
            details
        );

        sendSuccess(res, 'Your report has been submitted successfully. Our team will review it shortly.', {}, 201);

    } catch (error: any) {
        sendError(res, error, 'Server error while submitting report.');
    }
};
