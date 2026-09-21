/**
 * Smart Warm-up Engine
 * Science-based, 5-minute dynamic warm-up sequence generator tailored to workout type (Push, Pull, Legs, Full Body)
 * Single Source of Truth for Pre-Workout Dynamic Mobilization & Neuromuscular Priming
 */

import { WorkoutSession, WorkoutExercise } from '../types';
import { exerciseSeedData } from '../data/exerciseSeed';

export interface WarmupMovement {
  id: string;
  name: string;
  nameAr: string;
  durationSeconds: number; // typically 45-50 seconds
  repsOrTempo: string;
  repsOrTempoAr: string;
  targetJoints: string[];
  targetJointsAr: string[];
  targetMuscles: string[];
  targetMusclesAr: string[];
  rationale: string;
  rationaleAr: string;
  cues: string[];
  cuesAr: string[];
  breathing: string;
  breathingAr: string;
  iconName?: string;
  category?: 'mobility' | 'activation' | 'stretch' | 'cns' | 'potentiation';
  muscleTags?: string[];
  jointTags?: string[];
  imageUrl?: string;
  youtubeVideoId?: string;
  searchQuery?: string;
}

export interface WarmupSequence {
  workoutType: 'push' | 'pull' | 'legs' | 'full_body' | 'general' | 'custom';
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  totalDurationSeconds: number; // e.g. 180s (3m), 300s (5m), 480s (8m)
  focusMuscles: string[];
  focusMusclesAr: string[];
  primaryObjective: string;
  primaryObjectiveAr: string;
  movements: WarmupMovement[];
  targetedSessionExercises?: string[];
  detectedJointComplexes?: string[];
  detectedJointComplexesAr?: string[];
  muscleDistribution?: { muscle: string; muscleAr: string; count: number; percentage: number }[];
}

export interface SessionMuscleAnalysis {
  primaryMuscles: { name: string; nameAr: string; count: number; percentage: number }[];
  detectedJointComplexes: { name: string; nameAr: string }[];
  movementPatterns: string[];
  totalExercises: number;
  dominantCategory: 'push' | 'pull' | 'legs' | 'full_body';
  targetExerciseNames: { en: string; ar: string }[];
}

export interface WarmupGenerationOptions {
  durationMinutes?: 3 | 5 | 8;
  focusMode?: 'balanced' | 'mobility' | 'activation' | 'stretching';
  stiffAreas?: string[]; // 'shoulders' | 'hips' | 'lower_back' | 'ankles' | 'wrists' | 'hamstrings'
  isAr?: boolean;
}

export interface WarmupMovementMedia {
  imageUrl: string;
  youtubeVideoId: string;
  searchQuery: string;
}

export const WARMUP_MOVEMENT_MEDIA: Record<string, WarmupMovementMedia> = {
  push_1_arm_circles_slides: {
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 'w030iHqD33k',
    searchQuery: 'Arm Circles Overhead Wall Slides shoulder mobility exercise form'
  },
  push_2_band_pass_throughs: {
    imageUrl: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: '33P5AI27eiU',
    searchQuery: 'Band Shoulder Dislocations Pass Throughs warm up exercise form'
  },
  push_3_tspine_windmills: {
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: '4BOTvaXSRvU',
    searchQuery: 'Thoracic Spine Windmills quadruped opener mobility form'
  },
  push_4_scapular_pushups: {
    imageUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 'Z8GqQ0bE7iQ',
    searchQuery: 'Scapular Push ups serratus anterior form cues'
  },
  push_5_pushup_to_downward_dog: {
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 'Uge88v2B8kM',
    searchQuery: 'Dynamic Push up to Downward Dog warm up exercise form'
  },
  push_6_band_pull_aparts_y: {
    imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 'X5B3uE_L4f0',
    searchQuery: 'Band Pull Aparts and W to Y Raises warm up exercise'
  },
  pull_1_cat_cow_waves: {
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 'vPkyvU4n88M',
    searchQuery: 'Cat Cow spine waves pelvic tilts mobility exercise form'
  },
  pull_2_thread_the_needle: {
    imageUrl: 'https://images.unsplash.com/photo-1552196563-5523a4365313?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 'wI_bCkW-Ym8',
    searchQuery: 'Thread the Needle stretch thoracic spine mobility exercise form'
  },
  pull_3_scapular_pullups_band: {
    imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 's6Rj55q7v2U',
    searchQuery: 'Scapular Pull ups lat depression activation exercise form'
  },
  pull_4_banded_face_pulls: {
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 'HSoHeSjvIdY',
    searchQuery: 'Banded Face Pulls with external rotation rotator cuff form'
  },
  pull_5_hinge_hamstring_sweeps: {
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: '0Y-Z7bB0M7k',
    searchQuery: 'Dynamic Good Mornings and Hamstring Sweeps warm up form'
  },
  pull_6_wrist_forearm_prep: {
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 'mSZWSQSSEVU',
    searchQuery: 'Wrist and forearm mobility routine dynamic flexor extensor'
  },
  legs_1_deep_squat_pry: {
    imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 'qE_hX499z3U',
    searchQuery: 'Deep Squat Pry and Thoracic Sky Reach hip mobility form'
  },
  legs_2_90_90_hip_rotations: {
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 'h4X3X1WjS2w',
    searchQuery: '90 90 Dynamic Hip Switches capsule internal external rotation'
  },
  legs_3_glute_bridges: {
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 'wPM8icPu6H8',
    searchQuery: 'Glute Bridges with isometric hold glute activation form'
  },
  legs_4_quad_stretch_rdl_reach: {
    imageUrl: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 'r-rV9X88vKM',
    searchQuery: 'Walking Quad Stretch to Romanian Single Leg Reach dynamic warmup'
  },
  legs_5_lateral_lunges_cossack: {
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 'tpqpJ6bZ5lA',
    searchQuery: 'Alternating Lateral Lunges Cossack Squat Prep adductor mobility'
  },
  legs_6_ankle_wall_drives: {
    imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 'uH_kZkXzU6U',
    searchQuery: 'Ankle Dorsiflexion Wall Drives mobility drill squat depth'
  },
  full_1_worlds_greatest_stretch: {
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: '1e9j2x41d7M',
    searchQuery: 'Worlds Greatest Stretch thoracic opener lunge mobility drill'
  },
  full_2_inchworm_pushup: {
    imageUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 'ZP2u1B8fQoM',
    searchQuery: 'Inchworm Walkouts to Push up dynamic warm up posterior chain'
  },
  full_3_90_90_hips: {
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 'h4X3X1WjS2w',
    searchQuery: '90 90 Dynamic Hip Rotations mobility exercise form'
  },
  full_4_glute_bridges: {
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 'wPM8icPu6H8',
    searchQuery: 'Glute Bridges 3s squeeze activation exercise form'
  },
  full_5_band_pull_aparts: {
    imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 'X5B3uE_L4f0',
    searchQuery: 'Band Pull Aparts and W Raises upper back rotator cuff'
  },
  full_6_pogo_hops_arm_swings: {
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 'pYwK3k5tHqg',
    searchQuery: 'Elastic Pogo Hops cross body arm swings CNS potentiation'
  },
  push_doorway_pec_stretch: {
    imageUrl: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 'B2p0x7-87y0',
    searchQuery: 'Doorway Dynamic Pectoral Stretch scapular squeeze chest mobility'
  },
  push_overhead_triceps_reach: {
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 'M2oxwN9U2qY',
    searchQuery: 'Overhead Triceps Reach Lat Mobilization shoulder stretch'
  },
  legs_half_kneeling_psoas: {
    imageUrl: 'https://images.unsplash.com/photo-1552196563-5523a4365313?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 'YQmpO9VT28E',
    searchQuery: 'Half Kneeling Dynamic Hip Flexor Psoas Drive mobility'
  },
  legs_fire_hydrant_glute: {
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 'Z_gJ8qZ-c0c',
    searchQuery: 'Quadruped Fire Hydrants Glute Medius Circles hip activation'
  },
  core_birddog_anti_rotation: {
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 'wiFNA3sqjCA',
    searchQuery: 'Bird Dog core bracing posterior chain Stuart McGill form'
  },
  legs_single_leg_rdl_reach: {
    imageUrl: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: 'r-rV9X88vKM',
    searchQuery: 'Single Leg Dynamic RDL Reach to High Knee Drive warm up'
  }
};

export function attachMediaToMovement(movement: WarmupMovement): WarmupMovement {
  const media = WARMUP_MOVEMENT_MEDIA[movement.id] || {
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
    youtubeVideoId: '1e9j2x41d7M',
    searchQuery: `${movement.name} dynamic warmup mobility form cues`
  };
  return {
    ...movement,
    imageUrl: movement.imageUrl || media.imageUrl,
    youtubeVideoId: movement.youtubeVideoId || media.youtubeVideoId,
    searchQuery: movement.searchQuery || media.searchQuery
  };
}

export function getMovementGoogleSearchUrl(movement: WarmupMovement): string {
  const query = movement.searchQuery || `${movement.name} dynamic warmup mobility form cues`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export function getMovementGoogleImagesUrl(movement: WarmupMovement): string {
  const query = movement.searchQuery || `${movement.name} exercise mobility form`;
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
}

export function getMovementYouTubeSearchUrl(movement: WarmupMovement): string {
  const query = movement.searchQuery || `${movement.name} warm up exercise tutorial form`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export const PUSH_WARMUP_SEQUENCE: WarmupMovement[] = [
  {
    id: 'push_1_arm_circles_slides',
    name: 'Arm Circles & Overhead Wall Slides',
    nameAr: 'دوائر الذراعين والانزلاق العلوي على الحائط',
    durationSeconds: 50,
    repsOrTempo: '10 small + 10 large circles each way, then 10 wall slides',
    repsOrTempoAr: '10 دوائر صغيرة + 10 كبيرة لكل اتجاه، ثم 10 انزلاقات حائط',
    targetJoints: ['Glenohumeral (Shoulder)', 'Scapulothoracic'],
    targetJointsAr: ['مفصل الكتف الكروي', 'لوح الكتف والقفص الصدري'],
    targetMuscles: ['Deltoids', 'Rotator Cuff', 'Serratus Anterior'],
    targetMusclesAr: ['الأكتاف', 'الكفة المدورة (الروتاتور كف)', 'العضلة المنشارية'],
    rationale: 'Increases synovial fluid in shoulder capsules and primes scapular upward rotation for overhead/incline pressing.',
    rationaleAr: 'يزيد السائل الزلالي في كبسولة الكتف ويهيئ حركة لوحي الكتف للأعلى لتمارين الضغط المستوي والمائل.',
    cues: [
      'Keep ribs locked down; do not hyperextend lumbar spine.',
      'Reach tall through fingertips at the apex of the movement.',
      'Squeeze lower traps as elbows pull down along the wall.'
    ],
    cuesAr: [
      'حافظ على شد البطن وعدم تقويس أسفل الظهر.',
      'تمدد لأعلى بأطراف أصابعك عند قمة الحركة.',
      'اعصر عضلات الظهر السفلية مع نزول الكوعين للأسفل.'
    ],
    breathing: 'Inhale on the reach up; exhale smoothly as you pull elbows down.',
    breathingAr: 'شهيق عند التمدد لأعلى، وزفير سلس عند سحب الكوعين للأسفل.',
    iconName: 'RotateCcw'
  },
  {
    id: 'push_2_band_pass_throughs',
    name: 'Band / Stick Shoulder Dislocations & Pass-Throughs',
    nameAr: 'تمرير الحبل أو العصا لمرونة الكتف (Pass-Throughs)',
    durationSeconds: 50,
    repsOrTempo: '12 - 15 smooth controlled passes',
    repsOrTempoAr: '12 - 15 تمريرة سلسة ومضبوطة',
    targetJoints: ['Glenohumeral', 'Acromioclavicular', 'Sternoclavicular'],
    targetJointsAr: ['مفصل الكتف', 'المفصل الأخرمي الترقوي', 'المفصل القصي الترقوي'],
    targetMuscles: ['Pectoralis Major & Minor', 'Anterior Deltoids', 'Subscapularis'],
    targetMusclesAr: ['عضلات الصدر الكبرى والصغرى', 'الكتف الأمامي', 'عضلات الكفة الداخلية'],
    rationale: 'Stretches anterior chest and shoulder capsules dynamically, removing stiffness before heavy horizontal pressing.',
    rationaleAr: 'يطيل عضلات الصدر وكبسولة الكتف الأمامية بشكل حركي، مما يزيل التيبس قبل أوزان البنش برس.',
    cues: [
      'Start with a wide grip and narrow down slightly only as mobility allows.',
      'Keep arms straight without bending elbows.',
      'Maintain continuous tension without jarring movements.'
    ],
    cuesAr: [
      'ابدأ بمسكة واسعة وضيّقها تدريجياً حسب مرونتك.',
      'حافظ على استقامة الذراعين بدون ثني الكوع.',
      'حافظ على سحب سلس ومستمر بدون حركات مفاجئة.'
    ],
    breathing: 'Inhale lifting forward and up; exhale passing behind your back.',
    breathingAr: 'شهيق مع الرفع للأعلى، وزفير مع التمرير خلف الظهر.',
    iconName: 'Maximize2'
  },
  {
    id: 'push_3_tspine_windmills',
    name: 'Thoracic Spine Windmills & Quadruped Openers',
    nameAr: 'طواحين العمود الفقري الصدري والفتح الرباعي',
    durationSeconds: 50,
    repsOrTempo: '6 - 8 slow rotations per side (25s each side)',
    repsOrTempoAr: '6 - 8 لفات بطيئة لكل جهة (25 ثانية لكل جانب)',
    targetJoints: ['Thoracic Spine (T1-T12)', 'Ribcage (Costovertebral)'],
    targetJointsAr: ['العمود الفقري الصدري (T1-T12)', 'القفص الصدري'],
    targetMuscles: ['Rhomboids', 'Mid Trapezius', 'Intercostals', 'Chest'],
    targetMusclesAr: ['العضلات المعينية', 'وسط الظهر', 'بين الضلوع', 'الصدر'],
    rationale: 'Thoracic extension and rotation is crucial for creating a rock-solid, pain-free arch on the bench press.',
    rationaleAr: 'مرونة العمود الفقري الصدري ضرورية جداً لبناء تقوس آمن وثابت على البنش برس بدون ألم أسفل الظهر.',
    cues: [
      'Keep hips completely square and stacked; rotate only from the upper torso.',
      'Follow your moving hand with your eyes.',
      'Hold the end range for 1 second to expand the chest.'
    ],
    cuesAr: [
      'ثبّت الحوض تماماً وحرّك الجزء العلوي من جذعك فقط.',
      'تابع يدك المتحركة بنظرات عينيك.',
      'اثبت ثانية عند أقصى مدى لفتح القفص الصدري.'
    ],
    breathing: 'Deep inhale as you open the chest to the ceiling; exhale as you return.',
    breathingAr: 'شهيق عميق مع فتح الصدر باتجاه السقف، وزفير مع العودة.',
    iconName: 'Compass'
  },
  {
    id: 'push_4_scapular_pushups',
    name: 'Scapular Push-ups & Serratus Push',
    nameAr: 'ضغط لوحي الكتف وتفعيل العضلة المنشارية (Scap Push-ups)',
    durationSeconds: 50,
    repsOrTempo: '15 controlled protraction/retraction pulses',
    repsOrTempoAr: '15 تكراراً مضبوطاً لتباعد وتقارب لوحي الكتف',
    targetJoints: ['Scapulothoracic Articulation'],
    targetJointsAr: ['تمفصل لوح الكتف مع القفص الصدري'],
    targetMuscles: ['Serratus Anterior', 'Lower Trapezius', 'Pectoralis Minor'],
    targetMusclesAr: ['العضلة المنشارية (Serratus)', 'الترابيس السفلية', 'الصدر الصغير'],
    rationale: 'Wakes up the serratus anterior, the primary stabilizer preventing shoulder impingement during heavy presses.',
    rationaleAr: 'يوقظ العضلة المنشارية، المسؤولة الأولى عن تثبيت لوح الكتف ومنع احتكاك الأوتار أثناء أوزان الضغط.',
    cues: [
      'Keep elbows locked completely straight.',
      'Pinch shoulder blades together in the bottom, then push the floor away at the top.',
      'Engage your glutes and core to keep your body in a rigid plank.'
    ],
    cuesAr: [
      'حافظ على قفل الكوعين مستقيمين تماماً.',
      'اقبض لوحي الكتف معاً للأسفل، ثم ادفع الأرض بقوة للأعلى.',
      'شد عضلات البطن والمؤخرة للحفاظ على استقامة الجسم.'
    ],
    breathing: 'Inhale dropping down between shoulder blades; exhale pushing the floor away.',
    breathingAr: 'شهيق مع نزول الصدر بين الكتفين، وزفير قوي مع دفع الأرض للأعلى.',
    iconName: 'Shield'
  },
  {
    id: 'push_5_pushup_to_downward_dog',
    name: 'Dynamic Push-up to Downward Dog',
    nameAr: 'تمرين الضغط الديناميكي إلى وضعية الكلب المتجه لأسفل',
    durationSeconds: 50,
    repsOrTempo: '8 - 10 fluid transitions',
    repsOrTempoAr: '8 - 10 تكرارات انتقالية سلسة',
    targetJoints: ['Shoulders', 'Thoracic Spine', 'Ankles'],
    targetJointsAr: ['الكتفان', 'العمود الفقري الصدري', 'الكواحل'],
    targetMuscles: ['Chest', 'Triceps', 'Anterior Delts', 'Calves & Hamstrings'],
    targetMusclesAr: ['الصدر', 'الترايسبس', 'الكتف الأمامي', 'السمانة والخلفيات'],
    rationale: 'Full anterior pressing recruitment combined with active posterior chain decompression and shoulder elevation.',
    rationaleAr: 'تفعيل كامل لعضلات الدفع الأمامية مع استطالة الظهر الخلفي وتمدد مفصل الكتف للأعلى بأمان.',
    cues: [
      'Perform a controlled push-up, then push hips high and back.',
      'Drive heels gently toward the ground in downward dog.',
      'Let your head relax between your biceps at the peak.'
    ],
    cuesAr: [
      'قم بتكرار ضغط مضبوط، ثم ادفع حوضك لأعلى وللخلف.',
      'وجّه كعبي قدميك برفق نحو الأرض.',
      'دع رأسك يسترخي بين ذراعيك عند قمة الوضعية.'
    ],
    breathing: 'Exhale pushing up; inhale pushing hips back; exhale holding downward dog.',
    breathingAr: 'زفير مع الصعود، شهيق مع دفع الحوض للخلف، وزفير عند قمة التمدد.',
    iconName: 'TrendingUp'
  },
  {
    id: 'push_6_band_pull_aparts_y',
    name: 'Band Pull-Aparts & W-to-Y Raises',
    nameAr: 'سحب الحبل للأكتاف الخلفية ورفع W إلى Y',
    durationSeconds: 50,
    repsOrTempo: '15 pull-aparts + 10 W-to-Y raises',
    repsOrTempoAr: '15 سحبة خلفية + 10 رفعات W إلى Y',
    targetJoints: ['Glenohumeral', 'Scapulothoracic'],
    targetJointsAr: ['مفصل الكتف', 'لوح الكتف'],
    targetMuscles: ['Rear Deltoids', 'Infraspinatus', 'Rhomboids', 'Mid/Lower Traps'],
    targetMusclesAr: ['الكتف الخلفي', 'عضلة تحت الشوكة', 'المعينيات', 'الترابيس الوسطى والسفلية'],
    rationale: 'Creates an active posterior shelf and fires up external rotators to stabilize heavy barbell and dumbbell pressing.',
    rationaleAr: 'يبني قاعدة خلفية قوية ويفعل عضلات التدوير الخارجية لتثبيت البار والدمبلز الثقيلة.',
    cues: [
      'Pull band apart by pinching your shoulder blades together first.',
      'Do not shrug shoulders up toward your ears.',
      'Control the eccentric return; keep constant tension.'
    ],
    cuesAr: [
      'اسحب الحبل بضم لوحي الكتف معاً أولاً.',
      'لا ترفع كتفيك باتجاه أذنيك (لا تشنج الترابيس العلوية).',
      'تحكم في الرجوع ببطء وحافظ على الشد المستمر.'
    ],
    breathing: 'Exhale on the pull-apart; inhale on the slow return.',
    breathingAr: 'زفير مع فتح الحبل، وشهيق مع الرجوع البطيء.',
    iconName: 'Zap'
  }
];

export const PULL_WARMUP_SEQUENCE: WarmupMovement[] = [
  {
    id: 'pull_1_cat_cow_waves',
    name: 'Cat-Cow Spine Waves & Pelvic Tilts',
    nameAr: 'أمواج العمود الفقري (Cat-Cow) وإمالة الحوض',
    durationSeconds: 50,
    repsOrTempo: '10 - 12 fluid spinal cycles',
    repsOrTempoAr: '10 - 12 دورة عمود فقري مرنة',
    targetJoints: ['Full Spine (Cervical, Thoracic, Lumbar)', 'Sacroiliac'],
    targetJointsAr: ['كامل العمود الفقري (عنقي، صدري، قطني)', 'المفصل العجزي الحرقفي'],
    targetMuscles: ['Erector Spinae', 'Rectus Abdominis', 'Multifidus', 'Lats'],
    targetMusclesAr: ['ناصبات العمود الفقري', 'عضلات البطن', 'العضلات الفقرية العميقة', 'المجنص (Lats)'],
    rationale: 'Decompresses the intervertebral discs and lubricates the entire spinal column before heavy rows and deadlifts.',
    rationaleAr: 'يزيل الضغط عن فقرات الظهر ويلين العمود الفقري بالكامل قبل تمارين التجديف والسحب الثقيل.',
    cues: [
      'Inhale: Drop belly gently, arch upper back, look slightly up.',
      'Exhale: Tuck chin to chest, round your entire spine, push the floor away.',
      'Move segment by segment like a wave.'
    ],
    cuesAr: [
      'شهيق: أسقط البطن برفق، افتح الصدر، وانظر للأمام قليلاً.',
      'زفير: ضم الذقن للصدر، قوس ظهرك بالكامل وادفع الأرض.',
      'تحرك فقرة بفقرة بسلاسة مثل الموجة.'
    ],
    breathing: 'Deep inhale on extension (cow); complete exhale on flexion (cat).',
    breathingAr: 'شهيق عميق مع التمدد (Cow)، وزفير كامل مع التقويس (Cat).',
    iconName: 'Waves'
  },
  {
    id: 'pull_2_thread_the_needle',
    name: 'Quadruped Thread the Needle & Lat Dynamic Stretch',
    nameAr: 'تمرين إدخال الخيط في الإبرة وإطالة المجنص الحركية',
    durationSeconds: 50,
    repsOrTempo: '6 - 8 repetitions per side (25s per side)',
    repsOrTempoAr: '6 - 8 تكرارات لكل جانب (25 ثانية لكل جهة)',
    targetJoints: ['Thoracic Spine', 'Posterior Shoulder Capsule'],
    targetJointsAr: ['العمود الفقري الصدري', 'كبسولة الكتف الخلفية'],
    targetMuscles: ['Latissimus Dorsi', 'Rhomboids', 'Posterior Deltoids', 'Obliques'],
    targetMusclesAr: ['المجنص (Lats)', 'العضلات المعينية', 'الكتف الخلفي', 'عضلات الجوانب'],
    rationale: 'Releases latissimus and thoracic tightness, restoring full rotational range of motion for unilateral rows.',
    rationaleAr: 'يحرر شد عضلات المجنص والظهر الصدري، مما يضمن أقصى مدى حركي في تمارين السحب والتجديف.',
    cues: [
      'Slide your arm across the floor under your chest as far as comfortable.',
      'Rest your shoulder lightly on the floor for 1 second.',
      'Rotate arm up toward the ceiling on the return.'
    ],
    cuesAr: [
      'مرر ذراعك تحت صدرك على الأرض لأقصى مدى مريح.',
      'أرح كتفك على الأرض برفق لمدة ثانية واحدة.',
      'افتح ذراعك لأعلى باتجاه السقف عند العودة.'
    ],
    breathing: 'Exhale reaching through; inhale rotating up toward the sky.',
    breathingAr: 'زفير مع التمدد للداخل، وشهيق مع الفتح للأعلى.',
    iconName: 'Compass'
  },
  {
    id: 'pull_3_scapular_pullups_band',
    name: 'Scapular Pull-ups / Band Lat Depressions',
    nameAr: 'سحب لوحي الكتف للأسفل وتفعيل المجنص (Scapular Pulls)',
    durationSeconds: 50,
    repsOrTempo: '12 - 15 controlled lat depressions with 2s hold',
    repsOrTempoAr: '12 - 15 تكراراً لسحب لوحي الكتف مع ثبات ثانيتين',
    targetJoints: ['Scapulothoracic', 'Glenohumeral'],
    targetJointsAr: ['لوح الكتف', 'مفصل الكتف'],
    targetMuscles: ['Lower Trapezius', 'Latissimus Dorsi', 'Teres Major'],
    targetMusclesAr: ['الترابيس السفلية', 'المجنص (Lats)', 'العضلة المدورة الكبيرة'],
    rationale: 'Establishes mind-muscle connection with the lower traps and lats to initiate every pull with the back instead of the biceps.',
    rationaleAr: 'يبني التوافق العصبي العضلي لبدء أي سحب بالظهر والمجنص بدلاً من إجهاد البايسبس مبكراً.',
    cues: [
      'Keep arms completely straight without bending elbows.',
      'Pull your shoulder blades down and back into your back pockets.',
      'Hold the bottom contraction for 2 solid seconds.'
    ],
    cuesAr: [
      'حافظ على استقامة الذراعين بدون ثني الكوعين.',
      'اسحب لوحي كتفيك لأسفل وكأنك تضعهما في جيب بنطالك الخلفي.',
      'اثبت في أقصى انقباض لمدة ثانيتين كاملتين.'
    ],
    breathing: 'Exhale pulling down; inhale slowly releasing up.',
    breathingAr: 'زفير مع السحب للأسفل، وشهيق مع الصعود البطيء.',
    iconName: 'ArrowDown'
  },
  {
    id: 'pull_4_banded_face_pulls',
    name: 'Banded Face Pulls & External Rotations',
    nameAr: 'فيس بول بحبل المقاومة والتدوير الخارجي',
    durationSeconds: 50,
    repsOrTempo: '15 reps with controlled peak contraction',
    repsOrTempoAr: '15 تكراراً مع التركيز على أقصى انقباض',
    targetJoints: ['Glenohumeral', 'Scapulothoracic'],
    targetJointsAr: ['مفصل الكتف', 'لوح الكتف'],
    targetMuscles: ['Rear Deltoids', 'Infraspinatus', 'Teres Minor', 'Rhomboids'],
    targetMusclesAr: ['الكتف الخلفي', 'الكفة المدورة الخارجية', 'المعينيات'],
    rationale: 'Reinforces the rotator cuff and scapular retractors, keeping the humerus centered safely during heavy pull-downs.',
    rationaleAr: 'يقوي الكفة المدورة وعضلات سحب لوحي الكتف، مما يحمي مفصل الكتف أثناء السحب العالي والأفقي.',
    cues: [
      'Pull the band toward your eyes/forehead, separating your hands.',
      'Finish with thumbs pointing backward and elbows high and wide.',
      'Squeeze the back of your shoulders hard at the peak.'
    ],
    cuesAr: [
      'اسحب الحبل باتجاه عينيك/جبهتك مع تفريق اليدين للخارج.',
      'أنهِ الحركة بإبهامك متجهاً للخلف وكوعيك مرتفعين.',
      'اعصر عضلات كتفك الخلفية بقوة في نهاية السحبة.'
    ],
    breathing: 'Exhale on the pull; inhale controlling the return.',
    breathingAr: 'زفير مع السحب للخلف، وشهيق مع العودة بالتحكم.',
    iconName: 'Target'
  },
  {
    id: 'pull_5_hinge_hamstring_sweeps',
    name: 'Dynamic Good Mornings & Hamstring Sweeps',
    nameAr: 'تمرين انحناء الجذع الديناميكي وإطالة الخلفيات الحركية',
    durationSeconds: 50,
    repsOrTempo: '12 controlled hip hinges + 6 sweeps per leg',
    repsOrTempoAr: '12 انحناء حوض مضبوط + 6 مسحات لكل ساق',
    targetJoints: ['Hip Joint (Coxofemoral)', 'Lumbar Spine (Stability)'],
    targetJointsAr: ['مفصل الحوض والفخذ', 'الفقرات القطنية (تثبيت)'],
    targetMuscles: ['Hamstrings', 'Gluteus Maximus', 'Erector Spinae'],
    targetMusclesAr: ['عضلات الفخذ الخلفية', 'المؤخرة (Glutes)', 'عضلات استقامة الظهر'],
    rationale: 'Pre-activates the hip hinge pattern, training proper spinal stiffness before bent-over barbell rows and RDLs.',
    rationaleAr: 'يهيئ نمط ثني الحوض (Hip Hinge) مع تثبيت الظهر قبل تمارين التجديف بالبار والديدلفت الروماني.',
    cues: [
      'Push your hips straight back as if touching a wall behind you.',
      'Keep a soft knee bend and a proud, neutral chest.',
      'Feel the deep stretch in your hamstrings, then drive hips forward.'
    ],
    cuesAr: [
      'ادفع حوضك للخلف مباشرة وكأنك تلمس جداراً خلفك.',
      'حافظ على انثناءة بسيطة في الركبة وصدر مرفوع ومستقيم.',
      'اشعر بالإطالة في الخلفيات، ثم ادفع الحوض للأمام للوقوف.'
    ],
    breathing: 'Inhale hinging back; exhale squeezing glutes to stand tall.',
    breathingAr: 'شهيق مع الانحناء للخلف، وزفير مع قبض المؤخرة للوقوف.',
    iconName: 'Activity'
  },
  {
    id: 'pull_6_wrist_forearm_prep',
    name: 'Wrist & Forearm Dynamic Flexion / Extension Circles',
    nameAr: 'دوائر وإطالات المعصم والساعدين الديناميكية',
    durationSeconds: 50,
    repsOrTempo: '15 wrist rolls + 15 palm pulses each direction',
    repsOrTempoAr: '15 لفة معصم + 15 ضغطة كف في كل اتجاه',
    targetJoints: ['Radiocarpal (Wrist)', 'Distal Radioulnar'],
    targetJointsAr: ['مفصل الرسغ', 'مفصل الكعبرة والزند'],
    targetMuscles: ['Forearm Flexors & Extensors', 'Brachioradialis', 'Grip Tendons'],
    targetMusclesAr: ['عضلات الساعد القابضة والباسطة', 'أوتار قبضة اليد'],
    rationale: 'Prevents forearm and elbow tendonitis (golfer/tennis elbow) from heavy gripping in bicep curls and chin-ups.',
    rationaleAr: 'يمنع التهاب أوتار الكوع والساعد الناتج عن إجهاد القبضة في تمارين البايسبس والسحب.',
    cues: [
      'Gently pulse weight over palms on hands and knees.',
      'Rotate fingertips toward knees to stretch flexors dynamically.',
      'Shake out hands and perform rapid light fist clenches to finish.'
    ],
    cuesAr: [
      'اضغط برفق بوزنك فوق راحتي يديك وأنت في وضعية الركوع.',
      'وجّه أطراف أصابعك نحو ركبتيك لإطالة عضلات الساعد.',
      'حرّك يديك واقبض أصابعك برفق لتنشيط تدفق الدم.'
    ],
    breathing: 'Breathe naturally and rhythmically throughout.',
    breathingAr: 'تنفس طبيعي ومنتظم طوال التمرين.',
    iconName: 'ShieldCheck'
  }
];

export const LEGS_WARMUP_SEQUENCE: WarmupMovement[] = [
  {
    id: 'legs_1_deep_squat_pry',
    name: 'Deep Squat Pry & Thoracic Sky Reach',
    nameAr: 'القرفصاء العميقة مع فتح الحوض والتمدد للسماء',
    durationSeconds: 50,
    repsOrTempo: '8 - 10 deep squat holds with alternating reaches',
    repsOrTempoAr: '8 - 10 تكرارات قرفصاء عميقة مع تمدد متبادل لليدين',
    targetJoints: ['Hips', 'Ankles (Dorsiflexion)', 'Thoracic Spine', 'Knees'],
    targetJointsAr: ['الحوض', 'الكواحل', 'العمود الفقري الصدري', 'الركبتان'],
    targetMuscles: ['Adductors', 'Glutes', 'Anterior Tibialis', 'T-Spine Extensors'],
    targetMusclesAr: ['العضلات الضامة', 'المؤخرة', 'عضلة قصبة الساق', 'عضلات الظهر الصدري'],
    rationale: 'Opens adductor groin tissue, enhances ankle dorsiflexion, and reinforces upright torso mechanics for deep squats.',
    rationaleAr: 'يفتح عضلات الحوض الضامة، ويزيد مرونة الكاحل لضمان قرفصاء عميقة مع صدر مرفوع وجذع مستقيم.',
    cues: [
      'Sink into your lowest comfortable squat with feet flat on the floor.',
      'Use elbows to gently press knees outwards.',
      'Reach one hand high to the ceiling, rotating your chest.'
    ],
    cuesAr: [
      'انزل لأعمق قرفصاء مريحة مع ثبات كامل القدمين على الأرض.',
      'استخدم كوعيك لدفع الركبتين برفق للخارج.',
      'ارفع يداً واحدة للسماء مع لف صدرك للأعلى.'
    ],
    breathing: 'Inhale sinking down; exhale on the thoracic rotation reach.',
    breathingAr: 'شهيق مع النزول، وزفير مع الالتفاف ورفع اليد للسماء.',
    iconName: 'Maximize2'
  },
  {
    id: 'legs_2_90_90_hip_rotations',
    name: '90/90 Dynamic Hip Capsule Switches',
    nameAr: 'تبديل وضعية 90/90 لمرونة كبسولة الحوض الداخلية والخارجية',
    durationSeconds: 50,
    repsOrTempo: '10 - 12 smooth seated switches',
    repsOrTempoAr: '10 - 12 تبديلة سلسة بالجلوس',
    targetJoints: ['Acetabulofemoral (Hip Joint)'],
    targetJointsAr: ['مفصل الحوض الفخذي'],
    targetMuscles: ['Gluteus Medius/Minimus', 'Piriformis', 'Hip Rotators', 'Psoas'],
    targetMusclesAr: ['عضلات المؤخرة الوسطى', 'العضلة الكمثرية', 'مدورات الحوض', 'عضلات الفخذ العميقة'],
    rationale: 'Unlocks both internal and external hip rotation, preventing hip pinch and lower back rounding (butt-wink) in squats.',
    rationaleAr: 'يحرر الدوران الداخلي والخارجي للحوض، مما يمنع انضغاط الحوض أو تقوس أسفل الظهر في السكوات.',
    cues: [
      'Sit tall with both knees bent at 90-degree angles.',
      'Rotate your knees from one side to the other, keeping heels pinned.',
      'Lead with your front knee and avoid using hands if mobility allows.'
    ],
    cuesAr: [
      'اجلس مستقيماً مع ثني الركبتين بزاوية 90 درجة.',
      'بدّل ركبتيك من جهة لأخرى مع تثبيت الكعبين على الأرض.',
      'حاول عدم استخدام يديك إذا سمحت مرونتك بذلك.'
    ],
    breathing: 'Inhale through the transition; exhale lowering into the stretch.',
    breathingAr: 'شهيق أثناء الانتقال، وزفير عند النزول في الإطالة.',
    iconName: 'RotateCcw'
  },
  {
    id: 'legs_3_glute_bridges',
    name: 'Glute Bridges with 3-Second Iso-Holds',
    nameAr: 'جسر المؤخرة (Glute Bridges) مع ثبات 3 ثوانٍ في القمة',
    durationSeconds: 50,
    repsOrTempo: '12 reps with 3-second squeeze at the apex',
    repsOrTempoAr: '12 تكراراً مع ثبات وعصر المؤخرة 3 ثوانٍ في الأعلى',
    targetJoints: ['Hip Joint (Extension)'],
    targetJointsAr: ['مفصل الحوض (فرد للخلف)'],
    targetMuscles: ['Gluteus Maximus', 'Hamstrings', 'Transverse Abdominis'],
    targetMusclesAr: ['المؤخرة الكبرى (Glute Max)', 'الخلفيات', 'عضلات البطن العميقة'],
    rationale: 'Wakes up dormant glutes, ensuring your hips produce the primary horsepower rather than overloading the lower back in leg day.',
    rationaleAr: 'يوقظ عضلات المؤخرة الخاملة، لضمان توليد القوة من الحوض بدلاً من تحميل أسفل الظهر أوزاناً زائدة.',
    cues: [
      'Drive through your heels; keep toes lightly grounded.',
      'Do not arch your lower back; squeeze glutes to create a straight line from knee to shoulder.',
      'Hold the peak contraction for 3 full seconds.'
    ],
    cuesAr: [
      'ادفع من خلال كعبي قدميك وثبّت مشطي القدم برفق.',
      'لا تقوس أسفل ظهرك؛ اعصر المؤخرة لتشكل خطاً مستقيماً من الركبة للكتف.',
      'اثبت في قمة الحركة 3 ثوانٍ كاملة.'
    ],
    breathing: 'Exhale driving hips up; inhale lowering with control.',
    breathingAr: 'زفير قوي عند رفع الحوض للأعلى، وشهيق مع النزول بتحكم.',
    iconName: 'Zap'
  },
  {
    id: 'legs_4_quad_stretch_rdl_reach',
    name: 'Walking Quad Stretch to Romanian Single-Leg Reach',
    nameAr: 'إطالة الفخذ الأمامي الحركية مع النزول الروماني لساق واحدة',
    durationSeconds: 50,
    repsOrTempo: '6 reps per leg alternating',
    repsOrTempoAr: '6 تكرارات لكل ساق بالتناوب',
    targetJoints: ['Hips', 'Knee', 'Ankle Stability'],
    targetJointsAr: ['الحوض', 'الركبة', 'ثبات مفصل الكاحل'],
    targetMuscles: ['Quadriceps (Rectus Femoris)', 'Hamstrings', 'Glute Medius'],
    targetMusclesAr: ['الفخذ الأمامي', 'الفخذ الخلفي', 'عضلة ثبات الحوض'],
    rationale: 'Elongates the anterior hip flexors while instantly challenging single-leg stability and hamstring eccentric control.',
    rationaleAr: 'يطيل عضلات الفخذ الأمامية ويختبر ثبات الساق المفردة والتحكم في عضلات الخلفية.',
    cues: [
      'Pull one heel to your glute and stand tall for a brief quad stretch.',
      'Release, hinge forward on the same leg, reaching arms forward and back leg straight behind.',
      'Keep hips square to the floor.'
    ],
    cuesAr: [
      'اسحب كعبك نحو مؤخرتك مع الوقوف مستقيماً لإطالة الفخذ الأمامي.',
      'حرر الساق وانحنِ للأمام على نفس الساق مع مد الذراعين للأمام والساق للخلف.',
      'حافظ على استقامة الحوض بمحاذاة الأرض.'
    ],
    breathing: 'Inhale during quad grab; exhale hinging out into single-leg reach.',
    breathingAr: 'شهيق مع سحب الفخذ، وزفير مع الانحناء للأمام.',
    iconName: 'TrendingUp'
  },
  {
    id: 'legs_5_lateral_lunges_cossack',
    name: 'Alternating Lateral Lunges / Cossack Squat Prep',
    nameAr: 'طعنات جانبية متبادلة وتحضير لسكوات القوزاق (Cossack)',
    durationSeconds: 50,
    repsOrTempo: '10 - 12 alternating smooth lateral lunges',
    repsOrTempoAr: '10 - 12 طعنة جانبية متبادلة وسلسة',
    targetJoints: ['Hips (Frontal Plane)', 'Knees', 'Ankles'],
    targetJointsAr: ['مفصل الحوض (المستوى الجانبي)', 'الركبتان', 'الكواحل'],
    targetMuscles: ['Adductors (Groin)', 'Gluteus Medius', 'Quadriceps'],
    targetMusclesAr: ['العضلات الضامة (الضامّة)', 'المؤخرة الجانبية', 'الفخذ الأمامي'],
    rationale: 'Warms up the frontal plane, adductor elasticity, and lateral knee stabilizers that are often neglected in pure sagittal squatting.',
    rationaleAr: 'يهيئ مرونة العضلات الضامة وعضلات ثبات الركبة الجانبية الضرورية جداً لسلامة الركبتين.',
    cues: [
      'Step wide, push hips back, and bend one knee while keeping the other leg straight.',
      'Keep the working foot flat on the floor; knee tracks over toes.',
      'Push forcefully off the bent leg to return to center.'
    ],
    cuesAr: [
      'افتح ساقيك واسعاً، ادفع حوضك للخلف واثنِ ركبة واحدة مع استقامة الساق الأخرى.',
      'حافظ على ثبات كامل القدم العاملة على الأرض ومحاذاة الركبة للأصابع.',
      'ادفع بقوة من الساق المثنية للعودة للمنتصف.'
    ],
    breathing: 'Inhale sinking to the side; exhale pushing back to standing.',
    breathingAr: 'شهيق مع النزول للجانب، وزفير مع الدفع والعودة للوقوف.',
    iconName: 'Shield'
  },
  {
    id: 'legs_6_ankle_wall_drives',
    name: 'Ankle Dorsiflexion Wall Drives & Calf Bounces',
    nameAr: 'دفعات مرونة الكاحل على الحائط وقفزات السمانة الخفيفة',
    durationSeconds: 50,
    repsOrTempo: '10 wall knee drives per leg + 20 light elastic calf bounces',
    repsOrTempoAr: '10 دفعات ركبة للكاحل لكل ساق + 20 قفزة سمانة مرنة',
    targetJoints: ['Talocrural (Ankle Joint)', 'Subtalar'],
    targetJointsAr: ['مفصل الكاحل الحقيقي', 'المفصل تحت الكاحل'],
    targetMuscles: ['Gastrocnemius', 'Soleus', 'Achilles Tendon', 'Tibialis Anterior'],
    targetMusclesAr: ['عضلة السمانة', 'العضلة النعلية', 'وتر أكيليس', 'قصبة الساق'],
    rationale: 'Restricted ankle dorsiflexion is the #1 cause of knee caving and heel rising in heavy squats and leg presses.',
    rationaleAr: 'تيبس مفصل الكاحل هو السبب الأول لميل الركبتين للداخل وارتفاع الكعب في السكوات ومكبس الأرجل.',
    cues: [
      'Place toes 3-4 inches from the wall with heel glued to the floor.',
      'Drive your knee straight forward over your second toe until it taps the wall.',
      'Follow with light, rhythmic pogo hops to activate Achilles tendon stiffness.'
    ],
    cuesAr: [
      'ضع أصابع قدمك على بعد 8-10 سم من الجدار مع التصاق الكعب بالأرض.',
      'ادفع ركبتك للأمام مباشرة فوق إصبع قدمك الثاني حتى تلمس الجدار.',
      'اختم بقفزات خفيفة إيقاعية على مشطي القدم لتنشيط أوتار الساق.'
    ],
    breathing: 'Exhale driving knee forward; inhale returning; light rhythmic breathing on bounces.',
    breathingAr: 'زفير مع دفع الركبة للأمام، وشهيق مع الرجوع؛ وتنفس خفيف مع القفزات.',
    iconName: 'FastForward'
  }
];

export const FULLBODY_WARMUP_SEQUENCE: WarmupMovement[] = [
  {
    id: 'full_1_worlds_greatest_stretch',
    name: "World's Greatest Stretch & T-Spine Opener",
    nameAr: 'أعظم إطالة حركية في العالم مع فتح الظهر الصدري',
    durationSeconds: 50,
    repsOrTempo: '4 - 5 reps per side alternating (25s per side)',
    repsOrTempoAr: '4 - 5 تكرارات لكل جهة بالتناوب (25 ثانية لكل جهة)',
    targetJoints: ['Hips', 'Thoracic Spine', 'Ankles', 'Shoulders'],
    targetJointsAr: ['الحوض', 'العمود الفقري الصدري', 'الكواحل', 'الكتفان'],
    targetMuscles: ['Hip Flexors', 'Hamstrings', 'Adductors', 'Thoracic Rotators'],
    targetMusclesAr: ['عضلات ثني الحوض', 'الخلفيات', 'الضامة', 'مدورات الصدر'],
    rationale: 'Simultaneously mobilizes the hips, thoracic spine, groin, and hamstrings in one total-body flow.',
    rationaleAr: 'يمرن ويطيل الحوض، والعمود الفقري الصدري، والعضلات الضامة والخلفيات في حركة شاملة واحدة.',
    cues: [
      'Step into a deep lunge with hands on the inside of your front foot.',
      'Drop your front elbow toward the floor, then rotate your arm up toward the ceiling.',
      'Keep the back leg actively locked straight.'
    ],
    cuesAr: [
      'انزل في خطوة طعن عميقة مع وضع اليدين بجانب القدم الأمامية من الداخل.',
      'أنزل كوعك الأمامي نحو الأرض ثم لفه وافتحه للأعلى نحو السقف.',
      'حافظ على استقامة الساق الخلفية مشدودة.'
    ],
    breathing: 'Inhale dropping elbow; exhale rotating up toward the sky.',
    breathingAr: 'شهيق مع نزول الكوع، وزفير مع الالتفاف للأعلى.',
    iconName: 'Sparkles'
  },
  {
    id: 'full_2_inchworm_pushup',
    name: 'Inchworm Walkouts to Push-up',
    nameAr: 'المشي بالأيدي (Inchworms) مع تمرين ضغط',
    durationSeconds: 50,
    repsOrTempo: '6 - 8 smooth walkouts',
    repsOrTempoAr: '6 - 8 تكرارات مشي سلسة',
    targetJoints: ['Wrists', 'Shoulders', 'Hips', 'Spine'],
    targetJointsAr: ['المعاصم', 'الكتفان', 'الحوض', 'العمود الفقري'],
    targetMuscles: ['Hamstrings', 'Core/Abs', 'Chest', 'Shoulders'],
    targetMusclesAr: ['الخلفيات', 'عضلات الجذع والبطن', 'الصدر', 'الكتفان'],
    rationale: 'Dynamic hamstring lengthening, core anti-extension activation, and shoulder girdle loading.',
    rationaleAr: 'إطالة ديناميكية للخلفيات، وتفعيل عضلات البطن لمنع تقوس الظهر، وتهيئة مفاصل الكتفين.',
    cues: [
      'Hinge at hips, place hands on floor with minimal knee bend.',
      'Walk hands out into a solid high plank, execute 1 smooth push-up.',
      'Walk hands back, driving heels toward the ground.'
    ],
    cuesAr: [
      'انحنِ من الحوض وضع يديك على الأرض مع أقل انثناءة في الركبتين.',
      'امشِ بيديك للأمام لوضعية البلانك العالي ونفذ تكرار ضغط سليم.',
      'امشِ بيديك للخلف مع توجيه كعبيك نحو الأرض.'
    ],
    breathing: 'Inhale walking out; exhale on the push-up; inhale walking back.',
    breathingAr: 'شهيق مع المشي للأمام، زفير مع الضغط، وشهيق مع الرجوع.',
    iconName: 'Activity'
  },
  {
    id: 'full_3_90_90_hips',
    name: '90/90 Dynamic Hip Rotations',
    nameAr: 'تبديل وضعية 90/90 لمرونة الحوض',
    durationSeconds: 50,
    repsOrTempo: '10 - 12 smooth switches',
    repsOrTempoAr: '10 - 12 تبديلة سلسة بالجلوس',
    targetJoints: ['Hip Joint'],
    targetJointsAr: ['مفصل الحوض'],
    targetMuscles: ['Glute Medius', 'Piriformis', 'Hip Rotators'],
    targetMusclesAr: ['المؤخرة الوسطى', 'العضلة الكمثرية', 'مدورات الحوض'],
    rationale: 'Frees up internal and external hip capsules.',
    rationaleAr: 'يحرر كبسولة الحوض بالكامل للدوران الداخلي والخارجي.',
    cues: [
      'Rotate knees side-to-side keeping heels grounded.',
      'Sit tall with chest proud.'
    ],
    cuesAr: [
      'بدّل ركبتيك من جانب لآخر مع تثبيت الكعبين.',
      'اجلس مستقيم الظهر وصدرك للأمام.'
    ],
    breathing: 'Rhythmic deep breathing.',
    breathingAr: 'تنفس عميق ومنتظم.',
    iconName: 'RotateCcw'
  },
  {
    id: 'full_4_glute_bridges',
    name: 'Glute Bridges with 3s Squeeze',
    nameAr: 'جسر المؤخرة مع عصر 3 ثوانٍ',
    durationSeconds: 50,
    repsOrTempo: '12 controlled reps',
    repsOrTempoAr: '12 تكراراً مضبوطاً',
    targetJoints: ['Hip Extension'],
    targetJointsAr: ['بسط الحوض'],
    targetMuscles: ['Gluteus Maximus', 'Hamstrings'],
    targetMusclesAr: ['المؤخرة الكبرى', 'الخلفيات'],
    rationale: 'Fires up posterior chain power production.',
    rationaleAr: 'يفعل عضلات السلسلة الخلفية لتوليد القوة.',
    cues: [
      'Drive through heels and squeeze glutes at the top.',
      'Avoid hyperextending lumbar spine.'
    ],
    cuesAr: [
      'ادفع من الكعبين واعصر المؤخرة في الأعلى.',
      'تجنب المبالغة في تقوس أسفل الظهر.'
    ],
    breathing: 'Exhale up, inhale down.',
    breathingAr: 'زفير للأعلى، شهيق للأسفل.',
    iconName: 'Zap'
  },
  {
    id: 'full_5_band_pull_aparts',
    name: 'Band Pull-Aparts & W-Raises',
    nameAr: 'سحب الحبل للظهر والأكتاف الخلفية',
    durationSeconds: 50,
    repsOrTempo: '15 pull-aparts',
    repsOrTempoAr: '15 سحبة خلفية',
    targetJoints: ['Shoulders', 'Scapula'],
    targetJointsAr: ['الكتفان', 'لوح الكتف'],
    targetMuscles: ['Rear Delts', 'Rhomboids', 'Rotator Cuff'],
    targetMusclesAr: ['الكتف الخلفي', 'المعينيات', 'الكفة المدورة'],
    rationale: 'Upper back and shoulder posture stabilization.',
    rationaleAr: 'تثبيت عضلات أعلى الظهر ووضعية الكتفين.',
    cues: [
      'Pinch shoulder blades together smoothly.',
      'Keep shoulders away from ears.'
    ],
    cuesAr: [
      'اضمم لوحي الكتف معاً بسلاسة.',
      'أبعد كتفيك عن أذنيك.'
    ],
    breathing: 'Exhale on pull, inhale on return.',
    breathingAr: 'زفير مع السحب، شهيق مع العودة.',
    iconName: 'Target'
  },
  {
    id: 'full_6_pogo_hops_arm_swings',
    name: 'Elastic Pogo Hops & Cross-Body Arm Swings',
    nameAr: 'قفزات مرنة على المشط مع أرجحة الذراعين',
    durationSeconds: 50,
    repsOrTempo: 'Light continuous elastic rhythm',
    repsOrTempoAr: 'إيقاع قفز خفيف ومرن مستمر',
    targetJoints: ['Ankles', 'Shoulders'],
    targetJointsAr: ['الكواحل', 'الكتفان'],
    targetMuscles: ['Calves', 'Chest', 'Upper Back', 'Cardiovascular System'],
    targetMusclesAr: ['السمانة', 'الصدر', 'أعلى الظهر', 'الجهاز القلبي الوعائي'],
    rationale: 'Elevates core body temperature, increases heart rate to 110-120 bpm, and activates the central nervous system.',
    rationaleAr: 'يرفع درجة حرارة الجسم الأساسية ومعدل نبضات القلب وينشط الجهاز العصبي المركزي قبل بدء التمرين.',
    cues: [
      'Spring lightly on balls of feet with stiff ankles.',
      'Swing arms rhythmically across chest and back.',
      'Stay relaxed and breathe deeply.'
    ],
    cuesAr: [
      'اقفز بخفة على مشطي القدمين مع ثبات الكاحل.',
      'أرجح ذراعيك بإيقاع مريح عبر الصدر وللخلف.',
      'حافظ على استرخائك وتنفس بعمق.'
    ],
    breathing: 'Deep continuous aerobic breathing.',
    breathingAr: 'تنفس هوائي عميق ومستمر.',
    iconName: 'FastForward'
  }
];

// Additional targeted muscle and joint mobilization drills
export const ADDITIONAL_TARGETED_MOVEMENTS: WarmupMovement[] = [
  {
    id: 'push_doorway_pec_stretch',
    name: 'Doorway Dynamic Pectoral Stretch & Scapular Squeeze',
    nameAr: 'إطالة ديناميكية لعضلات الصدر عند الباب مع ضم اللوحين',
    durationSeconds: 50,
    repsOrTempo: '10 pulses per side with 2-second hold',
    repsOrTempoAr: '10 نبضات لكل جانب مع ثبات لثانيتين',
    targetJoints: ['Glenohumeral (Shoulder)', 'Sternocostal (Chest wall)'],
    targetJointsAr: ['مفصل الكتف', 'القفص الصدري وعظمة القص'],
    targetMuscles: ['Chest (Pectoralis Major & Minor)', 'Anterior Deltoids'],
    targetMusclesAr: ['عضلات الصدر (الكبرى والصغرى)', 'الكتف الأمامي'],
    rationale: 'Releases pectoral tightness, opens anterior shoulder capsule, and ensures full horizontal abduction range for pressing.',
    rationaleAr: 'يحرر الشد في عضلات الصدر، ويفتح كبسولة الكتف الأمامية، ويمنحك المدى الحركي الكامل لتمارين الدفع.',
    cues: [
      'Forearm on doorframe or upright at 90 degrees; step forward gently until a deep chest stretch is felt.',
      'Do not rotate your torso aggressively; keep chest open and tall.',
      'Squeeze shoulder blades together on every rep.'
    ],
    cuesAr: [
      'ضع الساعد على حافة الباب أو القائم بزاوية 90 درجة، وتقدم بخطوة للأمام بلطف حتى تشعر بإطالة الصدر.',
      'لا تلف جذعك بعنف، بل حافظ على صدرك مرفوعاً ومفتوحاً.',
      'اضمم لوحي الكتف للخلف مع كل تكرار.'
    ],
    breathing: 'Inhale into the chest belly; exhale softly as you step into the stretch.',
    breathingAr: 'شهيق عميق يملأ الصدر، وزفير هادئ مع التقدم في الإطالة.',
    iconName: 'Maximize2',
    category: 'stretch',
    muscleTags: ['chest', 'shoulders']
  },
  {
    id: 'push_overhead_triceps_reach',
    name: 'Dynamic Overhead Triceps Reach & Lat Mobilization',
    nameAr: 'إطالة ديناميكية للترايسبس والكتف مع سحب لوح الكتف',
    durationSeconds: 50,
    repsOrTempo: '8-10 fluid overhead reaches per arm',
    repsOrTempoAr: '8-10 إطالات سلسة علوية لكل ذراع',
    targetJoints: ['Humeroulnar (Elbow)', 'Glenohumeral (Shoulder)'],
    targetJointsAr: ['مفصل الكوع', 'مفصل الكتف'],
    targetMuscles: ['Triceps (Long Head)', 'Latissimus Dorsi', 'Teres Major'],
    targetMusclesAr: ['عضلة الترايسبس (الرأس الطويل)', 'المجنص (Lats)', 'العضلة المدورة الكبيرة'],
    rationale: 'Elongates the long head of the triceps across both shoulder and elbow joints, preventing elbow tendon irritation during presses and dips.',
    rationaleAr: 'يطيل الرأس الطويل لعضلة الترايسبس عبر مفصلي الكتف والكوع، مما يقي أوتار الكوع من الالتهاب والإجهاد أثناء الدفع.',
    cues: [
      'Reach one hand behind neck toward shoulder blade; gently assist with opposite hand.',
      'Keep core braced and ribs down; avoid arching lower back.',
      'Perform gentle side-bend pulses to open up lats and triceps together.'
    ],
    cuesAr: [
      'مد إحدى يديك خلف الرقبة باتجاه لوح الكتف، واستعن باليد الأخرى برفق.',
      'ثبت عضلات بطنك ولا تدع أسفل ظهرك يتقوس.',
      'قم بانحناء جانبي خفيف مع الإطالة لفتح المجنص والترايسبس معاً.'
    ],
    breathing: 'Deep continuous breathing into lateral ribcage.',
    breathingAr: 'تنفس عميق ومستمر داخل القفص الصدري الجانبي.',
    iconName: 'Sparkles',
    category: 'mobility',
    muscleTags: ['triceps', 'lats']
  },
  {
    id: 'legs_half_kneeling_psoas',
    name: 'Half-Kneeling Dynamic Hip Flexor & Psoas Drive',
    nameAr: 'إطالة ديناميكية لنصف الجلوس للحوض وعضلة القطنية (Psoas)',
    durationSeconds: 50,
    repsOrTempo: '8 pulses + 3-second hold per side',
    repsOrTempoAr: '8 نبضات مع ثبات 3 ثوانٍ لكل جانب',
    targetJoints: ['Acetabulofemoral (Hip)', 'Sacroiliac (SI Joint)'],
    targetJointsAr: ['مفصل الحوض', 'المفصل العجزي الحرقفي'],
    targetMuscles: ['Psoas Major', 'Iliacus', 'Rectus Femoris (Quads)'],
    targetMusclesAr: ['عضلة القطنية الكبيرة (Psoas)', 'عضلة الحرقفة', 'عضلة الفخذ الأمامية المستقيمة'],
    rationale: 'Unlocks tight anterior hip flexors, restores neutral pelvic alignment, and activates glutes for deeper, safer squats.',
    rationaleAr: 'يحرر انكماش عضلات الحوض الأمامية، ويعيد استقامة الحوض الطبيعية، مما يمهد لسكوات أعمق وأكثر أماناً.',
    cues: [
      'Tuck tailbone under (posterior pelvic tilt) and squeeze back glute tight before lunging.',
      'Glide forward slightly from hips without arching lower back.',
      'Raise same-side arm overhead for an expanded fascial stretch.'
    ],
    cuesAr: [
      'شد عضلات المؤخرة الخلفية واثنِ الحوض قليلاً للداخل قبل التقدم.',
      'انزلق للأمام برفق من مفصل الحوض دون تقويس أسفل الظهر.',
      'ارفع الذراع لنفس الجانب للأعلى لتعزيز إطالة الغشاء العضلي.'
    ],
    breathing: 'Inhale tall; exhale as you slide hips forward into stretch.',
    breathingAr: 'شهيق مع الاستقامة، وزفير مع دفع الحوض للأمام في الإطالة.',
    iconName: 'Waves',
    category: 'stretch',
    muscleTags: ['hip_flexors', 'quads', 'glutes']
  },
  {
    id: 'legs_fire_hydrant_glute',
    name: 'Quadruped Fire Hydrants & Glute Medius Circles',
    nameAr: 'تمرين الإطفائي الرباعي ودوائر المؤخرة لتفعيل العضلة الوسطى',
    durationSeconds: 50,
    repsOrTempo: '10 circles forward + 10 backward each leg',
    repsOrTempoAr: '10 دوائر للأمام + 10 للخلف لكل ساق',
    targetJoints: ['Hip Capsule', 'Pelvis'],
    targetJointsAr: ['كبسولة الحوض', 'عظام الحوض'],
    targetMuscles: ['Gluteus Medius', 'Gluteus Minimus', 'Tensor Fasciae Latae'],
    targetMusclesAr: ['عضلة المؤخرة الوسطى', 'المؤخرة الصغرى', 'عضلة اللفافة العريضة'],
    rationale: 'Fires up the lateral hip stabilizers to prevent knee valgus (knees caving in) during squats, lunges, and leg presses.',
    rationaleAr: 'ينشط مثبتات الحوض الجانبية لمنع ميل الركبتين للداخل أثناء السكوات والطعنات وضغط الأرجل.',
    cues: [
      'Keep core rigid; do not let lower back or hips tilt excessively.',
      'Lift knee out to side leading with outer thigh, not ankle.',
      'Make smooth circular paths with the knee joint.'
    ],
    cuesAr: [
      'ثبت عضلات بطنك ولا تدع ظهرك يميل أو يتقوس للجانب.',
      'ارفع الركبة للجانب مع توجيه الفخذ الخارجي للأعلى.',
      'ارسم دوائر ناعمة وكاملة بمفصل الركبة.'
    ],
    breathing: 'Rhythmic, steady breathing through nose and mouth.',
    breathingAr: 'تنفس منتظم وهادئ من الأنف والفم.',
    iconName: 'Activity',
    category: 'activation',
    muscleTags: ['glutes', 'hips']
  },
  {
    id: 'core_birddog_anti_rotation',
    name: 'Bird-Dog Core Bracing & Posterior Chain Priming',
    nameAr: 'تمرين الكلب الطائر (Bird-Dog) لثبات الكور وأسفل الظهر',
    durationSeconds: 50,
    repsOrTempo: '6-8 deliberate reps per side with 3s hold',
    repsOrTempoAr: '6-8 تكرارات محكمة لكل جانب مع ثبات 3 ثوانٍ',
    targetJoints: ['Lumbar Spine', 'Glenohumeral', 'Acetabulofemoral'],
    targetJointsAr: ['الفقرات القطنية', 'مفصل الكتف', 'مفصل الفخذ'],
    targetMuscles: ['Erector Spinae', 'Gluteus Maximus', 'Transverse Abdominis', 'Multifidus'],
    targetMusclesAr: ['عضلات استقامة الظهر', 'المؤخرة الكبرى', 'عضلة البطن المستعرضة', 'العضلات متعددة الفلوق'],
    rationale: 'McGill Big 3 core exercise: locks lumbar stability, eliminates spine shear stress, and primes the nervous system for heavy compound lifts.',
    rationaleAr: 'من أهم تمارين الدكتور ماكجيل لتثبيت الفقرات القطنية، وحماية أسفل الظهر من إجهاد القص وتجهيز الجهاز العصبي للأوزان الثقيلة.',
    cues: [
      'Maintain a neutral spine; balance a glass of water on your lower back.',
      'Extend opposite arm and leg straight out without overarching lower back.',
      'Squeeze working glute at full extension for 3 seconds.'
    ],
    cuesAr: [
      'حافظ على استقامة العمود الفقري كأنك توازن كوب ماء على أسفل ظهرك.',
      'مد الذراع والساق المعاكسة في خط مستقيم دون تقويس الظهر.',
      'اعصر عضلة المؤخرة في أقصى امتداد لمدة 3 ثوانٍ كاملة.'
    ],
    breathing: 'Exhale and brace abs as limbs extend; inhale returning to center.',
    breathingAr: 'زفير مع عصر البطن عند فرد الأطراف، وشهيق مع الرجوع للمنتصف.',
    iconName: 'Shield',
    category: 'activation',
    muscleTags: ['core', 'glutes', 'spine']
  },
  {
    id: 'legs_single_leg_rdl_reach',
    name: 'Single-Leg Dynamic RDL Reach to High Knee Drive',
    nameAr: 'إطالة رومانية ديناميكية على ساق واحدة مع رفع الركبة',
    durationSeconds: 50,
    repsOrTempo: '6-8 controlled fluid reps per leg',
    repsOrTempoAr: '6-8 تكرارات انسيابية ومحكومة لكل ساق',
    targetJoints: ['Hip Hinge Complex', 'Talocrural (Ankle)'],
    targetJointsAr: ['مفصل مفصلة الحوض', 'مفصل الكاحل'],
    targetMuscles: ['Hamstrings', 'Gluteus Maximus', 'Calves & Foot Stabilizers'],
    targetMusclesAr: ['عضلات الفخذ الخلفية', 'المؤخرة الكبرى', 'السمانة ومثبتات القدم'],
    rationale: 'Primes the hip hinge motor pattern, dynamically stretches hamstrings under eccentric tension, and activates ankle stabilizers.',
    rationaleAr: 'يهيئ النمط الحركي لمفصلة الحوض (Hinge)، ويوفر إطالة ديناميكية للخلفيات تحت الشد، وينشط ثبات الكاحل.',
    cues: [
      'Soft bend in standing knee; hinge back at the hip while keeping spine flat.',
      'Reach fingertips toward mid-shin or floor as back leg floats straight behind you.',
      'Drive hips through to standing and power knee up into a tall finish.'
    ],
    cuesAr: [
      'انثناء بسيط في ركبة الارتكاز، ثم ادفع الحوض للخلف مع الحفاظ على استقامة الظهر.',
      'المس بمنتصف أصابعك الساق بينما ترتفع الساق الأخرى للخلف باستقامة.',
      'ادفع الحوض للأمام بقوة واختم برفع الركبة للأعلى باستقامة تامة.'
    ],
    breathing: 'Inhale on the hinge reach; exhale powerfully as you drive up to standing.',
    breathingAr: 'شهيق مع النزول والمفصلة، وزفير قوي مع الصعود والاستقامة.',
    iconName: 'Target',
    category: 'potentiation',
    muscleTags: ['hamstrings', 'glutes', 'ankles']
  }
];

export const WarmupEngine = {
  /**
   * Analyzes targeted muscles, joint complexes, and movement patterns from current session exercises
   */
  analyzeSessionMuscles(workout: WorkoutSession): SessionMuscleAnalysis {
    if (!workout || !workout.exercises || workout.exercises.length === 0) {
      return {
        primaryMuscles: [
          { name: 'Full Body Mobility', nameAr: 'مرونة الجسم الشاملة', count: 4, percentage: 100 }
        ],
        detectedJointComplexes: [
          { name: 'Hips & Pelvis', nameAr: 'الحوض والمفصل الفخذي' },
          { name: 'Shoulders & T-Spine', nameAr: 'الكتفان والعمود الفقري الصدري' }
        ],
        movementPatterns: ['multi_planar'],
        totalExercises: 0,
        dominantCategory: 'full_body',
        targetExerciseNames: []
      };
    }

    const muscleTally: Record<string, { count: number; nameEn: string; nameAr: string }> = {};
    const movementPatternsSet = new Set<string>();
    const targetExerciseNames: { en: string; ar: string }[] = [];

    // Tally muscles and patterns
    workout.exercises.forEach(ex => {
      const exNameEn = ex.exerciseName || '';
      const exNameAr = ex.exerciseNameAr || exNameEn;
      targetExerciseNames.push({ en: exNameEn, ar: exNameAr });

      // Match against seed data for rich anatomical info
      const matchedSeed = exerciseSeedData.find(s => 
        s.id === ex.exerciseId || 
        s.name.toLowerCase() === exNameEn.toLowerCase() ||
        exNameEn.toLowerCase().includes(s.name.toLowerCase())
      );

      if (matchedSeed) {
        if (matchedSeed.movementPattern) {
          movementPatternsSet.add(matchedSeed.movementPattern);
        }

        // Primary muscle gets weighted 2
        const pMuscle = matchedSeed.primaryMuscle || 'Full Body';
        const pMuscleAr = matchedSeed.primaryMuscleAr || pMuscle;
        const pGroup = this.normalizeMuscleGroup(pMuscle);
        if (!muscleTally[pGroup.key]) {
          muscleTally[pGroup.key] = { count: 0, nameEn: pGroup.nameEn, nameAr: pGroup.nameAr };
        }
        muscleTally[pGroup.key].count += 2;

        // Secondary muscles get weighted 1
        if (matchedSeed.secondaryMuscles && matchedSeed.secondaryMuscles.length > 0) {
          matchedSeed.secondaryMuscles.forEach((sm, i) => {
            const smAr = matchedSeed.secondaryMusclesAr?.[i] || sm;
            const smGroup = this.normalizeMuscleGroup(sm);
            if (!muscleTally[smGroup.key]) {
              muscleTally[smGroup.key] = { count: 0, nameEn: smGroup.nameEn, nameAr: smGroup.nameAr };
            }
            muscleTally[smGroup.key].count += 1;
          });
        }
      } else {
        // Fallback to exercise.primaryMuscle or workout.type
        const rawMuscle = ex.primaryMuscle || workout.type || 'Full Body';
        const norm = this.normalizeMuscleGroup(rawMuscle);
        if (!muscleTally[norm.key]) {
          muscleTally[norm.key] = { count: 0, nameEn: norm.nameEn, nameAr: norm.nameAr };
        }
        muscleTally[norm.key].count += 2;
      }
    });

    const totalWeight = Object.values(muscleTally).reduce((sum, item) => sum + item.count, 0) || 1;
    const sortedMuscles = Object.values(muscleTally)
      .sort((a, b) => b.count - a.count)
      .map(item => ({
        name: item.nameEn,
        nameAr: item.nameAr,
        count: item.count,
        percentage: Math.round((item.count / totalWeight) * 100)
      }));

    // Determine dominant category
    let dominantCategory: 'push' | 'pull' | 'legs' | 'full_body' = 'full_body';
    const rawType = (workout.type || '').toLowerCase();
    if (rawType.includes('push') || sortedMuscles.some(m => m.name.includes('Chest') && m.percentage >= 25)) {
      dominantCategory = 'push';
    } else if (rawType.includes('pull') || sortedMuscles.some(m => m.name.includes('Back') && m.percentage >= 25)) {
      dominantCategory = 'pull';
    } else if (rawType.includes('leg') || sortedMuscles.some(m => (m.name.includes('Quad') || m.name.includes('Hamstring') || m.name.includes('Glute')) && m.percentage >= 30)) {
      dominantCategory = 'legs';
    }

    // Determine detected joint complexes
    const detectedJointComplexes: { name: string; nameAr: string }[] = [];
    const hasUpperPress = sortedMuscles.some(m => ['Chest', 'Shoulders', 'Triceps'].some(k => m.name.includes(k)));
    const hasUpperPull = sortedMuscles.some(m => ['Back & Lats', 'Biceps & Forearms', 'Traps'].some(k => m.name.includes(k)));
    const hasLowerSquat = sortedMuscles.some(m => ['Quadriceps', 'Glutes', 'Calves'].some(k => m.name.includes(k)));
    const hasLowerHinge = sortedMuscles.some(m => ['Hamstrings', 'Glutes', 'Erectors'].some(k => m.name.includes(k)));

    if (hasUpperPress) {
      detectedJointComplexes.push({ name: 'Glenohumeral & Rotator Cuff', nameAr: 'مفصل الكتف الكروي والكفة المدورة' });
      detectedJointComplexes.push({ name: 'Scapulothoracic Complex', nameAr: 'لوح الكتف والقفص الصدري' });
    }
    if (hasUpperPull) {
      detectedJointComplexes.push({ name: 'Thoracic Spine Rotation', nameAr: 'العمود الفقري الصدري' });
      detectedJointComplexes.push({ name: 'Humeroulnar (Elbow) & Wrists', nameAr: 'مفاصل الكوع والمعصمين' });
    }
    if (hasLowerSquat || hasLowerHinge) {
      detectedJointComplexes.push({ name: 'Hip Capsule (90/90 Rotation)', nameAr: 'كبسولة الحوض (دوران داخلي وخارجي)' });
      detectedJointComplexes.push({ name: 'Talocrural (Ankle Dorsiflexion)', nameAr: 'الكاحل وانثناء مشط القدم' });
    }
    if (detectedJointComplexes.length === 0) {
      detectedJointComplexes.push({ name: 'Multi-Planar Joints & Core', nameAr: 'المفاصل الحركية الشاملة والجذع' });
    }

    return {
      primaryMuscles: sortedMuscles.slice(0, 5),
      detectedJointComplexes,
      movementPatterns: Array.from(movementPatternsSet),
      totalExercises: workout.exercises.length,
      dominantCategory,
      targetExerciseNames: targetExerciseNames.slice(0, 4)
    };
  },

  /**
   * Helper to normalize raw muscle strings into standardized categories
   */
  normalizeMuscleGroup(raw: string): { key: string; nameEn: string; nameAr: string } {
    const s = raw.toLowerCase();
    if (s.includes('chest') || s.includes('pectoral') || s.includes('بنش') || s.includes('صدر')) {
      return { key: 'chest', nameEn: 'Chest (Pectorals)', nameAr: 'الصدر (البكتورال)' };
    }
    if (s.includes('delt') || s.includes('shoulder') || s.includes('كتف')) {
      return { key: 'shoulders', nameEn: 'Deltoids & Rotators', nameAr: 'الأكتاف والكفة المدورة' };
    }
    if (s.includes('tricep') || s.includes('تراي')) {
      return { key: 'triceps', nameEn: 'Triceps', nameAr: 'الترايسبس' };
    }
    if (s.includes('lat') || s.includes('back') || s.includes('ظهر') || s.includes('مجنص') || s.includes('rhomboid')) {
      return { key: 'back', nameEn: 'Back & Lats', nameAr: 'الظهر والمجنص' };
    }
    if (s.includes('bicep') || s.includes('forearm') || s.includes('باي') || s.includes('ساعد')) {
      return { key: 'arms', nameEn: 'Biceps & Forearms', nameAr: 'البايسبس والساعدين' };
    }
    if (s.includes('quad') || s.includes('فخذ أمامي')) {
      return { key: 'quads', nameEn: 'Quadriceps', nameAr: 'الفخذ الأمامي (الكوادس)' };
    }
    if (s.includes('hamstring') || s.includes('خلفيات') || s.includes('فخذ خلفي')) {
      return { key: 'hamstrings', nameEn: 'Hamstrings', nameAr: 'الفخذ الخلفي (الهامسترنغ)' };
    }
    if (s.includes('glute') || s.includes('مؤخرة') || s.includes('حوض')) {
      return { key: 'glutes', nameEn: 'Glutes & Hips', nameAr: 'المؤخرة ومحيط الحوض' };
    }
    if (s.includes('calf') || s.includes('calves') || s.includes('سمانة') || s.includes('كاحل')) {
      return { key: 'calves', nameEn: 'Calves & Ankles', nameAr: 'السمانة والكواحل' };
    }
    if (s.includes('core') || s.includes('ab') || s.includes('بطن') || s.includes('جذع')) {
      return { key: 'core', nameEn: 'Core & Stabilizers', nameAr: 'الكور والمثبتات' };
    }
    return { key: 'general', nameEn: 'General Musculature', nameAr: 'عضلات حركية عامة' };
  },

  /**
   * Generates a fully dynamic, personalized warm-up sequence tailored directly to the specific
   * muscles and exercises in the active workout session.
   */
  generateDynamicWarmup(workout: WorkoutSession, options?: WarmupGenerationOptions): WarmupSequence {
    const isAr = options?.isAr ?? false;
    const durationMinutes = options?.durationMinutes ?? 5;
    const focusMode = options?.focusMode ?? 'balanced';
    const stiffAreas = options?.stiffAreas ?? [];

    const analysis = this.analyzeSessionMuscles(workout);
    const exercisesListEn = analysis.targetExerciseNames.map(e => e.en).join(', ') || workout.name;
    const exercisesListAr = analysis.targetExerciseNames.map(e => e.ar).join('، ') || (workout.nameAr || workout.name);

    // Combine standard sequence pool and new targeted drills
    const allCandidateMovements: WarmupMovement[] = [
      ...PUSH_WARMUP_SEQUENCE,
      ...PULL_WARMUP_SEQUENCE,
      ...LEGS_WARMUP_SEQUENCE,
      ...FULLBODY_WARMUP_SEQUENCE,
      ...ADDITIONAL_TARGETED_MOVEMENTS
    ];

    // Determine target movement count based on duration
    // 3 min = 4 movements (~45s each = 180s)
    // 5 min = 6 movements (~50s each = 300s)
    // 8 min = 8 movements (~60s each = 480s)
    const targetCount = durationMinutes === 3 ? 4 : durationMinutes === 8 ? 8 : 6;
    const movementDuration = durationMinutes === 3 ? 45 : durationMinutes === 8 ? 60 : 50;

    // Movement selection scoring
    const scoredMovements: { movement: WarmupMovement; score: number }[] = [];
    const usedIds = new Set<string>();

    allCandidateMovements.forEach(m => {
      // Deduplicate by normalized name
      const normName = m.name.toLowerCase();
      if (usedIds.has(normName)) return;
      usedIds.add(normName);

      let score = 10; // base score

      // Match against session's primary muscles
      analysis.primaryMuscles.forEach(pm => {
        const pmKey = pm.name.toLowerCase();
        const matchesMuscle = m.targetMuscles.some(tm => tm.toLowerCase().includes(pmKey)) ||
          m.targetMusclesAr.some(tma => pm.nameAr && tma.includes(pm.nameAr));

        if (matchesMuscle) {
          score += pm.percentage * 2; // high priority if heavy in workout
        }
      });

      // Match category preference
      if (focusMode === 'mobility' && (m.category === 'mobility' || m.targetJoints.length > 0)) {
        score += 25;
      } else if (focusMode === 'activation' && (m.category === 'activation' || m.id.includes('bridge') || m.id.includes('band') || m.id.includes('hydrant'))) {
        score += 25;
      } else if (focusMode === 'stretching' && (m.category === 'stretch' || m.id.includes('stretch'))) {
        score += 25;
      }

      // Stiff area booster overrides
      if (stiffAreas.includes('shoulders') && (m.targetJoints.some(j => j.toLowerCase().includes('shoulder')) || m.targetMuscles.some(tm => tm.toLowerCase().includes('delt')))) {
        score += 40;
      }
      if (stiffAreas.includes('hips') && (m.targetJoints.some(j => j.toLowerCase().includes('hip')) || m.targetMuscles.some(tm => tm.toLowerCase().includes('glute')))) {
        score += 40;
      }
      if (stiffAreas.includes('lower_back') && (m.targetJoints.some(j => j.toLowerCase().includes('spine')) || m.targetMuscles.some(tm => tm.toLowerCase().includes('erector') || tm.toLowerCase().includes('spine')))) {
        score += 40;
      }
      if (stiffAreas.includes('ankles') && m.targetJoints.some(j => j.toLowerCase().includes('ankle'))) {
        score += 40;
      }
      if (stiffAreas.includes('wrists') && (m.targetJoints.some(j => j.toLowerCase().includes('wrist')) || m.id.includes('wrist'))) {
        score += 40;
      }

      // Check dominant category affinity
      if (analysis.dominantCategory === 'push' && PUSH_WARMUP_SEQUENCE.some(p => p.id === m.id)) {
        score += 20;
      } else if (analysis.dominantCategory === 'pull' && PULL_WARMUP_SEQUENCE.some(p => p.id === m.id)) {
        score += 20;
      } else if (analysis.dominantCategory === 'legs' && LEGS_WARMUP_SEQUENCE.some(p => p.id === m.id)) {
        score += 20;
      }

      scoredMovements.push({ movement: m, score });
    });

    // Sort by highest score
    scoredMovements.sort((a, b) => b.score - a.score);

    // Pick top unique movements and format duration
    const selected = scoredMovements.slice(0, targetCount).map(({ movement }) => {
      // Dynamic tailored rationale linking specifically to today's session exercises
      const dynamicRationaleEn = `${movement.rationale} Directly prepares your joints for ${exercisesListEn || 'today’s key movements'}.`;
      const dynamicRationaleAr = `${movement.rationaleAr} يجهز مفاصلك وعضلاتك مباشرة لأداء ${exercisesListAr || 'تمارين جلستك اليوم'} بكفاءة وأمان.`;

      return attachMediaToMovement({
        ...movement,
        durationSeconds: movementDuration,
        rationale: dynamicRationaleEn,
        rationaleAr: dynamicRationaleAr
      });
    });

    // Build title and subtitle
    const durationLabelEn = `${durationMinutes}-Minute`;
    const durationLabelAr = `${durationMinutes} دقائق`;
    const topMusclesEn = analysis.primaryMuscles.slice(0, 3).map(m => m.name.split(' ')[0]).join(' & ');
    const topMusclesAr = analysis.primaryMuscles.slice(0, 3).map(m => m.nameAr.split(' ')[0]).join(' و');

    return {
      workoutType: (analysis.dominantCategory || 'custom') as any,
      title: `${durationLabelEn} Dynamic ${topMusclesEn ? topMusclesEn + ' ' : ''}Warm-up`,
      titleAr: `الإحماء الديناميكي الذكي (${durationLabelAr}) • ${topMusclesAr || 'مخصص للجلسة'}`,
      subtitle: `Targeted mobility & activation sequence tailored to ${workout.exercises.length} exercises in ${workout.name}.`,
      subtitleAr: `سلسلة حركية وإطالات ديناميكية مهيأة خصيصاً لـ ${workout.exercises.length} تمارين في ${workout.nameAr || workout.name}.`,
      totalDurationSeconds: durationMinutes * 60,
      focusMuscles: analysis.primaryMuscles.map(m => m.name),
      focusMusclesAr: analysis.primaryMuscles.map(m => m.nameAr),
      primaryObjective: `Maximize motor unit recruitment and synovial lubrication for ${exercisesListEn}.`,
      primaryObjectiveAr: `تليين المفاصل بالمدى الحركي الكامل وتنشيط الجهاز العصبي لتمارين: ${exercisesListAr}.`,
      movements: selected,
      targetedSessionExercises: analysis.targetExerciseNames.map(e => isAr ? e.ar : e.en),
      detectedJointComplexes: analysis.detectedJointComplexes.map(j => j.name),
      detectedJointComplexesAr: analysis.detectedJointComplexes.map(j => j.nameAr),
      muscleDistribution: analysis.primaryMuscles.map(m => ({
        muscle: m.name,
        muscleAr: m.nameAr,
        count: m.count,
        percentage: m.percentage
      }))
    };
  },

  /**
   * Generates the tailored 5-minute (300s) sequence based on workout type (backward compatibility)
   */
  getWarmupSequence(typeInput?: string, isAr: boolean = false): WarmupSequence {
    const rawType = (typeInput || 'push').toLowerCase().trim();

    if (rawType.includes('push') || rawType.includes('chest') || rawType.includes('shoulder')) {
      return {
        workoutType: 'push',
        title: '5-Minute Smart Push Warm-up',
        titleAr: 'الإحماء الذكي لجلسة الدفع (5 دقائق)',
        subtitle: 'Shoulder capsule lubrication, T-spine extension, serratus & rotator cuff activation',
        subtitleAr: 'تليين كبسولة الكتف، مرونة الظهر الصدري، وتفعيل الكفة المدورة والمنشارية',
        totalDurationSeconds: 300,
        focusMuscles: ['Chest', 'Shoulders', 'Triceps', 'Rotator Cuff', 'Serratus Anterior'],
        focusMusclesAr: ['الصدر', 'الأكتاف', 'الترايسبس', 'الكفة المدورة', 'العضلة المنشارية'],
        primaryObjective: 'Maximize pressing power, eliminate anterior shoulder pinch, and stabilize the scapula under heavy loads.',
        primaryObjectiveAr: 'مضاعفة قوة الدفع، منع احتكاك وتر الكتف، وتثبيت لوح الكتف بأمان تحت الأوزان العالية.',
        movements: PUSH_WARMUP_SEQUENCE.map(attachMediaToMovement)
      };
    }

    if (rawType.includes('pull') || rawType.includes('back') || rawType.includes('lat')) {
      return {
        workoutType: 'pull',
        title: '5-Minute Smart Pull Warm-up',
        titleAr: 'الإحماء الذكي لجلسة السحب (5 دقائق)',
        subtitle: 'Spinal decompression, lat neuromuscular recruitment, T-spine rotation & wrist prep',
        subtitleAr: 'إلغاء ضغط الفقرات، تفعيل المجنص عصبياً، مرونة الصدر الصدري وتهيئة المعاصم',
        totalDurationSeconds: 300,
        focusMuscles: ['Lats', 'Rhomboids', 'Rear Delts', 'Erector Spinae', 'Forearms'],
        focusMusclesAr: ['المجنص (Lats)', 'المعينيات', 'الكتف الخلفي', 'عضلات استقامة الظهر', 'الساعدين'],
        primaryObjective: 'Unlock full lat engagement, protect elbow tendons, and stabilize the posterior chain for heavy rows.',
        primaryObjectiveAr: 'تفعيل أقصى انقباض للمجنص، حماية أوتار الكوع والمعصم، وتثبيت السلسلة الخلفية للتجديف الثقيل.',
        movements: PULL_WARMUP_SEQUENCE.map(attachMediaToMovement)
      };
    }

    if (rawType.includes('leg') || rawType.includes('squat') || rawType.includes('lower')) {
      return {
        workoutType: 'legs',
        title: '5-Minute Smart Legs Warm-up',
        titleAr: 'الإحماء الذكي لجلسة الأرجل (5 دقائق)',
        subtitle: 'Hip capsule 90/90 mobility, adductor opening, glute activation & ankle dorsiflexion',
        subtitleAr: 'مرونة كبسولة الحوض 90/90، فتح العضلات الضامة، تفعيل المؤخرة ومرونة الكاحل',
        totalDurationSeconds: 300,
        focusMuscles: ['Quads', 'Hamstrings', 'Glutes', 'Adductors', 'Ankles & Calves'],
        focusMusclesAr: ['الفخذ الأمامي', 'الخلفيات', 'المؤخرة', 'العضلات الضامة', 'الكواحل والسمانة'],
        primaryObjective: 'Achieve rock-solid squat depth, protect knee joints, and fire up glute torque production.',
        primaryObjectiveAr: 'تحقيق أقصى عمق وثبات في السكوات، حماية مفصل الركبة، وتوليد أعلى عزم وقوة من المؤخرة والحوض.',
        movements: LEGS_WARMUP_SEQUENCE.map(attachMediaToMovement)
      };
    }

    // Default / Full Body / Rest Active
    return {
      workoutType: 'full_body',
      title: '5-Minute Smart Dynamic Warm-up',
      titleAr: 'الإحماء الذكي الديناميكي الشامل (5 دقائق)',
      subtitle: 'Multi-planar mobilization, core priming, and central nervous system activation',
      subtitleAr: 'مرونة حركية شاملة، تهيئة عضلات الجذع، وتنشيط الجهاز العصبي المركزي',
      totalDurationSeconds: 300,
      focusMuscles: ['Full Body Hips', 'Spine', 'Shoulders', 'Core', 'Cardiovascular'],
      focusMusclesAr: ['الحوض بالكامل', 'العمود الفقري', 'الكتفان', 'الكور والبطن', 'الجهاز الدوري'],
      primaryObjective: 'Elevate core temperature and prepare all primary joints for high performance.',
      primaryObjectiveAr: 'رفع درجة حرارة الجسم وتجهيز جميع المفاصل الرئيسية للأداء الرياضي العالي.',
      movements: FULLBODY_WARMUP_SEQUENCE.map(attachMediaToMovement)
    };
  }
};
