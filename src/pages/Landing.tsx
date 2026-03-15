import { Link } from 'react-router-dom';
import { Heart, Droplets, Shield, TrendingUp } from 'lucide-react';
import heroImage from '@/assets/hero-illustration.jpg';

const features = [
  {
    icon: Droplets,
    title: 'Track Hemoglobin',
    description: 'Upload blood reports and track your Hb levels over time with easy-to-read charts.',
  },
  {
    icon: Shield,
    title: 'Personalized Diet Plans',
    description: 'Get Indian diet recommendations based on your Hb levels — dal, sabzi, fruits & more.',
  },
  {
    icon: TrendingUp,
    title: 'Daily Health To-Dos',
    description: 'Simple daily reminders for iron supplements, vitamin C, and healthy habits.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Heart className="h-7 w-7 text-secondary" fill="hsl(var(--secondary))" />
          <span className="font-display text-xl font-bold text-foreground">AnemiaCare</span>
        </div>
        <div className="flex gap-3">
          <Link
            to="/auth"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted btn-hover-scale"
          >
            Log In
          </Link>
          <Link
            to="/auth?tab=signup"
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:opacity-90 btn-hover-scale"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="fade-in">
            <h1 className="font-display text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
              Know your Hb.
              <br />
              <span className="text-secondary">Know your health.</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Hemoglobin (Hb) carries oxygen to every part of your body. Low Hb levels affect
              <strong className="text-foreground"> 53% of Indian women</strong>, causing fatigue, weakness,
              and serious health complications. AnemiaCare helps you understand, track, and improve
              your hemoglobin levels with personalized Indian diet plans.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/auth?tab=signup"
                className="rounded-lg bg-secondary px-6 py-3 font-display text-base font-semibold text-secondary-foreground transition-all hover:opacity-90 btn-hover-scale"
              >
                Get Started — It's Free
              </Link>
              <Link
                to="/auth"
                className="rounded-lg border-2 border-primary bg-primary/20 px-6 py-3 font-display text-base font-semibold text-foreground transition-all hover:bg-primary/40 btn-hover-scale"
              >
                Log In
              </Link>
            </div>
          </div>
          <div className="fade-in">
            <img
              src={heroImage}
              alt="Indian women supporting each other in health"
              className="w-full rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Why Hb Matters */}
      <section className="bg-card py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center font-display text-3xl font-bold text-foreground">
            Why does Hemoglobin matter?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Hemoglobin is the protein in your red blood cells that carries oxygen. When it's low,
            you feel tired, dizzy, and weak. For women, menstruation, pregnancy, and diet all
            affect Hb levels. Early awareness can prevent anemia.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border bg-card p-6 transition-all hover:shadow-md btn-hover-scale"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/30">
                  <feature.icon className="h-6 w-6 text-foreground" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hb Level Guide */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center font-display text-3xl font-bold text-foreground">
          Understanding Hb Levels
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { range: '> 12 g/dL', label: 'Sufficient', color: 'bg-accent text-accent-foreground', desc: 'You\'re doing great! Maintain your healthy diet.' },
            { range: '10–12 g/dL', label: 'Appropriate', color: 'bg-warning text-warning-foreground', desc: 'Borderline — include more iron-rich foods.' },
            { range: '7–10 g/dL', label: 'Mild Anemia', color: 'bg-warning/70 text-foreground', desc: 'Consult a doctor and improve your diet.' },
            { range: '< 7 g/dL', label: 'Severe', color: 'bg-destructive text-destructive-foreground', desc: 'Seek medical attention immediately.' },
          ].map((level) => (
            <div key={level.label} className="rounded-2xl border bg-card p-5">
              <span className={`inline-block rounded-lg px-3 py-1 text-xs font-semibold ${level.color}`}>
                {level.label}
              </span>
              <p className="mt-3 font-display text-2xl font-bold text-foreground">{level.range}</p>
              <p className="mt-2 text-sm text-muted-foreground">{level.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary/30 py-16 text-center">
        <h2 className="font-display text-3xl font-bold text-foreground">
          Take charge of your health today
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
          Join thousands of Indian women who are tracking their hemoglobin and improving their health.
        </p>
        <Link
          to="/auth?tab=signup"
          className="mt-8 inline-block rounded-lg bg-secondary px-8 py-3 font-display text-base font-semibold text-secondary-foreground transition-all hover:opacity-90 btn-hover-scale"
        >
          Sign Up for Free
        </Link>
      </section>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Made with care for Indian women 💗
      </footer>
    </div>
  );
}
