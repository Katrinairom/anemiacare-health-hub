import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Upload, Utensils, ListChecks, UserCircle, TrendingUp, Plus, X, CheckCircle, Circle } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

interface HbReading {
  hb_value: number;
  status: string;
  created_at: string;
}

function getHbStatus(val: number) {
  if (val < 7) return { label: 'Severe', color: 'bg-destructive text-destructive-foreground', key: 'severe' };
  if (val < 10) return { label: 'Moderate', color: 'bg-warning text-warning-foreground', key: 'moderate' };
  if (val < 12) return { label: 'Mild', color: 'bg-warning/60 text-foreground', key: 'mild' };
  return { label: 'Sufficient', color: 'bg-accent text-accent-foreground', key: 'sufficient' };
}

function getSeverityKey(val: number): string {
  if (val < 7) return 'severe';
  if (val < 10) return 'moderate';
  return 'mild';
}

const DEMO_READINGS: HbReading[] = [
  { hb_value: 9.2, status: 'Moderate', created_at: '2026-01-15' },
  { hb_value: 10.1, status: 'Mild', created_at: '2026-02-10' },
  { hb_value: 10.8, status: 'Mild', created_at: '2026-03-01' },
  { hb_value: 11.4, status: 'Mild', created_at: '2026-03-12' },
];

const quickActions = [
  { to: '/upload', icon: Upload, label: 'Upload Report', desc: 'Analyse blood report' },
  { to: '/diet', icon: Utensils, label: 'Diet Plan', desc: 'Personalised diet' },
  { to: '/todos', icon: ListChecks, label: 'To-Dos', desc: 'Daily health tasks' },
  { to: '/profile', icon: UserCircle, label: 'Edit Profile', desc: 'Update your info' },
];

// === Healthy Habits defaults by severity ===
const HABITS_BY_SEVERITY: Record<string, string[]> = {
  mild: [
    'Take iron-rich meals twice a day',
    'Add lemon to meals',
    'Walk 20 mins daily',
    'Avoid tea/coffee with food',
    'Take prescribed supplements',
  ],
  moderate: [
    'Take doctor-prescribed iron tablets',
    'Eat liver or leafy greens daily',
    'Drink beetroot/amla juice',
    'Rest adequately',
    'Weekly Hb check reminder',
  ],
  severe: [
    "Follow doctor's treatment plan",
    'Take IV/oral iron as prescribed',
    'Eat iron-rich food every meal',
    'Avoid strenuous activity',
    'Daily symptom log',
  ],
};

interface HabitTask {
  id: string;
  text: string;
  done: boolean;
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function loadHabits(severityKey: string): HabitTask[] {
  const today = getTodayKey();
  const storageKey = `anemiacare_habits`;
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.date === today) return parsed.tasks;
    } catch { /* ignore */ }
  }
  // Initialize with defaults for the severity
  const defaults = HABITS_BY_SEVERITY[severityKey] || HABITS_BY_SEVERITY.mild;
  return defaults.map((text, i) => ({ id: `default-${i}`, text, done: false }));
}

function saveHabits(tasks: HabitTask[]) {
  localStorage.setItem('anemiacare_habits', JSON.stringify({ date: getTodayKey(), tasks }));
}

