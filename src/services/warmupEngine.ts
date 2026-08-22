/**
 * Smart Warm-up Engine
 * Science-based, 5-minute dynamic warm-up sequence generator tailored to workout type (Push, Pull, Legs, Full Body)
 * Single Source of Truth for Pre-Workout Dynamic Mobilization & Neuromuscular Priming
 */

export interface WarmupMovement {
  id: string;
  name: string;
  nameAr: string;
  durationSeconds: number; // typically 50 seconds (6 movements * 50s = 300s = 5 mins)
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
}

export interface WarmupSequence {
  workoutType: 'push' | 'pull' | 'legs' | 'full_body' | 'general';
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  totalDurationSeconds: number; // 300 seconds = 5 minutes
  focusMuscles: string[];
  focusMusclesAr: string[];
  primaryObjective: string;
  primaryObjectiveAr: string;
  movements: WarmupMovement[];
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

export const WarmupEngine = {
  /**
   * Generates the tailored 5-minute (300s) sequence based on workout type
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
        movements: PUSH_WARMUP_SEQUENCE
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
        movements: PULL_WARMUP_SEQUENCE
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
        movements: LEGS_WARMUP_SEQUENCE
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
      movements: FULLBODY_WARMUP_SEQUENCE
    };
  }
};
