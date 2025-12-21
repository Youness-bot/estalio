import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Home, Users, BedDouble, Bath, Maximize, MapPin, Phone, Mail, Calendar, Clock, Euro, CheckCircle, XCircle, Wifi, Coffee, Tv, Wind, Car, Droplet, Volume2, PartyPopper, Key, Heart, Plus, ArrowLeft, Share2, Shield } from 'lucide-react';
import { propertyService } from '../../services/propertyService';

const PropertyPublicView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        // UPDATED: Use public method that doesn't require authentication
        const data = await propertyService?.getByIdPublic(id);
        setProperty(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching property:', err);
        setError('Propriété introuvable');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProperty();
    }
  }, [id]);

  const getPropertyTypeLabel = (type) => {
    const types = {
      apartment: 'Appartement entier',
      villa: 'Villa entière',
      house: 'Maison entière',
      studio: 'Studio entier',
      penthouse: 'Penthouse entier',
      riad: 'Riad entier'
    };
    return types?.[type] || type;
  };

  const amenityIcons = {
    wifi: <Wifi className="w-5 h-5" />,
    parking: <Car className="w-5 h-5" />,
    kitchen: <Coffee className="w-5 h-5" />,
    tv: <Tv className="w-5 h-5" />,
    ac: <Wind className="w-5 h-5" />,
    heating: <Droplet className="w-5 h-5" />,
    default: <CheckCircle className="w-5 h-5" />
  };

  const houseRules = [
    { 
      icon: <XCircle className="w-5 h-5 text-red-500" />, 
      title: 'Non-fumeur', 
      desc: 'Interdiction de fumer dans la propriété' 
    },
    { 
      icon: <Volume2 className="w-5 h-5 text-blue-500" />, 
      title: 'Calme respecté', 
      desc: 'Merci de respecter le calme après 22h' 
    },
    { 
      icon: <PartyPopper className="w-5 h-5 text-orange-500" />, 
      title: 'Pas de fêtes', 
      desc: 'Les fêtes et événements sont interdits' 
    },
    { 
      icon: <Users className="w-5 h-5 text-green-500" />, 
      title: 'Voyageurs conformes', 
      desc: 'Le nombre de voyageurs doit correspondre à la réservation' 
    },
    { 
      icon: <Key className="w-5 h-5 text-yellow-500" />, 
      title: 'Perte de clés', 
      desc: 'Frais de 50€ en cas de perte des clés' 
    },
    { 
      icon: <Heart className="w-5 h-5 text-pink-500" />, 
      title: 'Couples marocains', 
      desc: 'Les couples marocains sont les bienvenus' 
    },
    { 
      icon: <Plus className="w-5 h-5 text-purple-500" />, 
      title: 'Prolongation possible', 
      desc: 'Possibilité de prolonger votre séjour (sous réserve de disponibilité)' 
    }
  ];

  const handleShare = async () => {
    const shareData = {
      title: property?.name || 'Propriété',
      text: `Découvrez ${property?.name || 'cette propriété'}`,
      url: window.location?.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err?.name !== 'AbortError') {
          console.error('Erreur de partage:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard?.writeText(window.location?.href);
        setShareMessage('Lien copié dans le presse-papiers !');
        setTimeout(() => setShareMessage(''), 3000);
      } catch (err) {
        console.error('Erreur de copie:', err);
        setShareMessage('Impossible de copier le lien');
        setTimeout(() => setShareMessage(''), 3000);
      }
    }
  };

  const handleContactClick = (type) => {
    const fixedPhone = '+212662230203';
    const fixedEmail = 'contact@estalio.ma';
    
    if (type === 'phone') {
      window.location.href = `tel:${fixedPhone}`;
    } else if (type === 'email') {
      window.location.href = `mailto:${fixedEmail}`;
    }
  };

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (str) => {
    if (!str) return '';
    return str?.charAt(0)?.toUpperCase() + str?.slice(1)?.toLowerCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Chargement de la propriété...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Propriété introuvable</h2>
          <p className="text-gray-600 mb-6">La propriété que vous recherchez n'existe pas ou n'est plus disponible.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const primaryImage = property?.images?.find(img => img?.is_primary)?.image_url || property?.image_url;
  const secondaryImages = property?.images?.filter(img => !img?.is_primary)?.sort((a, b) => a?.display_order - b?.display_order) || [];
  const location = property?.location || null;
  const cityName = typeof location === 'string' ? capitalizeFirstLetter(location) : (location?.city ? capitalizeFirstLetter(location?.city) : null);

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      {/* Header - MODIFIED: Removed "Nous contacter" button */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button 
              onClick={() => window.history?.back()}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Retour</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 rounded-xl transition-colors font-medium"
            >
              <Share2 className="w-5 h-5" />
              <span>Partager</span>
            </button>
          </div>
        </div>
        {shareMessage && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg text-sm font-medium">
            {shareMessage}
          </div>
        )}
      </header>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section - MODIFIED: Added city display with icon */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{property?.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-gray-600">
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              <span className="font-medium">{getPropertyTypeLabel(property?.property_type)}</span>
            </div>
            {cityName && (
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span className="font-medium">{cityName}</span>
              </div>
            )}
          </div>
        </div>
        {/* Photo Gallery - MODIFIED: Added mobile carousel */}
        <div className="mb-12">
          {/* Desktop Grid View */}
          <div className="hidden md:grid md:grid-cols-4 gap-2 rounded-2xl overflow-hidden">
            <div className="md:col-span-2 md:row-span-2 relative group cursor-pointer" onClick={() => setSelectedImageIndex(0)}>
              <img 
                src={primaryImage} 
                alt={property?.image_alt || property?.name}
                className="w-full h-full object-cover aspect-[4/3] md:aspect-auto"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all"></div>
            </div>
            {secondaryImages?.slice(0, 4)?.map((img, idx) => (
              <div key={img?.id} className="relative group cursor-pointer" onClick={() => setSelectedImageIndex(idx + 1)}>
                <img 
                  src={img?.image_url} 
                  alt={img?.image_alt || `Photo ${idx + 2}`}
                  className="w-full h-full object-cover aspect-[4/3]"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all"></div>
              </div>
            ))}
          </div>

{/* Mobile Carousel – STABLE (same source as desktop) */}
<div className="md:hidden mb-8">
  <div className="relative w-full h-80 overflow-hidden rounded-xl">

    <img
      src={
        currentImageIndex === 0
          ? primaryImage
          : secondaryImages[currentImageIndex - 1]?.image_url
      }
      alt={`Photo ${currentImageIndex + 1}`}
      className="w-full h-full object-cover rounded-xl cursor-pointer"
      onClick={() => setSelectedImageIndex(currentImageIndex)}
    />

    {currentImageIndex > 0 && (
      <button
        onClick={() => setCurrentImageIndex(i => i - 1)}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 text-white w-9 h-9 rounded-full flex items-center justify-center"
      >
        ‹
      </button>
    )}

    {currentImageIndex < secondaryImages.length && (
      <button
        onClick={() => setCurrentImageIndex(i => i + 1)}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 text-white w-9 h-9 rounded-full flex items-center justify-center"
      >
        ›
      </button>
    )}

    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
      {currentImageIndex + 1} / {secondaryImages.length + 1}
    </div>

  </div>
</div>


          {/* Show All Photos Button */}
          {property.images?.length > 1 && (
            <button
              onClick={() => setShowAllPhotos(true)}
              className="mt-4 px-6 py-2.5 border-2 border-gray-300 rounded-xl font-medium hover:border-gray-400 transition-colors"
            >
              Voir toutes les photos ({property.images.length})
            </button>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-12">
            {/* UX Trust Badge - NEW */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl p-4">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Hébergement vérifié · Photos réelles · Support disponible</span>
            </div>

            {/* About Section */}
            <section className="border-b border-gray-200 pb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">À propos de cet hébergement</h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Voyageurs</p>
                    <p className="font-semibold text-gray-900">{property?.max_guests}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <BedDouble className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Chambres</p>
                    <p className="font-semibold text-gray-900">{property?.bedrooms}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <Bath className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Salles de bain</p>
                    <p className="font-semibold text-gray-900">{property?.bathrooms}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <Maximize className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Surface</p>
                    <p className="font-semibold text-gray-900">{property?.area_sqm}m²</p>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{property?.description}</p>
            </section>

            {/* Amenities Section */}
            <section className="border-b border-gray-200 pb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Équipements</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {property?.amenities?.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    {amenityIcons?.[amenity?.toLowerCase()] || amenityIcons?.default}
                    <span className="text-gray-700 font-medium capitalize">{amenity}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* House Rules Section */}
            <section className="border-b border-gray-200 pb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Règlement intérieur</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {houseRules?.map((rule, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      {rule?.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{rule?.title}</h3>
                      <p className="text-sm text-gray-600">{rule?.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Check-in/out Section */}
            <section className="border-b border-gray-200 pb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Arrivée & Départ</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl">
                  <Calendar className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Check-in</h3>
                    <p className="text-gray-700">À partir de 14h00</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-xl">
                  <Clock className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Arrivée tardive</h3>
                    <p className="text-gray-700">Supplément de 10€ après 23h30</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-red-50 rounded-xl">
                  <Calendar className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Check-out</h3>
                    <p className="text-gray-700">Avant 11h30</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Location Section */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Localisation</h2>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Quartier</h3>
                    <p className="text-gray-700">
                      {cityName || 'Non spécifié'}
                    </p>
                  </div>
                </div>
                <div className="w-full h-64 bg-gray-200 rounded-xl flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Localisation approximative</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-6">
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold text-gray-900">{property?.base_price}€</span>
                    <span className="text-gray-600">/ nuit</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Euro className="w-4 h-4" />
                    <span>Prix de base</span>
                  </div>
                </div>

                <button 
                  onClick={() => handleContactClick('phone')}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
                >
                  Nous contacter
                </button>

                <p className="text-center text-sm text-gray-500 mt-4">Ou contactez-nous directement</p>

                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                  <button 
                    onClick={() => handleContactClick('phone')}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors w-full"
                  >
                    <Phone className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">+212 662 230 203</span>
                  </button>
                  <button 
                    onClick={() => handleContactClick('email')}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors w-full"
                  >
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">contact@estalio.ma</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Sticky CTA Bottom Bar (Mobile Only) - NEW */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-30">
        <div className="flex items-center gap-3 p-4">
          <button 
            onClick={() => handleContactClick('phone')}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            <Phone className="w-5 h-5" />
            <span>Appeler</span>
          </button>
          <button 
            onClick={() => handleContactClick('email')}
            className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
          >
            <Mail className="w-5 h-5" />
            <span>Email</span>
          </button>
        </div>
      </div>
      {/* Lightbox Modal */}
      {selectedImageIndex !== null && (
  <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
    
    <button
      className="absolute top-4 right-4 text-white z-50"
      onClick={() => setSelectedImageIndex(null)}
    >
      <XCircle className="w-8 h-8" />
    </button>

<div className="w-full h-full flex items-center justify-center">
  <img
  src={property.images[selectedImageIndex]?.image_url}
  className="max-w-full max-h-full object-contain"
/>

</div>

    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm bg-black/60 px-4 py-2 rounded-full">
      {selectedImageIndex + 1} / {property.images.length}
    </div>

  </div>
)}

      {/* All Photos Modal */}
      {showAllPhotos && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-white py-4 z-10">
              <h2 className="text-2xl font-bold text-gray-900">Toutes les photos</h2>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" onClick={() => setShowAllPhotos(false)}>
                <XCircle className="w-8 h-8" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <img src={primaryImage} alt={property?.image_alt || property?.name} className="w-full rounded-xl" />
              {secondaryImages?.map((img) => (
                <img key={img?.id} src={img?.image_url} alt={img?.image_alt || 'Photo'} className="w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyPublicView;