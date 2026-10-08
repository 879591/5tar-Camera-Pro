export type TemplateCategory =
  | 'All'
  | 'Cinematic LUTs'
  | 'Wedding & Festival'
  | 'Reels & Slow-Mo'
  | 'Portrait & Beauty'
  | 'Night & Cyberpunk'
  | 'Travel & Vlog'
  | 'Retro & 35mm Film'
  | 'Action & Sports';

export interface StudioTemplate {
  id: string;
  code: string;
  name: string;
  category: Exclude<TemplateCategory, 'All'>;
  aspectRatio: '16:9' | '9:16' | '4:3' | '1:1' | '2.39:1';
  fpsTarget: 24 | 30 | 60 | 120;
  speedMultiplier: number;
  recommendedMode: 'PHOTO' | 'PORTRAIT' | 'PRO' | 'VIDEO' | 'SLOW_MO' | 'TIME_LAPSE' | 'CINEMATIC';
  description: string;
  filterSettings: {
    brightness: number;    // -50 to +50
    contrast: number;      // -50 to +50
    saturation: number;    // -50 to +50
    temperature: number;   // -50 to +50 (cool to warm)
    tint: number;          // -50 to +50
    vignette: number;      // 0 to 100
    sharpness: number;     // 0 to 100
    highlights: number;    // -50 to +50
    shadows: number;       // -50 to +50
  };
  overlayText?: string;
  transitionType: 'Fade' | 'Cross Dissolve' | 'Flash Cut' | 'Whip Pan' | 'Film Burn';
  audioMood: string;
  accentColor: string;
}

const categoryDefinitions: Array<{
  category: Exclude<TemplateCategory, 'All'>;
  prefix: string;
  accent: string;
  mode: StudioTemplate['recommendedMode'];
  aspect: StudioTemplate['aspectRatio'];
  fps: StudioTemplate['fpsTarget'];
  speed: number;
  baseFilter: StudioTemplate['filterSettings'];
  presets: Array<{ name: string; desc: string; overlay?: string; tempMod: number; satMod: number; conMod: number; vigMod: number }>;
}> = [
  {
    category: 'Cinematic LUTs',
    prefix: 'CINE',
    accent: '#F59E0B',
    mode: 'CINEMATIC',
    aspect: '2.39:1',
    fps: 24,
    speed: 1,
    baseFilter: { brightness: -4, contrast: 22, saturation: -8, temperature: 12, tint: -4, vignette: 35, sharpness: 25, highlights: -15, shadows: -10 },
    presets: [
      { name: 'Anamorphic Gold 2.39', desc: 'Warm tungsten highlights with deep cinema letterbox shadows', overlay: 'DIRECTED BY 5TAR', tempMod: 15, satMod: -5, conMod: 18, vigMod: 40 },
      { name: 'Teal & Orange Blockbuster', desc: 'Complementary cyan shadows and rich skin-tone warmth', tempMod: 18, satMod: 14, conMod: 25, vigMod: 30 },
      { name: 'Arri Alexa Log-C Neutral', desc: 'Wide dynamic range flat profile for maximum grading latitude', tempMod: 0, satMod: -22, conMod: -15, vigMod: 10 },
      { name: 'Dune Desert Amber', desc: 'Monochromatic ochre sand tones with high atmospheric haze', tempMod: 34, satMod: -12, conMod: 15, vigMod: 35 },
      { name: 'Noir Gotham Shadow', desc: 'Crushed blacks with metallic silver midtones for dramatic thrillers', tempMod: -14, satMod: -35, conMod: 38, vigMod: 55 },
      { name: 'Opus 70mm IMAX Print', desc: 'Crisp micro-contrast and rich natural celluloid color rendition', tempMod: 8, satMod: 10, conMod: 20, vigMod: 25 },
      { name: 'Nordic Cold Fjord', desc: 'Desaturated slate blues and crisp overcast highlights', tempMod: -24, satMod: -18, conMod: 16, vigMod: 30 },
      { name: 'Sunset Boulevard 35mm', desc: 'Lush golden hour flare simulation with lifted warm shadows', tempMod: 28, satMod: 16, conMod: 12, vigMod: 28 },
      { name: 'Emerald Matrix Grade', desc: 'Subtle green tint shift in midtones with high-contrast speculars', tempMod: -8, satMod: -10, conMod: 30, vigMod: 45 },
      { name: 'Midnight Express Blue', desc: 'Day-for-night optical tungsten shift with deep sapphire shadows', tempMod: -32, satMod: -14, conMod: 22, vigMod: 50 },
      { name: 'Criterion Classic B&W', desc: 'Pure monochrome silver gelatin curve with fine film grain', tempMod: 0, satMod: -50, conMod: 35, vigMod: 42 },
      { name: 'Mumbai Monsoon Cinema', desc: 'Humid emerald greens and moody rain-soaked pavement contrast', tempMod: -6, satMod: 12, conMod: 24, vigMod: 32 },
      { name: 'Velvet Cinema Hall', desc: 'Rich crimson undertones and soft halation roll-off', tempMod: 14, satMod: 8, conMod: 18, vigMod: 38 },
      { name: 'Solaris Sci-Fi Clean', desc: 'Clinical high-key highlights with cool titanium shadows', tempMod: -18, satMod: -15, conMod: 20, vigMod: 15 },
    ],
  },
  {
    category: 'Wedding & Festival',
    prefix: 'FEST',
    accent: '#E11D48',
    mode: 'PORTRAIT',
    aspect: '9:16',
    fps: 60,
    speed: 0.5,
    baseFilter: { brightness: 6, contrast: 14, saturation: 18, temperature: 16, tint: 6, vignette: 20, sharpness: 20, highlights: -10, shadows: 12 },
    presets: [
      { name: 'Royal Haldi Marigold', desc: 'Vibrant turmeric yellows and radiant skin glow for daytime ceremonies', overlay: 'SHUBH VIVAH', tempMod: 26, satMod: 24, conMod: 12, vigMod: 15 },
      { name: 'Diwali Diya Glow', desc: 'Warm candlelight enhancement with rich festive gold sparkles', overlay: 'HAPPY DIWALI', tempMod: 30, satMod: 20, conMod: 18, vigMod: 28 },
      { name: 'Bridal Sabyasachi Red', desc: 'Deep crimson lehenga fidelity with creamy soft background bokeh', tempMod: 14, satMod: 22, conMod: 16, vigMod: 24 },
      { name: 'Sangeet Stage Spotlight', desc: 'Balanced stage LED contrast preventing magenta skin clipping', tempMod: -4, satMod: 10, conMod: 22, vigMod: 30 },
      { name: 'Mehendi Garden Pastel', desc: 'Airy botanical greens and soft sunlit henna tones', tempMod: 10, satMod: 8, conMod: 6, vigMod: 12 },
      { name: 'Holi Gulaal Burst', desc: 'Ultra-vivid color separation for high-speed powder throws', tempMod: 8, satMod: 38, conMod: 24, vigMod: 18 },
      { name: 'Baraat Procession Energy', desc: 'Punchy dynamic contrast with stabilized motion clarity', tempMod: 16, satMod: 20, conMod: 20, vigMod: 22 },
      { name: 'Varmala Golden Hour', desc: 'Romantic warm backlight bloom with gentle shadow lift', tempMod: 22, satMod: 14, conMod: 10, vigMod: 20 },
      { name: 'Navratri Garba Night', desc: 'Rich mirror-work sparkle and vivid traditional attire grading', tempMod: 18, satMod: 26, conMod: 22, vigMod: 26 },
      { name: 'Reception Champagne Luxe', desc: 'Sophisticated pearl highlights and warm chandelier ambiance', tempMod: 12, satMod: 6, conMod: 16, vigMod: 25 },
      { name: 'Eid Moonlight Glow', desc: 'Silver-gold evening serenity with clean night portrait clarity', tempMod: 6, satMod: 12, conMod: 14, vigMod: 20 },
      { name: 'Birthday Bash Confetti', desc: 'Bright festive pop with crisp cake-candle exposure balance', overlay: 'CELEBRATE', tempMod: 14, satMod: 22, conMod: 15, vigMod: 14 },
      { name: 'Temple Heritage Bronze', desc: 'Warm antique brass tones for traditional cultural architecture', tempMod: 24, satMod: 10, conMod: 20, vigMod: 32 },
      { name: 'Vidaai Emotional Film', desc: 'Soft cinematic nostalgia with muted highlights and warm tears', tempMod: 10, satMod: -12, conMod: 14, vigMod: 36 },
    ],
  },
  {
    category: 'Reels & Slow-Mo',
    prefix: 'REEL',
    accent: '#8B5CF6',
    mode: 'SLOW_MO',
    aspect: '9:16',
    fps: 120,
    speed: 0.25,
    baseFilter: { brightness: 4, contrast: 20, saturation: 16, temperature: 4, tint: 2, vignette: 24, sharpness: 35, highlights: -8, shadows: 8 },
    presets: [
      { name: '120FPS Velocity Ramp', desc: 'Butter-smooth 0.25x hardware slow motion with crisp edge definition', overlay: 'SLOW MOTION 120', tempMod: 4, satMod: 18, conMod: 22, vigMod: 25 },
      { name: '240FPS Water Droplet Macro', desc: 'Ultra-high-speed shutter preset freezing every liquid splash', tempMod: -10, satMod: 12, conMod: 28, vigMod: 20 },
      { name: 'Viral Street Walk Transition', desc: 'High-impact urban contrast with punchy bass-drop flash cut', tempMod: 8, satMod: 15, conMod: 26, vigMod: 30 },
      { name: 'Hair Flip Golden Slow-Mo', desc: 'Sunlit rim-light booster for dramatic portrait slow motion', tempMod: 22, satMod: 16, conMod: 14, vigMod: 22 },
      { name: 'Car Rolling Shot 60FPS', desc: 'Automotive metallic paint gloss and asphalt contrast enhancer', tempMod: -6, satMod: 10, conMod: 32, vigMod: 35 },
      { name: 'Coffee Pour B-Roll', desc: 'Rich espresso browns and creamy latte art micro-contrast', tempMod: 18, satMod: 8, conMod: 20, vigMod: 28 },
      { name: 'Gym Beast Mode PR', desc: 'Gritty high-clarity sweat and muscle definition grade', overlay: 'NO EXCUSES', tempMod: -8, satMod: -18, conMod: 38, vigMod: 42 },
      { name: 'Fashion OOTD Showcase', desc: 'True-to-life fabric color accuracy with clean studio pop', tempMod: 2, satMod: 12, conMod: 14, vigMod: 12 },
      { name: 'Rain Window Mood Reel', desc: 'Melancholic cool droplets with warm indoor bokeh circles', tempMod: -14, satMod: 6, conMod: 18, vigMod: 34 },
      { name: 'Sneaker Unbox Crisp', desc: 'High-sharpness studio product look for hype gear reels', tempMod: 0, satMod: 20, conMod: 22, vigMod: 16 },
      { name: 'Dance Choreography Lock', desc: 'Wide-angle zero-distortion look with vibrant studio neon pop', tempMod: 6, satMod: 24, conMod: 20, vigMod: 18 },
      { name: 'Skate Trick Flip 120', desc: 'Fisheye-inspired high contrast street skate aesthetic', tempMod: 12, satMod: 10, conMod: 28, vigMod: 38 },
      { name: 'Food Sizzle Macro Slow', desc: 'Appetizing warm saturation for street food and kitchen reels', tempMod: 20, satMod: 26, conMod: 18, vigMod: 22 },
      { name: 'Bike Ride POV Horizon', desc: 'Electronic stabilization lock with vivid sky and road contrast', tempMod: 4, satMod: 18, conMod: 24, vigMod: 20 },
    ],
  },
  {
    category: 'Portrait & Beauty',
    prefix: 'PORT',
    accent: '#EC4899',
    mode: 'PORTRAIT',
    aspect: '4:3',
    fps: 30,
    speed: 1,
    baseFilter: { brightness: 8, contrast: 6, saturation: 8, temperature: 10, tint: 4, vignette: 18, sharpness: 12, highlights: -14, shadows: 16 },
    presets: [
      { name: 'Studio Softbox 85mm f/1.4', desc: 'Flattering portrait lighting with creamy f/1.4 aperture separation', tempMod: 8, satMod: 6, conMod: 8, vigMod: 20 },
      { name: 'Golden Hour Rim Light', desc: 'Warm honey skin tones and luminous hair backlight', tempMod: 24, satMod: 14, conMod: 10, vigMod: 22 },
      { name: 'Editorial Vogue Monochrome', desc: 'High-fashion black and white with sculpted cheekbone shadows', tempMod: 0, satMod: -50, conMod: 32, vigMod: 28 },
      { name: 'Natural Glass Skin Glow', desc: 'Subtle highlight smoothing while preserving real skin texture', tempMod: 6, satMod: 4, conMod: 4, vigMod: 10 },
      { name: 'Window Light Vermeer', desc: 'Directional side window light with painterly shadow falloff', tempMod: 12, satMod: -4, conMod: 18, vigMod: 32 },
      { name: 'Peach Blossom Spring', desc: 'Soft pink-peach tint for bright outdoor garden portraits', tempMod: 10, satMod: 12, conMod: 6, vigMod: 14 },
      { name: 'Corporate Executive Headshot', desc: 'Clean trustworthy neutral color balance and sharp eye focus', tempMod: -2, satMod: 4, conMod: 14, vigMod: 16 },
      { name: 'Rembrandt Dramatic Key', desc: 'Classic 45-degree studio triangle lighting contrast', tempMod: 14, satMod: -6, conMod: 26, vigMod: 38 },
      { name: 'Cafe Candid 50mm', desc: 'Cozy indoor tungsten coffee shop portrait warmth', tempMod: 20, satMod: 8, conMod: 12, vigMod: 24 },
      { name: 'High-Key Beauty White', desc: 'Bright commercial studio look with lifted shadows', tempMod: 2, satMod: 6, conMod: -6, vigMod: 0 },
      { name: 'Rooftop Dusk Silhouette', desc: 'Twilight purple sky gradient with crisp subject rim', tempMod: -8, satMod: 18, conMod: 22, vigMod: 26 },
      { name: 'Vintage Polaroid Portrait', desc: 'Faded instant film border feel with nostalgic warm cast', tempMod: 18, satMod: -10, conMod: -8, vigMod: 30 },
      { name: 'Selfie Mirror True-Tone', desc: 'Balanced indoor mirror exposure without harsh flash glare', tempMod: 6, satMod: 8, conMod: 10, vigMod: 12 },
    ],
  },
  {
    category: 'Night & Cyberpunk',
    prefix: 'NEON',
    accent: '#06B6D4',
    mode: 'PRO',
    aspect: '16:9',
    fps: 24,
    speed: 1,
    baseFilter: { brightness: -2, contrast: 28, saturation: 24, temperature: -16, tint: 18, vignette: 36, sharpness: 30, highlights: -22, shadows: -6 },
    presets: [
      { name: 'Tokyo Shibuya Neon', desc: 'Electric cyan and magenta split-toning for wet night streets', tempMod: -22, satMod: 30, conMod: 30, vigMod: 38 },
      { name: 'Low-Light ISO 800 Clean', desc: 'Shadow noise suppression with protected neon sign highlights', tempMod: -8, satMod: 10, conMod: 18, vigMod: 24 },
      { name: 'Blade Runner Acid Rain', desc: 'Smoky amber and deep teal futuristic atmospheric grade', tempMod: 16, satMod: 22, conMod: 34, vigMod: 44 },
      { name: 'Astro Milky Way Long-Exp', desc: 'Deep dark sky contrast for tripod night sky photography', tempMod: -26, satMod: 28, conMod: 36, vigMod: 15 },
      { name: 'Light Trail Highway 1/4s', desc: 'Slow shutter streak enhancer for vibrant car tail lights', tempMod: -10, satMod: 32, conMod: 28, vigMod: 30 },
      { name: 'Cyber Arcade Violet', desc: 'Ultraviolet synthwave glow with punchy shadow blacks', tempMod: -18, satMod: 26, conMod: 26, vigMod: 36 },
      { name: 'Moonlit Marine Drive', desc: 'Golden sodium-vapor street lamps against deep ocean blues', tempMod: 12, satMod: 16, conMod: 24, vigMod: 32 },
      { name: 'Concert Stage Laser', desc: 'Prevents LED sensor clipping under intense club lighting', tempMod: -14, satMod: 20, conMod: 28, vigMod: 34 },
      { name: 'Campfire Ember Night', desc: 'Warm firelight glow on faces against pitch-black woods', tempMod: 32, satMod: 24, conMod: 26, vigMod: 42 },
      { name: 'City Skyline Blue Hour', desc: 'Balanced twilight exposure 20 minutes after sunset', tempMod: -20, satMod: 18, conMod: 20, vigMod: 22 },
      { name: 'Subway Fluorescent Grit', desc: 'Cinematic green-cyan underground transit atmosphere', tempMod: -12, satMod: -8, conMod: 32, vigMod: 40 },
      { name: 'Fireworks Sparkle Lock', desc: 'Zero-blowout highlight protection for night sky bursts', tempMod: 4, satMod: 34, conMod: 30, vigMod: 25 },
      { name: 'Midnight Diner Hopper', desc: 'Warm interior glass contrast viewed from dark rainy exterior', tempMod: 14, satMod: 12, conMod: 28, vigMod: 36 },
    ],
  },
  {
    category: 'Travel & Vlog',
    prefix: 'VLOG',
    accent: '#10B981',
    mode: 'VIDEO',
    aspect: '16:9',
    fps: 60,
    speed: 1,
    baseFilter: { brightness: 5, contrast: 14, saturation: 16, temperature: 8, tint: 0, vignette: 14, sharpness: 24, highlights: -12, shadows: 14 },
    presets: [
      { name: 'Himalayan Mountain Crisp', desc: 'Polarizer-style deep blue skies and snow peak clarity', overlay: 'EXPEDITION LOG', tempMod: -8, satMod: 20, conMod: 22, vigMod: 16 },
      { name: 'Goa Tropical Beach', desc: 'Turquoise ocean water enhancer and warm golden sand', tempMod: 16, satMod: 24, conMod: 14, vigMod: 12 },
      { name: 'Daily Vlog Natural Pro', desc: 'Clean skin tones + stabilized walk-and-talk dynamic range', tempMod: 6, satMod: 10, conMod: 12, vigMod: 10 },
      { name: 'Rajasthan Fort Terracotta', desc: 'Rich sandstone reds and warm desert sun vibrance', tempMod: 24, satMod: 22, conMod: 18, vigMod: 22 },
      { name: 'Kerala Backwater Lush', desc: 'Tropical palm foliage booster with humid mist recovery', tempMod: 4, satMod: 26, conMod: 16, vigMod: 18 },
      { name: 'Roadtrip Hyperlapse 10x', desc: 'Time-lapse highway grade with smooth cloud motion contrast', tempMod: 10, satMod: 18, conMod: 20, vigMod: 20 },
      { name: 'European Cobblestone Cafe', desc: 'Warm editorial travel postcard aesthetic', tempMod: 14, satMod: 8, conMod: 14, vigMod: 18 },
      { name: 'Airplane Window Cloudscape', desc: 'Dehaze atmospheric scatter for crisp wing-view shots', tempMod: -6, satMod: 16, conMod: 26, vigMod: 14 },
      { name: 'Waterfall Long-Exposure', desc: 'Silky water motion with deep moss green shadows', tempMod: -4, satMod: 20, conMod: 18, vigMod: 24 },
      { name: 'Street Market Spice', desc: 'High-color-separation profile for vibrant local bazaars', tempMod: 18, satMod: 28, conMod: 16, vigMod: 16 },
      { name: 'Sunrise Peak Time-Lapse', desc: 'Gradual exposure transition from blue dawn to golden sun', tempMod: 20, satMod: 22, conMod: 18, vigMod: 18 },
      { name: 'Camping Forest Pine', desc: 'Earthy woodland greens and warm flannel browns', tempMod: 12, satMod: -6, conMod: 20, vigMod: 28 },
      { name: 'Urban Architecture Lines', desc: 'Ultra-wide perspective look with crisp structural geometry', tempMod: -10, satMod: -8, conMod: 28, vigMod: 15 },
    ],
  },
  {
    category: 'Retro & 35mm Film',
    prefix: 'FILM',
    accent: '#F97316',
    mode: 'PHOTO',
    aspect: '4:3',
    fps: 24,
    speed: 1,
    baseFilter: { brightness: 2, contrast: -6, saturation: -8, temperature: 14, tint: 6, vignette: 32, sharpness: 5, highlights: -18, shadows: 22 },
    presets: [
      { name: 'Kodak Portra 400 Emulation', desc: 'Legendary warm skin tones and pastel highlight roll-off', overlay: 'PORTRA 400', tempMod: 16, satMod: 6, conMod: -4, vigMod: 24 },
      { name: 'Fujifilm Superia 800', desc: 'Iconic fourth-color-layer emerald greens and cool shadows', tempMod: -6, satMod: 12, conMod: 10, vigMod: 28 },
      { name: 'CineStill 800T Halation', desc: 'Tungsten-balanced motion picture stock with red highlight bloom', tempMod: -14, satMod: 14, conMod: 18, vigMod: 34 },
      { name: 'Ilford HP5 Plus 400 B&W', desc: 'Classic documentary black and white photojournalism grain', tempMod: 0, satMod: -50, conMod: 26, vigMod: 36 },
      { name: '1998 VHS Camcorder', desc: 'Nostalgic home-video tape look with soft chroma warmth', overlay: 'PLAY ▶ 1998', tempMod: 12, satMod: -14, conMod: -12, vigMod: 40 },
      { name: 'Super 8mm Kodachrome', desc: 'Vintage 1970s family reel with rich archival yellows and reds', tempMod: 26, satMod: 16, conMod: 14, vigMod: 45 },
      { name: 'Disposable Flash Party', desc: 'Direct xenon flash look with green-tinted background shadows', tempMod: 8, satMod: 10, conMod: 22, vigMod: 38 },
      { name: 'Agfa Vista 200 Punch', desc: 'Warm holiday snapshot stock with vibrant cherry reds', tempMod: 14, satMod: 20, conMod: 12, vigMod: 22 },
      { name: '70s Bollywood Technicolor', desc: 'Lush saturated retro cinema print inspired by classic celluloid', tempMod: 22, satMod: 28, conMod: 16, vigMod: 30 },
      { name: 'Sepia Archive TinType', desc: '19th-century warm silver-plate antique portrait finish', tempMod: 38, satMod: -38, conMod: 24, vigMod: 48 },
      { name: 'Faded Summer Album 95', desc: 'Matte lifted blacks and sun-bleached nostalgic pastels', tempMod: 18, satMod: -18, conMod: -16, vigMod: 26 },
      { name: 'Leica M6 Street Chrome', desc: 'Crisp rangefinder micro-contrast with subtle shadow warmth', tempMod: 6, satMod: -6, conMod: 24, vigMod: 28 },
      { name: 'Cross-Processed E6 Slide', desc: 'Experimental high-contrast cyan-yellow chemical shift', tempMod: -8, satMod: 24, conMod: 32, vigMod: 35 },
    ],
  },
  {
    category: 'Action & Sports',
    prefix: 'ACTN',
    accent: '#3B82F6',
    mode: 'SLOW_MO',
    aspect: '16:9',
    fps: 120,
    speed: 0.5,
    baseFilter: { brightness: 0, contrast: 26, saturation: 14, temperature: -4, tint: 0, vignette: 22, sharpness: 45, highlights: -16, shadows: 6 },
    presets: [
      { name: 'Cricket Boundary 120FPS', desc: 'Fast 1/2000s shutter action preset for bat-ball impact clarity', overlay: '120 FPS REPLAY', tempMod: 4, satMod: 22, conMod: 24, vigMod: 18 },
      { name: 'Football Stadium Floodlight', desc: 'Crisp turf green enhancement under night stadium lights', tempMod: -8, satMod: 26, conMod: 26, vigMod: 20 },
      { name: 'Motocross Dirt Burst', desc: 'High-grit shutter freeze for flying mud and suspension travel', tempMod: 14, satMod: 12, conMod: 32, vigMod: 30 },
      { name: 'Parkour Rooftop POV', desc: 'Wide dynamic stabilization look with urban concrete punch', tempMod: -6, satMod: 8, conMod: 28, vigMod: 24 },
      { name: 'Boxing Ring Sweat & Grit', desc: 'Dramatic overhead ring light contrast with metallic skin sheen', tempMod: 8, satMod: -20, conMod: 40, vigMod: 44 },
      { name: 'Surf Barrel Pacific Blue', desc: 'Deep ocean cyan clarity and bright whitewater spray protection', tempMod: -16, satMod: 24, conMod: 22, vigMod: 16 },
      { name: 'Basketball Dunk Slow-Mo', desc: 'Court hardwood warmth with rim-level high-speed motion lock', tempMod: 12, satMod: 18, conMod: 24, vigMod: 26 },
      { name: 'Cycling Peloton Sprint', desc: 'Aerodynamic motion blur balance with vivid jersey colors', tempMod: 2, satMod: 20, conMod: 22, vigMod: 18 },
      { name: 'Track Sprint Finish Line', desc: 'Ultra-sharp photo-finish clarity at 120 frames per second', tempMod: 0, satMod: 16, conMod: 28, vigMod: 20 },
      { name: 'Badminton Smash Freeze', desc: 'Indoor court anti-flicker balance for shuttlecock velocity', tempMod: -4, satMod: 14, conMod: 24, vigMod: 16 },
      { name: 'Mountain Bike Trail Flow', desc: 'Forest canopy shadow recovery with fast shutter stabilization', tempMod: 6, satMod: 22, conMod: 20, vigMod: 22 },
      { name: 'Swimming Pool Underwater', desc: 'Corrects chlorine blue cast and sharpens bubble turbulence', tempMod: -12, satMod: 20, conMod: 26, vigMod: 14 },
    ],
  },
];

const transitions: StudioTemplate['transitionType'][] = [
  'Fade',
  'Cross Dissolve',
  'Flash Cut',
  'Whip Pan',
  'Film Burn',
];

const audioMoods = [
  'Cinematic Pulse 90 BPM (Public Domain)',
  'Festival Dhol & Ambient Strings',
  'Lo-Fi Tape Vinyl Crackle',
  'Deep Sub-Bass Slow-Mo Riser',
  'Acoustic Travel Guitar Loop',
  'Synthwave Night Drive 118 BPM',
];

export const STUDIO_TEMPLATES: StudioTemplate[] = (() => {
  const list: StudioTemplate[] = [];
  let counter = 1;

  for (const group of categoryDefinitions) {
    for (let i = 0; i < group.presets.length; i++) {
      const p = group.presets[i];
      const code = `${group.prefix}-${String(counter).padStart(3, '0')}`;
      list.push({
        id: `tpl-${counter}`,
        code,
        name: p.name,
        category: group.category,
        aspectRatio: group.aspect,
        fpsTarget: group.fps,
        speedMultiplier: group.speed,
        recommendedMode: group.mode,
        description: p.desc,
        filterSettings: {
          brightness: group.baseFilter.brightness,
          contrast: Math.max(-50, Math.min(50, p.conMod)),
          saturation: Math.max(-50, Math.min(50, p.satMod)),
          temperature: Math.max(-50, Math.min(50, p.tempMod)),
          tint: group.baseFilter.tint,
          vignette: Math.max(0, Math.min(100, p.vigMod)),
          sharpness: group.baseFilter.sharpness,
          highlights: group.baseFilter.highlights,
          shadows: group.baseFilter.shadows,
        },
        overlayText: p.overlay,
        transitionType: transitions[counter % transitions.length],
        audioMood: audioMoods[counter % audioMoods.length],
        accentColor: group.accent,
      });
      counter++;
    }
  }
  return list;
})();

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'All',
  'Cinematic LUTs',
  'Wedding & Festival',
  'Reels & Slow-Mo',
  'Portrait & Beauty',
  'Night & Cyberpunk',
  'Travel & Vlog',
  'Retro & 35mm Film',
  'Action & Sports',
];