export default function Dashboard() {
  const { user } = useAuth();
  const [readings, setReadings] = useState<HbReading[]>([]);
  const [loading, setLoading] = useState(true);
  const name = user?.user_metadata?.name || 'there';

  // Hb update state
  const [hbInput, setHbInput] = useState('');
  const [hbSaving, setHbSaving] = useState(false);

  useEffect(() => {
    async function fetchReadings() {
      if (isSupabaseConfigured() && user) {
        const { data } = await supabase
          .from('hb_readings')
          .select('hb_value, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        setReadings(data || []);
      } else {
        // Load from localStorage or use demo
        const saved = localStorage.getItem('anemiacare_readings');
        setReadings(saved ? JSON.parse(saved) : DEMO_READINGS);
      }
      setLoading(false);
    }
    fetchReadings();
  }, [user]);

  const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;
  const hbStatus = latestReading ? getHbStatus(latestReading.hb_value) : null;
  const severityKey = latestReading ? getSeverityKey(latestReading.hb_value) : 'mild';

  // === Hb Update handler ===
  const handleHbUpdate = useCallback(async () => {
    const val = parseFloat(hbInput);
    if (isNaN(val) || val < 1 || val > 20) return;
    setHbSaving(true);
    const newReading: HbReading = {
      hb_value: val,
      status: getHbStatus(val).label,
      created_at: new Date().toISOString(),
    };
    if (isSupabaseConfigured() && user) {
      await supabase.from('hb_readings').insert({
        user_id: user.id, hb_value: val, status: newReading.status,
      });
    }
    const updated = [...readings, newReading];
    setReadings(updated);
    localStorage.setItem('anemiacare_readings', JSON.stringify(updated));
    setHbInput('');
    setHbSaving(false);
  }, [hbInput, readings, user]);

  // === Healthy Habits ===
  const [habits, setHabits] = useState<HabitTask[]>(() => loadHabits(severityKey));
  const [newHabit, setNewHabit] = useState('');

  // Re-init habits if severity changes (e.g. after adding a new reading)
  useEffect(() => {
    // Only re-init if no saved habits for today
    const saved = localStorage.getItem('anemiacare_habits');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.date === getTodayKey()) return; // already have today's
      } catch { /* ignore */ }
    }
    setHabits(loadHabits(severityKey));
  }, [severityKey]);

  useEffect(() => { saveHabits(habits); }, [habits]);

  const addHabit = () => {
    const text = newHabit.trim();
    if (!text) return;
    setHabits(prev => [...prev, { id: `custom-${Date.now()}`, text, done: false }]);
    setNewHabit('');
  };

  const toggleHabit = (id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, done: !h.done } : h));
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const completedHabits = habits.filter(h => h.done);
  const pendingHabits = habits.filter(h => !h.done);
  const habitProgress = habits.length > 0 ? Math.round((completedHabits.length / habits.length) * 100) : 0;

  const chartData = useMemo(() => ({
    labels: readings.map(r => new Date(r.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })),
    datasets: [{
      label: 'Hb Level (g/dL)',
      data: readings.map(r => r.hb_value),
      borderColor: 'hsl(218, 57%, 70%)',
      backgroundColor: 'hsla(218, 57%, 83%, 0.3)',
      fill: true,
      tension: 0.4,
      pointRadius: 5,
      pointBackgroundColor: 'hsl(326, 79%, 85%)',
      pointBorderColor: 'hsl(326, 79%, 75%)',
      pointBorderWidth: 2,
    }],
  }), [readings]);

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { min: 4, max: 16, ticks: { stepSize: 2 }, grid: { color: 'hsla(0,0%,0%,0.05)' } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
        Namaste, {name}! 🙏
      </h1>
      <p className="mt-1 text-muted-foreground">Here is your health snapshot.</p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {/* Hb Status Card */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm md:col-span-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">Latest Hb Level</span>
          </div>
          {loading ? (
            <div className="mt-4 h-16 animate-pulse rounded-lg bg-muted" />
          ) : latestReading ? (
            <div className="mt-4">
              <p className="font-display text-5xl font-bold text-foreground">
                {latestReading.hb_value}
                <span className="ml-1 text-lg font-normal text-muted-foreground">g/dL</span>
              </p>
              <span className={`mt-2 inline-block rounded-lg px-3 py-1 text-xs font-semibold ${hbStatus?.color}`}>
                {hbStatus?.label}
              </span>
              <p className="mt-3 text-xs text-muted-foreground">
                Last updated: {new Date(latestReading.created_at).toLocaleDateString('en-IN')}
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">No readings yet.</p>
              <Link to="/upload" className="mt-2 inline-block text-sm font-semibold text-foreground underline">
                Upload your first report →
              </Link>
            </div>
          )}

          {/* Update Hb Input */}
          <div className="mt-5 border-t pt-4">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Update Hb Count</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                min="1"
                max="20"
                value={hbInput}
                onChange={e => setHbInput(e.target.value)}
                placeholder="e.g. 11.2"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={handleHbUpdate}
                disabled={hbSaving || !hbInput}
                className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground btn-hover-scale disabled:opacity-50"
              >
                {hbSaving ? '...' : 'Add'}
              </button>
            </div>
          </div>
        </div>

        {/* Hb Trend Chart */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm md:col-span-2">
          <h3 className="font-display text-sm font-semibold text-foreground">Hb Trend</h3>
          {readings.length > 1 ? (
            <div className="mt-4">
              <Line data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="mt-8 text-center text-sm text-muted-foreground">
              <p>Upload at least 2 reports to see your trend chart.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <h3 className="mt-10 font-display text-lg font-semibold text-foreground">Quick Actions</h3>
      <div className="mt-4 grid gap-4 grid-cols-2 md:grid-cols-4">
        {quickActions.map(action => (
          <Link
            key={action.to}
            to={action.to}
            className="rounded-2xl border bg-card p-5 transition-all hover:shadow-md btn-hover-scale"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/30">
              <action.icon className="h-5 w-5 text-foreground" />
            </div>
            <p className="mt-3 font-display text-sm font-semibold text-foreground">{action.label}</p>
            <p className="text-xs text-muted-foreground">{action.desc}</p>
          </Link>
        ))}
      </div>

      {/* Healthy Habits To-Do */}
      <div className="mt-10">
        <h3 className="font-display text-lg font-semibold text-foreground">My Healthy Habits</h3>
        <p className="mt-1 text-sm text-muted-foreground">Track your daily health tasks. Resets each day.</p>

        {/* Progress bar */}
        <div className="mt-4 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Today's Progress</span>
            <span className="font-semibold text-foreground">{completedHabits.length}/{habits.length} habits completed</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${habitProgress}%` }} />
          </div>
        </div>

        {/* Add task */}
        <div className="mt-4 flex gap-2">
          <input
            value={newHabit}
            onChange={e => setNewHabit(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addHabit()}
            placeholder="Add a new habit..."
            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button onClick={addHabit} disabled={!newHabit.trim()} className="flex items-center gap-1 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground btn-hover-scale disabled:opacity-50">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>

        {/* Pending tasks */}
        <div className="mt-4 space-y-2">
          {pendingHabits.map(h => (
            <div key={h.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm text-foreground">
              <button onClick={() => toggleHabit(h.id)}><Circle className="h-5 w-5 text-border" /></button>
              <span className="flex-1">{h.text}</span>
              <button onClick={() => deleteHabit(h.id)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>

        {/* Completed tasks */}
        {completedHabits.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Completed</p>
            <div className="space-y-2">
              {completedHabits.map(h => (
                <div key={h.id} className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-muted-foreground line-through">
                  <button onClick={() => toggleHabit(h.id)}><CheckCircle className="h-5 w-5 text-accent" /></button>
                  <span className="flex-1">{h.text}</span>
                  <button onClick={() => deleteHabit(h.id)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
