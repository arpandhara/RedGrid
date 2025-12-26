import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ShieldCheck, Loader2 } from 'lucide-react';

const VerifyDonation = () => {
  const [scanResult, setScanResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationData, setVerificationData] = useState(null);

  useEffect(() => {
    // Initialize Scanner
    // We put this in a timeout to ensure DOM element exists
    const timer = setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );
    
        scanner.render(onScanSuccess, onScanFailure);
    
        function onScanSuccess(decodedText, decodedResult) {
            scanner.clear(); // Stop scanning on success
            setScanResult(decodedText);
            handleVerify(decodedText);
        }
    
        function onScanFailure(error) {
            // handle scan failure, usually better to ignore and keep scanning.
            // console.warn(`Code scan error = ${error}`);
        }

        return () => {
            scanner.clear();
        };
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleVerify = async (textInfo) => {
    setVerifying(true);
    try {
        const payload = JSON.parse(textInfo);
        
        // Call Backend to Verify
        const res = await api.post('/donations/verify', { 
            donorId: payload.donorId,
            timestamp: payload.timestamp 
        });

        setVerificationData(res.data.data);
        toast.success("Donor Verified Successfully!");

    } catch (error) {
        console.error(error);
        toast.error("Invalid QR Code or Verification Failed");
        setScanResult(null); // Reset to try again? 
        // In a real app, you might want a "Try Again" button instead of auto-resetting scanner
    } finally {
        setVerifying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <ShieldCheck className="text-green-500" size={32} />
            Verify Donor
        </h1>
        <p className="text-zinc-400">Scan the donor's Digital ID to log a donation.</p>
      </div>

      {!verificationData ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
             <div id="reader" className="overflow-hidden rounded-xl border-2 border-dashed border-zinc-700"></div>
             {verifying && (
                 <div className="mt-4 flex items-center justify-center gap-2 text-zinc-300">
                     <Loader2 className="animate-spin" /> Verifying...
                 </div>
             )}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                <ShieldCheck size={40} />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Verification Successful</h2>
            <p className="text-zinc-400 mb-6">Donation has been logged.</p>

            <div className="bg-zinc-900/80 p-6 rounded-xl text-left space-y-3 mb-8">
                <div>
                     <p className="text-xs text-zinc-500 uppercase tracking-wider">Donor Name</p>
                     <p className="text-white font-medium text-lg">{verificationData.donorName}</p>
                </div>
                <div>
                     <p className="text-xs text-zinc-500 uppercase tracking-wider">Blood Group</p>
                     <p className="text-red-500 font-bold text-xl">{verificationData.bloodGroup}</p>
                </div>
                 <div>
                     <p className="text-xs text-zinc-500 uppercase tracking-wider">Donation ID</p>
                     <p className="text-zinc-400 font-mono text-sm">{verificationData.donationId}</p>
                </div>
            </div>

            <button 
                onClick={() => window.location.reload()}
                className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-3 rounded-xl font-medium transition-colors border border-zinc-700"
            >
                Scan Next Donor
            </button>
        </div>
      )}
    </div>
  );
};

export default VerifyDonation;
