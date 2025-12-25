import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form"; // Ensure you have installed: npm install react-hook-form
import { ArrowLeft, Siren, User, Activity, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/useAuthStore";
import api from "../../api/axios"; // Assuming you have a configured axios instance

const CreateRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      urgency: "moderate",
      unitsNeeded: 1,
    },
  });

  // 1. Auto-Fetch Hospital Location from User Profile
  useEffect(() => {
    if (user?.location?.coordinates) {
      // Backend stores as [lng, lat], Frontend form might want specific display or hidden fields
      // We will submit the location object exactly as the backend expects it:
      // { type: "Point", coordinates: [lng, lat] }
      // For now, we rely on the backend validation, but we can visualize it if needed.
    } else {
      toast.error("Please update your Hospital Profile with a location first!");
      navigate("/hospital/dashboard");
    }
  }, [user, navigate]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Construct the payload matching your Request.js model
      const payload = {
        patientName: data.patientName,
        bloodGroup: data.bloodGroup,
        unitsNeeded: Number(data.unitsNeeded),
        urgency: data.urgency,
        location: {
          type: "Point",
          // Use the hospital's registered location for the request
          coordinates: user.location.coordinates, 
        },
      };

      const res = await api.post("/requests", payload);

      if (res.data.success) {
        toast.success("Request Broadcasted to Donors!");
        navigate("/hospital/dashboard");
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Failed to create request";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-zinc-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </button>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Siren className="w-6 h-6 text-red-500" />
            Create Blood Request
          </h1>
          <p className="text-zinc-400 mt-2">
            This will instantly notify eligible donors within a 10km radius.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Patient Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <User className="w-4 h-4" />
              Patient Name
            </label>
            <input
              {...register("patientName", { required: "Patient name is required" })}
              className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              placeholder="e.g. John Doe"
            />
            {errors.patientName && (
              <span className="text-red-500 text-xs">{errors.patientName.message}</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Blood Group */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Blood Group Needed
              </label>
              <select
                {...register("bloodGroup", { required: "Blood group is required" })}
                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 outline-none appearance-none"
              >
                <option value="">Select Blood Group</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
              {errors.bloodGroup && (
                <span className="text-red-500 text-xs">{errors.bloodGroup.message}</span>
              )}
            </div>

            {/* Units Needed */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Units Required</label>
              <input
                type="number"
                {...register("unitsNeeded", { required: true, min: 1, max: 20 })}
                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 outline-none"
                placeholder="1"
              />
            </div>
          </div>

          {/* Urgency Level */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-300">Urgency Level</label>
            <div className="grid grid-cols-3 gap-4">
              {['low', 'moderate', 'critical'].map((level) => (
                <label
                  key={level}
                  className="cursor-pointer relative"
                >
                  <input
                    type="radio"
                    value={level}
                    {...register("urgency")}
                    className="peer sr-only"
                  />
                  <div className={`
                    capitalize text-center py-3 rounded-lg border border-zinc-800 
                    peer-checked:border-transparent transition-all
                    ${level === 'critical' ? 'peer-checked:bg-red-600 peer-checked:text-white' : ''}
                    ${level === 'moderate' ? 'peer-checked:bg-orange-500 peer-checked:text-white' : ''}
                    ${level === 'low' ? 'peer-checked:bg-green-600 peer-checked:text-white' : ''}
                    hover:bg-zinc-800
                  `}>
                    {level}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Location Info (Read Only) */}
          <div className="bg-zinc-800/50 p-4 rounded-lg flex items-start gap-3 border border-zinc-700/50">
            <MapPin className="w-5 h-5 text-zinc-400 mt-0.5" />
            <div>
              <p className="text-sm text-zinc-300 font-medium">Request Location</p>
              <p className="text-xs text-zinc-500 mt-1">
                This request will be linked to your registered hospital coordinates.
                {user?.location?.address && <span className="block mt-1 text-zinc-400">{user.location.address}</span>}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Broadcasting..." : "Broadcast Request"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRequest;