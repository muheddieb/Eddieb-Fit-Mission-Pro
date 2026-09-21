export interface VisualizerQuickAction {
  id: 'anatomy-blueprint' | 'meal-plate' | 'progression-snapshot';
  name: string;
  nameAr: string;
  category: string;
  categoryAr: string;
  tagline: string;
  taglineAr: string;
  prompt: string;
  imageSize: '1K' | '2K' | '4K';
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  iconName: 'Activity' | 'Utensils' | 'Flame';
  badge: string;
  badgeAr: string;
  accentGradient: string;
  borderHover: string;
  btnColor: string;
  samplePreviewUrl: string;
}

export const VISUALIZER_QUICK_ACTIONS: VisualizerQuickAction[] = [
  {
    id: 'anatomy-blueprint',
    name: 'Anatomy Blueprint',
    nameAr: 'مخطط التشريح العضلي',
    category: 'Biomechanics & Form',
    categoryAr: 'الميكانيكا الحيوية والتشريح',
    tagline: 'Scientific musculoskeletal blueprint highlighting active prime movers and stabilization lines.',
    taglineAr: 'مخطط تشريحي علمي فائق الدقة يوضح ألياف العضلات المحركة ومسارات التثبيت الحركي.',
    prompt: 'Scientific anatomical breakdown of human muscular biomechanics in motion, detailed musculoskeletal diagram with glowing turquoise and amber muscle fiber highlights showing active prime movers, stabilizers and tendon insertion points, high-contrast dark digital medical blueprint, precision athletic biomechanics, 8k ultra-detailed',
    imageSize: '2K',
    aspectRatio: '16:9',
    iconName: 'Activity',
    badge: '16:9 • 2K QHD',
    badgeAr: '16:9 • دقة 2K',
    accentGradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    borderHover: 'hover:border-cyan-500/50',
    btnColor: 'bg-cyan-600 hover:bg-cyan-500 text-white',
    samplePreviewUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'meal-plate',
    name: 'High-Protein Meal Plate',
    nameAr: 'طبق بروتين رياضي متكامل',
    category: 'Sports Nutrition & Fuel',
    categoryAr: 'التغذية الرياضية والماكروز',
    tagline: 'Precision culinary macro fueling: grilled lean protein, healthy carbs & fresh garden salad.',
    taglineAr: 'وجبة متوازنة بدقة علمية: صدر دجاج ولحم مشوي، خبز بلدي مصري، وسلطة خضراء غنية.',
    prompt: 'Gourmet athletic high-protein meal plate overhead view, perfectly grilled sliced chicken breast and lean beef, authentic Egyptian baladi whole wheat flatbread, vibrant Mediterranean green salad with crisp cucumber and tomatoes, light olive oil drizzle, clean macro-balanced meal prep, studio culinary food photography, warm soft natural lighting, 8k sharp focus',
    imageSize: '2K',
    aspectRatio: '4:3',
    iconName: 'Utensils',
    badge: '4:3 • 2K QHD',
    badgeAr: '4:3 • دقة 2K',
    accentGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    borderHover: 'hover:border-emerald-500/50',
    btnColor: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    samplePreviewUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'progression-snapshot',
    name: 'Body Progression Snapshot',
    nameAr: 'لقطة تقدم البنية الجسدية',
    category: 'Physique & Transformation',
    categoryAr: 'تطور البنية والنشافة',
    tagline: 'Milestone athletic physique progress with defined core vascularity and natural symmetry.',
    taglineAr: 'لقطة توثيق الإنجاز العضلي والتحول الرياضي، تقسيم عضلات البطن والتناسق الطبيعي.',
    prompt: 'Athletic body progression milestone snapshot, lean shredded muscular physique, defined six-pack abdominals and vascular deltoids, natural aesthetic bodybuilding symmetry, dramatic high-contrast gym lighting, photorealistic fitness transformation',
    imageSize: '2K',
    aspectRatio: '3:4',
    iconName: 'Flame',
    badge: '3:4 • 2K QHD',
    badgeAr: '3:4 • دقة 2K',
    accentGradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    borderHover: 'hover:border-amber-500/50',
    btnColor: 'bg-amber-600 hover:bg-amber-500 text-white',
    samplePreviewUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80',
  },
];
