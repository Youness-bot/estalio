export default async (request, context) => {
  const url = new URL(request.url);
  
  // 1. Extraire l'ID de l'URL (/properties/:id/public)
  const pathParts = url.pathname.split('/');
  const id = pathParts[2]; 

  if (!id) return context.next();

  try {
    // 2. Récupérer les données depuis Supabase via REST API
    // On utilise les variables d'environnement configurées sur Netlify
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

    const response = await fetch(
      `${supabaseUrl}/rest/v1/properties?id=eq.${id}&select=name,description,image_url`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    const data = await response.json();
    const property = data[0];

    if (!property) return context.next();

    // 3. Récupérer le contenu de l'index.html original
    const res = await context.next();
    const html = await res.text();

    // 4. Injecter les balises OG dynamiques dans le <head>
    const ogTags = `
      <meta property="og:type" content="website" />
      <meta property="og:title" content="${property.name}" />
      <meta property="og:description" content="${property.description || 'Découvrez ce bien sur Estalio'}" />
      <meta property="og:image" content="${property.image_url}" />
      <meta property="og:url" content="${request.url}" />
      <meta name="twitter:card" content="summary_large_image">
    `;

    // On remplace la balise <head> par <head> + nos tags
    const newHtml = html.replace("<head>", `<head>${ogTags}`);

    return new Response(newHtml, {
      headers: { "content-type": "text/html" },
    });
  } catch (error) {
    console.error("Edge Function Error:", error);
    return context.next();
  }
};