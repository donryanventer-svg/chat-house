export interface StylePresetOption {
  id: string;
  name: string;
  icon: string;
  category: 'artistic' | 'photographic' | 'digital' | 'illustrative';
  promptSnippet: string;
  recommendedAspect?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  description: string;
}

export const STYLE_PRESETS: StylePresetOption[] = [
  {
    id: 'cinematic',
    name: 'Cinematic 35mm',
    icon: '🎬',
    category: 'photographic',
    promptSnippet: 'cinematic 35mm film still, Kodak Vision3, anamorphic lens flare, shallow depth of field, color graded, dramatic lighting',
    recommendedAspect: '16:9',
    description: 'Hollywood motion picture aesthetic with film grain and atmospheric depth',
  },
  {
    id: 'photorealistic',
    name: 'Hyper-Realistic',
    icon: '📷',
    category: 'photographic',
    promptSnippet: 'hyperrealistic portrait, 8k resolution, Hasselblad H6D-100c, sharp focal plane, natural subsurface scattering, studio clarity',
    recommendedAspect: '3:4',
    description: 'Clean, tack-sharp commercial studio photography with natural textures',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    icon: '⚡',
    category: 'digital',
    promptSnippet: 'cyberpunk aesthetic, high-tech dystopian city, glowing neon pink and cyan reflections, wet asphalt, volumetric haze',
    recommendedAspect: '16:9',
    description: 'Vibrant neon cityscapes, chrome reflections, and futuristic technology',
  },
  {
    id: 'anime',
    name: 'Anime / Ukiyo-e',
    icon: '🌸',
    category: 'illustrative',
    promptSnippet: 'modern anime aesthetic mixed with woodblock ukiyo-e, Makoto Shinkai atmosphere, vivid sky, painterly cloudscapes, clean cel shading',
    recommendedAspect: '16:9',
    description: 'Lush Japanese animation aesthetic with emotive lighting and clouds',
  },
  {
    id: 'isometric',
    name: '3D Isometric',
    icon: '🧱',
    category: 'digital',
    promptSnippet: 'isometric 3D diorama, stylized miniature voxel world, Octane render, raytraced reflections, soft ambient occlusion, clean bevels',
    recommendedAspect: '1:1',
    description: 'Charming miniature 3D diorama rendered with soft shadows and rich materials',
  },
  {
    id: 'oil-painting',
    name: 'Renaissance Oil',
    icon: '🎨',
    category: 'artistic',
    promptSnippet: 'classical oil painting on canvas, Rembrandt chiaroscuro, thick impasto strokes, rich cracked glaze, museum masterpiece',
    recommendedAspect: '4:3',
    description: 'Old master oil painting with dramatic light and authentic impasto texture',
  },
  {
    id: 'dark-fantasy',
    name: 'Dark Fantasy',
    icon: '🏺',
    category: 'artistic',
    promptSnippet: 'dark fantasy gothic concept art, eerie mist, Elden Ring atmosphere, muted earthy tones, decaying architecture, ethereal glow',
    recommendedAspect: '16:9',
    description: 'Atmospheric, mysterious mythical worlds with somber majesty',
  },
  {
    id: 'pixel-art',
    name: '32-Bit Pixel Art',
    icon: '👾',
    category: 'digital',
    promptSnippet: 'detailed 32-bit pixel art, isometric perspective, vibrant retro palette, handcrafted sprite dithering, CRT scanline nostalgia',
    recommendedAspect: '1:1',
    description: 'Charming retro game art with meticulous pixel placement and dithering',
  },
  {
    id: 'minimalist-vector',
    name: 'Minimalist Vector',
    icon: '📐',
    category: 'illustrative',
    promptSnippet: 'minimalist graphic design, flat vector art, Swiss international style, geometric silhouettes, bold balanced negative space',
    recommendedAspect: '1:1',
    description: 'Clean Bauhaus-inspired vector graphics with intentional negative space',
  },
  {
    id: 'vintage-polaroid',
    name: '1970s Polaroid',
    icon: '🎞️',
    category: 'photographic',
    promptSnippet: 'vintage 1978 instant Polaroid photograph, faded warm color palette, soft light leaks, nostalgic film grain, authentic vignette',
    recommendedAspect: '1:1',
    description: 'Nostalgic analog snapshot with authentic color cast and light leaks',
  },
  {
    id: 'synthwave',
    name: '80s Synthwave',
    icon: '🌆',
    category: 'digital',
    promptSnippet: 'synthwave outrun retro 80s aesthetic, neon wireframe grid, purple sunset chrome reflections, vintage sports car horizon',
    recommendedAspect: '16:9',
    description: 'Retro-futuristic outrun grids with purple sunset horizons and chrome',
  },
  {
    id: 'claymation',
    name: 'Claymation Sculpt',
    icon: '🧸',
    category: 'artistic',
    promptSnippet: 'stop-motion claymation character, polymer clay sculpture, visible artisan fingerprint textures, tactile miniature studio lighting',
    recommendedAspect: '1:1',
    description: 'Handcrafted stop-motion clay aesthetic with tactile surface textures',
  },
];

export interface ModifierPill {
  id: string;
  name: string;
  category: 'lighting' | 'camera' | 'color' | 'detail' | 'negative';
  snippet: string;
}

export const MODIFIER_PILLS: ModifierPill[] = [
  // Lighting
  { id: 'l-golden', name: 'Golden Hour', category: 'lighting', snippet: 'warm golden hour sun, long soft shadows' },
  { id: 'l-godrays', name: 'God Rays', category: 'lighting', snippet: 'volumetric atmospheric god rays streaming through mist' },
  { id: 'l-neon', name: 'Neon Rim', category: 'lighting', snippet: 'cyberpunk colored rim lighting, edge glow' },
  { id: 'l-chiaroscuro', name: 'Chiaroscuro', category: 'lighting', snippet: 'dramatic baroque chiaroscuro, intense shadows' },
  { id: 'l-softbox', name: 'Softbox Studio', category: 'lighting', snippet: 'commercial diffused softbox studio light' },
  { id: 'l-biolum', name: 'Bioluminescent', category: 'lighting', snippet: 'internal bioluminescent organic glow' },

  // Camera
  { id: 'c-85mm', name: '85mm f/1.4', category: 'camera', snippet: '85mm lens at f/1.4, creamy bokeh background blur' },
  { id: 'c-wide', name: '16mm Ultra-Wide', category: 'camera', snippet: '16mm ultra-wide dynamic perspective' },
  { id: 'c-macro', name: 'Macro Close-Up', category: 'camera', snippet: 'extreme macro photography, microscopic surface detail' },
  { id: 'c-drone', name: 'Drone Top-Down', category: 'camera', snippet: 'overhead bird-eye drone aerial view' },
  { id: 'c-fisheye', name: 'Fisheye Lens', category: 'camera', snippet: 'curved spherical fisheye distortion' },

  // Color & Mood
  { id: 'col-tealorange', name: 'Teal & Orange', category: 'color', snippet: 'cinematic teal and orange color grading' },
  { id: 'col-noir', name: 'Film Noir B&W', category: 'color', snippet: 'high contrast black and white monochrome noir' },
  { id: 'col-pastel', name: 'Pastel Dream', category: 'color', snippet: 'soft ethereal pastel palette, dreamlike low contrast' },
  { id: 'col-vibrant', name: 'Technicolor', category: 'color', snippet: 'hyper-saturated vibrant vintage technicolor' },
  { id: 'col-sepia', name: 'Antique Sepia', category: 'color', snippet: 'sepia toned 19th century archival plate' },

  // Render & Detail
  { id: 'd-ue5', name: 'Unreal Engine 5', category: 'detail', snippet: 'Unreal Engine 5 Lumen render, sub-polygon displacement' },
  { id: 'd-octane', name: 'Octane 8K', category: 'detail', snippet: 'Octane render, photorealistic materials, 8k resolution' },
  { id: 'd-masterpiece', name: 'Fine Art Museum', category: 'detail', snippet: 'masterpiece gallery composition, curated award-winner' },
];

export const NEGATIVE_PROMPT_PRESETS = [
  'blurry, unfocused',
  'deformed anatomy, extra limbs, bad hands, mutated fingers',
  'watermark, signature, logo, copyright text',
  'low resolution, pixelated, jpeg artifacts, compression noise',
  'oversaturated neon, blown out highlights',
  'cluttered, chaotic composition',
  'unnatural plastic skin, porcelain doll face',
];

export const SAMPLE_PROMPTS = [
  'A neon-lit ramen bar on a rainy Tokyo backstreet at midnight, steam rising from ceramic bowls, wet pavement reflecting magenta signs, cinematic 35mm film',
  'Ancient obsidian monolith floating in a misty alpine mountain pass, bioluminescent runes carved into stone, volumetric dawn rays, hyperdetailed fantasy',
  'Cybernetic astronaut tending a lush hydroponic terrarium inside a deep space station, earth visible through curved panoramic observation window',
  '1970s vintage Porsche 911 parked beside a coastal cliff at golden hour, ocean waves crashing below, retro Kodachrome aesthetic, warm film grain',
  'A tiny steampunk clockwork chameleon resting on a brass pocket watch, intricate exposed gears, miniature macro photography, shallow depth of field',
  'Cozy attic library bathed in autumn afternoon sunlight, stacks of ancient leather-bound books, floating dust motes, watercolor illustration style',
  'Isometric 3D diorama of a futuristic eco-friendly apartment with vertical gardens and solar panels, soft Octane render, clay materials',
  'A mystical silver stag with flowering crystal antlers standing in an enchanted bioluminescent forest, night time, ethereal dreamlike atmosphere',
];

export const DEFAULT_IMAGE_ADJUSTMENTS = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  vignette: 0,
  grain: 0,
  blur: 0,
  sepia: 0,
  invert: false,
  hueRotate: 0,
  filterPreset: 'none' as const,
  flipH: false,
  flipV: false,
  rotation: 0,
  watermarkText: '',
  watermarkPosition: 'bottom-right' as const,
  watermarkOpacity: 0.7,
};
