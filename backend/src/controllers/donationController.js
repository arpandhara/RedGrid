import User from '../models/User.js';
import Request from '../models/Request.js';
import Donation from '../models/Donation.js';
import Notification from '../models/Notification.js';
import Inventory from '../models/Inventory.js';
import { v4 as uuidv4 } from 'uuid';
import PDFDocument from 'pdfkit';
import { getIO } from '../utils/socket.js';

// @desc    Verify Donor & Log Donation (Hospital only)
// @route   POST /api/donations/verify
export const verifyDonation = async (req, res) => {
  try {
    const { donorId, timestamp } = req.body;
    const hospitalId = req.user._id;

    // 1. Basic Validation
    if (!donorId) return res.status(400).json({ success: false, message: 'Invalid QR Code' });
    
    // Optional: Check timestamp to prevent replay attacks (QR valid for 5 mins)
    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() - timestamp > fiveMinutes) {
        // purely optional, skipping for demo simplicity
        // return res.status(400).json({ success: false, message: 'QR Code Expired' });
    }

    // 2. Find Donor
    const donor = await User.findById(donorId);
    if (!donor) return res.status(404).json({ success: false, message: 'Donor not found' });

    // 3. Check for Open Requests linked to this Donor
    // Logic update: If scanning a specific Donation Ticket, use that requestId.
    // If scanning general Digital ID, look for any pending acceptance.
    let linkedRequestId = null;
    let pendingRequest = null;

    if (req.body.requestId) {
        // Explicit link from Donation Ticket
        linkedRequestId = req.body.requestId;
        pendingRequest = await Request.findById(linkedRequestId);
        
        if (pendingRequest && pendingRequest.status !== 'fulfilled') {
             // Mark as fulfilled now that donor is here
             pendingRequest.status = 'fulfilled';
        }
    } else {
        // Implicit link (General Scan)
        pendingRequest = await Request.findOne({
            'acceptedBy.donorId': donorId,
            'acceptedBy.status': 'accepted',
            status: { $in: ['accepted', 'pending'] } // Look for active accepted requests
        }).sort({ createdAt: -1 });

        if (pendingRequest) {
            linkedRequestId = pendingRequest._id;
             // Mark as fulfilled
             pendingRequest.status = 'fulfilled';
        }
    }

    // 4. Create Donation Record
    const newDonation = await Donation.create({
        donor: donorId,
        hospital: hospitalId,
        bloodGroup: donor.donorProfile?.bloodGroup || 'Unknown',
        quantityUnits: 1, // Defaulting to 1 for now
        relatedRequestId: linkedRequestId,
        certificateId: `CERT-${uuidv4().split('-')[0].toUpperCase()}-${Date.now()}` 
    });

    // 5. Update Donor Stats
    await User.findByIdAndUpdate(donorId, {
        $set: { 
            'donorProfile.lastDonationDate': new Date(),
            // 'donorProfile.isAvailable': false // Disabled for testing/demo as per user request
        }
    });

    // 6. Update Hospital Inventory (Auto-Increment)
    if (newDonation.bloodGroup && newDonation.bloodGroup !== 'Unknown') {
        await Inventory.findOneAndUpdate(
            { hospital: hospitalId, bloodGroup: newDonation.bloodGroup },
            { $inc: { quantity: 1 }, $set: { lastUpdated: new Date() } },
            { upsert: true, new: true }
        );
    }

    // 6. Complete the specific acceptance sub-doc
    if (pendingRequest) {
        const acceptanceObj = pendingRequest.acceptedBy.find(a => a.donorId.toString() === donorId);
        if (acceptanceObj) {
            acceptanceObj.status = 'completed';
        }
        await pendingRequest.save();
    }

    // 7. Notify Donor
     await Notification.create({
      recipient: donorId,
      type: 'general',
      title: 'Donation Verified!',
      message: `Thank you for donating at ${req.user.hospitalProfile?.hospitalName || 'our hospital'}. Your certificate is being generated.`,
    });

    // 8. Emit Socket Event
    const io = getIO();
    io.to(donorId.toString()).emit('notification', {
        type: 'general',
        title: 'Donation Verified!',
        message: 'Your donation has been verified. Dashboard updated.',
        timestamp: new Date()
    });

    res.status(200).json({
        success: true,
        message: 'Donation Verified Successfully',
        data: {
            donationId: newDonation.certificateId,
            donorName: `${donor.firstName} ${donor.lastName}`,
            bloodGroup: donor.donorProfile?.bloodGroup,
            date: newDonation.donationDate
        }
    });

  } catch (error) {
    console.error('Verify Donation Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download Donation Certificate (PDF)
// @route   GET /api/donations/:id/certificate
export const downloadCertificate = async (req, res) => {
    try {
        const donationId = req.params.id;
        const userId = req.user._id;

        // 1. Fetch Donation with details
        const donation = await Donation.findById(donationId)
            .populate('donor', 'firstName lastName')
            .populate('hospital', 'hospitalProfile.hospitalName location');

        if (!donation) {
            return res.status(404).json({ success: false, message: 'Donation record not found' });
        }

        // 2. Authorization Check (Only Donor or Hospital involved can download)
        if (donation.donor._id.toString() !== userId.toString() && donation.hospital._id.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized to access this certificate' });
        }

        // 3. Generate PDF
        const doc = new PDFDocument({
            layout: 'landscape',
            size: 'A4',
            margin: 50
        });

        // Set Headers for Download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Certificate-${donation.certificateId}.pdf`);

        doc.pipe(res);

        // --- PREMIUM CERTIFICATE DESIGN ---

        // 1. Background Pattern (Subtle Watermark)
        doc.save();
        doc.translate(doc.page.width / 2, doc.page.height / 2);
        doc.rotate(-45);
        doc.fontSize(100).fillColor('#fce7f3').opacity(0.1).text('REDGRID VERIFIED', 0, 0, { align: 'center' });
        doc.restore();

        // 2. Ornate Border
        const margin = 20;
        const heavyBorder = 4;
        const innerMargin = 30;

        // Outer Dark Border
        doc.rect(margin, margin, doc.page.width - (margin * 2), doc.page.height - (margin * 2))
           .lineWidth(heavyBorder)
           .strokeColor('#18181b')
           .stroke();

        // Inner Red Border
        doc.rect(innerMargin, innerMargin, doc.page.width - (innerMargin * 2), doc.page.height - (innerMargin * 2))
           .lineWidth(1)
           .strokeColor('#ef4444')
           .stroke();

        // Corner Decorations (Top-Left)
        doc.moveTo(innerMargin, innerMargin + 40).lineTo(innerMargin, innerMargin).lineTo(innerMargin + 40, innerMargin).strokeColor('#ef4444').lineWidth(3).stroke();
        // Bottom-Right
        doc.moveTo(doc.page.width - innerMargin, doc.page.height - innerMargin - 40).lineTo(doc.page.width - innerMargin, doc.page.height - innerMargin).lineTo(doc.page.width - innerMargin - 40, doc.page.height - innerMargin).stroke();


        // 3. Header & Logo
        const centerX = doc.page.width / 2;
        
        doc.moveDown(2);
        doc.fontSize(40).font('Helvetica-Bold').fillColor('#ef4444').text('RedGrid', { align: 'center' });
        doc.fontSize(10).font('Helvetica').fillColor('#71717a').text('OFFICIAL BLOOD DONATION NETWORK', { align: 'center', letterSpacing: 4 });

        // 4. "CERTIFICATE OF APPRECIATION"
        doc.moveDown(2.5);
        doc.fontSize(32).font('Helvetica-Bold').fillColor('#000').text('CERTIFICATE', { align: 'center' });
        doc.fontSize(16).font('Helvetica').fillColor('#ef4444').text('OF APPRECIATION', { align: 'center', letterSpacing: 2 });

        // 5. Recipient Name (The Hero)
        doc.moveDown(2);
        doc.fontSize(12).font('Helvetica').fillColor('#52525b').text('THIS IS PROUDLY PRESENTED TO', { align: 'center' });
        
        doc.moveDown(1);
        doc.fontSize(36).font('Helvetica-Bold').fillColor('#18181b').text(`${donation.donor.firstName} ${donation.donor.lastName}`, { align: 'center' });
        
        // Underline Name
        const textWidth = doc.widthOfString(`${donation.donor.firstName} ${donation.donor.lastName}`);
        doc.moveTo(centerX - (textWidth/2) - 20, doc.y).lineTo(centerX + (textWidth/2) + 20, doc.y).strokeColor('#e4e4e7').lineWidth(1).stroke();

        // 6. Body Text
        doc.moveDown(1.5);
        const bodyText = `For their selfless act of donating blood (${donation.bloodGroup}) on ${new Date(donation.createdAt).toLocaleDateString()}, providing a lifeline to those in need and strengthening our community's health security.`;
        doc.fontSize(14).font('Helvetica').fillColor('#3f3f46').text(bodyText, { 
            align: 'center', 
            width: 500,
            align: 'center'
        });

        // 7. Verified Seal (Graphic)
        const sealY = 480;
        const sealX = 680;
        
        // Draw Seal Circle
        doc.circle(sealX, sealY, 40).fillColor('#ef4444').fill();
        doc.circle(sealX, sealY, 35).lineWidth(1).strokeColor('#fff').stroke();
        
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#fff').text('VERIFIED', sealX - 22, sealY - 5);
        doc.fontSize(8).text('DONATION', sealX - 22, sealY + 8);

        // 8. Signatures & Footer
        const footerY = 480;
        
        // Authorized Sig
        doc.moveTo(150, footerY).lineTo(350, footerY).strokeColor('#a1a1aa').lineWidth(1).stroke();
        doc.fontSize(10).fillColor('#a1a1aa').text('Authorized Signature', 150, footerY + 10, { width: 200, align: 'center' });
        doc.fontSize(12).fillColor('#18181b').text(donation.hospital.hospitalProfile.hospitalName, 150, footerY - 20, { width: 200, align: 'center' });

        // Date
        doc.moveTo(450, footerY).lineTo(600, footerY).stroke();
        doc.fontSize(10).fillColor('#a1a1aa').text('Date', 450, footerY + 10, { width: 150, align: 'center' });
        doc.fontSize(12).fillColor('#18181b').text(new Date().toLocaleDateString(), 450, footerY - 20, { width: 150, align: 'center' });

        doc.fontSize(8).fillColor('#d4d4d8').text(`ID: ${donation.certificateId}`, 20, doc.page.height - 30);

        doc.end();

    } catch (error) {
        console.error('Certificate Gen Error:', error);
        if (!res.headersSent) res.status(500).json({ success: false, message: 'Failed to generate certificate' });
    }
};

// @desc    Get Donor Stats & History
// @route   GET /api/donations/my-stats
export const getMyDonationStats = async (req, res) => {
    try {
        const donorId = req.user._id;

        const donations = await Donation.find({ donor: donorId })
            .sort({ createdAt: -1 })
            .populate('hospital', 'hospitalProfile.hospitalName location');

        const totalDonations = donations.length;
        const livesSaved = totalDonations * 3; // Approximation
        const lastDonation = donations.length > 0 ? donations[0].createdAt : null;

        res.status(200).json({
            success: true,
            data: {
                totalDonations,
                livesSaved,
                lastDonation,
                recentDonations: donations.slice(0, 10) // Increased limit for history page
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch stats" });
    }
};
