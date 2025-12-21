import { supabase } from '../lib/supabase';
import { reservationService } from './reservationService';

export const propertyService = {

  /* ===================== GET ALL ===================== */
  async getAll() {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.from('properties')?.select(`
        *,
        property_images (
          id,
          image_url,
          image_alt,
          is_primary,
          display_order
        )
      `)?.eq('user_id', user?.id)?.order('created_at', { ascending: false });

    if (error) throw error;

    return data?.map(p => ({
      ...p,

      /* 🔁 NORMALISATION FRONT */
      type: p?.property_type,
      area: p?.area_sqm,
      capacity: p?.max_guests,
      pricePerNight: p?.base_price,

      images: p?.property_images || [],
      image:
        p?.property_images?.find(i => i?.is_primary)?.image_url ||
        p?.image_url ||
        ''
    }));
  },

  /* ===================== GET BY ID ===================== */
  async getByIdWithDetails(propertyId) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.from('properties')?.select(`
        *,
        property_images (
          id,
          image_url,
          image_alt,
          is_primary,
          display_order
        )
      `)?.eq('id', propertyId)?.eq('user_id', user?.id)?.single();

    if (error) throw error;

    return {
      ...data,

      /* 🔁 NORMALISATION FRONT */
      type: data?.property_type,
      area: data?.area_sqm,
      capacity: data?.max_guests,
      pricePerNight: data?.base_price,

      images: (data?.property_images || [])?.sort(
        (a, b) => a?.display_order - b?.display_order
      )
    };
  },

  /* ===================== GET BY ID PUBLIC (NO AUTH) ===================== */
  async getByIdPublic(propertyId) {
    const { data, error } = await supabase?.from('properties')?.select(`
        *,
        property_images (
          id,
          image_url,
          image_alt,
          is_primary,
          display_order
        )
      `)?.eq('id', propertyId)?.eq('is_published', true)?.maybeSingle();

    if (error) throw error;

    return {
      ...data,

      /* 🔁 NORMALISATION FRONT */
      type: data?.property_type,
      area: data?.area_sqm,
      capacity: data?.max_guests,
      pricePerNight: data?.base_price,

      images: (data?.property_images || [])?.sort(
        (a, b) => a?.display_order - b?.display_order
      )
    };
  },

  /* ===================== CREATE ===================== */
  async create(payload) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.from('properties')?.insert({
  user_id: user?.id,

  // 🔴 OBLIGATOIRE
  property_code: payload?.property_code || payload?.code,

  name: payload?.name,
  property_type: payload?.type,
  status: 'available',
  is_published: true,
  location: payload?.location,
  address: payload?.address,
  maps_url: payload?.mapsUrl || '',
  area_sqm: payload?.area,
  bedrooms: payload?.bedrooms,
  bathrooms: payload?.bathrooms,
  max_guests: payload?.capacity,
  base_price: payload?.pricePerNight,
  description: payload?.description,
  amenities: payload?.amenities || [],
  image_url: payload?.image,
  image_alt: payload?.imageAlt
})?.select()?.single();

    if (error) throw error;

if (payload?.gallery?.length) {
  const images = payload?.gallery?.map((url, index) => ({
    property_id: data?.id,
    image_url: url,
    image_alt: payload?.name || '',
    is_primary: index === 0,
    display_order: index
  }));

  await supabase?.from('property_images')?.insert(images);
}

    return data;
  },

  /* ===================== UPDATE ===================== */
  async update(propertyId, updates) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.from('properties')?.update({
        name: updates?.name,
        property_type: updates?.type,
        status: updates?.status,
        location: updates?.location,
        address: updates?.address,
        maps_url: updates?.mapsUrl || '',
        area_sqm: updates?.area,
        bedrooms: updates?.bedrooms,
        bathrooms: updates?.bathrooms,
        max_guests: updates?.capacity,
        base_price: updates?.pricePerNight,
        description: updates?.description,
        amenities: updates?.amenities || [],
image_url: updates?.image_url || null

      })?.eq('id', propertyId)?.eq('user_id', user?.id)?.select()?.single();

    if (error) throw error;
