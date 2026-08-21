import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Mail, Shield, Camera, CheckCircle2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, role } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isCameraTesting, setIsCameraTesting] = useState(false);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (videoRef.current && activeStream) {
      videoRef.current.srcObject = activeStream;
      videoRef.current.play().catch(() => {});
    }
  }, [activeStream, isCameraTesting]);

  const handleToggleCameraTest = async () => {
    if (isCameraTesting && activeStream) {
      activeStream.getTracks().forEach((t) => t.stop());
      setActiveStream(null);
      setIsCameraTesting(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setActiveStream(stream);
        setIsCameraTesting(true);
      } catch {
        alert('Could not access camera/microphone. Please grant permissions in your browser.');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          User Profile
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Account credentials and proctoring hardware diagnostic tools.
        </p>
      </div>

      {/* Profile Overview */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xl">
            {user?.full_name?.charAt(0) || 'A'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.full_name || 'Aditya Kumar'}</h2>
            <p className="text-xs text-slate-500">{user?.email || 'teacher@chem.edu'}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 uppercase tracking-wider border border-blue-200">
              Role: {role?.toUpperCase() || 'STUDENT'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
            <Mail className="w-4 h-4 text-slate-500" />
            <div>
              <span className="text-slate-400 block text-[10px]">Academic Email</span>
              <strong className="text-slate-800">{user?.email || 'aditya.kumar@university.edu'}</strong>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
            <Shield className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="text-slate-400 block text-[10px]">Security Status</span>
              <strong className="text-emerald-700">Authenticated & Active</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Diagnostic Card */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Hardware & Proctoring Diagnostic
            </h2>
            <p className="text-xs text-slate-500">
              Verify your camera and microphone are recognized before scheduled examinations.
            </p>
          </div>
          <Button
            variant={isCameraTesting ? 'danger' : 'secondary'}
            size="sm"
            leftIcon={<Camera className="w-4 h-4" />}
            onClick={handleToggleCameraTest}
          >
            {isCameraTesting ? 'Stop Camera Test' : 'Test Webcam'}
          </Button>
        </div>

        {isCameraTesting && (
          <div className="relative aspect-video max-w-md rounded-2xl bg-slate-950 overflow-hidden border border-slate-200 mx-auto">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 text-white text-[10px] font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Hardware Live Test Normal
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
