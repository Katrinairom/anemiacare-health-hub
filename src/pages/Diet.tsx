import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { api } from '@/lib/api';
import { Utensils, Sun, Coffee, Moon } from 'lucide-react';

interface MealPlan {
  meal: string;
  items: string[];
}

const FALLBACK_PLANS: Record<string, MealPlan[]> = {
  severe: [
    { meal: 'Breakfast', items: ['Ragi porridge with jaggery', 'Amla juice', 'Dates (4-5)', 'Poha with peanuts'] },
    { meal: 'Lunch', items: ['Palak dal with rice', 'Rajma curry', 'Beetroot raita', 'Roti with ghee'] },
    { meal: 'Dinner', items: ['Chana masala', 'Ragi roti', 'Spinach soup', 'Curd rice'] },
    { meal: 'Snacks', items: ['Gur chana', 'Amla candy', 'Dry fruits mix', 'Orange/Mosambi juice (Vitamin C)'] },
  ],
  mild: [
    { meal: 'Breakfast', items: ['Moong dal chilla', 'Banana smoothie', 'Sprouted moong salad', 'Poha with lemon'] },
    { meal: 'Lunch', items: ['Dal tadka with rice', 'Palak paneer', 'Mixed veg sabzi', 'Cucumber raita'] },
    { meal: 'Dinner', items: ['Methi roti with dal', 'Tofu bhurji', 'Lauki soup', 'Khichdi'] },
    { meal: 'Snacks', items: ['Roasted chana', 'Fruit chaat with lemon', 'Murmura/Bhel', 'Jaggery ladoo'] },
  ],
  appropriate: [
    { meal: 'Breakfast', items: ['Idli-sambhar', 'Upma with vegetables', 'Dosa with chutney', 'Paratha with curd'] },
    { meal: 'Lunch', items: ['Dal, rice, sabzi, roti', 'Mixed dal with salad', 'Chole with rice', 'Vegetable pulao'] },
    { meal: 'Dinner', items: ['Roti with dal', 'Light soup with bread', 'Khichdi with ghee', 'Vegetable curry'] },
    { meal: 'Snacks', items: ['Seasonal fruits', 'Buttermilk/Lassi', 'Roasted makhana', 'Dry fruits'] },
  ],
};

const mealIcons: Record<string, typeof Sun> = { Breakfast: Sun, Lunch: Utensils, Dinner: Moon, Snacks: Coffee };

function getStatusKey(hbValue: number): string {
  if (hbValue < 7) return 'severe';
  if (hbValue < 10) return 'mild';
  return 'appropriate';
}

export default function Diet() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [statusLabel, setStatusLabel] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      let hbValue = 10.8; // default demo
      let statusKey = 'appropriate';

      if (isSupabaseConfigured() && user) {
        const { data } = await supabase
          .from('hb_readings')
          .select('hb_value')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (data) {
          hbValue = data.hb_value;
          statusKey = getStatusKey(hbValue);
        }
      }

      setStatusLabel(statusKey);

      // Try API first, fallback to local
      try {
        const apiPlans = await api.getDietPlan(statusKey);
        if (Array.isArray(apiPlans) && apiPlans.length > 0) {
          setPlans(apiPlans);
        } else {
          setPlans(FALLBACK_PLANS[statusKey] || FALLBACK_PLANS.appropriate);
        }
      } catch {
        setPlans(FALLBACK_PLANS[statusKey] || FALLBACK_PLANS.appropriate);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 fade-in">
      <h1 className="font-display text-2xl font-bold text-foreground">Your Diet Plan</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Personalised Indian diet based on your Hb status:{' '}
        <span className="font-semibold capitalize text-foreground">{statusLabel || '...'}</span>
      </p>

      {statusLabel === 'severe' || statusLabel === 'mild' ? (
        <div className="mt-4 rounded-xl bg-secondary/20 px-4 py-3 text-sm text-foreground">
          🍎 <strong>Iron-boosting focus:</strong> Include Palak, Rajma, Chana, Jaggery, Dates, Amla, Ragi + Vitamin C sources for better iron absorption.
        </div>
      ) : null}

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
