// server/src/controllers/reportController.ts
import { Request, Response } from 'express';
import Report from '../models/Report';
import User from '../models/User';
import Listing from '../models/Listing';
import { createAndEmitNotification } from './notificationController';
import mongoose from 'mongoose';

// @route   POST /api/reports/:contentType/:contentId
// @desc    Submit a report against a listing or a user
// @access  Private
export const submitReport = async (req: Request, res: Response) => {
  const { contentType, contentId } = req.params;
  const { reason, details } = req.body;
  const reporterId = req.user?._id;

  if (!reporterId) {
    return res.status(401).json({ message: 'User not authenticated.' });
  }

  try {
    // 1. Validate the content being reported actually exists
    let contentExists = null;
    if (contentType === 'Listing') {
      contentExists = await Listing.findById(contentId);
    } else if (contentType === 'User') {
      contentExists = await User.findById(contentId);
      // Prevent users from reporting themselves
      if (reporterId.toString() === contentId) {
          return res.status(400).json({ message: "You cannot report yourself." });
      }
    }

    if (!contentExists) {
      return res.status(404).json({ message: `The ${contentType} you are trying to report does not exist.` });
    }

    // 2. Create the new report
    const newReport = new Report({
      reporter: reporterId,
      reportedContentType: contentType,
      reportedContentId: contentId,
      reason,
      details
    });

    await newReport.save();

    // 3. Notify all admins about the new report
    const admins = await User.find({ role: 'admin' }).select('_id');
    if (admins.length > 0) {
      const notificationPromises = admins.map(admin => 
        createAndEmitNotification(
          admin._id.toString(),
          'admin_alert', // A specific type for admin notifications
          `New report submitted for ${contentType} by ${req.user?.username}. Reason: ${reason}`,
          { type: 'profile', id: admin._id.toString() } // Link object as required by notification system
        )
      );
      await Promise.all(notificationPromises);
    }

    res.status(201).json({ message: 'Your report has been submitted successfully. Our team will review it shortly.' });

  } catch (error: any) {
    console.error('Error submitting report:', error);
    res.status(500).json({ message: 'Server error while submitting report.' });
  }
};