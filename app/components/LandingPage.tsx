import { AlertCircle, MapPin, Shield, Users, Clock, Heart, Droplets, Activity, CheckCircle2, Calendar, BookOpen, ArrowRight, Building2, Megaphone } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

type Page = 'home' | 'find-blood' | 'become-donor' | 'hospitals' | 'hospitals-list' | 'education' | 'campaigns' | 'donor-dashboard' | 'requestor-dashboard' | 'hospital-panel' | 'profile' | 'notifications';

interface LandingPageProps {
  onNavigate: (page: Page) => void;
  onLogin: () => void;
  onSignup: () => void;
}

export function LandingPage({ onNavigate, onLogin, onSignup }: LandingPageProps) {
  return (
    <div className="bg-white">
      {/* ── Hero Section ─────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1763149191834-471c980404f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwZW1lcmdlbmN5JTIwaG9zcGl0YWwlMjBtb2Rlcm58ZW58MXx8fHwxNzY5Njc5NzYyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Medical Emergency"
            className="w-full h-full object-cover opacity-20"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-3xl">
            {/* Emergency Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Real-Time Blood Donor Network</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Every Second Counts.<br />
              <span className="text-red-200">Find Blood. Save Lives.</span>
            </h1>

            <p className="text-xl md:text-2xl text-red-100 mb-8 leading-relaxed">
              Connect with verified blood donors in real-time during emergencies.
              GPS-powered matching. Hospital-verified. Trusted by thousands.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button
                onClick={() => onNavigate('find-blood')}
                type="button"
                className="group relative z-20 w-full sm:w-auto min-h-[56px] flex items-center justify-center gap-2 bg-white text-red-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-red-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <AlertCircle className="w-5 h-5 group-hover:animate-pulse" />
                Request Blood Now
              </button>
              <button
                onClick={onSignup}
                type="button"
                className="group w-full sm:w-auto min-h-[56px] flex items-center justify-center gap-2 bg-transparent text-white px-8 py-4 rounded-lg font-semibold text-lg border-2 border-white/50 hover:border-white hover:bg-white/10 transition-all"
              >
                <Heart className="w-5 h-5" />
                Become a Donor
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-red-100">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span>Hospital Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>GPS-Based Matching</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>24/7 Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500 rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-400 rounded-full blur-3xl opacity-20 pointer-events-none" />
      </section>

      {/* ── Live Stats ────────────────────────────────────────── */}
      <section className="bg-white py-12 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Activity className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">12,450+</div>
              <div className="text-sm text-gray-600">Active Donors</div>
              <div className="text-xs text-green-600 mt-1 flex items-center justify-center gap-1">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                Online Now
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle2 className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">8,920</div>
              <div className="text-sm text-gray-600">Requests Fulfilled</div>
              <div className="text-xs text-gray-500 mt-1">This Month</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">340+</div>
              <div className="text-sm text-gray-600">Partner Hospitals</div>
              <div className="text-xs text-gray-500 mt-1">Verified Network</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">&lt; 15min</div>
              <div className="text-sm text-gray-600">Average Response</div>
              <div className="text-xs text-gray-500 mt-1">In Emergencies</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION: Find Blood ───────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-1.5 mb-5">
                <Droplets className="w-4 h-4 text-red-600" fill="currentColor" />
                <span className="text-sm font-semibold text-red-600">Find Blood</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                Need Blood Urgently?<br />
                <span className="text-red-600">We'll Find a Match — Fast.</span>
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Search for compatible donors near you in real time. Our GPS-powered engine
                matches blood type, location, and availability — delivering results in under a minute.
              </p>
              <ul className="space-y-3 mb-8">
                {['Filter by blood type & location', 'View verified donor profiles', 'Submit emergency request instantly', 'Hospital confirmation & tracking'].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => onNavigate('find-blood')}
                className="inline-flex items-center gap-2 bg-red-600 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-red-700 transition-all shadow-md hover:shadow-lg group"
              >
                Find Blood Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { type: 'O-', label: 'Universal Donor', color: 'bg-red-600', donors: '1,240 nearby' },
                { type: 'A+', label: 'Most Common', color: 'bg-rose-500', donors: '3,120 nearby' },
                { type: 'B+', label: 'High Demand', color: 'bg-orange-500', donors: '2,440 nearby' },
                { type: 'AB+', label: 'Universal Recipient', color: 'bg-red-800', donors: '890 nearby' },
              ].map((bt) => (
                <div key={bt.type} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 ${bt.color} rounded-xl flex items-center justify-center mb-3`}>
                    <span className="text-white font-bold text-lg">{bt.type}</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">{bt.label}</div>
                  <div className="text-xs text-green-600 font-medium">{bt.donors}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION: Become Donor ─────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Steps */}
            <div className="order-2 lg:order-1 space-y-5">
              {[
                { step: '01', title: 'Create your donor profile', desc: 'Sign up and complete your health screening form in minutes.' },
                { step: '02', title: 'Get verified by hospital', desc: 'Our hospital partners verify your eligibility and health records.' },
                { step: '03', title: 'Receive donation alerts', desc: 'Get real-time notifications when your blood type is urgently needed nearby.' },
                { step: '04', title: 'Schedule & donate', desc: 'Confirm a slot, visit the hospital, and save a life.' },
              ].map((s) => (
                <div key={s.step} className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-white font-bold text-sm">{s.step}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{s.title}</h4>
                    <p className="text-sm text-gray-600">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-full px-4 py-1.5 mb-5">
                <Heart className="w-4 h-4 text-rose-600" />
                <span className="text-sm font-semibold text-rose-600">Become a Donor</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                Be a Hero.<br />
                <span className="text-rose-600">Register as a Donor Today.</span>
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                One donation saves up to 3 lives. Join over 12,000 active donors on HemoConnect
                and make a difference when it matters most.
              </p>
              <div className="flex gap-3 flex-wrap mb-8">
                {['18-65 yrs', 'Weight ≥ 50kg', 'Good health', 'Every 3 months'].map((e) => (
                  <span key={e} className="text-sm bg-rose-50 text-rose-700 border border-rose-200 rounded-full px-3 py-1.5 font-medium">
                    ✓ {e}
                  </span>
                ))}
              </div>
              <button
                onClick={() => onNavigate('become-donor')}
                className="inline-flex items-center gap-2 bg-rose-600 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-rose-700 transition-all shadow-md hover:shadow-lg group"
              >
                Start Donation Journey
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION: Hospitals ───────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 mb-5">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-600">Partner Hospitals</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              340+ Verified Hospital Partners
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our network of hospitals and blood banks ensures every donation is safe, verified, and goes where it's needed most.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { icon: Shield, color: 'blue', title: 'NABH Accredited', desc: 'All partner hospitals are NABH accredited and maintain highest safety standards.' },
              { icon: Activity, color: 'indigo', title: 'Real-Time Inventory', desc: 'View live blood inventory levels across all partner hospitals in your area.' },
              { icon: MapPin, color: 'violet', title: 'Find Nearest Bank', desc: 'Locate the nearest blood bank or hospital with your required blood type.' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 text-${color}-600`} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => onNavigate('hospitals-list')}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg group"
            >
              Explore All Hospitals
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* ── SECTION: Awareness & Education ───────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5 mb-5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-600">Awareness & Education</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                Know Before You Donate.<br />
                <span className="text-emerald-600">Learn. Empower. Save.</span>
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Discover blood type compatibility, donation eligibility, myths vs facts, and the health benefits of
                becoming a regular donor — all in one place.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { label: 'Blood Type Compatibility', color: 'red' },
                  { label: 'Eligibility Guidelines', color: 'green' },
                  { label: 'Myths & Facts', color: 'orange' },
                  { label: 'Health Benefits', color: 'blue' },
                ].map((t) => (
                  <div key={t.label} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className={`w-2 h-2 bg-${t.color}-500 rounded-full flex-shrink-0`} />
                    {t.label}
                  </div>
                ))}
              </div>
              <button
                onClick={() => onNavigate('education')}
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg group"
              >
                Explore Awareness Hub
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            {/* Info Cards */}
            <div className="space-y-4">
              {[
                { type: 'O-', badge: 'Universal Donor', info: 'Can donate to ALL blood types. Less than 7% of population has O-.', color: 'red' },
                { type: 'AB+', badge: 'Universal Recipient', info: 'Can receive blood from ALL types. Only 3% of population is AB+.', color: 'blue' },
                { type: 'O+', badge: 'Most Common', info: '37% of people are O+. In high demand at hospitals nationwide.', color: 'orange' },
              ].map((b) => (
                <div key={b.type} className={`bg-${b.color}-50 border border-${b.color}-200 rounded-xl p-5 flex gap-4 items-center`}>
                  <div className={`w-14 h-14 bg-${b.color}-600 rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-bold text-xl">{b.type}</span>
                  </div>
                  <div>
                    <div className={`text-xs font-bold text-${b.color}-700 mb-1`}>{b.badge}</div>
                    <p className="text-sm text-gray-700">{b.info}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION: Campaigns ───────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-rose-50 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-rose-100 border border-rose-200 rounded-full px-4 py-1.5 mb-5">
              <Megaphone className="w-4 h-4 text-rose-600" />
              <span className="text-sm font-semibold text-rose-600">Nearby Campaigns</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Upcoming Blood Donation Drives</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Blood banks, hospitals, and NGOs regularly organize donation camps.
              Find events happening near you and register to donate.
            </p>
          </div>

          {/* Sample campaign cards preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              {
                title: 'World Blood Donor Day Mega Drive',
                organizer: 'Apollo Hospitals',
                date: 'Jun 14, 2026',
                location: 'Jubilee Hills',
                urgent: true,
                spots: 45,
              },
              {
                title: 'Monthly Community Blood Drive',
                organizer: 'Red Cross Blood Bank',
                date: 'Jun 20, 2026',
                location: 'Banjara Hills',
                urgent: false,
                spots: 28,
              },
              {
                title: 'University Campus Donation Camp',
                organizer: 'JNTU Hyderabad',
                date: 'Jun 22, 2026',
                location: 'Kukatpally',
                urgent: false,
                spots: 80,
              },
            ].map((c) => (
              <div key={c.title} className="bg-white rounded-2xl p-5 shadow-sm border border-rose-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  {c.urgent && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-600 text-white flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      URGENT
                    </span>
                  )}
                  <span className="text-xs text-green-600 font-semibold ml-auto">{c.spots} spots</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-1 text-sm leading-snug">{c.title}</h4>
                <p className="text-xs text-red-600 font-medium mb-3">{c.organizer}</p>
                <div className="space-y-1.5 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />{c.date}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />{c.location}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => onNavigate('campaigns')}
              className="inline-flex items-center gap-2 bg-rose-600 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-rose-700 transition-all shadow-md hover:shadow-lg group"
            >
              View All Campaigns
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How HemoConnect Works</h2>
            <p className="text-xl text-gray-600">Fast, reliable, and verified blood donation in 3 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-red-600">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Request Blood</h3>
              <p className="text-gray-600 mb-4">
                Submit your emergency request with blood type, location, and urgency level. Upload medical documents for verification.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" />Instant request submission</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" />Hospital verification</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">GPS Matching</h3>
              <p className="text-gray-600 mb-4">
                Our smart system finds compatible donors near you in real-time. Donors receive instant notifications.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" />Blood type compatibility</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" />Distance-based priority</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Donate & Save</h3>
              <p className="text-gray-600 mb-4">
                Donors accept requests and visit authorized hospitals. Track donation status in real-time.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" />Authorized hospitals only</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" />Real-time tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why HemoConnect ──────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose HemoConnect?</h2>
            <p className="text-xl text-gray-600">The most trusted blood donation platform</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Shield, color: 'red', title: 'Verified Users', desc: 'All donors and hospitals are verified with medical documents and official IDs.' },
              { icon: MapPin, color: 'blue', title: 'GPS-Based Matching', desc: 'Find the nearest compatible donors instantly using real-time location data.' },
              { icon: Activity, color: 'purple', title: 'Real-Time Updates', desc: 'Track your request status and receive instant notifications at every step.' },
              { icon: Clock, color: 'green', title: 'Emergency Priority', desc: 'Critical requests get top priority with immediate notifications to nearby donors.' },
              { icon: Users, color: 'orange', title: 'Large Network', desc: 'Access to thousands of verified donors and hundreds of partner hospitals.' },
              { icon: Heart, color: 'pink', title: 'Data Privacy', desc: 'Your medical information is encrypted and protected with industry standards.' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${color}-600`} />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-600 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-red-100 mb-8">
            Join thousands of donors and help save lives in your community
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onSignup}
              className="bg-white text-red-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-red-50 transition-colors shadow-lg"
            >
              Create Free Account
            </button>
            <button
              onClick={onLogin}
              className="bg-red-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-red-800 transition-colors border-2 border-white"
            >
              Login to Dashboard
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
