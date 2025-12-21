import { createClient } from '@supabase/supabase-js';

// ✅ Supabase via Netlify env vars
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const handler = async (event) => {
  try {
    // ✅ EXTRACTION CORRECTE DE L’ID
    // URL: /og/property/:id
    const match = event.path.match(/\/og\/property\/([^/]+)/);
    const propertyId = match?.[1];

    if (!propertyId) {
      return {
        statusCode: 400,
        body: 'Property ID is required'
      };
    }

    // Fetch property data from Supabase (public endpoint)
    const { data: property, error } = await supabase?.from('properties')?.select(`
        id,
        name,
        description,
        location,
        image_url,
        image_alt,
        base_price,
        property_type,
        bedrooms,
        bathrooms,
        max_guests,
        is_published,
        property_images (
          image_url,
          image_alt,
          is_primary,
          display_order
        )
      `)?.eq('id', propertyId)?.eq('is_published', true)?.single();

    if (error || !property) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/html' },
        body: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Property Not Found</title>
              <meta http-equiv="refresh" content="0; url=/properties/${propertyId}/public">
            </head>
            <body>
              <p>Redirecting...</p>
            </body>
          </html>
        `
      };
    }

    // Get primary image or fallback to property image_url
    const primaryImage = property?.property_images?.find(img => img?.is_primary)?.image_url 
      || property?.property_images?.[0]?.image_url 
      || property?.image_url;
    
    const imageAlt = property?.property_images?.find(img => img?.is_primary)?.image_alt 
      || property?.image_alt 
      || property?.name;

    // Format location
    const capitalizeFirstLetter = (str) => {
      if (!str) return '';
      return str?.charAt(0)?.toUpperCase() + str?.slice(1)?.toLowerCase();
    };

    const cityName = typeof property?.location === 'string' 
      ? capitalizeFirstLetter(property?.location) 
      : (property?.location?.city ? capitalizeFirstLetter(property?.location?.city) : '');

    // Property type labels
    const propertyTypeLabels = {
      apartment: 'Appartement',
      villa: 'Villa',
      house: 'Maison',
      studio: 'Studio',
      penthouse: 'Penthouse',
      riad: 'Riad'
    };

    const propertyTypeLabel = propertyTypeLabels?.[property?.property_type] || property?.property_type;

    // Create attractive title and description
    const title = `${property?.name} - ${cityName || 'Morocco'}`;
    const description = `${propertyTypeLabel} · ${property?.bedrooms} chambres · ${property?.max_guests} voyageurs · ${property?.base_price}€/nuit${cityName ? ' · ' + cityName : ''}`;
    
    // Full URL for og:url
    const baseUrl = 'https://estalio.app';
    const propertyUrl = `${baseUrl}/properties/${property?.id}/public`;
    const ogUrl = `${baseUrl}/og/property/${property?.id}`;

    // Generate HTML with Open Graph meta tags
    const html = `
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Primary Meta Tags -->
    <title>${title}</title>
    <meta name="title" content="${title}">
    <meta name="description" content="${description}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${ogUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${primaryImage}">
    <meta property="og:image:alt" content="${imageAlt}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="Estalio">
    <meta property="og:locale" content="fr_FR">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${ogUrl}">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${primaryImage}">
    <meta name="twitter:image:alt" content="${imageAlt}">
    
    <!-- WhatsApp / LinkedIn -->
    <meta property="og:image:secure_url" content="${primaryImage}">
    
    <!-- Instant redirect to React page -->
<script>
  setTimeout(() => {
    window.location.href = '${propertyUrl}';
  }, 1500);
</script>
    
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      .container {
        text-align: center;
        padding: 2rem;
      }
      .spinner {
        width: 50px;
        height: 50px;
        border: 5px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      h1 {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0 0 0.5rem;
      }
      p {
        font-size: 1rem;
        opacity: 0.9;
        margin: 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="spinner"></div>
      <h1>${property?.name}</h1>
      <p>Chargement de la propriété...</p>
    </div>
  </body>
</html>`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-Robots-Tag': 'index, follow'
      },
      body: html
    };

  } catch (error) {
    console.error('Error generating OG page:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/html' },
      body: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Error</title>
            <meta http-equiv="refresh" content="0; url=/">
          </head>
          <body>
            <p>An error occurred. Redirecting...</p>
          </body>
        </html>
      `
    };
  }
};