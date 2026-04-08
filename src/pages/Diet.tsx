import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Utensils, Sun, Coffee, Moon, AlertTriangle } from 'lucide-react';

interface MealPlan {
  meal: string;
  items: string[];
}

// New diet data by severity + food preference
const DIET_DATA: Record<string, Record<string, MealPlan[]>> = {
  mild: {
    veg: [
      { meal: 'Breakfast', items: ['Spinach dal with roti', 'Pomegranate juice', 'Fortified roti with ghee', 'Jaggery rice'] },
      { meal: 'Lunch', items: ['Palak paneer with rice', 'Mixed dal with lemon', 'Beetroot salad', 'Curd rice'] },
      { meal: 'Dinner', items: ['Methi roti with dal', 'Spinach soup', 'Moong dal khichdi', 'Lauki sabzi'] },
      { meal: 'Snacks', items: ['Pomegranate', 'Dates (4-5)', 'Jaggery chana', 'Orange/Amla juice'] },
    ],
    nonveg: [
      { meal: 'Breakfast', items: ['Egg bhurji with toast', 'Chicken keema paratha', 'Boiled eggs (2)', 'Fish cutlet'] },
      { meal: 'Lunch', items: ['Chicken liver curry with rice', 'Fish curry with roti', 'Egg curry', 'Spinach sabzi'] },
      { meal: 'Dinner', items: ['Grilled fish with salad', 'Egg fried rice', 'Chicken soup', 'Spinach sabzi with roti'] },
      { meal: 'Snacks', items: ['Boiled egg', 'Fish tikka', 'Chicken sandwich', 'Orange juice'] },
    ],
  },
  moderate: {
    veg: [
      { meal: 'Breakfast', items: ['Rajma paratha', 'Beetroot smoothie', 'Moringa soup', 'Soaked raisins + figs'] },
      { meal: 'Lunch', items: ['Rajma chawal', 'Beetroot sabzi with roti', 'Palak dal', 'Amla chutney'] },
      { meal: 'Dinner', items: ['Moringa soup with bread', 'Chana masala', 'Methi paratha', 'Mixed dal khichdi'] },
      { meal: 'Snacks', items: ['Soaked raisins + figs', 'Beetroot juice', 'Dates with nuts', 'Amla candy'] },
    ],
    nonveg: [
      { meal: 'Breakfast', items: ['Mutton liver fry', 'Egg curry with paratha', 'Sardine sandwich', 'Boiled eggs (2)'] },
      { meal: 'Lunch', items: ['Mutton liver curry with rice', 'Fish curry', 'Egg biryani', 'Leafy green sabzi'] },
      { meal: 'Dinner', items: ['Sardine curry with roti', 'Egg curry', 'Chicken stew with bread', 'Spinach dal'] },
      { meal: 'Snacks', items: ['Fish tikka', 'Boiled eggs', 'Chicken soup', 'Orange/Amla juice'] },
    ],
  },
  severe: {
    veg: [
      { meal: 'Breakfast', items: ['Iron-fortified porridge', 'Drumstick leaves sabzi', 'Dates (6-8)', 'Amla juice'] },
      { meal: 'Lunch', items: ['Drumstick leaves dal with rice', 'Palak paneer', 'Beetroot raita', 'Ragi roti'] },
      { meal: 'Dinner', items: ['Iron-fortified roti with dal', 'Moringa soup', 'Chana masala', 'Spinach khichdi'] },
      { meal: 'Snacks', items: ['Amla juice', 'Dates with jaggery', 'Soaked figs + raisins', 'Beetroot juice'] },
    ],
    nonveg: [
      { meal: 'Breakfast', items: ['Beef/goat liver fry', 'Eggs x2 (boiled/scrambled)', 'Bone broth', 'Fish cutlet'] },
      { meal: 'Lunch', items: ['Goat liver curry with rice', 'Fish curry with roti', 'Egg biryani', 'Leafy greens'] },
      { meal: 'Dinner', items: ['Bone broth soup', 'Fish curry', 'Egg curry with roti', 'Chicken liver stir-fry'] },
      { meal: 'Snacks', items: ['Boiled eggs', 'Fish tikka', 'Bone broth', 'Orange juice'] },
    ],
  },
};

const mealIcons: Record<string, typeof Sun> = { Breakfast: Sun, Lunch: Utensils, Dinner: Moon, Snacks: Coffee };

function getSeverityKey(hbValue: number): string {
  if (hbValue < 7) return 'severe';
  if (hbValue < 10) return 'moderate';
  return 'mild';
}

function getSeverityLabel(key: string): string {
  if (key === 'severe') return 'Severe (Hb < 7)';
  if (key === 'moderate') return 'Moderate (Hb 7–9.9)';
  return 'Mild (Hb 10–11.9)';
}

export default function Diet() {
  const { user } = useAuth();
  const [severityKey, setSeverityKey] = useState('mild');
  const [foodPref, setFoodPref] = useState<'veg' | 'nonveg'>('veg');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      let hbValue = 10.8;
      if (isSupabaseConfigured() && user) {
        const { data } = await supabase
          .from('hb_readings')
          .select('hb_value')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (data) hbValue = data.hb_value;
      } else {
        const saved = localStorage.getItem('anemiacare_readings');
        if (saved) {
          const arr = JSON.parse(saved);
          if (arr.length > 0) hbValue = arr[arr.length - 1].hb_value;
        }
      }
      setSeverityKey(getSeverityKey(hbValue));
      setLoading(false);
    }
    load();
  }, [user]);

  const plans = DIET_DATA[severityKey]?.[foodPref] || DIET_DATA.mild.veg;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Your Diet Plan</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Personalised Indian diet based on your Hb status:{' '}
        <span className="font-semibold text-foreground">{getSeverityLabel(severityKey)}</span>
      </p>

      {/* Food preference toggle */}
      <div className="mt-5 inline-flex rounded-xl border bg-muted p-1">
        <button
          onClick={() => setFoodPref('veg')}
          className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${foodPref === 'veg' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          🥬 Vegetarian
        </button>
        <button
          onClick={() => setFoodPref('nonveg')}
          className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${foodPref === 'nonveg' ? 'bg-secondary text-secondary-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          🍗 Non-Vegetarian
        </button>
      </div>

      {severityKey === 'severe' && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span><strong>Severe anemia detected.</strong> Please consult a doctor immediately. This diet plan is supplementary, not a replacement for medical treatment.</span>
        </div>
      )}

      {(severityKey === 'severe' || severityKey === 'moderate') && (
        <div className="mt-4 rounded-xl bg-secondary/20 px-4 py-3 text-sm text-foreground">
          🍎 <strong>Iron-boosting focus:</strong> Include Palak, Rajma, Chana, Jaggery, Dates, Amla, Ragi + Vitamin C sources for better iron absorption.
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {plans.map(plan => {
            const Icon = mealIcons[plan.meal] || Utensils;
            return (
              <div key={plan.meal} className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/30">
                    <Icon className="h-4 w-4 text-foreground" />
                  </div>
                  <h3 className="font-display text-base font-semibold text-foreground">{plan.meal}</h3>
                </div>
                <ul className="mt-4 space-y-2">
                  {plan.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 rounded-2xl border bg-card p-5 shadow-sm">
        <h3 className="font-display text-base font-semibold text-foreground">💡 Tips for Better Iron Absorption</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>• Pair iron-rich foods with Vitamin C (lemon, amla, orange)</li>
          <li>• Avoid tea/coffee within 1 hour of meals — they block iron absorption</li>
          <li>• Cook in iron kadhai/tawa to boost iron content of food</li>
          <li>• Soak and sprout legumes to increase iron bioavailability</li>
        </ul>
      </div>
    </div>
  );
}