/* ===================== ADD NEW IMAGES ON EDIT ===================== */
/*if (Array.isArray(updates?.gallery) && updates?.gallery?.length > 0) {
  // 1️⃣ Récupérer les images existantes
  const { data: existingImages, error: fetchError } = await supabase?.from('property_images')?.select('image_url')?.eq('property_id', propertyId);

  if (fetchError) throw fetchError;

  const existingUrls = (existingImages || [])?.map(i => i?.image_url);

  // 2️⃣ Identifier uniquement les NOUVELLES images
  const newImages = updates?.gallery?.filter(
    url => !existingUrls?.includes(url)
  );

  // 3️⃣ Insérer uniquement les nouvelles images
  if (newImages?.length > 0) {
    const records = newImages?.map((url, index) => ({
      property_id: propertyId,
      image_url: url,
      image_alt: updates?.name || '',
      is_primary: false,
      display_order: existingUrls?.length + index
    }));

    const { error: insertError } = await supabase?.from('property_images')?.insert(records);

    if (insertError) throw insertError;
  }
}*/
/* ===================== FINAL PRIMARY IMAGE RESYNC ===================== */
const { data: primaryImage, error: primaryError } = await supabase?.from('property_images')?.select('image_url')?.eq('property_id', propertyId)?.order('display_order', { ascending: true })?.limit(1)?.single();

if (primaryError && primaryError?.code !== 'PGRST116') {
  throw primaryError;
}

await supabase?.from('properties')?.update({
    image_url: primaryImage?.image_url || null
  })?.eq('id', propertyId);

    return data;
  },

    /* ===================== ADD IMAGES (EDIT MODE) ===================== */
  async addImages(propertyId, images = []) {
    if (!Array.isArray(images) || images?.length === 0) return;

    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const records = images?.map((img, index) => ({
      property_id: propertyId,
      image_url: img?.url,
      image_alt: '',
      is_primary: false,
      display_order: index
    }));

    const { error } = await supabase?.from('property_images')?.insert(records);

    if (error) throw error;
  },

  /* ===================== DELETE IMAGES ===================== */
async deleteImages(imageIds = []) {
  if (!Array.isArray(imageIds) || imageIds?.length === 0) return;

  const { data: { user } } = await supabase?.auth?.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase?.from('property_images')?.delete()?.in('id', imageIds);

  if (error) throw error;
},

  /* ===================== SET PRIMARY IMAGE ===================== */
  async setPrimaryImage(propertyId, imageId) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase?.rpc('set_primary_property_image', {
        p_image_id: imageId,
        p_property_id: propertyId
      });

    if (error) throw error;
  },

  /* ===================== REORDER IMAGES ===================== */
  async reorderImages(imageOrders) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase?.rpc('reorder_property_images', {
        p_image_orders: imageOrders
      });

    if (error) throw error;
  },

  /* ===================== STATUS ===================== */
  async archive(id) {
    const hasActive = await reservationService?.hasActiveReservation(id);
    if (hasActive) throw new Error('ARCHIVE_FORBIDDEN');
    return this.update(id, { status: 'archived' });
  },

  async restore(id) {
    return this.update(id, { status: 'available' });
  },

  async disable(id) {
    return this.update(id, { status: 'disabled' });
  },

  async enable(id) {
    return this.update(id, { status: 'available' });
  },

  /* ===================== STATISTICS ===================== */
  async getStatistics() {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.from('properties')?.select('status')?.eq('user_id', user?.id);

    if (error) throw error;

    return {
      total: data?.length,
      available: data?.filter(p => p?.status === 'available')?.length,
      disabled: data?.filter(p => p?.status === 'disabled')?.length,
      archived: data?.filter(p => p?.status === 'archived')?.length
    };
  }
};

export default propertyService;