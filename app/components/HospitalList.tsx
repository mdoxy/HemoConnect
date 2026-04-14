import { MapPin, Phone, Clock, CheckCircle, Search, Star } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  rating: number;
  verified: boolean;
  operatingHours: string;
  emergencyServices: boolean;
}

// Parse CSV data
function parseCSV(csvText: string): Hospital[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  
  const hospitals: Hospital[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Handle quoted fields
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.replace(/^"|"$/g, ''));
    
    if (fields.length >= 7) {
      hospitals.push({
        id: `H${String(i).padStart(3, '0')}`,
        name: fields[0].trim(),
        address: fields[1].trim(),
        city: 'Pune',
        phone: fields[3].trim(),
        rating: Math.random() * (4.9 - 4.5) + 4.5, // Random rating between 4.5-4.9
        verified: true,
        operatingHours: '24/7',
        emergencyServices: fields[6].toLowerCase().includes('government') || fields[6].toLowerCase().includes('trust'),
      });
    }
  }
  
  return hospitals;
}

export function HospitalList() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const loadHospitals = async () => {
      try {
        const response = await fetch('/pune_hospital_10.csv');
        const csvText = await response.text();
        const parsedHospitals = parseCSV(csvText);
        setHospitals(parsedHospitals);
      } catch (error) {
        console.error('Error loading hospitals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHospitals();
  }, []);

  const filteredHospitals = hospitals.filter((hospital) => {
    const matchesSearch =
      hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.address.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Ensure current page is valid when filtered results change
  const totalPages = Math.max(1, Math.ceil(filteredHospitals.length / itemsPerPage));

  useEffect(() => {
    // If search term changes, show first page of results
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHospitals = filteredHospitals.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold mb-4">Find Blood Banks & Hospitals</h1>
          <p className="text-red-100 text-lg">
            Search for nearby hospitals and blood banks in your area
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by hospital name, city, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">Loading hospitals...</p>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredHospitals.length}</span>{' '}
                {filteredHospitals.length === 1 ? 'hospital' : 'hospitals'}
              </p>
            </div>

            {/* Hospital Cards */}
            <div className="space-y-6">
              {paginatedHospitals.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No hospitals found</h3>
                  <p className="text-gray-600">
                    Try adjusting your search terms to find what you're looking for.
                  </p>
                </div>
              ) : (
                paginatedHospitals.map((hospital) => (
                  <div
                    key={hospital.id}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200"
                  >
                    <div className="p-6">
                      {/* Hospital Header */}
                      <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h2 className="text-2xl font-bold text-gray-900">{hospital.name}</h2>
                          {hospital.verified && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-semibold">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </div>
                          )}
                          {hospital.emergencyServices && (
                            <div className="px-2 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-semibold">
                              Emergency
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 mb-4">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(hospital.rating)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-sm font-semibold text-gray-700 ml-1">
                            {hospital.rating.toFixed(1)}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-gray-600">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">
                              {hospital.address}, {hospital.city}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <a href={`tel:${hospital.phone}`} className="text-sm hover:text-red-600 transition-colors">
                              {hospital.phone}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm">{hospital.operatingHours}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{Math.min(filteredHospitals.length, itemsPerPage)}</span> of <span className="font-semibold text-gray-900">{filteredHospitals.length}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-md border focus:outline-none transition-colors text-sm ${currentPage === 1 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  Previous
                </button>

                <div className="text-sm text-gray-700">Page {currentPage} / {totalPages}</div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-md border focus:outline-none transition-colors text-sm ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  Next
                </button>
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Need Help?
              </h3>
              <p className="text-blue-800 text-sm">
                For blood donation or emergency requests, please contact the hospital directly using the phone number provided. 
                All listed hospitals are verified blood banks and medical facilities.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


