import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Heart, ChevronLeft, ChevronRight, Check } from 'lucide-react';

const STEPS = ['BMI Calculator', 'Menstrual & Hormonal', 'Hereditary Conditions', 'Lifestyle'];

interface QuizData {
  height: string;
  weight: string;
  bmi: number | null;
  bmiCategory: string;
  conditions: string[];
  hereditary: string[];
  dietType: string;
  activityLevel: string;
  sleepHours: string;
}

function getBMICategory(bmi: number) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

export default function Quiz() {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<QuizData>({
    height: '', weight: '', bmi: null, bmiCategory: '',
    conditions: [], hereditary: [], dietType: '', activityLevel: '', sleepHours: '',
  });

  const calculateBMI = () => {
    const h = parseFloat(data.height) / 100;
    const w = parseFloat(data.weight);
    if (h > 0 && w > 0) {
      const bmi = parseFloat((w / (h * h)).toFixed(1));
      setData({ ...data, bmi, bmiCategory: getBMICategory(bmi) });
    }
  };

  const toggleArray = (field: 'conditions' | 'hereditary', val: string) => {
    const arr = data[field];
    setData({ ...data, [field]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isSupabaseConfigured() && user) {
        await supabase.from('user_profiles').upsert({
          user_id: user.id,
          name: user.user_metadata?.name || '',
          age: user.user_metadata?.age || null,
          dob: user.user_metadata?.dob || null,
          bmi: data.bmi,
          conditions: { menstrual: data.conditions, hereditary: data.hereditary },
          diet_type: data.dietType,
          activity_level: data.activityLevel,
          sleep_hours: data.sleepHours ? parseFloat(data.sleepHours) : null,
        }, { onConflict: 'user_id' });
      } else {
        localStorage.setItem('anemiacare_quiz', JSON.stringify(data));
      }
      navigate('/dashboard');
    } finally {
      setSaving(false);
    }
  };

  const CheckboxItem = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${
        checked ? 'border-secondary bg-secondary/20 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-secondary/50'
      }`}
    >
      <div className={`flex h-5 w-5 items-center justify-center rounded border ${checked ? 'border-secondary bg-secondary' : 'border-border'}`}>
        {checked && <Check className="h-3 w-3 text-secondary-foreground" />}
      </div>
      {label}
    </button>
  );

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-8">
      <Link to="/dashboard" className="mb-6 flex items-center gap-2">
        <Heart className="h-7 w-7 text-secondary" fill="hsl(var(--secondary))" />
        <span className="font-display text-xl font-bold text-foreground">AnemiaCare</span>
      </Link>

      <div className="w-full max-w-lg fade-in">
        {/* Progress Bar */}
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {step + 1} of {STEPS.length}</span>
          <button onClick={() => navigate('/dashboard')} className="underline">Skip</button>
        </div>
        <div className="mb-6 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <h2 className="mb-6 font-display text-2xl font-bold text-foreground">{STEPS[step]}</h2>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          {/* Step 0 - BMI */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Height (cm)</label>
                <input type="number" value={data.height} onChange={e => setData({ ...data, height: e.target.value })}
                  placeholder="e.g. 160" className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Weight (kg)</label>
                <input type="number" value={data.weight} onChange={e => setData({ ...data, weight: e.target.value })}
                  placeholder="e.g. 55" className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <button onClick={calculateBMI} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground btn-hover-scale">
                Calculate BMI
              </button>
              {data.bmi && (
                <div className="rounded-xl bg-accent/20 p-4">
                  <p className="text-sm text-muted-foreground">Your BMI</p>
                  <p className="font-display text-3xl font-bold text-foreground">{data.bmi}</p>
                  <span className="inline-block mt-1 rounded-lg bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                    {data.bmiCategory}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step 1 - Menstrual */}
          {step === 1 && (
            <div className="space-y-3">
              {['Regular Periods', 'PCOS / PCOD', 'Irregular periods', 'Currently pregnant', 'Post-menopausal'].map(c => (
                <CheckboxItem key={c} label={c} checked={data.conditions.includes(c)} onChange={() => toggleArray('conditions', c)} />
              ))}
            </div>
          )}

          {/* Step 2 - Hereditary */}
          {step === 2 && (
            <div className="space-y-3">
              {['Thalassemia', 'Sickle cell trait', 'Diabetes', 'Thyroid disorder', 'None'].map(c => (
                <CheckboxItem key={c} label={c} checked={data.hereditary.includes(c)} onChange={() => toggleArray('hereditary', c)} />
              ))}
            </div>
          )}

          {/* Step 3 - Lifestyle */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Diet Type</label>
                <select value={data.dietType} onChange={e => setData({ ...data, dietType: e.target.value })}
                  className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select</option>
                  <option>Vegetarian</option>
                  <option>Non-vegetarian</option>
                  <option>Vegan</option>
                  <option>Eggetarian</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Activity Level</label>
                <select value={data.activityLevel} onChange={e => setData({ ...data, activityLevel: e.target.value })}
                  className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select</option>
                  <option>Sedentary</option>
                  <option>Lightly Active</option>
                  <option>Moderately Active</option>
                  <option>Very Active</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Sleep Hours/Day</label>
                <select value={data.sleepHours} onChange={e => setData({ ...data, sleepHours: e.target.value })}
                  className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select</option>
                  <option>Less than 5</option>
                  <option>5-6</option>
                  <option>6-7</option>
                  <option>7-8</option>
                  <option>More than 8</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Summary Card (after last step) */}
        {step === 3 && data.dietType && (
          <div className="mt-4 rounded-2xl border bg-card p-5 shadow-sm fade-in">
            <h3 className="font-display text-sm font-semibold text-foreground">Summary</h3>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              {data.bmi && <p>BMI: <span className="font-medium text-foreground">{data.bmi} ({data.bmiCategory})</span></p>}
              {data.conditions.length > 0 && <p>Conditions: <span className="font-medium text-foreground">{data.conditions.join(', ')}</span></p>}
              {data.hereditary.length > 0 && <p>Hereditary: <span className="font-medium text-foreground">{data.hereditary.join(', ')}</span></p>}
              <p>Diet: <span className="font-medium text-foreground">{data.dietType}</span></p>
              <p>Activity: <span className="font-medium text-foreground">{data.activityLevel}</span></p>
              <p>Sleep: <span className="font-medium text-foreground">{data.sleepHours} hrs</span></p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm text-muted-foreground disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1 rounded-lg bg-secondary px-5 py-2 text-sm font-semibold text-secondary-foreground btn-hover-scale"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground btn-hover-scale disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Submit & Continue'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
