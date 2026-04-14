import { Heart, Droplet, AlertTriangle, CheckCircle2, Shield, Clock, Activity, BookOpen } from 'lucide-react';

export function Education() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blood Donation Education</h1>
          <p className="text-xl text-red-100 max-w-3xl mx-auto">
            Learn everything you need to know about blood donation, compatibility, and saving lives
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Blood Type Compatibility Chart */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Blood Type Compatibility Chart
          </h2>
          
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="p-4 text-left font-bold text-gray-900">Blood Type</th>
                    <th className="p-4 text-center font-bold text-green-700">Can Donate To</th>
                    <th className="p-4 text-center font-bold text-blue-700">Can Receive From</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Droplet className="w-5 h-5 text-red-600" fill="currentColor" />
                        <span className="font-bold text-red-600 text-lg">O-</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                        All Blood Types (Universal Donor)
                      </span>
                    </td>
                    <td className="p-4 text-center text-gray-900">O-</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Droplet className="w-5 h-5 text-red-600" fill="currentColor" />
                        <span className="font-bold text-red-600 text-lg">O+</span>
                      </div>
                    </td>
                    <td className="p-4 text-center text-gray-900">O+, A+, B+, AB+</td>
                    <td className="p-4 text-center text-gray-900">O-, O+</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Droplet className="w-5 h-5 text-red-600" fill="currentColor" />
                        <span className="font-bold text-red-600 text-lg">A-</span>
                      </div>
                    </td>
                    <td className="p-4 text-center text-gray-900">A-, A+, AB-, AB+</td>
                    <td className="p-4 text-center text-gray-900">O-, A-</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Droplet className="w-5 h-5 text-red-600" fill="currentColor" />
                        <span className="font-bold text-red-600 text-lg">A+</span>
                      </div>
                    </td>
                    <td className="p-4 text-center text-gray-900">A+, AB+</td>
                    <td className="p-4 text-center text-gray-900">O-, O+, A-, A+</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Droplet className="w-5 h-5 text-red-600" fill="currentColor" />
                        <span className="font-bold text-red-600 text-lg">B-</span>
                      </div>
                    </td>
                    <td className="p-4 text-center text-gray-900">B-, B+, AB-, AB+</td>
                    <td className="p-4 text-center text-gray-900">O-, B-</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Droplet className="w-5 h-5 text-red-600" fill="currentColor" />
                        <span className="font-bold text-red-600 text-lg">B+</span>
                      </div>
                    </td>
                    <td className="p-4 text-center text-gray-900">B+, AB+</td>
                    <td className="p-4 text-center text-gray-900">O-, O+, B-, B+</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Droplet className="w-5 h-5 text-red-600" fill="currentColor" />
                        <span className="font-bold text-red-600 text-lg">AB-</span>
                      </div>
                    </td>
                    <td className="p-4 text-center text-gray-900">AB-, AB+</td>
                    <td className="p-4 text-center text-gray-900">O-, A-, B-, AB-</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Droplet className="w-5 h-5 text-red-600" fill="currentColor" />
                        <span className="font-bold text-red-600 text-lg">AB+</span>
                      </div>
                    </td>
                    <td className="p-4 text-center text-gray-900">AB+</td>
                    <td className="p-4 text-center">
                      <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                        All Blood Types (Universal Recipient)
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <h3 className="text-xl font-bold text-green-900">Universal Donor</h3>
              </div>
              <p className="text-green-800">
                <strong>O-</strong> blood type is the universal donor and can be given to anyone. This makes O- donors incredibly valuable during emergencies.
              </p>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 className="w-8 h-8 text-blue-600" />
                <h3 className="text-xl font-bold text-blue-900">Universal Recipient</h3>
              </div>
              <p className="text-blue-800">
                <strong>AB+</strong> blood type is the universal recipient and can receive blood from all other blood types.
              </p>
            </div>
          </div>
        </section>

        {/* Donation Process */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">The Donation Process</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">1</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Registration</h3>
              <p className="text-sm text-gray-600">
                Register and provide basic information. Show ID and answer health questions.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Health Screening</h3>
              <p className="text-sm text-gray-600">
                Quick health check including blood pressure, temperature, and hemoglobin test.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Donation</h3>
              <p className="text-sm text-gray-600">
                The actual donation takes 8-10 minutes. Relax while trained staff collect your blood.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">4</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Refreshments</h3>
              <p className="text-sm text-gray-600">
                Enjoy snacks and drinks. Rest for 10-15 minutes before leaving.
              </p>
            </div>
          </div>
        </section>

        {/* Eligibility Guidelines */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Eligibility Guidelines</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Can Donate */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <h3 className="text-2xl font-bold text-gray-900">You Can Donate If:</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Age between 18-65 years</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Weight at least 50 kg (110 lbs)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">In good general health</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">At least 3 months since last donation</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Had a good meal and plenty of fluids</span>
                </li>
              </ul>
            </div>

            {/* Cannot Donate */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="w-8 h-8 text-red-600" />
                <h3 className="text-2xl font-bold text-gray-900">Cannot Donate If:</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Currently sick or taking antibiotics</span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Pregnant or breastfeeding</span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Recent tattoo or piercing (within 6 months)</span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">History of certain medical conditions</span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Recent travel to certain countries</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Common Myths */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Common Myths & Facts</h2>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-red-600 mb-2">MYTH: Donating blood is painful</h3>
                  <p className="text-gray-700">
                    <strong className="text-green-600">FACT:</strong> You may feel a slight pinch when the needle goes in, but the donation itself is painless. Most people describe it as less painful than a routine blood test.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-red-600 mb-2">MYTH: I can get sick from donating blood</h3>
                  <p className="text-gray-700">
                    <strong className="text-green-600">FACT:</strong> All equipment used is sterile and single-use. It's impossible to contract any disease from donating blood.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-red-600 mb-2">MYTH: Donating makes you weak</h3>
                  <p className="text-gray-700">
                    <strong className="text-green-600">FACT:</strong> Your body replaces the donated blood volume within 24-48 hours. Most donors feel fine and can resume normal activities the same day.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-red-600 mb-2">MYTH: Older people can't donate</h3>
                  <p className="text-gray-700">
                    <strong className="text-green-600">FACT:</strong> There's no upper age limit for blood donation as long as you're healthy and meet other eligibility criteria.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Health Benefits */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Health Benefits of Donating</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Heart Health</h3>
              <p className="text-sm text-gray-600">
                Regular blood donation reduces iron stores, which may lower the risk of heart disease.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Free Health Screening</h3>
              <p className="text-sm text-gray-600">
                Each donation includes a mini health checkup including blood pressure, pulse, and hemoglobin levels.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Stimulates Blood Production</h3>
              <p className="text-sm text-gray-600">
                Your body replenishes the donated blood, stimulating the production of new blood cells.
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Save Lives?</h2>
          <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
            One donation can save up to three lives. Join our community of heroes today.
          </p>
          <button className="bg-white text-red-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-red-50 transition-colors shadow-lg">
            Register as a Donor
          </button>
        </section>
      </div>
    </div>
  );
}
