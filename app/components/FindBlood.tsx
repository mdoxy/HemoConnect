import { Search, MapPin, Droplet, Phone, Navigation, Loader, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { parseCSV, Hospital } from '../utils/csvParser';
import { RequestForm } from './RequestForm';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type Page = 'home' | 'find-blood' | 'become-donor' | 'hospitals' | 'hospitals-list' | 'education' | 'donor-dashboard' | 'requestor-dashboard' | 'hospital-panel' | 'profile' | 'notifications';

interface User {
  id?: string;
  _id?: string;
  name: string;
  role: 'donor' | 'requestor' | 'hospital' | null;
  verified: boolean;
  bloodType?: string;
  email?: string;
}

interface FindBloodProps {
  onNavigate?: (page: Page) => void;
  user?: User | null;
  onSetPendingHospital?: (hospital: Hospital | null) => void;
  pendingHospital?: Hospital | null;
  onLoginRequired?: () => void;
  onSignupRequired?: () => void;
}

export function FindBlood({ 
  onNavigate, 
  user,
  onSetPendingHospital,
  pendingHospital,
  onLoginRequired,
  onSignupRequired
}: FindBloodProps) {
  const [bloodBanks, setBloodBanks] = useState<Hospital[]>([]);
  const [filteredBanks, setFilteredBanks] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBank, setSelectedBank] = useState<Hospital | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingBankForRequest, setPendingBankForRequest] = useState<Hospital | null>(null);
  const itemsPerPage = 10;
  const [mapCenter, setMapCenter] = useState<[number, number]>([18.5204, 73.8567]);
  const [mapZoom, setMapZoom] = useState<number>(11);
  const mapRef = useRef<any>(null);
  const [distances, setDistances] = useState<{ [key: string]: number }>({});
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const DISTANCE_RADIUS = 15; // km radius to show distance box
  const markerRefs = useRef<{ [key: string]: any }>({});
  const nearestIds = useMemo(() => {
    return Object.entries(distances)
      .map(([k, v]) => ({ id: k, d: v }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 3)
      .map(x => x.id);
  }, [distances]);

  // When user updates, check if we have a pending bank and should open request form
  useEffect(() => {
    if (user?.id || user?._id) {
      if (pendingBankForRequest) {
        focusOnBank(pendingBankForRequest, true);
        setShowRequestForm(true);
        setPendingBankForRequest(null);
        onSetPendingHospital?.(null);
      }
    }
  }, [user?.id, user?._id, pendingBankForRequest, onSetPendingHospital]);

  useEffect(() => {
    if (pendingHospital && !pendingBankForRequest) {
      setPendingBankForRequest(pendingHospital);
    }
  }, [pendingHospital, pendingBankForRequest]);

  useEffect(() => {
    const loadBloodBanks = async () => {
      try {
        const response = await fetch('/pune_blood_banks_10.csv');
        const csvText = await response.text();
        const banks = parseCSV(csvText);
        setBloodBanks(banks);
        setFilteredBanks(banks);
        setLoading(false);
      } catch (error) {
        console.error('Error loading blood banks:', error);
        setLoading(false);
      }
    };

    loadBloodBanks();
  }, []);

  // Auto-calculate distances using user's geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);

          const distanceMap: { [key: string]: number } = {};
          bloodBanks.forEach((bank) => {
            const dist = haversineDistance(latitude, longitude, bank.latitude, bank.longitude);
            distanceMap[String(bank.id)] = dist;
          });
          setDistances(distanceMap);
        },
        (err) => {
          console.log('Geolocation not available or permission denied', err);
          // Continue without distances if geolocation is not available
        }
      );
    }
  }, [bloodBanks]);

  const handleSearch = () => {
    let filtered = bloodBanks;

    if (searchLocation.trim()) {
      filtered = filtered.filter(bank =>
        bank.name.toLowerCase().includes(searchLocation.toLowerCase()) ||
        bank.address.toLowerCase().includes(searchLocation.toLowerCase()) ||
        bank.pincode.includes(searchLocation)
      );
    }

    if (selectedType) {
      filtered = filtered.filter(bank =>
        bank.type.toLowerCase().includes(selectedType.toLowerCase())
      );
    }

    setFilteredBanks(filtered);
    setCurrentPage(1);

    // Map centering behavior
    if (filtered.length === 1) {
      const b = filtered[0];
      setSelectedBank(b);
      setMapCenter([b.latitude, b.longitude]);
      setMapZoom(16);
      setTimeout(() => mapRef.current?.flyTo([b.latitude, b.longitude], 16, { duration: 1 }), 150);
    } else if (filtered.length > 1) {
      // fit bounds to all filtered banks
      try {
        const latlngs = filtered.map(b => [b.latitude, b.longitude]);
        const bounds = (L as any).latLngBounds(latlngs);
        setTimeout(() => mapRef.current?.fitBounds(bounds, { padding: [50, 50] }), 150);
      } catch (e) {
        // ignore
      }
    }
  };

  const findNearestBanks = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      setUserLocation([latitude, longitude]);
      const distanceMap: { [key: string]: number } = {};
      const sorted = [...filteredBanks].sort((a, b) => {
        const distA = haversineDistance(latitude, longitude, a.latitude, a.longitude);
        const distB = haversineDistance(latitude, longitude, b.latitude, b.longitude);
        distanceMap[String(a.id)] = distA;
        distanceMap[String(b.id)] = distB;
        return distA - distB;
      });
      setDistances(distanceMap);
      setFilteredBanks(sorted);
      setCurrentPage(1);
      // center on user and fit top results
      setMapCenter([latitude, longitude]);
      setMapZoom(12);
      setTimeout(() => {
        try {
          const top = sorted.slice(0, 3);
          const latlngs = top.length ? top.map(b => [b.latitude, b.longitude]) : sorted.slice(0, 5).map(b => [b.latitude, b.longitude]);
          const bounds = (L as any).latLngBounds(latlngs);
          mapRef.current?.fitBounds(bounds, { padding: [60, 60] });
        } catch (e) {
          // ignore
        }
      }, 200);
    }, (err) => {
      console.error('Geolocation error', err);
      alert('Unable to access location');
    });
  };

  // small wrapper for distance calculation used in nearest
  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Helper function to focus on a blood bank and open its popup
  const focusOnBank = (bank: Hospital, shouldOpenPopup = true) => {
    const targetLat = bank.latitude;
    const targetLng = bank.longitude;
    const targetZoom = 16;

    setSelectedBank(bank);
    
    // Call flyTo for smooth animation
    if (mapRef.current && typeof mapRef.current.flyTo === 'function') {
      try {
        mapRef.current.flyTo([targetLat, targetLng], targetZoom, { 
          duration: 0.8,
          easeLinearity: 0.25,
          animate: true 
        });
      } catch (e) {
        console.log('Error flying to location:', e);
        // Fallback to setView if flyTo fails
        if (mapRef.current && typeof mapRef.current.setView === 'function') {
          try {
            mapRef.current.setView([targetLat, targetLng], targetZoom, { animate: true });
          } catch (err) {
            console.log('Error setting view:', err);
          }
        }
      }
    }
    
    // Update state after animation completes to keep controlled props in sync
    setTimeout(() => {
      setMapCenter([targetLat, targetLng]);
      setMapZoom(targetZoom);
    }, 800);
    
    // Open the marker popup during the animation
    if (shouldOpenPopup) {
      setTimeout(() => {
        const marker = markerRefs.current[String(bank.id)];
        if (marker && typeof marker.openPopup === 'function') {
          try {
            marker.openPopup();
          } catch (e) {
            console.log('Error opening popup:', e);
          }
        }
      }, 400);
    }
  };

  // Manage body scroll when modals are open
  useEffect(() => {
    if (showLoginModal || showRequestForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showLoginModal, showRequestForm]);

  useEffect(() => {
    // Clamp current page when filtered results change so pagination stays valid
    const last = Math.max(1, Math.ceil(filteredBanks.length / itemsPerPage));
    setCurrentPage((prev) => Math.min(prev, last));
  }, [filteredBanks, itemsPerPage]);

  const lastPage = Math.max(1, Math.ceil(filteredBanks.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBanks = filteredBanks.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Find Blood Banks</h1>
          <p className="text-gray-600">Search for blood banks in Pune and check their details</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bank Type</label>
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">All Types</option>
                <option value="Private">Private</option>
                <option value="Government">Government</option>
                <option value="Trust">Trust</option>
                <option value="Corporate">Corporate</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search by Name/Address/Pincode</label>
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Enter name, address or pincode"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="flex items-end">
              <div className="flex gap-2 w-full">
                <button 
                  onClick={handleSearch}
                  className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Search
                </button>
                <button
                  onClick={findNearestBanks}
                  title="Find nearest banks"
                  className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:border-red-600"
                >
                  <Navigation className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Results List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Blood Banks {filteredBanks.length > 0 && `(${filteredBanks.length})`}
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 text-red-600 animate-spin" />
                <span className="ml-2 text-gray-600">Loading blood banks...</span>
              </div>
            ) : filteredBanks.length > 0 ? (
              <>
                {paginatedBanks.map((bank) => (
                  <div id={`bank-${String(bank.id)}`} key={String(bank.id)} className={`bg-white rounded-lg shadow-md border-2 transition-all ${selectedBank?.id === bank.id ? 'border-red-600 ring-4 ring-red-100 shadow-lg' : 'border-gray-200 hover:shadow-lg'} p-6 cursor-pointer`}>
                    <div className="flex items-start justify-between mb-4">
                      <div 
                        className="flex-1 cursor-pointer hover:text-red-600 transition-colors"
                        onClick={() => focusOnBank(bank, true)}
                      >
                        <h3 className="font-bold text-gray-900 text-lg mb-2">{bank.name}</h3>
                        <div className="flex flex-col gap-2 text-sm text-gray-600 mb-3">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{bank.address}</span>
                          </div>
                          <div className="ml-6 text-xs text-gray-500">Pincode: {bank.pincode}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full border border-green-300 whitespace-nowrap">
                          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                          <span className="text-xs font-semibold">Available</span>
                        </div>
                        {distances[String(bank.id)] !== undefined && distances[String(bank.id)] <= DISTANCE_RADIUS && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full border border-blue-300 whitespace-nowrap">
                            <Navigation className="w-3 h-3" />
                            <span className="text-xs font-semibold">{distances[String(bank.id)].toFixed(1)} km</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2 p-3 bg-gray-50 rounded">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <a href={`tel:${bank.phone}`} className="hover:text-red-600 transition-colors">
                        {bank.phone}
                      </a>
                    </div>

                      <div className="mb-4 text-xs text-gray-500 px-3 py-2 flex items-center justify-between">
                      <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {bank.type}
                      </span>
                      <button
                        onClick={() => {
                          // Check if user is logged in
                          if (!user?.id && !user?._id) {
                            // Store the bank for later and show login modal
                            setPendingBankForRequest(bank);
                            onSetPendingHospital?.(bank);
                            setShowLoginModal(true);
                            return;
                          }
                          
                          // Focus on the bank and open its popup
                          focusOnBank(bank, true);
                          setShowRequestForm(true);
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                      >
                        Find Blood
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-md text-sm font-medium border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'}`}
                  >
                    Previous
                  </button>

                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {lastPage}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                    disabled={currentPage === lastPage}
                    className={`px-4 py-2 rounded-md text-sm font-medium border ${currentPage === lastPage ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'}`}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Droplet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No blood banks found matching your search criteria</p>
              </div>
            )}
          </div>

          {/* Map Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-24">
              <div className="p-4 bg-gradient-to-r from-red-600 to-red-700 text-white">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Map & Statistics
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                  <div className="text-sm text-red-700 font-medium">Total Blood Banks</div>
                  <div className="text-2xl font-bold text-red-600 mt-1">{bloodBanks.length}</div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-sm text-blue-700 font-medium">Results Found</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1">{filteredBanks.length}</div>
                </div>

                <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-100">
                  <MapContainer
                    center={mapCenter as L.LatLngExpression}
                    zoom={mapZoom}
                    style={{ height: '100%', width: '100%' }}
                    ref={mapRef as any}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {filteredBanks.map((bank) => (
                      <Marker
                        key={String(bank.id)}
                        position={[bank.latitude, bank.longitude] as L.LatLngExpression}
                        icon={redIcon}
                        ref={(el) => {
                          if (el) {
                            markerRefs.current[String(bank.id)] = el;
                          }
                        }}
                        eventHandlers={{
                          click: () => {
                            focusOnBank(bank, true);
                            setTimeout(() => {
                              const el = document.getElementById(`bank-${bank.id}`);
                              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 100);
                          }
                        }}
                      >
                        <Popup>
                          <div className="p-1">
                            <p className="text-sm font-semibold text-red-600 m-0">{bank.name}</p>
                            <p className="text-xs text-gray-500 m-0">{bank.type}</p>
                            {distances[String(bank.id)] && <p className="text-xs text-gray-500 m-0">{distances[String(bank.id)].toFixed(1)} KM</p>}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>

                <div className="border-t pt-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Bank Types</h4>
                  <div className="space-y-2 text-sm">
                    {['Private', 'Government', 'Trust', 'Corporate'].map(type => {
                      const count = bloodBanks.filter(b => b.type.includes(type)).length;
                      return count > 0 ? (
                        <div key={type} className="flex items-center justify-between text-gray-600">
                          <span>{type}</span>
                          <span className="font-semibold text-gray-900">{count}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Request Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-[5px] z-50 flex items-center justify-center p-4">
          {/* Modal Backdrop - click to close */}
          <div 
            className="absolute inset-0 cursor-pointer"
            onClick={() => {
              setShowRequestForm(false);
              setSelectedBank(null);
            }}
          />
          
          {/* Modal Card */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in-95">
            <RequestForm
              selectedBank={selectedBank || undefined}
              user={user}
              onClose={() => {
                setShowRequestForm(false);
                setSelectedBank(null);
                onSetPendingHospital?.(null);
              }}
              onNavigate={(page) => {
                if (page === 'requestor-dashboard' && onNavigate) {
                  // Close modal and navigate to requestor dashboard
                  setShowRequestForm(false);
                  setSelectedBank(null);
                  onSetPendingHospital?.(null);
                  onNavigate(page);
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Login Required Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40 backdrop-blur-[5px]">
          {/* Modal Backdrop - click to close */}
          <div 
            className="absolute inset-0 cursor-pointer"
            onClick={() => {
              setShowLoginModal(false);
              setPendingBankForRequest(null);
              onSetPendingHospital?.(null);
            }}
          />
          
          {/* Modal Card */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in-95">
            {/* Warning Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center shadow-md">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            {/* Heading */}
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Please login to continue</h2>

            {/* Divider */}
            <div className="h-1 w-12 bg-gradient-to-r from-red-600 to-red-400 rounded-full mx-auto mb-4"></div>

            {/* Message */}
            <p className="text-gray-600 mb-8 leading-relaxed">
              You need to login or sign up before submitting a blood request.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  onLoginRequired?.();
                }}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                Login
              </button>

              <button
                onClick={() => {
                  setShowLoginModal(false);
                  onSignupRequired?.();
                }}
                className="w-full bg-white border border-red-200 text-red-700 py-3 rounded-lg font-semibold hover:bg-red-50 transition-all"
              >
                Sign Up
              </button>
            </div>

            {/* Close Button Option */}
            <button
              onClick={() => {
                setShowLoginModal(false);
                setPendingBankForRequest(null);
                onSetPendingHospital?.(null);
              }}
              className="w-full mt-3 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors active:scale-95"
            >
              Cancel
            </button>

            {/* Info Text */}
            <p className="text-xs text-gray-500 mt-6">
              Your selected blood bank is preserved and the request form opens after successful login.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}