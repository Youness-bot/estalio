import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Users,
  BedDouble,
  Bath,
  DollarSign,
  Image as ImageIcon,
  ChevronDown
} from 'lucide-react';
import { propertyService } from '../../services/propertyService';
import Button from '../../components/ui/Button';

/* ------------------ Helpers ------------------ */

const KPI = ({ icon, label, value }) => (
  <div className="bg-white rounded-xl border shadow-sm p-4 flex items-center gap-4">
    <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  </div>
);

const Info = ({ label, value }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
    <p className="font-medium text-gray-900 mt-1">{value ?? '—'}</p>
  </div>
);

const Collapsible = ({ title, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl border shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex justify-between items-center"
      >
        <span className="font-semibold text-gray-700">{title}</span>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
};

/* ------------------ Main ------------------ */

const PropertyOwnerView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const load = async () => {
      const data = await propertyService.getByIdWithDetails(id);
      setProperty(data);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading…
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Property not found
      </div>
    );
  }

  /* -------- Images -------- */

  const primaryImage = property.image_url
    ? {
        url: property.image_url,
        alt: property.image_alt || property.name
      }
    : null;

const galleryImages = Array.isArray(property.property_images)
  ? property.property_images
      .filter(img => img.image_url !== property.image_url)
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map(img => ({
        url: img.image_url,
        alt: img.image_alt || property.name
      }))
  : [];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* HEADER / HERO */}
      <div className="relative bg-white border-b">
        {primaryImage && (
          <div className="h-64 w-full overflow-hidden">
            <img
              src={primaryImage.url}
              alt={primaryImage.alt}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="max-w-7xl mx-auto px-6 py-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft />
          </Button>

          <h1 className="text-3xl font-bold mt-4">{property.name}</h1>

          <div className="flex flex-wrap gap-2 mt-3">
            <span className="px-3 py-1 rounded-full text-sm bg-gray-100">
              {property.property_type}
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-gray-100">
              {property.status}
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-gray-100">
              {property.location}
            </span>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <KPI
            icon={<Users />}
            label="Guests"
            value={property.max_guests}
          />
          <KPI
            icon={<BedDouble />}
            label="Bedrooms"
            value={property.bedrooms}
          />
          <KPI
            icon={<Bath />}
            label="Bathrooms"
            value={property.bathrooms}
          />
          <KPI
            icon={<DollarSign />}
            label="Price / night"
            value={`${property.base_price} MAD`}
          />
        </div>

        {/* DETAILS */}
        <section className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="font-semibold text-lg mb-6">Property Details</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <Info label="Property code" value={property.property_code} />
            <Info label="Area (m²)" value={property.area_sqm} />
            <Info label="City" value={property.location} />
          </div>

          {property.description && (
            <p className="mt-6 text-gray-700 leading-relaxed whitespace-pre-wrap">
              {property.description}
            </p>
          )}
        </section>

        {/* LOCATION */}
        <section className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="font-semibold text-lg mb-4">Location</h2>
          {property.maps_url ? (
            <a
              href={property.maps_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-blue-600 hover:bg-blue-50"
            >
              <MapPin className="w-4 h-4" />
              Open in Google Maps
            </a>
          ) : (
            <span>—</span>
          )}
        </section>

        {/* IMAGES */}
        <section className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Images ({galleryImages.length + (primaryImage ? 1 : 0)})
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {primaryImage && (
              <img
                src={primaryImage.url}
                alt={primaryImage.alt}
                onClick={() => setSelectedImage(primaryImage)}
                className="cursor-pointer rounded-lg object-cover h-40 w-full border"
              />
            )}

            {galleryImages.map((img, i) => (
              <img
                key={i}
                src={img.url}
                alt={img.alt}
                onClick={() => setSelectedImage(img)}
                className="cursor-pointer rounded-lg object-cover h-40 w-full border"
              />
            ))}
          </div>
        </section>

        {/* AMENITIES */}
        <section className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="font-semibold text-lg mb-4">Amenities</h2>

          <div className="flex flex-wrap gap-2">
            {Array.isArray(property.amenities) &&
              property.amenities.map((a, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-sm bg-gray-100"
                >
                  {a}
                </span>
              ))}
          </div>
        </section>

        {/* META */}
        <Collapsible title="Technical & Publication Info">
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <Info label="Published" value={property.is_published ? 'Yes' : 'No'} />
            <Info label="Active" value={property.is_active ? 'Yes' : 'No'} />
            <Info label="Created at" value={property.created_at} />
            <Info label="Updated at" value={property.updated_at} />
          </div>
        </Collapsible>

      </div>

      {/* LIGHTBOX */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage.url}
            alt={selectedImage.alt}
            className="max-w-full max-h-[90vh] rounded-lg"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default PropertyOwnerView;
