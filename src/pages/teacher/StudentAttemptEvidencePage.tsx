import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStudentAttemptEvidence } from '../../lib/evidenceService';
import { StudentAttemptEvidenceSummary } from '../../types/evidence';
import { Button } from '../../components/common/Button';
import {
  Video,
  Camera,
  Play,
  Pause,
  Maximize,
  Volume2,
  VolumeX,
  Clock,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  User,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export const StudentAttemptEvidencePage: React.FC = () => {
  const { examId, attemptId } = useParams<{ examId: string; attemptId: string }>();
  const activeAttemptId = attemptId || 'att-001';
  const activeExamId = examId || 'exam-act-001';

  const [evidenceData, setEvidenceData] = useState<StudentAttemptEvidenceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pre_scan' | 'snapshots' | 'mid_scan'>('pre_scan');

  // Video Player State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [auditStatus, setAuditStatus] = useState<'pending' | 'verified' | 'flagged'>('pending');

  const mockPeriodicSnapshots = [
    {
      id: 'snap-1',
      time: '18:15:22',
      status: 'Normal',
      description: 'Candidate looking directly at screen',
      img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: 'snap-2',
      time: '18:22:45',
      status: 'Normal',
      description: 'Solving chemical thermodynamics calculation',
      img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: 'snap-3',
      time: '18:35:10',
      status: 'Notice',
      description: 'Gaze diverted towards desk side for 8 seconds',
      img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=60',
    },
    {
      id: 'snap-4',
      time: '18:48:30',
      status: 'Normal',
      description: 'Reviewing question palette submissions',
      img: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=60',
    },
  ];

  useEffect(() => {
    getStudentAttemptEvidence(activeAttemptId).then((data) => {
      setEvidenceData(data);
      setLoading(false);
    });
  }, [activeAttemptId]);

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const target = parseFloat(e.target.value);
    videoRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSpeedChange = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-500">
        Loading 360° examination evidence dossier...
      </div>
    );
  }

  const attempt = evidenceData?.attempt || {
    id: activeAttemptId,
    studentName: 'Alex Chen',
    studentEmail: 'alex.chen@chem.edu',
    examTitle: 'Thermodynamics & Gibbs Free Energy Assessment',
    score: 16,
    totalMarks: 20,
    status: 'completed',
    integrityScore: 98,
  };

  const roomScanVideo = evidenceData?.roomScanVideo;

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* 1. Header Navigation */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Evidence Audit Dossier
            </span>
            <span className="text-xs text-slate-500">
              Exam: {attempt.examTitle || 'Thermodynamics Assessment'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Video className="w-6 h-6 text-blue-600" />
            360° Room-Scan Video Evidence Review
          </h1>
          <p className="text-xs text-slate-500">
            Candidate: <strong>{attempt.studentName}</strong> • Attempt ID: <code className="text-blue-700 font-bold">{attempt.id}</code>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to={`/teacher/exam/${activeExamId}/attempts`}>
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              All Attempts
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Candidate & Attempt Metadata Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-card space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>Candidate Name</span>
          </div>
          <span className="font-bold text-slate-900 text-sm block">{attempt.studentName}</span>
          <span className="text-[10px] text-slate-400 font-mono truncate block">{attempt.studentEmail}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-card space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Scan Timestamp</span>
          </div>
          <span className="font-mono text-xs font-bold text-slate-800 block">
            {roomScanVideo ? new Date(roomScanVideo.recordedAt).toLocaleTimeString() : '10:24 AM'}
          </span>
          <span className="text-[10px] text-emerald-700 font-bold block">Pre-flight Verified</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-card space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Video Duration</span>
          </div>
          <span className="font-mono text-sm font-bold text-slate-900 block">
            {roomScanVideo?.durationSeconds ? `${roomScanVideo.durationSeconds}s` : '42s'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono block">
            Perimeter: 360° Cleared
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-card space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Integrity Score</span>
          </div>
          <span className="font-mono text-sm font-bold text-emerald-600 block">
            {attempt.integrityScore || 98}%
          </span>
          <span className="text-[10px] text-slate-500 block">
            Status: {attempt.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* 3. Evidence Categories Navigation */}
      <div className="flex rounded-2xl bg-white p-1 border border-slate-200 shadow-card text-xs font-semibold gap-1">
        <button
          onClick={() => setActiveTab('pre_scan')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'pre_scan'
              ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Pre-Exam 360° Room Scan Video</span>
        </button>

        <button
          onClick={() => setActiveTab('snapshots')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'snapshots'
              ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>In-Exam Photo Snapshots ({mockPeriodicSnapshots.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('mid_scan')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'mid_scan'
              ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Mid-Exam 360° Re-Scan</span>
        </button>
      </div>

      {/* 4. TAB 1 & 3: Video Player Stage (Pre-Scan or Mid-Scan) */}
      {(activeTab === 'pre_scan' || activeTab === 'mid_scan') && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900">
                {activeTab === 'pre_scan'
                  ? 'Raw Pre-Flight 360° Environment Video Recording'
                  : 'Mandatory Mid-Exam 360° Environmental Re-Scan'}
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Storage: Encrypted Object Store
            </span>
          </div>

          {/* Video Container */}
          <div className="relative aspect-video rounded-2xl bg-slate-950 overflow-hidden shadow-md flex items-center justify-center group">
            <video
              ref={videoRef}
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              className="w-full h-full object-contain cursor-pointer"
              onClick={handleTogglePlay}
            />

            {/* Centered Play Button Overlay */}
            {!isPlaying && (
              <button
                onClick={handleTogglePlay}
                className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white/90 text-slate-950 flex items-center justify-center shadow-2xl hover:scale-105 transition-transform"
              >
                <Play className="w-8 h-8 ml-1" />
              </button>
            )}

            {/* Custom Bottom Control Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent space-y-2">
              {/* Timeline Seek Bar */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-white font-bold">
                  {formatSeconds(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-[11px] font-mono text-slate-400">
                  {formatSeconds(duration)}
                </span>
              </div>

              {/* Action Buttons Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleTogglePlay}
                    className="p-1.5 rounded-lg text-white hover:bg-white/20 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={handleToggleMute}
                    className="p-1.5 rounded-lg text-white hover:bg-white/20 transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  {/* Playback Speeds */}
                  <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-700 text-[10px] font-mono">
                    {[0.5, 1, 1.5, 2].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => handleSpeedChange(spd)}
                        className={`px-1.5 py-0.5 rounded ${
                          playbackSpeed === spd
                            ? 'bg-blue-600 text-white font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleFullscreen}
                  className="p-1.5 rounded-lg text-white hover:bg-white/20 transition-colors"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 2: In-Exam Photo Snapshots Grid */}
      {activeTab === 'snapshots' && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Automated Periodic Webcam Snapshots
              </h3>
              <p className="text-xs text-slate-500">Captured automatically during examination session</p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
              {mockPeriodicSnapshots.length} Snapshots Saved
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockPeriodicSnapshots.map((snap) => (
              <div
                key={snap.id}
                className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-card hover:border-slate-300 transition-all space-y-2.5 p-3"
              >
                <div className="relative aspect-video rounded-xl bg-slate-100 overflow-hidden">
                  <img
                    src={snap.img}
                    alt="Webcam snapshot"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur text-white text-[10px] font-mono font-bold">
                    {snap.time}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Status Check</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      snap.status === 'Normal' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {snap.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {snap.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Faculty Audit Action Decision */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Academic Faculty Evaluation Decision
            </h3>
            <p className="text-xs text-slate-500">
              Validate 360° environmental recording and proctoring log integrity
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={auditStatus === 'verified' ? 'primary' : 'secondary'}
              size="sm"
              leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              onClick={() => {
                setAuditStatus('verified');
                alert(`Attempt ${attempt.id} verified as compliant.`);
              }}
            >
              Approve Environment
            </Button>
            <Button
              variant={auditStatus === 'flagged' ? 'danger' : 'secondary'}
              size="sm"
              leftIcon={<AlertTriangle className="w-4 h-4 text-rose-600" />}
              onClick={() => {
                setAuditStatus('flagged');
                alert(`Attempt ${attempt.id} flagged for integrity review.`);
              }}
            >
              Flag for Committee Review
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
