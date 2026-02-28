import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { photo_base64, preferences } = await req.json();

    if (!photo_base64) {
      return new Response(JSON.stringify({ error: 'Photo is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build CSV-like string from preferences
    const csvData = preferences
      ? `interests,goals,experience\n"${(preferences.interests || []).join(';')}","${(preferences.learning_goals || []).join(';')}","${preferences.experience_level || ''}"`
      : '';

    // Use Gemini vision to estimate age from the photo
    const response = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an age estimation assistant. Analyze the provided photo and user preferences to estimate the person's age. 
Return ONLY a JSON object with these fields:
- "estimated_age": number (your best estimate)
- "is_kid": boolean (true if estimated age < 13)
- "confidence": "low" | "medium" | "high"

User preferences CSV data:
${csvData}

Be conservative: if unsure, lean toward a higher age estimate. Respond with ONLY the JSON object, no extra text.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: photo_base64.startsWith('data:') ? photo_base64 : `data:image/jpeg;base64,${photo_base64}`,
                },
              },
              {
                type: 'text',
                text: 'Please estimate the age of the person in this photo.',
              },
            ],
          },
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`AI Gateway error [${response.status}]: ${errBody}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || '';

    // Parse the JSON from the AI response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({
      estimated_age: parsed.estimated_age,
      is_kid: parsed.is_kid,
      confidence: parsed.confidence,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in analyze-user:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
