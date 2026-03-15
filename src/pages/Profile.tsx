import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Camera, Save } from 'lucide-react';

interface ProfileData {
  name: string;
  age: string;
  dob: string;
  cycle_length: string;
  cycle_regular: string;
  avatar_url: string;
  bmi: number | null;
  conditions: { menstrual?: string[]; hereditary?: string[] } | null;
  diet_type: string;
  activity_level: string;
  sleep_hours: string;
}

export default function Profile() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData>({
    name: user?.user_metadata?.name || '',
    age: user?.user_metadata?.age?.toString() || '',
    dob: user?.user_metadata?.dob || '',
    cycle_length: '',
    cycle_regular: '',
    avatar_url: '',
    bmi: null,
    conditions: null,
    diet_type: '',
    activity_level: '',
    sleep_hours: '',
  });

  useEffect(() => {
    async function load() {
      if (isSupabaseConfigured() && user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (data) {
          setProfile({
            name: data.name || '',
            age: data.age?.toString() || '',
            dob: data.dob || '',
            cycle_length: data.cycle_length?.toString() || '',
            cycle_regular: data.cycle_regular || '',
            avatar_url: data.avatar_url || '',
            bmi: data.bmi,
            conditions: data.conditions,
            diet_type: data.diet_type || '',
            activity_level: data.activity_level || '',
            sleep_hours: data.sleep_hours?.toString() || '',
          });
        }
      } else {
        const saved = localStorage.getItem('anemiacare_demo_profile');
        const quiz = localStorage.getItem('anemiacare_quiz');
        if (saved) {
          const p = JSON.parse(saved);
          setProfile(prev => ({ ...prev, name: p.name || prev.name, age: p.age?.toString() || prev.age, dob: p.dob || prev.dob }));
        }
        if (quiz) {
          const q = JSON.parse(quiz);
          setProfile(prev => ({
            ...prev,
            bmi: q.bmi,
            conditions: { menstrual: q.conditions, hereditary: q.hereditary },
            diet_type: q.dietType || '',
            activity_level: q.activityLevel || '',
            sleep_hours: q.sleepHours || '',
          }));
        }
      }
    }
    load();
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));

    if (isSupabaseConfigured() && user) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        setProfile(p => ({ ...p, avatar_url: data.publicUrl }));
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    if (isSupabaseConfigured() && user) {
      await supabase.from('user_profiles').upsert({
        user_id: user.id,
        name: profile.name,
        age: profile.age ? parseInt(profile.age) : null,
        dob: profile.dob || null,
        cycle_length: profile.cycle_length ? parseInt(profile.cycle_length) : null,
        cycle_regular: profile.cycle_regular || null,
        avatar_url: profile.avatar_url || null,
      }, { onConflict: 'user_id' });
    } else {
      localStorage.setItem('anemiacare_demo_profile', JSON.stringify(profile));
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const avatarSrc = avatarPreview || profile.avatar_url;

  return (
    <div className="mx-auto max-w-lg px-4 py-8 fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Your Profile</h1>

      {/* Avatar */}
      <div className="mt-6 flex justify-center">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-primary/30">
            {avatarSrc ? (
              <img src={avatarSrc} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-3xl font-bold text-foreground">
                {profile.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-sm"
          >
            <Camera className="h-4 w-4" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </div>
      </div>

      {/* Editable Fields */}
      <div className="mt-8 space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name</label>
          <input type="text" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })}
            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" maxLength={100} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Age</label>
            <input type="number" value={profile.age} onChange={e => setProfile({ ...profile, age: e.target.value })}
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Date of Birth</label>
            <input type="date" value={profile.dob} onChange={e => setProfile({ ...profile, dob: e.target.value })}
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Cycle Length (days)</label>
            <input type="number" value={profile.cycle_length} onChange={e => setProfile({ ...profile, cycle_length: e.target.value })}
              placeholder="e.g. 28" className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Cycle Regularity</label>
            <select value={profile.cycle_regular} onChange={e => setProfile({ ...profile, cycle_regular: e.target.value })}
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select</option>
              <option>Regular</option>
              <option>Irregular</option>
              <option>Not applicable</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary py-3 font-display text-sm font-semibold text-secondary-foreground transition-all hover:opacity-90 disabled:opacity-50 btn-hover-scale"
        >
          {saving ? 'Saving...' : saved ? '✓ Saved!' : <><Save className="h-4 w-4" /> Save Changes</>}
        </button>
      </div>

      {/* Quiz Answers (Read-only) */}
      {(profile.bmi || profile.conditions || profile.diet_type) && (
        <div className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">
          <h3 className="font-display text-sm font-semibold text-foreground">Body Profile (from quiz)</h3>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            {profile.bmi && <p>BMI: <span className="font-medium text-foreground">{profile.bmi}</span></p>}
            {profile.conditions?.menstrual && profile.conditions.menstrual.length > 0 && (
              <p>Menstrual/Hormonal: <span className="font-medium text-foreground">{profile.conditions.menstrual.join(', ')}</span></p>
            )}
            {profile.conditions?.hereditary && profile.conditions.hereditary.length > 0 && (
              <p>Hereditary: <span className="font-medium text-foreground">{profile.conditions.hereditary.join(', ')}</span></p>
            )}
            {profile.diet_type && <p>Diet: <span className="font-medium text-foreground">{profile.diet_type}</span></p>}
            {profile.activity_level && <p>Activity: <span className="font-medium text-foreground">{profile.activity_level}</span></p>}
            {profile.sleep_hours && <p>Sleep: <span className="font-medium text-foreground">{profile.sleep_hours} hrs</span></p>}
          </div>
        </div>
      )}
    </div>
  );
}
