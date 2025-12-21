import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export const handler = async (event) => {
  try {
    const id = event.path.split("/").pop();

    const { data, error } = await supabase
      .from("properties")
      .select("name, description, image_url")
      .eq("id", id)
      .single();

    if (error || !data) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "text/html" },
        body: "<h1>Property not found</h1>",
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "public, max-age=3600",
      },
      body: `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${data.name}" />
<meta property="og:description" content="${data.description}" />
<meta property="og:image" content="${data.image_url}" />
<meta property="og:url" content="https://estalio.app/properties/${id}/public" />
</head>
<body></body>
</html>
`,
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: "Server error",
    };
  }
};
