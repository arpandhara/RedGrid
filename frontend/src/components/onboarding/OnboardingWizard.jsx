import React, { useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import useAuthStore from "../../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabase";
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Loader2,
  ChevronRight,
  UploadCloud,
  LocateFixed,
  Plane,
  Syringe
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

const OnboardingWizard = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { onboard } = useAuthStore();
  const navigate = useNavigate();

  const role = user?.unsafeMetadata?.role || "donor";
  const totalSteps = 3;

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: "",
    // Location
    address: "",
    city: "",
    state: "",
    zipCode: "",
    // Donor - Health
    bloodGroup: "",
    dob: "",
    weight: "",
    gender: "",
    healthConditions: [],
    // --- NEW FIELDS ---
    hasTattooOrPiercing: false,
    hasTravelledRecently: false,
    // Disease Fields
    hasCommunicableDisease: false,
    diseaseName: "",
    certificateFile: null,
    // Hospital / Org
    hospitalName: user?.unsafeMetadata?.hospitalName || "",
    type: "private",
    registrationNumber: "",
    organizationName: user?.unsafeMetadata?.organizationName || "",
    accountType: "permanent",
    expiryDate: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "file") {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // --- 1. AUTO LOCATION DETECTION ---
  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const address = res.data.address;

          setFormData((prev) => ({
            ...prev,
            city: address.city || address.town || address.village || "",
            state: address.state || "",
            zipCode: address.postcode || "",
            address: `${address.road || ""}, ${address.suburb || ""}`,
          }));
          toast.success("Location detected!");
        } catch (error) {
          console.error(error);
          toast.error("Could not fetch address details. Please enter manually.");
        } finally {
          setIsDetectingLocation(false);
        }
      },
      () => {
        toast.error("Permission denied. Please enable location access.");
        setIsDetectingLocation(false);
      }
    );
  };

  // --- 2. INTELLIGENT ERROR MESSAGES ---
  const cleanErrorMessage = (error) => {
    const msg = error.response?.data?.message || error.message;
    if (msg.includes("E11000"))
      return "This email or phone number is already registered.";
    if (msg.includes("validation"))
      return "Please check your inputs. Some fields are invalid.";
    if (msg.includes("Network")) return "Network error. Check your connection.";
    return msg || "Setup failed. Please try again.";
  };

  // --- 3. SUBMISSION & FILE UPLOAD ---
  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("Session expired. Login again.");

      let certificateUrl = null;
      let licenseUrl = null;

      // Handle File Upload to Supabase if disease is checked
      if (role === "donor" && formData.hasCommunicableDisease && formData.certificateFile) {
        const fileExt = formData.certificateFile.name.split(".").pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("certificates")
          .upload(fileName, formData.certificateFile);

        if (uploadError) throw new Error("Certificate upload failed: " + uploadError.message);

        const { data: urlData } = supabase.storage
          .from("certificates")
          .getPublicUrl(fileName);
        certificateUrl = urlData.publicUrl;
      }

      if (role === "hospital" && formData.licenseFile) {
        const fileExt = formData.licenseFile.name.split(".").pop();
        const fileName = `hospital_license_${user.id}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("certificates")
          .upload(fileName, formData.licenseFile);

        if (uploadError) throw new Error("License upload failed: " + uploadError.message);

        const { data: urlData } = supabase.storage
          .from("certificates")
          .getPublicUrl(fileName);
        licenseUrl = urlData.publicUrl;
      }

      // Construct Payload
      const payload = {
        role,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          coordinates: { lat: 0, lng: 0 },
        },
        donorData:
          role === "donor"
            ? {
                bloodGroup: formData.bloodGroup,
                dob: formData.dob,
                weight: Number(formData.weight),
                gender: formData.gender,
                healthConditions: formData.healthConditions,
                
                // --- NEW FIELDS MAPPED HERE ---
                hasTattooOrPiercing: formData.hasTattooOrPiercing,
                hasTravelledRecently: formData.hasTravelledRecently,
                
                hasCommunicableDisease: formData.hasCommunicableDisease,
                communicableDiseaseName: formData.hasCommunicableDisease
                  ? formData.diseaseName
                  : null,
                fitnessCertificateUrl: certificateUrl,
              }
            : undefined,
        hospitalData:
          role === "hospital"
            ? {
                hospitalName: formData.hospitalName,
                type: formData.type,
                registrationNumber: formData.registrationNumber,
                licenseDocumentUrl: licenseUrl,
              }
            : undefined,
        orgData:
          role === "organization"
            ? {
                organizationName: formData.organizationName,
                accountType: formData.accountType,
                expiryDate: formData.expiryDate,
              }
            : undefined,
      };

      await onboard(payload, token);
      toast.success("Profile Setup Complete!");

      if (role === "hospital") navigate("/hospital/dashboard");
      else if (role === "organization") navigate("/org/dashboard");
      else navigate("/donor/dashboard");
    } catch (error) {
      console.error(error);
      toast.error(cleanErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  // UI Helpers
  const nextStep = () => setStep((s) => Math.min(totalSteps, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));
  const progress = (step / totalSteps) * 100;

  const getIllustration = () => {
    if (step === 1) return "/SVG/DrawKit Vector Illustrations COVID-19 & Vaccinations (8).svg";
    if (step === 2) return "/undraw_map-dark_g9xq.svg";
    if (step === 3) return "/SVG/DrawKit Vector Illustrations COVID-19 & Vaccinations (12).svg";
    return "/SVG/DrawKit Vector Illustrations COVID-19 & Vaccinations (1).svg";
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-black flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-5/12 bg-zinc-900 relative flex-col justify-between p-12 border-r border-zinc-800">
        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[120px]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              R
            </div>
            <span className="text-2xl font-bold text-white">RedGrid</span>
          </div>
          <div className="space-y-8">
            <StepItem num={1} title="Identity" desc="Basic details" active={step === 1} completed={step > 1} />
            <StepItem num={2} title="Location" desc="Address & City" active={step === 2} completed={step > 2} />
            <StepItem num={3} title="Medical / Legal" desc="Verification" active={step === 3} completed={step > 3} />
          </div>
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <img src={getIllustration()} alt="Illustration" className="w-full max-w-sm h-64 object-contain" />
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-black relative">
        {/* Mobile Header */}
        <div className="lg:hidden p-6 bg-white dark:bg-black sticky top-0 z-20 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-20">
          <div className="max-w-2xl mx-auto space-y-8 pb-24">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                {step === 1 && "Basic Info"}
                {step === 2 && "Your Location"}
                {step === 3 && (role === "donor" ? "Medical Profile" : "Professional Info")}
              </h1>
              <p className="text-zinc-500">Please fill strictly accurate details.</p>
            </div>

            {/* STEP 1: IDENTITY */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="grid grid-cols-2 gap-4">
                  <FloatingInput label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
                  <FloatingInput label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
                </div>
                <FloatingInput label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
              </div>
            )}

            {/* STEP 2: LOCATION */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <button
                  onClick={detectLocation}
                  disabled={isDetectingLocation}
                  className="w-full py-3 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-xl font-semibold border border-blue-100 dark:border-blue-900/30 flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
                >
                  {isDetectingLocation ? <Loader2 className="animate-spin" size={18} /> : <LocateFixed size={18} />}
                  {isDetectingLocation ? "Detecting..." : "Use Current Location"}
                </button>
                <FloatingInput label="Street Address" name="address" value={formData.address} onChange={handleChange} />
                <div className="grid grid-cols-2 gap-4">
                  <FloatingInput label="City" name="city" value={formData.city} onChange={handleChange} />
                  <FloatingInput label="State" name="state" value={formData.state} onChange={handleChange} />
                </div>
                <FloatingInput label="Zip Code" name="zipCode" value={formData.zipCode} onChange={handleChange} />
              </div>
            )}

            {/* STEP 3: MEDICAL / ROLE SPECIFIC */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                {role === "donor" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <SelectInput
                        label="Blood Group"
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleChange}
                        options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
                      />
                      <SelectInput
                        label="Gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        options={["male", "female", "other"]}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FloatingInput label="Date of Birth" type="date" name="dob" value={formData.dob} onChange={handleChange} />
                      <FloatingInput label="Weight (kg)" type="number" name="weight" value={formData.weight} onChange={handleChange} />
                    </div>

                    {/* --- NEW SECTION: LIFESTYLE & HISTORY --- */}
                    <div className="space-y-3 pt-2">
                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Lifestyle & Travel History</h3>
                        
                        {/* Tattoo / Piercing Checkbox */}
                        <label className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-lg">
                                <Syringe size={20} />
                            </div>
                            <div className="flex-1">
                                <span className="text-zinc-900 dark:text-white font-semibold block">Tattoos or Piercings</span>
                                <span className="text-xs text-zinc-500">Within the last 6 months?</span>
                            </div>
                            <input 
                                type="checkbox" 
                                name="hasTattooOrPiercing" 
                                checked={formData.hasTattooOrPiercing} 
                                onChange={handleChange}
                                className="w-5 h-5 accent-red-600 rounded cursor-pointer"
                            />
                        </label>

                        {/* Travel Checkbox */}
                        <label className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
                             <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                                <Plane size={20} />
                            </div>
                            <div className="flex-1">
                                <span className="text-zinc-900 dark:text-white font-semibold block">Recent Travel</span>
                                <span className="text-xs text-zinc-500">Travelled abroad in the last 6 months?</span>
                            </div>
                            <input 
                                type="checkbox" 
                                name="hasTravelledRecently" 
                                checked={formData.hasTravelledRecently} 
                                onChange={handleChange}
                                className="w-5 h-5 accent-red-600 rounded cursor-pointer"
                            />
                        </label>
                    </div>

                    {/* DISEASE EXCEPTION FLOW */}
                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                      <label className="flex items-start gap-3 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <input
                          type="checkbox"
                          name="hasCommunicableDisease"
                          checked={formData.hasCommunicableDisease}
                          onChange={handleChange}
                          className="mt-1 w-5 h-5 accent-red-600 rounded"
                        />
                        <div>
                          <span className="font-bold text-zinc-900 dark:text-white block">
                            I have a major communicable disease
                          </span>
                          <span className="text-xs text-zinc-500">
                            Check this if you wish to proceed as a recipient with medical proof.
                          </span>
                        </div>
                      </label>

                      {formData.hasCommunicableDisease && (
                        <div className="mt-4 p-4 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-xl space-y-4 animate-in slide-in-from-top-2">
                          <FloatingInput label="Disease Name" name="diseaseName" value={formData.diseaseName} onChange={handleChange} />
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-zinc-500">Upload Medical Certificate</label>
                            <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-red-500 transition-colors bg-white dark:bg-zinc-900">
                              <UploadCloud className="text-zinc-400 mb-2" />
                              <p className="text-sm text-zinc-500">
                                {formData.certificateFile ? formData.certificateFile.name : "Click to upload (PDF/JPG)"}
                              </p>
                              <input
                                type="file"
                                name="certificateFile"
                                onChange={handleChange}
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {role === "hospital" && (
                  <>
                    <FloatingInput label="Hospital Name" name="hospitalName" value={formData.hospitalName} onChange={handleChange} icon={<Building2 size={18} />} />
                    <div className="grid grid-cols-2 gap-4">
                      <FloatingInput label="Registration / GST No." name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} />
                      <SelectInput label="Hospital Type" name="type" value={formData.type} onChange={handleChange} options={["government", "private", "ngo"]} />
                    </div>
                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-bold uppercase text-zinc-500 ml-1">Upload Legal Proof (License / GST Cert)</label>
                      <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-red-500 transition-colors bg-zinc-50 dark:bg-zinc-900/50">
                        <UploadCloud className="text-zinc-400 mb-2" />
                        <p className="text-sm text-zinc-500 font-medium">
                          {formData.licenseFile ? formData.licenseFile.name : "Click to upload Document"}
                        </p>
                        <input
                          type="file"
                          name="licenseFile"
                          onChange={handleChange}
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      <p className="text-[10px] text-zinc-400 pl-1">Your account will be pending until this document is verified by our team.</p>
                    </div>
                  </>
                )}

                {role === "organization" && (
                  <>
                    <FloatingInput label="Organization Name" name="organizationName" value={formData.organizationName} onChange={handleChange} icon={<Building2 size={18} />} />
                    <SelectInput label="Account Type" name="accountType" value={formData.accountType} onChange={handleChange} options={["permanent", "temporary"]} />
                    {formData.accountType === "temporary" && (
                      <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 rounded-xl space-y-3">
                        <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-bold text-xs uppercase">
                          <Calendar size={14} /> Event Expiry
                        </div>
                        <input
                          type="date"
                          name="expiryDate"
                          value={formData.expiryDate}
                          onChange={handleChange}
                          className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                        <p className="text-xs text-orange-600/80">Account auto-deletes after this date.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="p-6 bg-white dark:bg-black border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
          <button onClick={prevStep} disabled={step === 1} className="flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white disabled:opacity-0 transition-opacity">
            <ArrowLeft size={18} /> Back
          </button>
          <button
            onClick={step < totalSteps ? nextStep : handleSubmit}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-500/30 transition-transform active:scale-95"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : step < totalSteps ? <>Next <ArrowRight size={18} /></> : <>Complete <CheckCircle2 size={18} /></>}
          </button>
        </div>
      </div>
    </div>
  );
};

// UI Components
const StepItem = ({ num, title, desc, active, completed }) => (
  <div className="flex gap-4 group opacity-80 hover:opacity-100 transition-opacity">
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${active ? "bg-red-600 text-white" : completed ? "bg-green-500 text-white" : "bg-zinc-800 text-zinc-500"}`}>
      {completed ? <CheckCircle2 size={16} /> : num}
    </div>
    <div>
      <h4 className="text-white font-medium">{title}</h4>
      <p className="text-zinc-500 text-xs">{desc}</p>
    </div>
  </div>
);

const FloatingInput = ({ label, className, icon, ...props }) => (
  <div className="relative group">
    {icon && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">{icon}</div>}
    <input
      className={`peer w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent dark:border-zinc-800 rounded-xl px-4 py-3 pt-5 font-medium text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-black focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all placeholder-transparent ${className}`}
      placeholder={label}
      {...props}
    />
    <label className="absolute left-4 top-1 text-xs font-bold text-zinc-500 uppercase tracking-wider transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-400 peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-focus:top-1 peer-focus:text-xs peer-focus:font-bold peer-focus:text-red-500">
      {label}
    </label>
  </div>
);

const SelectInput = ({ label, options, ...props }) => (
  <div className="relative group">
    <label className="absolute left-4 top-1 text-xs font-bold text-zinc-500 uppercase tracking-wider z-10 pointer-events-none group-focus-within:text-red-500">{label}</label>
    <div className="relative">
      <select
        className="w-full appearance-none bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent dark:border-zinc-800 rounded-xl px-4 py-3 pt-5 font-medium text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-black focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all cursor-pointer capitalize"
        {...props}
      >
        <option value="">Select...</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 rotate-90 pointer-events-none" size={18} />
    </div>
  </div>
);

export default OnboardingWizard;