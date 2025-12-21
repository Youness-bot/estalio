import React, { useState, useEffect, useRef } from 'react';

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

import PropertyImageManager from '../../../components/PropertyImageManager';
import storageService from '../../../services/storageService';
import { useAuth } from '../../../contexts/AuthContext';
import propertyService from '../../../services/propertyService';
import { supabase } from '../../../lib/supabase';


/* =========================================================
   COLLAPSIBLE SECTION
========================================================= */
const Section = ({ title, icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-lg">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <Icon name={icon} size={18} />
          <span className="font-medium">{title}</span>
        </div>
        <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={18} />
      </button>

      {open && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
};

/* =========================================================
   AMENITIES (COMPLET – BOOKING STYLE)
========================================================= */
const AMENITIES_GROUPS = [
  {
    title: 'Idéal pour votre séjour',
    icon: 'Sparkles',
    items: [
      'Salle de bains privative',
      'Connexion Wi-Fi gratuite',
      'Parking',
      'Chambres non-fumeurs',
      'Chambres familiales',
      'Télévision à écran plat',
      'Places de stationnement dans la rue',
      'Douche',
      'Ascenseur',
      'Espace fumeurs'
    ]
  },
  {
    title: 'Salle de bains',
    icon: 'Bath',
    items: [
      'Papier toilette',
      'Serviettes',
      'Serviettes / linge de lit (frais supplémentaires)',
      'Baignoire ou douche',
      'Toilettes',
      'Articles de toilette gratuits',
      'Sèche-cheveux'
    ]
  },
  {
    title: 'Chambre',
    icon: 'BedDouble',
    items: ['Linge de maison', 'Armoire ou penderie']
  },
  {
    title: 'Cuisine',
    icon: 'ChefHat',
    items: [
      'Table à manger',
      'Machine à café',
      'Produits ménagers',
      'Grille-pain',
      'Plaque de cuisson',
      'Four',
      'Sèche-linge',
      'Ustensiles de cuisine',
      'Bouilloire électrique',
      'Micro-ondes',
      'Réfrigérateur'
    ]
  },
  { title: 'Équipements en chambre', icon: 'Plug', items: ['Prise près du lit'] },
  { title: 'Coin salon', icon: 'Sofa', items: ['Coin repas', 'Bureau'] },
  { title: 'High-tech', icon: 'Monitor', items: ['Télévision à écran plat', 'Chaînes satellite', 'Télévision'] },
  { title: 'Internet', icon: 'Wifi', items: ['Bonne connexion Wi-Fi gratuite (≈ 46 Mb/s)'] },
  {
    title: 'Parking',
    icon: 'ParkingCircle',
    items: [
      'Parking public sur place (1 €/jour)',
      'Stationnement dans la rue',
      'Parking accessible PMR'
    ]
  },
  { title: 'Réception', icon: 'ClipboardCheck', items: ['Facture fournie sur demande'] },
  {
    title: 'Sécurité',
    icon: 'Shield',
    items: ['Extincteurs', 'Caméras de surveillance', 'Détecteurs de fumée']
  },
  {
    title: 'Général',
    icon: 'Building',
    items: [
      'Chambre anti-allergie',
      'Établissement non-fumeurs',
      'Insonorisation',
      'Moquette',
      'Ascenseur',
      'Chambres familiales',
      'Chambres non-fumeurs'
    ]
  },
  {
    title: 'Accessibilité',
    icon: 'Accessibility',
    items: ['Étages supérieurs accessibles par ascenseur']
  },
  { title: 'Langues parlées', icon: 'Languages', items: ['Arabe', 'Anglais', 'Français'] }
];

/* =========================================================
   MAIN COMPONENT
========================================================= */
const AddPropertyModal = ({ isOpen, onClose, onAddProperty, editProperty }) => {
  const { user } = useAuth();
  const isEditMode = Boolean(editProperty?.id);
  const refs = useRef({});

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    area: '',
    capacity: '',
    bedrooms: '',
    bathrooms: '',
    description: '',
    pricePerNight: '',
    code: '',
    mapsUrl: '',
    image: '',
    imageAlt: '',
    gallery: [],
    amenities: []
  });

  const [uploadedImages, setUploadedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [errors, setErrors] = useState({});
  const [deletedImageIds, setDeletedImageIds] = useState([]);

  /* =========================
     PREFILL (EDIT MODE)
  ========================= */
  useEffect(() => {
    if (!isOpen) return;

    if (editProperty?.id) {
      setFormData(prev => ({
  ...prev,
  ...editProperty,
  mapsUrl: editProperty?.maps_url || '', // ✅ FIX ICI
  amenities: editProperty?.amenities || []
}));


const existingImages = Array.isArray(editProperty?.images)
  ? editProperty?.images?.map(img => ({
  id: img?.id,                 // 🔴 OBLIGATOIRE
  url: img?.image_url,
  isExisting: true
}))
  : editProperty?.image
    ? [{ url: editProperty?.image }]
    : [];

setUploadedImages(existingImages);
    } else {
      setFormData({
        name: '',
        type: '',
        location: '',
        area: '',
        capacity: '',
        bedrooms: '',
        bathrooms: '',
        description: '',
        pricePerNight: '',
        code: '',
        mapsUrl: '',
        image: '',
        imageAlt: '',
        gallery: [],
        amenities: []
      });
      setUploadedImages([]);
    }
    setErrors({});
    setFormError('');
  }, [editProperty, isOpen]);

  const propertyTypes = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'villa', label: 'Villa' },
    { value: 'studio', label: 'Studio' },
    { value: 'house', label: 'House' },
    { value: 'penthouse', label: 'Penthouse' }
  ];

  const locations = [
    { value: 'marrakech', label: 'Marrakech' },
    { value: 'casablanca', label: 'Casablanca' },
    { value: 'rabat', label: 'Rabat' },
    { value: 'fes', label: 'Fes' },
    { value: 'agadir', label: 'Agadir' }
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const toggleAmenity = (label) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev?.amenities?.includes(label)
        ? prev?.amenities?.filter(a => a !== label)
        : [...prev?.amenities, label]
    }));
    setErrors(prev => ({ ...prev, amenities: null }));
  };

  const selectAllAmenities = () => {
    const all = AMENITIES_GROUPS?.flatMap(g => g?.items);
    setFormData(prev => ({ ...prev, amenities: all }));
    setErrors(prev => ({ ...prev, amenities: null }));
  };

  const clearAllAmenities = () => {
    setFormData(prev => ({ ...prev, amenities: [] }));
  };

  const generatePropertyCode = () => {
    const p = formData?.type?.substring(0, 2)?.toUpperCase();
    const l = formData?.location?.substring(0, 3)?.toUpperCase();
    return `${p}${l}${Math.floor(Math.random() * 1000)?.toString()?.padStart(3, '0')}`;
  };

  /* =========================
     IMAGE HANDLERS
  ========================= */
  const handleImageUpload = async (file) => {
    if (!user?.id) throw new Error('User not authenticated');

    const result = await storageService?.uploadPropertyImage(
      file,
      user?.id,
      editProperty?.id
    );

    setUploadedImages(prev => [
      ...prev,
      {
        url: result?.url,
        path: result?.path,
        isNew: true,
        is_primary: prev?.length === 0, // First image is primary by default
        display_order: prev?.length
      }
    ]);

    setErrors(prev => ({ ...prev, images: null }));
  };

  const handleImageRemove = (index) => {
    setUploadedImages(prev => {
      const img = prev?.[index];

      // Mark existing images for deletion
      if (img?.id) {
        setDeletedImageIds(ids => [...ids, img?.id]);
      }

      const copy = [...prev];
      copy?.splice(index, 1);
      return copy;
    });
  };

  const handleSetPrimary = async (imageId) => {
    if (!isEditMode || !editProperty?.id) return;

    try {
      await propertyService?.setPrimaryImage(editProperty?.id, imageId);
      
      // Update local state
      setUploadedImages(prev => 
        prev?.map(img => ({
          ...img,
          is_primary: img?.id === imageId
        }))
      );
    } catch (error) {
      console.error('Error setting primary image:', error);
      setFormError('Failed to set primary image');
    }
  };

  const handleReorderImages = async (imageOrders) => {
    if (!isEditMode || !editProperty?.id) return;

    try {
      await propertyService?.reorderImages(imageOrders);
    } catch (error) {
      console.error('Error reordering images:', error);
      setFormError('Failed to reorder images');
    }
  };

  /* =========================
     VALIDATION CHAMP PAR CHAMP
  ========================= */
  const isPositiveNumber = v => v !== '' && !isNaN(v) && Number(v) > 0;
  const isText = v => /^[A-Za-zÀ-ÿ0-9\s\-']+$/?.test(v);
  const isUrl = v => /^https?:\/\/.+/?.test(v);

  const validateForm = () => {
    const e = {};

    if (!formData?.name || !isText(formData?.name)) e.name = 'Nom requis (texte)';
    if (!formData?.type) e.type = 'Type requis';
    if (!formData?.location) e.location = 'Localisation requise';

    if (!isPositiveNumber(formData?.area)) e.area = 'Surface > 0 requise';
    if (!isPositiveNumber(formData?.capacity)) e.capacity = 'Nombre > 0 requis';
    if (!isPositiveNumber(formData?.bedrooms)) e.bedrooms = 'Nombre > 0 requis';
    if (!isPositiveNumber(formData?.bathrooms)) e.bathrooms = 'Nombre > 0 requis';
    if (!isPositiveNumber(formData?.pricePerNight)) e.pricePerNight = 'Prix > 0 requis';

    if (!formData?.description) e.description = 'Description requise';
    if (!isUrl(formData?.mapsUrl)) e.mapsUrl = 'URL valide requise';

    if (uploadedImages?.length === 0) e.images = 'Au moins une image requise';
    if (formData?.amenities?.length === 0) e.amenities = 'Sélectionnez au moins un équipement';

    setErrors(e);

    const firstKey = Object.keys(e)?.[0];
    if (firstKey && refs?.current?.[firstKey]) {
      refs?.current?.[firstKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return Object.keys(e)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setFormError('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const imageUrls = uploadedImages?.map(img => img?.url);

      const finalPropertyCode =
  formData?.code && formData?.code?.trim()
    ? formData?.code
    : generatePropertyCode();
// 🔑 Determine new primary image (first remaining image)
const remainingImages = uploadedImages?.filter(img => img?.url);

const newPrimaryImage =
  remainingImages?.length > 0 ? remainingImages?.[0]?.url : null;

await onAddProperty({
  ...formData,
  id: editProperty?.id,
  property_code: finalPropertyCode, // 🔴 clé DB correcte
  image: newPrimaryImage,
  imageAlt: formData?.imageAlt || `Image of ${formData?.name}`,
  gallery: imageUrls
});
// ✅ ADD NEW IMAGES IN EDIT MODE ONLY
if (isEditMode) {
  const newImages = uploadedImages?.filter(img => img?.isNew);

  if (newImages?.length > 0) {
    await propertyService?.addImages(editProperty?.id, newImages);
  }
}
// 🔴 DELETE REMOVED IMAGES FROM DB
if (isEditMode && deletedImageIds?.length > 0) {
  await propertyService?.deleteImages(deletedImageIds);
}
// 🔑 DIFF — ALWAYS RESYNC PRIMARY IMAGE FROM DB (FINAL)
if (isEditMode) {
  const { data: primaryImage, error } = await supabase?.from('property_images')?.select('image_url')?.eq('property_id', editProperty?.id)?.order('display_order', { ascending: true })?.limit(1)?.single();

  // PGRST116 = no rows found (no images left)
  if (error && error?.code !== 'PGRST116') {
    throw error;
  }

  await supabase?.from('properties')?.update({
      image_url: primaryImage?.image_url || null
    })?.eq('id', editProperty?.id);
}

      onClose();
    } catch (error) {
      setFormError('Erreur lors de l\'enregistrement de la propriété.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* HEADER */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">
                {isEditMode ? 'Edit Property' : 'Add New Property'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isEditMode ? 'Update property information' : 'Create a property listing'}
              </p>
            </div>
            <Button variant="ghost" size="icon" iconName="X" onClick={onClose} />
          </div>

          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
              {formError}
            </div>
          )}

          {/* BASIC INFO */}
          <Section title="Basic Information" icon="Home" defaultOpen>
            <div ref={el => (refs.current.name = el)}>
              <Input
                label="Property Name"
                placeholder="Luxury Downtown Apartment"
                value={formData?.name}
                onChange={e => handleChange('name', e?.target?.value)}
                className={errors?.name ? 'border-red-500' : ''}
                required
              />
              {errors?.name && <p className="text-xs text-red-600">{errors?.name}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div ref={el => (refs.current.type = el)}>
                <Select
                  label="Property Type"
                  options={propertyTypes}
                  value={formData?.type}
                  onChange={v => handleChange('type', v)}
                  className={errors?.type ? 'border-red-500' : ''}
                  required
                />
                {errors?.type && <p className="text-xs text-red-600">{errors?.type}</p>}
              </div>

              <div ref={el => (refs.current.location = el)}>
                <Select
                  label="Location"
                  options={locations}
                  value={formData?.location}
                  onChange={v => handleChange('location', v)}
                  className={errors?.location ? 'border-red-500' : ''}
                  required
                />
                {errors?.location && <p className="text-xs text-red-600">{errors?.location}</p>}
              </div>
            </div>
          </Section>

          {/* DETAILS */}
          <Section title="Property Details" icon="LayoutGrid">
            <div className="grid md:grid-cols-3 gap-4">
              <div ref={el => (refs.current.area = el)}>
                <Input
                  label="Area (m²)"
                  placeholder="120"
                  value={formData?.area}
                  onChange={e => handleChange('area', e?.target?.value?.replace(/[^0-9.]/g, ''))}
                  className={errors?.area ? 'border-red-500' : ''}
                  required
                />
                {errors?.area && <p className="text-xs text-red-600">{errors?.area}</p>}
              </div>

              <div ref={el => (refs.current.capacity = el)}>
                <Input
                  label="Guests"
                  placeholder="4"
                  value={formData?.capacity}
                  onChange={e => handleChange('capacity', e?.target?.value?.replace(/[^0-9]/g, ''))}
                  className={errors?.capacity ? 'border-red-500' : ''}
                  required
                />
                {errors?.capacity && <p className="text-xs text-red-600">{errors?.capacity}</p>}
              </div>

              <div ref={el => (refs.current.bedrooms = el)}>
                <Input
                  label="Bedrooms"
                  placeholder="2"
                  value={formData?.bedrooms}
                  onChange={e => handleChange('bedrooms', e?.target?.value?.replace(/[^0-9]/g, ''))}
                  className={errors?.bedrooms ? 'border-red-500' : ''}
                  required
                />
                {errors?.bedrooms && <p className="text-xs text-red-600">{errors?.bedrooms}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div ref={el => (refs.current.bathrooms = el)}>
                <Input
                  label="Bathrooms"
                  placeholder="1"
                  value={formData?.bathrooms}
                  onChange={e => handleChange('bathrooms', e?.target?.value?.replace(/[^0-9]/g, ''))}
                  className={errors?.bathrooms ? 'border-red-500' : ''}
                  required
                />
                {errors?.bathrooms && <p className="text-xs text-red-600">{errors?.bathrooms}</p>}
              </div>

              <div ref={el => (refs.current.pricePerNight = el)}>
                <Input
                  label="Price per Night (€)"
                  placeholder="150"
                  value={formData?.pricePerNight}
                  onChange={e => handleChange('pricePerNight', e?.target?.value?.replace(/[^0-9.]/g, ''))}
                  className={errors?.pricePerNight ? 'border-red-500' : ''}
                  required
                />
                {errors?.pricePerNight && <p className="text-xs text-red-600">{errors?.pricePerNight}</p>}
              </div>
            </div>

            <div ref={el => (refs.current.description = el)}>
              <textarea
                className={`w-full border rounded-md p-3 ${errors?.description ? 'border-red-500' : ''}`}
                rows={4}
                placeholder="Describe the property..."
                value={formData?.description}
                onChange={e => handleChange('description', e?.target?.value)}
              />
              {errors?.description && <p className="text-xs text-red-600">{errors?.description}</p>}
            </div>
          </Section>

          {/* LOCATION */}
          <Section title="Location" icon="MapPin">
            <div ref={el => (refs.current.mapsUrl = el)}>
              <Input
                label="Google Maps URL"
                placeholder="https://maps.google.com/..."
                value={formData?.mapsUrl}
                onChange={e => handleChange('mapsUrl', e?.target?.value)}
                className={errors?.mapsUrl ? 'border-red-500' : ''}
                required
              />
              {errors?.mapsUrl && <p className="text-xs text-red-600">{errors?.mapsUrl}</p>}
            </div>
          </Section>

          {/* IMAGES */}
          <Section title="Images" icon="Image" defaultOpen>
            <PropertyImageManager
              images={uploadedImages}
              onUpload={handleImageUpload}
              onRemove={handleImageRemove}
              onSetPrimary={handleSetPrimary}
              onReorder={handleReorderImages}
              editMode={isEditMode}
            />
            {errors?.images && (
              <p className="text-xs text-red-600">{errors?.images}</p>
            )}
          </Section>

          {/* AMENITIES */}
          <Section title="Amenities" icon="ListChecks">
            <div className="flex gap-2 mb-2">
              <Button type="button" size="sm" onClick={selectAllAmenities}>Tout cocher</Button>
              <Button type="button" size="sm" variant="outline" onClick={clearAllAmenities}>Tout décocher</Button>
            </div>

            {AMENITIES_GROUPS?.map(group => (
              <div key={group?.title} className="space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <Icon name={group?.icon} size={16} />
                  {group?.title}
                </div>

                <div className="grid md:grid-cols-2 gap-2">
                  {group?.items?.map(item => (
                    <label key={item} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData?.amenities?.includes(item)}
                        onChange={() => toggleAmenity(item)}
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {errors?.amenities && <p className="text-xs text-red-600">{errors?.amenities}</p>}
          </Section>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={isSubmitting} iconName="Save">
              {isEditMode ? 'Update Property' : 'Add Property'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddPropertyModal;