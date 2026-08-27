// Vision-based palette scene suggestions
// Method: Systematic visual inspection of every JPEG in public/unsplash_images/
// 
// Progress: Batch 1 - Images 0-99 completed
//           Batch 2 - Images 100-149 completed
//           Batch 3 - Images 150-199 completed
//           Batch 4 - Images 200-249 completed
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
// Visual distinctions applied:
// - Sunset vs Dusk: Orange/warm tones = Sunset; Violet/purple = Dusk
// - Beach vs Ocean: Sand+water = Beach; Water-dominated = Ocean
// - Forest vs Woodland: Vibrant greens = Forest; Brown/muted = Woodland
// - Desert vs Canyon: Sandy landscape = Desert; Rock formations = Canyon
// - Golden hour vs Sunset: If distinct from sunset timing/no orange-purple
// - Wildflower: Landscape blooms only (NOT florist/indoor arrangements)
// - Aurora vs Milky Way: Green/colored lights = Aurora; White stars = just stars
// - NO suggestions for: snow scenes (winter forbidden), portraits with nature bg,
//   food/products with earthy tones, abstract art with nature colors, wildlife focus

export const PALETTE_SUGGESTIONS: Record<string, string[]> = {
  "5": ["Autumn", "Fog"],
  "13": ["Aurora", "Mountain"],
  "17": ["Forest", "Mountain"],
  "25": ["Ocean"],
  "40": ["Sunset"],
  "44": ["Ocean"],
  "66": ["Desert"],
  "99": ["Autumn"],
  "107": ["Canyon"],
  "119": ["Dusk", "Mountain"],
  "143": ["Autumn"],
  "159": ["Mountain"],
  "180": ["Mountain", "Fog"],
  "203": ["Sunset", "Dusk"],
  "209": ["Mountain"],
  "210": ["Mountain", "Forest"],
  "213": ["Tropical", "Rainforest"],
  "218": ["Forest"],
  "224": ["Wildflower"],
  "227": ["Waterfall"],
  "242": ["Wildflower"],
  "244": ["Dusk"],
  "400": ["Aurora", "Desert"],
  "1000": ["Desert"]
};
