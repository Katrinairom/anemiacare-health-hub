import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { api } from '@/lib/api';
import { Upload as UploadIcon, FileImage, CheckCircle, AlertTriangle } from 'lucide-react';

function getHbStatus(val: number) {
  if (val < 7) return { label: 'Severe', color: 'bg-destructive text-destructive-foreground' };
  if (val < 10) return { label: 'Mild Anemia', color: 'bg-warning text-warning-foreground' };
  if (val <= 12) return { label: 'Appropriate', color: 'bg-warning/60 text-foreground' };
  return { label: 'Sufficient', color: 'bg-accent text-accent-foreground' };
}

export default function UploadReport() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ hb_value: number; status: string } | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(f.type)) {
      setError('Please upload a JPG, PNG, or PDF file.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File must be smaller than 10MB.');
      return;
    }

    setFile(f);
    setError('');
    setResult(null);
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');

    try {
      const data = await api.analyseReport(file);
      setResult(data);

      // Save reading to Supabase
      if (isSupabaseConfigured() && user) {
        await supabase.from('hb_readings').insert({
          user_id: user.id,
          hb_value: data.hb_value,
          status: data.status,
        });
      }
    } catch {
      setError('Could not analyse report. Please ensure your backend API is running.');
    } finally {
      setUploading(false);
    }
  };

  const hbStatus = result ? getHbStatus(result.hb_value) : null;

  return (
    <div className="mx-auto max-w-lg px-4 py-8 fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Upload Blood Report</h1>
      <p className="mt-1 text-sm text-muted-foreground">Upload your blood report as JPG, PNG, or PDF to extract your Hb level.</p>

      <div className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
        {/* Drop zone */}
        <button
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-background px-6 py-10 transition-colors hover:border-secondary"
        >
          {preview ? (
            <img src={preview} alt="Report preview" className="max-h-40 rounded-lg object-contain" />
          ) : (
            <>
              <FileImage className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {file ? file.name : 'Click to select your blood report'}
              </p>
            </>
          )}
        </button>
        <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} className="hidden" />

        {file && !result && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-secondary py-3 font-display text-sm font-semibold text-secondary-foreground transition-all hover:opacity-90 disabled:opacity-50 btn-hover-scale"
          >
            {uploading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-secondary-foreground border-t-transparent" />
                Analysing...
              </>
            ) : (
              <>
                <UploadIcon className="h-4 w-4" />
                Analyse Report
              </>
            )}
          </button>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
          </div>
        )}

        {result && (
          <div className="mt-6 rounded-xl bg-background p-5 text-center fade-in">
            <CheckCircle className="mx-auto h-10 w-10 text-accent" />
            <p className="mt-3 text-sm text-muted-foreground">Your Hemoglobin Level</p>
            <p className="font-display text-5xl font-bold text-foreground">{result.hb_value}</p>
            <span className="text-sm text-muted-foreground">g/dL</span>
            <div className="mt-3">
              <span className={`inline-block rounded-lg px-4 py-1.5 text-sm font-semibold ${hbStatus?.color}`}>
                {hbStatus?.label}
              </span>
            </div>
            <button
              onClick={() => { setFile(null); setPreview(null); setResult(null); }}
              className="mt-6 text-sm font-medium text-foreground underline"
            >
              Upload Another Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
