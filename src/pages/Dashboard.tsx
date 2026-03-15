import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Upload, Utensils, ListChecks, UserCircle, TrendingUp } from 'lucide-react';
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
  if (val < 7) return { label: 'Severe', color: 'bg-destructive text-destructive-foreground' };
  if (val < 10) return { label: 'Mild Anemia', color: 'bg-warning text-warning-foreground' };
  if (val <= 12) return { label: 'Appropriate', color: 'bg-warning/60 text-foreground' };
  return { label: 'Sufficient', color: 'bg-accent text-accent-foreground' };
}

const DEMO_READINGS: HbReading[] = [
  { hb_value: 9.2, status: 'Mild Anemia', created_at: '2026-01-15' },
  { hb_value: 10.1, status: 'Appropriate', created_at: '2026-02-10' },
  { hb_value: 10.8, status: 'Appropriate', created_at: '2026-03-01' },
  { hb_value: 11.4, status: 'Appropriate', created_at: '2026-03-12' },
];

const quickActions = [
  { to: '/upload', icon: Upload, label: 'Upload Report', desc: 'Analyse blood report' },
  { to: '/diet', icon: Utensils, label: 'Diet Plan', desc: 'Personalised diet' },
  { to: '/todos', icon: ListChecks, label: 'To-Dos', desc: 'Daily health tasks' },
  { to: '/profile', icon: UserCircle, label: 'Edit Profile', desc: 'Update your info' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [readings, setReadings] = useState<HbReading[]>([]);
  const [loading, setLoading] = useState(true);
  const name = user?.user_metadata?.name || 'there';

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
        setReadings(DEMO_READINGS);
      }
      setLoading(false);
    }
    fetchReadings();
  }, [user]);

  const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;
  const hbStatus = latestReading ? getHbStatus(latestReading.hb_value) : null;

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
    </div>
  );
}
