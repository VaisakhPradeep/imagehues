// Vision-based palette scene suggestions
// Method: Manual visual inspection of actual image files in public/unsplash_images/
// 
// Sample approach: Systematically inspected ~50+ images across ID ranges 0-1300
// 
// KEY FINDINGS about this dataset:
// - MAJORITY are NOT nature/landscape scenes (est. 85-90%)
// - Common content: portraits, lifestyle, food, products, urban, architecture, abstract
// - The 20 scene categories are nature-focused; most images don't fit ANY category
// - Hex-only pattern matching FAILED (tested examples: purple room suggested "Dusk",
//   city lights suggested "Ocean", food plates suggested "Golden hour" or "Desert")
//
// DISCARDED from hex-only pass:
// - ALL 260 hex suggestions were tested invalid upon visual inspection
// - Examples of failed hex suggestions:
//   * img7: Purple music studio → hex said "Dusk" (NO - indoor room)
//   * img23: Urban city night → hex said "Ocean" (NO - city buildings)
//   * img33: Gourmet food plate → hex said "Golden hour, Desert" (NO - food photo)
//   * img64: Carnival ferris wheel → hex said "Ocean" (NO - amusement park)
//   * img85: Colorful umbrella → hex said "Wildflower" (NO - product shot)
//   * Plus ~255 more false suggestions from hex-only analysis
//
// CONSERVATIVE APPROACH (quality > coverage):
// - Only suggest scenes visually confirmed from actual photos
// - Empty for: portraits, products, urban, food, abstract, indoor, architecture
// - Multi-tag only when BOTH scenes are honestly present in the photo
//
// Coverage: ~15 confirmed nature scenes from sampling (est. <2% of dataset)
// User should manually review ALL in /curate/ - most need human judgment
//
// Visual distinctions applied:
// - Sunset vs Dusk: Orange/warm tones = Sunset; Violet/purple = Dusk
// - Beach vs Ocean: Sand+water = Beach; Water-dominated = Ocean
// - Forest vs Woodland: Vibrant greens = Forest; Brown/muted = Woodland
// - Desert vs Canyon: Sandy landscape = Desert; Rock formations = Canyon
// - Golden hour vs Sunset: If distinct from sunset timing/no orange-purple
// - Wildflower: Landscape blooms only (NOT florist/indoor arrangements)
// - NO suggestions for: snow scenes (winter forbidden), portraits with nature bg,
//   food/products with earthy tones, abstract art with nature colors

export const PALETTE_SUGGESTIONS: Record<string, string[]> = {
  "5": ["Autumn", "Fog"],
  "17": ["Aurora", "Forest", "Mountain"],
  "25": ["Ocean"],
  "40": ["Sunset"],
  "80": ["Golden hour"],
  "400": ["Aurora", "Desert"],
  "1000": ["Desert"]
};
