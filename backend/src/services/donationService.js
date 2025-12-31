import Donation from '../models/Donation.js';
import User from '../models/User.js';
import Inventory from '../models/Inventory.js';
import Notification from '../models/Notification.js';
import { v4 as uuidv4 } from 'uuid';
import { getIO } from '../utils/socket.js';

/**
 * Process a successful donation:
 * 1. Create Donation Record
 * 2. Update Donor Stats (Last Donation, Count)
 * 3. Award Badges (Gamification)
 * 4. Award Points (Gamification)
 * 5. Update Inventory (if Hospital verified)
 */
export const processDonation = async ({ donorId, verifierId, requestId, bloodGroup, donationType }) => {
    
    // 1. Fetch Donor
    const donor = await User.findById(donorId);
    if (!donor) throw new Error('Donor not found');

    const verifier = await User.findById(verifierId);

    // 2. Create Donation Record
    const newDonation = await Donation.create({
        donor: donorId,
        hospital: verifierId, // The entity marking it done (Hospital/Org/User)
        bloodGroup: bloodGroup || donor.donorProfile?.bloodGroup || 'Unknown',
        quantityUnits: 1,
        relatedRequestId: requestId,
        donationType: donationType || 'HOSPITAL', // Default
        certificateId: `CERT-${uuidv4().split('-')[0].toUpperCase()}-${Date.now()}`
    });

    // 3. Update Donor Stats
    await User.findByIdAndUpdate(donorId, {
        $set: { 
            'donorProfile.lastDonationDate': new Date()
        }
    });

    // 4. Update Inventory (Only if Verifier is Hospital/Organization)
    if (verifier && (verifier.role === 'hospital' || verifier.role === 'organization')) {
        if (newDonation.bloodGroup !== 'Unknown') {
            const updatedInventory = await Inventory.findOneAndUpdate(
                { hospital: verifierId, bloodGroup: newDonation.bloodGroup },
                { $inc: { quantity: 1 }, $set: { lastUpdated: new Date() } },
                { upsert: true, new: true }
            );

            // Socket: Inventory Update
            const io = getIO();
            io.to(verifierId.toString()).emit('inventory_update', {
                bloodGroup: newDonation.bloodGroup,
                quantity: updatedInventory.quantity
            });
        }
    }

    // 5. Gamification: Badges
    const totalDonations = await Donation.countDocuments({ donor: donorId });
    const BADGES = {
        1: { code: 'FIRST_DROP', name: 'First Drop', description: 'Your journey as a hero begins.', icon: 'droplet' },
        5: { code: 'LIFE_SAVER', name: 'Life Saver', description: '5 donations. You are making a habit of saving lives.', icon: 'heart' },
        10: { code: 'GUARDIAN', name: 'Guardian', description: '10 donations. A true protector of the community.', icon: 'shield' },
        25: { code: 'LEGEND', name: 'Legend', description: '25 donations. Your impact is immeasurable.', icon: 'crown' }
    };

    const io = getIO();

    if (BADGES[totalDonations]) {
        const badge = BADGES[totalDonations];
        const hasBadge = donor.donorProfile.badges.some(b => b.code === badge.code);
        
        if (!hasBadge) {
            await User.findByIdAndUpdate(donorId, {
                $push: { 'donorProfile.badges': badge }
            });

            // Socket: Badge Unlocked
            io.to(donorId.toString()).emit('badge_unlocked', { ...badge, earnedAt: new Date() });

            // Notification
            await Notification.create({
                recipient: donorId,
                type: 'system',
                title: `🏆 Badge Unlocked: ${badge.name}`,
                message: badge.description,
            });
        }
    }

    // 6. Gamification: Points
    let pointsAwarded = 0;
    // Award points ONLY for Hospital/Camp donations (Verified)
    // P2P/Family donations do not get points as per policy.
    if (donationType === 'HOSPITAL' || donationType === 'CAMP') {
        pointsAwarded = 50;
    } 

    if (pointsAwarded > 0) {
        await User.findByIdAndUpdate(donorId, {
            $inc: { 'donorProfile.points': pointsAwarded },
            $push: { 
                'donorProfile.pointsHistory': {
                    reason: `Donation Verified`,
                    change: pointsAwarded,
                    date: new Date()
                }
            }
        });

        // Socket: Points Update
        io.to(donorId.toString()).emit('points_update', {
            points: pointsAwarded,
            totalPoints: (donor.donorProfile.points || 0) + pointsAwarded,
            message: `You earned ${pointsAwarded} points!`
        });
    }

    // 7. General Notification to Donor
    await Notification.create({
        recipient: donorId,
        type: 'general',
        title: 'Donation Verified!',
        message: `Your donation has been confirmed. You earned ${pointsAwarded} points.`,
    });
    
    io.to(donorId.toString()).emit('notification', {
        type: 'general',
        title: 'Donation Verified!',
        message: 'Your donation has been verified. Dashboard updated.',
        timestamp: new Date()
    });

    return newDonation;
};
