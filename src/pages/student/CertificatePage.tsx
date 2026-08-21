import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCertificateByResultId } from '../../lib/certificateService';
import { CertificateData } from '../../types/certificate';
import { Button } from '../../components/common/Button';
import {
  Award,
  Printer,
  QrCode,
  ArrowLeft,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export const CertificatePage: React.FC = () => {
  const { resultId } = useParams<{ resultId: string }>();
  const activeResultId = resultId || 'res-001';

  const [cert, setCert] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCertificateByResultId(activeResultId).then((data) => {
      setCert(data);
      setLoading(false);
    });
  }, [activeResultId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !cert) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 font-mono text-sm">
        Generating Verified Certificate of Chemistry Mastery...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4 sm:px-6 flex flex-col items-center selection:bg-amber-500 selection:text-slate-950">
      {/* Top Action Controls Bar (Hidden during Print) */}
      <div className="max-w-4xl w-full flex items-center justify-between gap-4 mb-6 print:hidden">
        <Link to={`/student/results/${cert.resultId}`}>
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Exam Breakdown
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Link to={`/verify-certificate/${cert.certificateId}`} target="_blank">
            <Button variant="secondary" size="sm" leftIcon={<ExternalLink className="w-4 h-4" />}>
              Public Verification Link
            </Button>
          </Link>

          <Button
            variant="glow"
            size="sm"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
          >
            Print / Save Certificate PDF
          </Button>
        </div>
      </div>

      {/* Main Certificate Sheet (A4 Landscape aspect ratio) */}
      <div
        id="certificate-print-area"
        className="max-w-4xl w-full aspect-[1.414/1] bg-gradient-to-br from-slate-950 via-surface-100 to-slate-950 border-8 border-double border-amber-500/60 rounded-3xl p-8 sm:p-12 shadow-2xl relative flex flex-col justify-between overflow-hidden text-center"
      >
        {/* Subtle Watermark Guilloché Background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
          <div className="w-96 h-96 rounded-full border-8 border-dashed border-amber-400" />
        </div>

        {/* Ornate Corner Accents */}
        <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-amber-400" />
        <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-amber-400" />
        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-amber-400" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-amber-400" />

        {/* 1. Header: Institution & Seal */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <Award className="w-7 h-7" />
            </div>
          </div>
          <h2 className="text-xs sm:text-sm font-serif tracking-widest uppercase text-amber-300 font-bold">
            {cert.institutionName}
          </h2>
          <h1 className="text-2xl sm:text-4xl font-serif font-extrabold text-white tracking-wide">
            Certificate of Chemistry Mastery
          </h1>
          <p className="text-xs text-slate-400 font-serif italic">
            This official academic credential certifies the professional physical sciences competency of:
          </p>
        </div>

        {/* 2. Recipient Name */}
        <div className="space-y-1 py-2">
          <h3 className="text-3xl sm:text-4xl font-serif font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 underline decoration-amber-500/40 decoration-1 underline-offset-8">
            {cert.studentName}
          </h3>
          <p className="text-xs text-slate-300 font-mono pt-2">
            For successfully completing the comprehensive examination for
          </p>
          <div className="text-base sm:text-lg font-bold text-chem-300 font-sans">
            {cert.examTitle}
          </div>
        </div>

        {/* 3. Performance Honors Badge & Metrics */}
        <div className="flex flex-wrap items-center justify-center gap-4 py-2">
          <div className="px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Honors: {cert.academicHonors}</span>
          </div>

          <div className="px-3.5 py-1 rounded-full bg-surface-200/90 border border-slate-700 text-slate-200 text-xs font-mono">
            Final Grade: <strong className="text-white">{cert.grade} ({cert.scorePercentage}%)</strong>
          </div>

          <div className="px-3.5 py-1 rounded-full bg-surface-200/90 border border-slate-700 text-slate-200 text-xs font-mono">
            Cohort Rank: <strong className="text-emerald-400">{cert.percentileRank}th Percentile</strong>
          </div>
        </div>

        {/* 4. Footer: Signatures, Date & Cryptographic QR Seal */}
        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-3 items-end text-left gap-4 text-xs font-serif">
          {/* Left: Issue Date & Cert ID */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-mono block">DATE ISSUED</span>
            <span className="text-slate-200 font-mono text-xs">{cert.issueDate}</span>
            <span className="text-[10px] text-slate-500 font-mono block pt-1">CREDENTIAL ID</span>
            <span className="text-chem-300 font-mono text-[11px] font-bold">{cert.certificateId}</span>
          </div>

          {/* Center: Verification QR Stamp */}
          <div className="flex flex-col items-center text-center space-y-1">
            <div className="p-2 rounded-xl bg-white text-slate-950 shadow-md">
              <QrCode className="w-12 h-12" />
            </div>
            <span className="text-[9px] font-mono text-slate-400">
              SHA-256 HASH VERIFIED
            </span>
          </div>

          {/* Right: Faculty Signature */}
          <div className="text-right space-y-1">
            <div className="font-serif italic text-base text-amber-300">
              {cert.instructorSignatureName}
            </div>
            <div className="w-40 ml-auto border-b border-slate-600" />
            <span className="text-[10px] text-slate-400 block">
              {cert.instructorTitle}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
