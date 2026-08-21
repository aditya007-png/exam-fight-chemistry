import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { verifyCertificateById } from '../../lib/certificateService';
import { VerificationResult } from '../../types/certificate';
import { Button } from '../../components/common/Button';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Award,
  Calendar,
  User,
  GraduationCap,
  ArrowLeft,
} from 'lucide-react';

export const CertificateVerificationPage: React.FC = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [queryId, setQueryId] = useState<string>(certificateId || 'EFC-2026-984217-CHEM');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const performVerification = (idToVerify: string) => {
    setLoading(true);
    verifyCertificateById(idToVerify).then((res) => {
      setResult(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (queryId) {
      performVerification(queryId);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (queryId.trim()) {
      performVerification(queryId.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-chem-500 selection:text-slate-950">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-chem-500/10 border border-chem-500/20 text-chem-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-chem-400" />
            <span>Public Academic Credential Validator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Official Certificate Verification Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Verify the cryptographic authenticity and proctoring integrity of chemistry certificates issued on Exam Fight Chemistry.
          </p>
        </div>

        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-2 bg-surface-100 p-2 rounded-2xl border border-slate-800 shadow-xl"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Credential ID (e.g. EFC-2026-984217-CHEM)..."
              value={queryId}
              onChange={(e) => setQueryId(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-200 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-chem-400"
            />
          </div>
          <Button variant="glow" size="sm" type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Validate'}
          </Button>
        </form>

        {/* Verification Result Card */}
        {result && (
          <div
            className={`rounded-2xl bg-surface-100 border p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${
              result.isValid
                ? 'border-emerald-500/60 shadow-emerald-950/20'
                : 'border-rose-600/70 shadow-rose-950/20'
            }`}
          >
            {result.isValid && result.certificate ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">Cryptographically Valid</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                          Trust Score: 100%
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        Credential ID: {result.certificate.certificateId}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                    Verified {new Date(result.verifiedAt).toLocaleTimeString()}
                  </span>
                </div>

                {/* Candidate & Exam Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-surface-200/80 border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 text-slate-400">
                      <User className="w-3.5 h-3.5 text-chem-400" />
                      <span>Certified Recipient</span>
                    </div>
                    <span className="text-sm font-bold text-white block">
                      {result.certificate.studentName}
                    </span>
                    <span className="text-[11px] text-slate-400 block font-sans">
                      Honors: {result.certificate.academicHonors}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-200/80 border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 text-slate-400">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Academic Course</span>
                    </div>
                    <span className="text-sm font-bold text-white block">
                      {result.certificate.courseCode}
                    </span>
                    <span className="text-[11px] text-slate-400 block font-sans truncate">
                      {result.certificate.examTitle}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-200/80 border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>Score & Grade</span>
                    </div>
                    <span className="text-sm font-bold text-chem-300 block">
                      {result.certificate.grade} ({result.certificate.scorePercentage}%)
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Cohort Percentile: {result.certificate.percentileRank}th
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-200/80 border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Issue Date & Authority</span>
                    </div>
                    <span className="text-sm font-bold text-white block">
                      {result.certificate.issueDate}
                    </span>
                    <span className="text-[11px] text-slate-400 block font-sans">
                      {result.certificate.instructorSignatureName}
                    </span>
                  </div>
                </div>

                {/* Cryptographic SHA-256 Hash Seal */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 break-all space-y-1">
                  <span className="text-slate-500 block">Digital Verification Hash (SHA-256):</span>
                  <span className="text-slate-300">{result.certificate.verificationHash}</span>
                </div>
              </>
            ) : (
              <div className="py-6 text-center space-y-2">
                <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Invalid or Unrecognized Credential</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  The credential ID &quot;{queryId}&quot; could not be matched with any verified examination record.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="text-center pt-2">
          <Link to="/" className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Exam Fight Chemistry Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
