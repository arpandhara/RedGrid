import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ShieldCheck, Loader2, ArrowLeft, HeartHandshake } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize Scanner in a timeout to ensure DOM element exists
    const timer = setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
            "user-reader",
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
        let payload;
        try {
            payload = JSON.parse(textInfo);
        } catch (parseError) {
            throw new Error("Invalid QR: Not a valid JSON format");
        }
        
        // Determine type: explicit or inferred from structure
        let qrType = payload.type;
        
        // Legacy support: Infer type from payload structure
        if (!qrType) {
            if (payload.donorId && payload.requestId) {
                qrType = 'donation_ticket';
            } else if (payload.donorId) {
                qrType = 'digital_id';
            }
        }
        
        // Handle different QR types
        if (qrType === 'digital_id') {
            // Digital ID Card - Just verify donor exists
            const res = await api.get(`/users/${payload.donorId}`);
            setVerificationData({
                donorName: `${res.data.data.firstName} ${res.data.data.lastName}`,
                bloodGroup: res.data.data.donorProfile?.bloodGroup,
                verified: true,
                type: 'identity'
            });
            toast.success("Donor Identity Verified!");
        } else if (qrType === 'donation_ticket') {
            // Donation Ticket - Full donation verification
            const res = await api.post('/donations/verify', { 
                donorId: payload.donorId,
                requestId: payload.requestId,
                timestamp: payload.timestamp 
            });
            setVerificationData({
                ...res.data.data,
                type: 'donation'
            });
            toast.success("Donation Verified! Thank you.");
        } else {
            console.error("Unknown QR payload:", payload);
            throw new Error("Unrecognized QR Code. Please scan a valid Donor ID or Donation Ticket.");
        }

    } catch (error) {
        console.error(error);
        const msg = error.response?.data?.message || error.message || "Verification Failed";
        toast.error(msg);
        
        if (error.response?.status === 403) {
             setScanResult('error');
        } else {
             setScanResult(null);
        }
    } finally {
        setVerifying(false);
    }
  };


  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans flex flex-col items-center justify-center">
      
      <div className="w-full max-w-md">
        <button 
            onClick={() => navigate(-1)} 
            className="mb-8 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
            <ArrowLeft size={20} /> Back
        </button>

        <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                <HeartHandshake className="text-red-500" size={32} />
                Verify Donation
            </h1>
            <p className="text-zinc-400">Scan the donor's ticket to confirm the donation.</p>
        </div>

        {!verificationData ? (
            <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl ${scanResult === 'error' ? 'border-red-500/50' : ''}`}>
                <div id="user-reader" className="overflow-hidden rounded-xl border-2 border-dashed border-zinc-700"></div>
                
                {verifying && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-zinc-300">
                        <Loader2 className="animate-spin" /> Verifying Ticket...
                    </div>
                )}
                
                {scanResult === 'error' && (
                     <div className="mt-4 text-center">
                        <p className="text-red-500 font-bold mb-2">Verification Failed</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="text-xs bg-zinc-800 px-3 py-1 rounded text-white"
                        >
                            Try Again
                        </button>
                     </div>
                )}
            </div>
        ) : (
            <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/30 rounded-2xl p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                    <HeartHandshake size={40} />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
                <p className="text-zinc-400 mb-6">You have confirmed the donation.</p>

                <div className="bg-zinc-900/80 p-6 rounded-xl text-left space-y-3 mb-8">
                    <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider">Donor</p>
                        <p className="text-white font-medium text-lg">{verificationData.donorName}</p>
                    </div>
                    <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider">Blood Group</p>
                        <p className="text-red-500 font-bold text-xl">{verificationData.bloodGroup}</p>
                    </div>
                </div>

                <button 
                    onClick={() => navigate('/donor/hub')}
                    className="w-full bg-white text-black hover:bg-zinc-200 px-6 py-3 rounded-xl font-bold transition-colors"
                >
                    Return to Hub
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default UserScanner;
