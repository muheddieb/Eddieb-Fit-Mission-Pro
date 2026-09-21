import { PrescribedRecoverySession } from '../types';

export const RECOVERY_ROUTINES_LIBRARY: PrescribedRecoverySession[] = [
  // ==================== YOGA SESSIONS ====================
  {
    id: 'yoga-push-chest-shoulder-open',
    title: 'Chest & Anterior Shoulder Opening Yin Yoga',
    titleAr: 'يوغا الاسترخاء لفتح الصدر والأكتاف الأمامية',
    category: 'yoga',
    categoryLabel: 'Yin Yoga Flow',
    categoryLabelAr: 'تدفق يوغا الاسترخاء',
    durationMinutes: 12,
    intensityLevel: 'restorative',
    matchReason: 'Calibrated to release shortened pectorals and anterior deltoids loaded in heavy push pressing.',
    matchReasonAr: 'مصممة خصيصاً لإطالة عضلات الصدر والكتف الأمامي المشدودة نتيجة تمارين الدفع الثقيلة.',
    targetMuscles: ['Pectoralis Major & Minor', 'Anterior Deltoids', 'Biceps Tendons', 'Thoracic Spine'],
    targetMusclesAr: ['عضلات الصدر الكبرى والصغرى', 'الكتف الأمامي', 'أوتار البايسبس', 'الفقرات الصدرية'],
    description: 'A soothing restorative Yin sequence focusing on passive gravity holds that decompress the anterior shoulder capsule and thoracic cavity.',
    descriptionAr: 'جلسة يوغا مهدئة تركز على إطالات ساكنة بتأثير الجاذبية لإزالة الضغط عن مفصل الكتف والقفص الصدري.',
    poses: [
      {
        id: 'y_pu_1',
        name: 'Extended Puppy Pose (Uttana Shishosana)',
        nameAr: 'وضعية الجرو الممدد (تحرير الصدر والأكتاف)',
        durationSeconds: 90,
        instructions: 'From hands and knees, walk hands forward, melting your chest toward the mat while keeping hips stacked directly over knees.',
        instructionsAr: 'من وضعية اليدين والركبتين، تقدم بيديك للأمام مع إنزال صدرك بهدوء نحو الأرض، مع الحفاظ على الحوض فوق الركبتين مباشرة.',
        cues: [
          'Keep your forehead or chin grounded',
          'Feel the anterior shoulder capsule opening gently',
          'Inhale deeply into the back ribs, exhale to sink lower'
        ],
        cuesAr: [
          'حافظ على ملامسة الجبهة أو الذقن للأرض',
          'اشعر بانفتاح محفظة الكتف الأمامية برفق',
          'تنفس بعمق في الضلوع الخلفية، وازفر للاسترخاء نحو الأسفل'
        ],
        targetMuscles: ['Chest', 'Shoulders', 'Upper Back'],
        targetMusclesAr: ['الصدر', 'الأكتاف', 'أعلى الظهر'],
        breathingPace: 'slow_parasympathetic',
        iconType: 'shoulders',
      },
      {
        id: 'y_pu_2',
        name: 'Gentle Sphinx to Cobra Flow (Bhujangasana)',
        nameAr: 'تدفق أبو الهول إلى الكوبرا الهادئ',
        durationSeconds: 90,
        instructions: 'Lie prone, elbows beneath shoulders, draw chest through arm portals. Press palms gently to lift elbows slightly without lumbar pinch.',
        instructionsAr: 'استلقِ على بطنك مع المرفقين تحت الكتفين، اسحب صدرك للأمام بين الذراعين واضغط برفق لرفع المرفقين دون ضغط على أسفل الظهر.',
        cues: [
          'Depress shoulder blades down toward back pockets',
          'Lengthen cervical spine without hyper-extending neck',
          'Keep glutes softly engaged to stabilize sacrum'
        ],
        cuesAr: [
          'أنزل لوحي الكتف لأسفل باتجاه الجيوب الخلفية',
          'حافظ على استقامة الرقبة دون رفع مبالغ فيه للرأس',
          'فعل عضلات المؤخرة برفق لتثبيت الحوض'
        ],
        targetMuscles: ['Thoracic Spine', 'Anterior Core', 'Pectorals'],
        targetMusclesAr: ['الفقرات الصدرية', 'عضلات البطن الأمامية', 'الصدر'],
        breathingPace: 'deep_belly',
        iconType: 'spine',
      },
      {
        id: 'y_pu_3',
        name: 'Open Arm Prone Chest Opener (Scorpion Stretch)',
        nameAr: 'إطالة الصدر المنبطحة بالذراع المفتوحة',
        durationSeconds: 120,
        bilateral: true,
        sideSwitchSeconds: 60,
        instructions: 'Lie face down, extend right arm 90 degrees flat on floor. Roll body gently onto right hip, stepping left foot behind for support.',
        instructionsAr: 'استلقِ على بطنك، وافرد ذراعك اليمنى بزاوية 90 درجة على الأرض. در بجسمك برفق على وركك الأيمن وضع قدمك اليسرى خلفك للتوازن.',
        cues: [
          'Keep right palm firmly rooted to anchor pectoral insertion',
          'Breathe into the front right shoulder without forcing',
          'Switch sides smoothly when prompted'
        ],
        cuesAr: [
          'ثبت كف اليد في الأرض لتثبيت نقطة ارتكاز عضلة الصدر',
          'تنفس بهدوء في مقدمة الكتف دون أي حركة مفاجئة',
          'بدل إلى الجانب الآخر بنعومة عند التنبيه'
        ],
        targetMuscles: ['Pectoralis Major', 'Anterior Deltoid', 'Biceps Brachii'],
        targetMusclesAr: ['الصدر الكبير', 'الكتف الأمامي', 'عضلة البايسبس'],
        breathingPace: 'slow_parasympathetic',
        iconType: 'shoulders',
      },
      {
        id: 'y_pu_4',
        name: 'Supported Fish Pose / Heart Opener (Matsyasana)',
        nameAr: 'وضعية السمكة المدعومة (انفتاح القلب والقفص الصدري)',
        durationSeconds: 120,
        instructions: 'Recline with a rolled yoga mat, foam roller, or folded towel beneath upper back/shoulder blades, letting head and arms fall open to sides.',
        instructionsAr: 'استلقِ للخلف مع وضع منشفة ملفوفة أو فوم رولر أسفل لوحي الكتف، واترك رأسك وذراعيك تسترخي مفتوحة للجانبين.',
        cues: [
          'Allow collarbones to widen naturally with each breath',
          'Unclench jaw and release tension in front of the neck',
          'Surrender chest weight to gravity'
        ],
        cuesAr: [
          'اترك الترقوة تتسع بشكل طبيعي مع كل زفير',
          'ارخِ الفك وتخلص من أي توتر في مقدمة الرقبة',
          'استسلم لوزن الصدر واسترخِ بالكامل'
        ],
        targetMuscles: ['Pectoralis Minor', 'Intercostals', 'Sternocleidomastoid'],
        targetMusclesAr: ['الصدر الصغير', 'عضلات القفص الصدري', 'عضلات الرقبة الأمامية'],
        breathingPace: 'slow_parasympathetic',
        iconType: 'yoga',
      },
    ],
  },
  {
    id: 'yoga-legs-posterior-hip-relief',
    title: 'Deep Hip & Hamstring Decompression Yoga',
    titleAr: 'يوغا فك ضغط الحوض والأوتار بعد تمارين الأرجل',
    category: 'yoga',
    categoryLabel: 'Restorative Vinyasa',
    categoryLabelAr: 'يوغا استشفائية للأرجل',
    durationMinutes: 15,
    intensityLevel: 'deep_release',
    matchReason: 'Prescribed to release gluteal tightness, adductors, and lumbar compression after high-volume leg loading.',
    matchReasonAr: 'موصوفة خصيصاً لإزالة التصلب العضلي في الأرداف وأوتار الركبة بعد أحمال تمرين الأرجل العالية.',
    targetMuscles: ['Gluteus Medius & Maximus', 'Hamstrings', 'Hip Flexors / Psoas', 'Lower Back / QL'],
    targetMusclesAr: ['الأرداف الكبرى والوسطى', 'أوتار الركبة الخلفية', 'عضلات الحوض والبسواس', 'أسفل الظهر'],
    description: 'Targeted pelvic restoration sequence designed to restore hip internal-external rotation, stretch tight hamstrings, and decompress the sacrum.',
    descriptionAr: 'تسلسل علاجي دقيق لإعادة التوازن الحركي لمفصل الورك وإطالة الأوتار المشدودة بعد السكوات والرفعة الميتة.',
    poses: [
      {
        id: 'y_leg_1',
        name: 'Sleeping Pigeon Pose (Eka Pada Rajakapotasana)',
        nameAr: 'وضعية الحمام المسترخي (تحرير عميق للأرداف)',
        durationSeconds: 150,
        bilateral: true,
        sideSwitchSeconds: 75,
        instructions: 'Bring front knee toward same-side wrist, shin angled comfortably. Extend back leg straight behind, square hips, and fold torso forward over shin.',
        instructionsAr: 'اجلب الركبة الأمامية نحو معصم اليد بنفس الجانب، ومد الساق الخلفية باستقامة. وازن الحوض وانحنِ بجذعك للأمام فوق الساق.',
        cues: [
          'Keep front foot softly dorsiflexed to protect knee',
          'Avoid dumping all weight into outer hip; maintain level hips',
          'Long, oceanic exhalations into deep gluteal rotators'
        ],
        cuesAr: [
          'اثنِ مشط القدم الأمامية برفق لحماية مفصل الركبة',
          'لا تمِل بالكامل لجانب واحد، بل حافظ على توازن الحوض',
          'أخرج زفيراً بطيئاً وعميقاً نحو عمق عضلات الإلية'
        ],
        targetMuscles: ['Piriformis', 'Gluteus Medius', 'Hip Capsule'],
        targetMusclesAr: ['العضلة الكمثرية', 'الأرداف الجانبية', 'محفظة مفصل الورك'],
        breathingPace: 'slow_parasympathetic',
        iconType: 'hips',
      },
      {
        id: 'y_leg_2',
        name: 'Lizard Pose (Utthan Pristhasana)',
        nameAr: 'وضعية السحلية (تمدد عضلات الحوض والضامة)',
        durationSeconds: 120,
        bilateral: true,
        sideSwitchSeconds: 60,
        instructions: 'From low lunge, place both hands inside front foot. Lower back knee to mat or untuck toes. Lower onto elbows or stay on palms as hips sink.',
        instructionsAr: 'من وضعية الاندفاع المنخفض، ضع كلتا اليدين بالداخل من القدم الأمامية، وأنزل الركبة الخلفية للأرض واترك الحوض يهبط لأسفل.',
        cues: [
          'Keep front knee tracking in line with second toe',
          'Feel the trailing hip flexor and lead adductor opening',
          'Lengthen through the crown of your head'
        ],
        cuesAr: [
          'حافظ على مسار الركبة الأمامية في نفس اتجاه أصابع القدم',
          'اشعر بانفتاح عضلات الحوض الخلفية والضامة الأمامية',
          'حافظ على استقامة العمود الفقري'
        ],
        targetMuscles: ['Psoas', 'Hip Flexors', 'Adductors'],
        targetMusclesAr: ['عضلة البسواس', 'عضلات الورك الحابسة', 'العضلات الضامة'],
        breathingPace: 'deep_belly',
        iconType: 'hips',
      },
      {
        id: 'y_leg_3',
        name: 'Half Monkey Pose (Ardha Hanumanasana)',
        nameAr: 'نصف وضعية القرد (إطالة أوتار الركبة الخلفية)',
        durationSeconds: 120,
        bilateral: true,
        sideSwitchSeconds: 60,
        instructions: 'Shift hips back over back knee, straighten front leg, flex front toes toward face. Hinge from hips with flat back over front thigh.',
        instructionsAr: 'ارجع بالحوض للخلف فوق الركبة الخلفية، وافرد الساق الأمامية واثنِ أصابع قدمك نحوك. انحنِ من الوركين مع ظهر مستقيم.',
        cues: [
          'Do not round lumbar spine; lead with chest toward toes',
          'Micro-bend front knee if hamstrings are extremely tight',
          'Drive front heel down and pull back hip slightly'
        ],
        cuesAr: [
          'تجنب تقوس أسفل الظهر، وقُد الحركة بصدرك نحو القدم',
          'اثنِ الركبة انثناءً بسيطاً إذا كانت الأوتار مشدودة جداً',
          'اغرس الكعب في الأرض واسحب الورك قليلاً للخلف'
        ],
        targetMuscles: ['Biceps Femoris', 'Semitendinosus', 'Calves'],
        targetMusclesAr: ['أوتار الركبة الخلفية', 'العضلة نصف وترية', 'السمانة'],
        breathingPace: 'slow_parasympathetic',
        iconType: 'stretch',
      },
      {
        id: 'y_leg_4',
        name: 'Reclined Supine Twist (Supta Matsyendrasana)',
        nameAr: 'الالتواء المستلقي (فك ضغط الفقرات القطنية)',
        durationSeconds: 120,
        bilateral: true,
        sideSwitchSeconds: 60,
        instructions: 'Lie on back, hug right knee into chest, then guide it across body to the left. Extend right arm to side and gaze right.',
        instructionsAr: 'استلقِ على ظهرك، واسحب الركبة اليمنى إلى صدرك، ثم وجهها عبر جسمك إلى اليسار وافرد ذراعك اليمنى وانظر إليها.',
        cues: [
          'Keep both shoulder blades anchored to floor',
          'Allow spinal rotation to happen passively with gravity',
          'Deep breath into belly to massage internal organs and lumbar muscles'
        ],
        cuesAr: [
          'حافظ على ملامسة لوحي الكتف للأرض بالكامل',
          'اترك الالتواء يحدث بتأثير الجاذبية والراحة',
          'تنفس بعمق في البطن لتدليك عضلات أسفل الظهر'
        ],
        targetMuscles: ['Quadratus Lumborum', 'Gluteal Complex', 'Spine'],
        targetMusclesAr: ['عضلات أسفل الظهر', 'مجمع الأرداف', 'العمود الفقري'],
        breathingPace: 'slow_parasympathetic',
        iconType: 'spine',
      },
    ],
  },
  {
    id: 'yoga-pull-spine-decompression',
    title: 'Spinal Decompression & Lat Release Yoga',
    titleAr: 'يوغا فك ضغط العمود الفقري واستطالة المجنص',
    category: 'yoga',
    categoryLabel: 'Spine Alignment Flow',
    categoryLabelAr: 'تدفق محاذاة العمود الفقري',
    durationMinutes: 10,
    intensityLevel: 'restorative',
    matchReason: 'Calibrated to restore spinal disc hydration and relax compressed erectors & latissimus after pulling volume.',
    matchReasonAr: 'مخصصة لترطيب أقراص العمود الفقري وفك تشنج عضلات الظهر المنتصبة والمجنص بعد تمارين السحب الثقيلة.',
    targetMuscles: ['Latissimus Dorsi', 'Erector Spinae', 'Rhomboids', 'Posterior Deltoids'],
    targetMusclesAr: ['عضلات المجنص (اللاتس)', 'عضلات الظهر المنتصبة', 'العضلات المعينية', 'الكتف الخلفي'],
    description: 'Gentle spinal elongation flow that counteracts axial compressive fatigue from deadlifts, rows, and heavy pulldowns.',
    descriptionAr: 'تدفق حركي ناعم لإعادة استطالة العمود الفقري وإلغاء الضغط المحوري الناتج عن التجديف والرفعات.',
    poses: [
      {
        id: 'y_pu_sp_1',
        name: 'Cat-Cow Dynamic Breath Waves (Marjaryasana-Bitilasana)',
        nameAr: 'موجات التنفس بين القطة والبقرة (مرونة الفقرات)',
        durationSeconds: 90,
        instructions: 'On hands and knees, inhale to arch spine and lift gaze (Cow). Exhale to dome back, tuck tailbone, and press floor away (Cat).',
        instructionsAr: 'على اليدين والركبتين، استنشق مع تقويس الظهر ورفع النظر (البقرة)، وازفر مع تقبيب الظهر وإدخال الرأس للداخل (القطة).',
        cues: [
          'Initiate movement from the tailbone, ripple up to neck',
          'Synchronize movement completely with slow nasal breath',
          'Push actively through knuckles to relieve wrist pressure'
        ],
        cuesAr: [
          'ابدأ الحركة من عظمة العصعص ودعها تمتد كالتموج حتى الرقبة',
          'طابق الحركة تماماً مع الشهيق والزفير الأنفي البطيء',
          'اضغط بقوة بكفوف اليدين لحماية المعصمين'
        ],
        targetMuscles: ['Spine Articulation', 'Core', 'Thoracic Mobility'],
        targetMusclesAr: ['مفاصل العمود الفقري', 'عضلات الجذع', 'مرونة الفقرات الصدرية'],
        breathingPace: 'rhythmic',
        iconType: 'spine',
      },
      {
        id: 'y_pu_sp_2',
        name: 'Lateral Child’s Pose with Lat Reach (Balasana)',
        nameAr: 'وضعية الطفل الجانبية لإطالة المجنص',
        durationSeconds: 120,
        bilateral: true,
        sideSwitchSeconds: 60,
        instructions: 'From Child’s Pose, walk both hands diagonally to the left corner of mat. Plant right hand, push right hip back to stretch right side body.',
        instructionsAr: 'من وضعية الطفل، سر بيديك قطرياً إلى الزاوية اليسرى من البساط. ثبت يدك اليمنى وادفع وركك الأيمن للخلف لإطالة الجانب الأيمن.',
        cues: [
          'Anchor the opposite sitting bone down toward heel',
          'Breathe directly into the expanding rib cage and lats',
          'Feel the line from right wrist all the way down to hip crest'
        ],
        cuesAr: [
          'ثبت عظمة الجلوس المعاكسة نحو الكعب دون أن ترتفع',
          'تنفس مباشرة في جانب القفص الصدري والمجنص الممتد',
          'اشعر بخط التمدد الكامل من المعصم حتى عظم الحوض'
        ],
        targetMuscles: ['Latissimus Dorsi', 'Teres Major', 'Intercostals'],
        targetMusclesAr: ['عضلة المجنص', 'العضلة المدورة الكبيرة', 'عضلات القفص الصدري الجانبية'],
        breathingPace: 'slow_parasympathetic',
        iconType: 'stretch',
      },
      {
        id: 'y_pu_sp_3',
        name: 'Thread the Needle Pose (Parsva Balasana)',
        nameAr: 'وضعية إدخال الخيط في الإبرة (استرخاء أعلى الظهر)',
        durationSeconds: 120,
        bilateral: true,
        sideSwitchSeconds: 60,
        instructions: 'From table pose, slide right arm underneath body along floor with palm up. Rest right temple and shoulder softly on mat.',
        instructionsAr: 'من وضعية الطاولة، مرر ذراعك اليمنى تحت جسمك على الأرض مع راحة اليد لأعلى، وأرح كتفك الأيمن وصدغك على الأرض.',
        cues: [
          'Allow the weight of head and shoulder to settle comfortably',
          'Feel the space between the spine and right shoulder blade open',
          'Soft, rhythmic breath into upper dorsal thoracic spine'
        ],
        cuesAr: [
          'اترك وزن الرأس والكتف يستقر براحة تامة على الأرض',
          'اشعر بالمساحة بين العمود الفقري ولوح الكتف تنفتح بنعومة',
          'تنفس بهدوء في أعلى الظهر وأنسجة الرقبة'
        ],
        targetMuscles: ['Rhomboids', 'Posterior Deltoids', 'Trapezius'],
        targetMusclesAr: ['العضلات المعينية', 'الكتف الخلفي', 'عضلات الترابيس'],
        breathingPace: 'slow_parasympathetic',
        iconType: 'shoulders',
      },
    ],
  },
  {
    id: 'yoga-cns-parasympathetic-restorative',
    title: 'Parasympathetic Down-Regulation Yin Yoga',
    titleAr: 'يوغا تهدئة الجهاز العصبي والإنعاش الشامل',
    category: 'yoga',
    categoryLabel: 'Nervous System Recovery',
    categoryLabelAr: 'استشفاء الجهاز العصبي المركزي',
    durationMinutes: 15,
    intensityLevel: 'restorative',
    matchReason: 'Indicated for high cumulative strain across multiple consecutive workouts to lower cortisol and reboot HRV.',
    matchReasonAr: 'موصوفة عند تراكم الإجهاد التدريبي لخفض هرمون الكورتيزول وتنشيط الجهاز العصبي الباراسمبثاوي ورفع الـ HRV.',
    targetMuscles: ['Full Body Restorative', 'Central Nervous System', 'Diaphragm', 'Pelvic Floor'],
    targetMusclesAr: ['استشفاء كامل للجسم', 'الجهاز العصبي المركزي', 'الحجاب الحاجز', 'قاع الحوض'],
    description: 'A deeply meditative, ground-based passive routine designed to activate the vagus nerve and transition the body into deep anabolic recovery.',
    descriptionAr: 'جلسة استرخاء عميقة على الأرض مصممة لتنشيط العصب الحائر ونقل الجسم إلى حالة البناء والاستشفاء الفائق.',
    poses: [
      {
        id: 'y_cns_1',
        name: 'Legs Up The Wall Pose (Viparita Karani)',
        nameAr: 'وضعية رفع الساقين على الحائط (تفريغ حمض اللاكتيك)',
        durationSeconds: 180,
        instructions: 'Sit sideways against a wall, swing legs up against wall, and lie back with arms resting palms up by your sides.',
        instructionsAr: 'اجلس بمحاذاة الحائط، وارفع ساقيك للأعلى مستندتين على الجدار، واستلقِ على ظهرك مع فتح الذراعين للأعلى.',
        cues: [
          'Facilitates venous return and drains lymphatic fluid from legs',
          'Drop resting heart rate and relax lower back muscles against floor',
          'Breathe 4 seconds in through nose, 7 seconds exhale through mouth'
        ],
        cuesAr: [
          'تساعد على العود الوريدي وتصريف السوائل واللاكتيك من الأرجل',
          'تخفض معدل نبضات القلب وتريح عضلات أسفل الظهر تماماً',
          'تنفس: 4 ثوان شهيق من الأنف، و7 ثوان زفير هادئ من الفم'
        ],
        targetMuscles: ['Hamstrings', 'Venous Drainage', 'Lumbar Spine'],
        targetMusclesAr: ['أوتار الركبة', 'التصريف الوريدي والليمفاوي', 'الفقرات القطنية'],
        breathingPace: 'slow_parasympathetic',
        iconType: 'yoga',
      },
      {
        id: 'y_cns_2',
        name: 'Reclined Butterfly Pose (Supta Baddha Konasana)',
        nameAr: 'وضعية الفراشة المستلقية (استرخاء الحوض والتنفس البطني)',
        durationSeconds: 180,
        instructions: 'Lie on back, bring soles of feet together, and let knees fall naturally open to the sides. Rest one hand on heart, one on belly.',
        instructionsAr: 'استلقِ على ظهرك، وضع باطن القدمين معاً، واترك الركبتين تنفتحان للخارج بحرية. ضع يداً على صدرك ويداً على بطنك.',
        cues: [
          'Allow gravity to passively stretch adductors with zero force',
          'Notice your belly rise on inhale and fall on exhale',
          'Release any clenching in the jaw, eyes, and pelvic floor'
        ],
        cuesAr: [
          'اترك الجاذبية تمدد العضلات الضامة بنعومة دون أي شد',
          'اشعر بارتفاع البطن مع الشهيق وانخفاضه مع الزفير',
          'تخلص من أي ضغط في الفك أو العينين أو الحوض'
        ],
        targetMuscles: ['Adductors', 'Psoas', 'Diaphragm'],
        targetMusclesAr: ['العضلات الضامة', 'البسواس', 'الحجاب الحاجز'],
        breathingPace: 'slow_parasympathetic',
        iconType: 'hips',
      },
      {
        id: 'y_cns_3',
        name: 'Corpse Pose with Diaphragmatic Cadence (Savasana)',
        nameAr: 'وضعية السافاسانا مع تنفس الحجاب الحاجز العميق',
        durationSeconds: 180,
        instructions: 'Lie flat on back with legs hip-width apart and arms relaxed at sides. Close eyes and mentally scan body from toes to head, releasing all tension.',
        instructionsAr: 'استلقِ ممدداً على ظهرك، وباعد بين القدمين بعرض الحوض مع إرخاء الذراعين. أغمض عينيك ومرر انتباهك على جسدك بالكامل لإزالة التوتر.',
        cues: [
          'Completely quiet the body; zero muscular effort',
          'Allow the nervous system to absorb the benefits of training',
          'Every exhale carries away residual metabolic fatigue'
        ],
        cuesAr: [
          'سكون تام للجسد، بدون أي مجهود عضلي',
          'دع الجهاز العصبي يبدأ عمليات البناء وإعادة شحن الطاقة',
          'كل زفير يطرد التعب والإجهاد المتبقي من التدريب'
        ],
        targetMuscles: ['Full Body Relaxation', 'Vagus Nerve Activation'],
        targetMusclesAr: ['استرخاء الجسم بالكامل', 'تنشيط العصب الحائر'],
        breathingPace: 'slow_parasympathetic',
        iconType: 'yoga',
      },
    ],
  },

  // ==================== MOBILITY SESSIONS ====================
  {
    id: 'mobility-shoulder-t-spine',
    title: 'Thoracic Spine & Glenohumeral Rotational Mobility',
    titleAr: 'مرونة الفقرات الصدرية ومحفظة مفصل الكتف الدائرية',
    category: 'mobility',
    categoryLabel: 'Joint Mobility',
    categoryLabelAr: 'مرونة المفاصل والحركة',
    durationMinutes: 10,
    intensityLevel: 'moderate',
    matchReason: 'Calibrated to prevent shoulder impingement and restore thoracic rotation after upper body compound pressing & rowing.',
    matchReasonAr: 'مخصصة للوقاية من متلازمة اصطدام الكتف واستعادة الدوران الصدري بعد تمارين الصدر والظهر المركبة.',
    targetMuscles: ['Thoracic Spine', 'Rotator Cuff (Infraspinatus, Teres Minor)', 'Serratus Anterior'],
    targetMusclesAr: ['الفقرات الصدرية', 'الكفة المدورة (عضلات تدوير الكتف)', 'العضلة المنشارية الأمامية'],
    description: 'Dynamic joint lubrication sequence designed to restore pain-free overhead mechanics and scapular glide.',
    descriptionAr: 'تسلسل ديناميكي لتزييت المفاصل واستعادة المدى الحركي الكامل للأكتاف وانزلاق لوح الكتف دون ألم.',
    poses: [
      {
        id: 'm_sh_1',
        name: 'Quadruped Thoracic Rotations (Thread & Reach)',
        nameAr: 'الدوران الصدري من وضعية الطاولة (فتح القفص الصدري)',
        durationSeconds: 90,
        bilateral: true,
        sideSwitchSeconds: 45,
        instructions: 'On hands and knees, place one hand behind head. Rotate elbow down toward opposite wrist, then flare elbow up toward ceiling, tracking with eyes.',
        instructionsAr: 'على اليدين والركبتين، ضع يداً خلف رأسك. أنزل الكوع نحو المعصم المقابل، ثم افتح الكوع للأعلى باتجاه السقف مع متابعته بعينيك.',
        cues: [
          'Keep hips perfectly still; rotation must come strictly from mid-back',
          'Exhale as you rotate open to maximize thoracic extension',
          'Perform 8-10 controlled smooth reps per side'
        ],
        cuesAr: [
          'حافظ على ثبات الحوض تماماً، واجعل الدوران نابعاً من منتصف الظهر',
          'أخرج الزفير مع الصعود للأعلى لتحقيق أقصى مدى حركي',
          'قم بأداء 8-10 تكرارات محكومة وسلسة لكل جانب'
        ],
        targetMuscles: ['Thoracic Spine', 'Rhomboids', 'Posterior Deltoids'],
        targetMusclesAr: ['الفقرات الصدرية', 'العضلات المعينية', 'الكتف الخلفي'],
        breathingPace: 'rhythmic',
        iconType: 'mobility',
      },
      {
        id: 'm_sh_2',
        name: 'Floor Wall-Angels / Scapular Glides',
        nameAr: 'تمرين ملائكة الأرض (انزلاق لوح الكتف وثبات الكفة)',
        durationSeconds: 90,
        instructions: 'Lie on back, knees bent. Place elbows and backs of wrists in contact with floor in a 90-degree goalpost. Slowly slide arms overhead without lifting wrists.',
        instructionsAr: 'استلقِ على ظهرك مع ثني الركبتين. ضع المرفقين وظهر المعصمين ملامسين للأرض بزاوية 90 درجة، ثم حركهما ببطء للأعلى دون أن يرتفع المعصمان.',
        cues: [
          'Press lower back firmly into floor; do not flare ribs',
          'Keep wrists and elbows pinned to ground throughout full range',
          'Pause 2 seconds at the top of the glide'
        ],
        cuesAr: [
          'ثبت أسفل الظهر بالأرض دون تقوس في القفص الصدري',
          'حافظ على ملامسة المعصمين والمرفقين للأرض طوال الحركة',
          'اثبت لثانيتين في أعلى نقطة قبل النزول المحكوم'
        ],
        targetMuscles: ['Serratus Anterior', 'Lower Trapezius', 'External Rotators'],
        targetMusclesAr: ['المنشارية الأمامية', 'الترابيس السفلية', 'العضلات المدورة الخارجية'],
        breathingPace: 'rhythmic',
        iconType: 'shoulders',
      },
      {
        id: 'm_sh_3',
        name: 'Prone Shoulder Dislocates with Towel / Band',
        nameAr: 'دوران الأكتاف المنبطح بالمنشفة أو الباند',
        durationSeconds: 90,
        instructions: 'Lie face down holding a towel or band wider than shoulder-width. Keeping arms straight, lift hands and circle them back toward hips, then return.',
        instructionsAr: 'استلقِ على بطنك ممسكاً بمنشفة أو باند بمسافة أعرض من الكتفين، ومع استقامة الذراعين ارفعهما ومررهما للخلف نحو الأرداف ثم عُد ببطء.',
        cues: [
          'Keep forehead resting lightly on floor',
          'Move slowly with continuous muscular tension, never jerky',
          'Widen grip if you feel any joint pinching'
        ],
        cuesAr: [
          'أبقِ الجبهة ملامسة للأرض برفق',
          'تحرك ببطء وتحكم تام دون أي حركات سريعة مفاجئة',
          'وسع المسافة بين يديك إذا شعرت بأي وخز في المفصل'
        ],
        targetMuscles: ['Glenohumeral Joint', 'Rotator Cuff', 'Pectorals'],
        targetMusclesAr: ['محفظة مفصل الكتف', 'الكفة المدورة', 'الصدر'],
        breathingPace: 'rhythmic',
        iconType: 'mobility',
      },
    ],
  },
  {
    id: 'mobility-hip-ankle-lower-chain',
    title: 'Hip Capsule & Ankle Dorsiflexion Kinetic Mobility',
    titleAr: 'مرونة محفظة الورك وكاحل القدم للسلسلة الحركية السفلية',
    category: 'mobility',
    categoryLabel: 'Joint Mobility',
    categoryLabelAr: 'مرونة المفاصل والحركة',
    durationMinutes: 12,
    intensityLevel: 'moderate',
    matchReason: 'Calibrated to unlock deep squat depth, hip rotation, and ankle dorsiflexion following heavy lower body sessions.',
    matchReasonAr: 'مخصصة لفتح عمق السكوات، وزيادة مرونة دوران مفصل الورك والكاحل بعد تمارين الأرجل الشاقة.',
    targetMuscles: ['Hip Capsule (Internal & External)', 'Talocrural Ankle Joint', 'Adductors', 'Psoas'],
    targetMusclesAr: ['محفظة الورك (الدوران الداخلي والخارجي)', 'مفصل الكاحل', 'العضلات الضامة', 'عضلات الحوض'],
    description: 'Clinical mobility sequence combining 90/90 transitions, combat ankle mobilizations, and deep squat holds.',
    descriptionAr: 'جلسة مرونة حركية مدروسة تجمع بين تبديل الـ 90/90، وتحرير وتر أخيل، وتثبيت قاع السكوات.',
    poses: [
      {
        id: 'm_hip_1',
        name: '90/90 Hip Switches with Active Torso Lean',
        nameAr: 'تبديل الحوض 90/90 مع الانحناء الإيجابي',
        durationSeconds: 120,
        bilateral: true,
        sideSwitchSeconds: 60,
        instructions: 'Sit on floor with both legs bent at 90-degree angles. Lean torso with flat back over front shin for 5 seconds, then lift and rotate knees to other side.',
        instructionsAr: 'اجلس على الأرض مع ثني كلتا الساقين بزاوية 90 درجة. انحنِ بجذعك مستقيماً فوق الساق الأمامية 5 ثوان، ثم ارفع ركبتيك وبدلهما للجانب الآخر.',
        cues: [
          'Drive front knee and ankle down into the floor',
          'Avoid rounding the lower back during the forward hinge',
          'Feel deep internal rotation on trailing hip and external on leading hip'
        ],
        cuesAr: [
          'اضغط بالركبة والكاحل الأمامي نحو الأرض لتفعيل المفصل',
          'تجنب تقوس أسفل الظهر عند الانحناء للأمام',
          'اشعر بالدوران الداخلي للورك الخلفي والخارجي للورك الأمامي'
        ],
        targetMuscles: ['Hip Internal Rotators', 'Gluteus Medius', 'Joint Capsule'],
        targetMusclesAr: ['مدورات الورك الداخلية', 'الأرداف الوسطى', 'محفظة المفصل'],
        breathingPace: 'rhythmic',
        iconType: 'hips',
      },
      {
        id: 'm_hip_2',
        name: 'Half-Kneeling Ankle Dorsiflexion Rockers',
        nameAr: 'تحرير مرونة الكاحل من وضعية نصف الركوع',
        durationSeconds: 90,
        bilateral: true,
        sideSwitchSeconds: 45,
        instructions: 'In a half-kneeling stance, place hands on front knee. Drive knee forward tracking past second toe while keeping front heel firmly glued to the floor.',
        instructionsAr: 'في وضعية نصف الركوع، ضع يديك على الركبة الأمامية وادفعها للأمام متجاوزة أصابع القدم مع الحفاظ على الكعب مغروساً بالكامل في الأرض.',
        cues: [
          'Never let the heel peel off the ground',
          'Hold end-range dorsiflexion for 3 seconds each rep',
          'Apply gentle bodyweight pressure over knee'
        ],
        cuesAr: [
          'لا تسمح للكعب بالارتفاع عن الأرض نهائياً',
          'اثبت في أقصى مدى لـ 3 ثوان في كل تكرار',
          'اضغط بوزن جسمك بلطف فوق الركبة'
        ],
        targetMuscles: ['Soleus', 'Achilles Tendon', 'Ankle Joint Capsule'],
        targetMusclesAr: ['العضلة النعلية', 'وتر أخيل', 'محفظة مفصل الكاحل'],
        breathingPace: 'rhythmic',
        iconType: 'mobility',
      },
      {
        id: 'm_hip_3',
        name: 'Deep Combat Squat with Thoracic Pry',
        nameAr: 'جلسة القرفصاء العميقة مع فتح الركبتين بالكوعين',
        durationSeconds: 90,
        instructions: 'Drop into the bottom of a deep squat, elbows inside knees, hands in prayer. Press elbows out into knees while lifting chest tall.',
        instructionsAr: 'انزل إلى أقصى عمق في السكوات، وضع المرفقين داخل الركبتين، واضغط بهما للخارج لفتح الحوض مع رفع الصدر لأعلى.',
        cues: [
          'Distribute weight evenly between heels and mid-foot',
          'Lengthen spine; avoid slouching',
          'Shift weight gently side-to-side to mobilize ankles and hips'
        ],
        cuesAr: [
          'وزع وزنك بالتساوي بين الكعبين ومنتصف القدم',
          'افرد ظهرك بالكامل وتجنب الانحناء المترهل',
          'انقل وزنك بلطف يميناً ويساراً لزيادة مرونة الكاحلين'
        ],
        targetMuscles: ['Adductors', 'Hip Capsule', 'Ankles', 'Thoracic Spine'],
        targetMusclesAr: ['العضلات الضامة', 'محفظة الورك', 'الكاحلين', 'الفقرات الصدرية'],
        breathingPace: 'deep_belly',
        iconType: 'hips',
      },
    ],
  },

  // ==================== STRETCHING PROTOCOLS ====================
  {
    id: 'stretching-push-anterior-chain',
    title: 'Anterior Kinetic Chain & Pectoral Static Stretch',
    titleAr: 'إطالات ساكنة للصدر والكتف الأمامي والبايسبس',
    category: 'stretching',
    categoryLabel: 'Targeted Static Stretch',
    categoryLabelAr: 'إطالات ساكنة مستهدفة',
    durationMinutes: 8,
    intensityLevel: 'moderate',
    matchReason: 'Calibrated to reset muscle resting length and alleviate post-workout chest and tricep stiffness.',
    matchReasonAr: 'مخصصة لإعادة الطول الطبيعي للألياف العضلية وتخفيف التصلب بعد تمارين الصدر والترايسبس.',
    targetMuscles: ['Pectoralis Major & Minor', 'Anterior Deltoid', 'Triceps Brachii', 'Biceps Tendons'],
    targetMusclesAr: ['الصدر الكبرى والصغرى', 'الكتف الأمامي', 'الترايسبس', 'أوتار البايسبس'],
    description: 'Direct static holds designed to reduce DOMS (Delayed Onset Muscle Soreness) and maintain posture after pressing sessions.',
    descriptionAr: 'إطالات ساكنة دقيقة لتقليل آلام العضلات المتأخرة وتحسين استقامة القامة بعد تدريبات الدفع.',
    poses: [
      {
        id: 's_pu_1',
        name: 'Doorway Single-Arm Pec Stretch (90-Degree Angle)',
        nameAr: 'إطالة الصدر في إطار الباب (زاوية 90 درجة)',
        durationSeconds: 90,
        bilateral: true,
        sideSwitchSeconds: 45,
        instructions: 'Place forearm against a doorframe at 90 degrees. Step forward with inside leg until you feel a comfortable stretch across the chest.',
        instructionsAr: 'ضع ساعدك على إطار الباب بزاوية 90 درجة، وتقدم بخطوة للأمام بالقدم الداخلية حتى تشعر بإطالة مريحة في الصدر.',
        cues: [
          'Do not twist spine excessively; keep torso facing forward',
          'Keep shoulder packed down away from ear',
          'Hold static with smooth deep nasal breathing'
        ],
        cuesAr: [
          'لا تلف العمود الفقري بشكل مبالغ فيه، واجعل جذعك متجهاً للأمام',
          'أنزل الكتف بعيداً عن الأذن',
          'اثبت في وضع الإطالة مع تنفس أنفي هادئ وعميق'
        ],
        targetMuscles: ['Pectoralis Major', 'Anterior Deltoid'],
        targetMusclesAr: ['الصدر الكبير', 'الكتف الأمامي'],
        breathingPace: 'slow_parasympathetic',
        iconType: 'stretch',
      },
      {
        id: 's_pu_2',
        name: 'Overhead Triceps & Latissimus Static Stretch',
        nameAr: 'إطالة الترايسبس والمجنص فوق الرأس',
        durationSeconds: 90,
        bilateral: true,
        sideSwitchSeconds: 45,
        instructions: 'Raise one arm overhead and bend elbow so hand touches upper back. Use opposite hand to gently draw elbow back and across.',
        instructionsAr: 'ارفع ذراعاً فوق رأسك واثنِ الكوع لتلامس يدك أعلى ظهرك، واستخدم اليد المعاكسة لسحب الكوع بلطف للخلف والداخل.',
        cues: [
          'Stand tall with ribs locked down; avoid arching lower back',
          'Gently nudge elbow further as muscles relax on exhalation',
          'Maintain relaxed neck and jaw'
        ],
        cuesAr: [
          'قف مستقيماً مع تثبيت القفص الصدري ودون تقوس أسفل الظهر',
          'اسحب الكوع برفق أكبر كلما استرخت العضلة مع الزفير',
          'حافظ على استرخاء الرقبة والفك'
        ],
        targetMuscles: ['Triceps Long Head', 'Latissimus Dorsi', 'Teres Major'],
        targetMusclesAr: ['الرأس الطويل للترايسبس', 'المجنص', 'العضلة المدورة'],
        breathingPace: 'slow_parasympathetic',
        iconType: 'stretch',
      },
      {
        id: 's_pu_3',
        name: 'Cross-Body Posterior Deltoid & Capsule Stretch',
        nameAr: 'إطالة الكتف الخلفي والمحفظة عبر الجسم',
        durationSeconds: 90,
        bilateral: true,
        sideSwitchSeconds: 45,
        instructions: 'Bring one arm straight across chest at shoulder height. Use other forearm to hug arm close to chest while keeping shoulder down.',
        instructionsAr: 'مرر ذراعك باستقامة عبر صدرك بمستوى الكتف، واستخدم ساعدك الآخر لضم الذراع لصدرك مع خفض الكتف لأسفل.',
        cues: [
          'Depress shoulder blade down before pulling across',
          'Feel stretch behind shoulder joint capsule',
          'Keep breathing steady and unhurried'
        ],
        cuesAr: [
          'أنزل لوح الكتف لأسفل قبل سحب الذراع للداخل',
          'اشعر بالتمدد خلف مفصل الكتف',
          'حافظ على تنفس هادئ ومنتظم'
        ],
        targetMuscles: ['Posterior Deltoid', 'Infraspinatus', 'Rhomboids'],
        targetMusclesAr: ['الكتف الخلفي', 'عضلات الكفة المدورة', 'العضلات المعينية'],
        breathingPace: 'slow_parasympathetic',
        iconType: 'shoulders',
      },
    ],
  },
  {
    id: 'stretching-legs-hips-chain',
    title: 'Posterior & Anterior Lower Chain Deep Static Stretch',
    titleAr: 'إطالات ساكنة عميقة لسلسلة الأرجل والحوض الأمامية والخلفية',
    category: 'stretching',
    categoryLabel: 'Targeted Static Stretch',
    categoryLabelAr: 'إطالات ساكنة مستهدفة',
    durationMinutes: 10,
    intensityLevel: 'deep_release',
    matchReason: 'Calibrated to decompress quads, hip flexors, and hamstrings after heavy squats, leg presses, or deadlifts.',
    matchReasonAr: 'مخصصة لفك الضغط عن عضلات الفخذ الأمامية والخلفية والحوض بعد السكوات والضغط والرفعات.',
    targetMuscles: ['Quadriceps / Rectus Femoris', 'Psoas / Iliopsoas', 'Hamstrings', 'Gastrocnemius & Soleus'],
    targetMusclesAr: ['الفخذ الأمامي', 'عضلات الحوض والبسواس', 'أوتار الركبة الخلفية', 'السمانة'],
    description: 'Comprehensive static protocol targeting the major prime movers of the lower body to restore resting muscle tone.',
    descriptionAr: 'بروتوكول إطالات شامل يستهدف العضلات المحركة الرئيسية للأرجل لاستعادة المرونة وتجنب الشد العضلي.',
    poses: [
      {
        id: 's_leg_1',
        name: 'Kneeling Couch / Quad Stretch (Wall or Mat)',
        nameAr: 'إطالة الكاوتش العميقة للفخذ الأمامي والورك',
        durationSeconds: 120,
        bilateral: true,
        sideSwitchSeconds: 60,
        instructions: 'Place back knee on mat with rear foot elevated on a wall or bench. Step other foot forward into a lunge and bring torso upright.',
        instructionsAr: 'ضع الركبة الخلفية على البساط مع رفع مشط القدم على حائط أو مقعد، وتقدم بالقدم الأخرى في وضع الاندفاع وارفع جذعك للأعلى.',
        cues: [
          'Squeeze the glute on the rear leg to deepen hip flexor stretch',
          'Tuck tailbone slightly to prevent hyperextending lumbar spine',
          'Breathe deeply into front of hip and rectus femoris'
        ],
        cuesAr: [
          'شد عضلات المؤخرة للساق الخلفية لتعميق الإطالة في الحوض',
          'ادخل الحوض للداخل برفق لحماية أسفل الظهر من التقوس',
          'تنفس بعمق في مقدمة الفخذ والورك'
        ],
        targetMuscles: ['Rectus Femoris', 'Iliopsoas', 'Tensor Fasciae Latae'],
        targetMusclesAr: ['الفخذ المستقيم الأمامي', 'البسواس', 'اللفافة العريضة'],
        breathingPace: 'slow_parasympathetic',
        iconType: 'hips',
      },
      {
        id: 's_leg_2',
        name: 'Seated Hamstring & Calves Single-Leg Stretch',
        nameAr: 'إطالة أوتار الركبة والسمانة في وضعية الجلوس',
        durationSeconds: 120,
        bilateral: true,
        sideSwitchSeconds: 60,
        instructions: 'Sit on floor, extend one leg forward, and tuck sole of other foot against inner thigh. Hinge forward from hips toward extended foot.',
        instructionsAr: 'اجلس على الأرض، ومد ساقاً للأمام مع وضع باطن القدم الأخرى ملامساً للفخذ الداخلي، وانحنِ من الحوض نحو القدم الممدودة.',
        cues: [
          'Flex toes of extended leg backward toward shins',
          'Keep chest proud and back long rather than rounding neck',
          'Exhale to surrender deeper into the hamstring'
        ],
        cuesAr: [
          'اثنِ أصابع القدم الممدودة للخلف باتجاه الساق',
          'حافظ على استقامة الظهر والصدر بدلاً من تقويس الرقبة',
          'أخرج الزفير للاسترخاء بشكل أعمق في الأوتار'
        ],
        targetMuscles: ['Hamstrings', 'Gastrocnemius', 'Erector Spinae'],
        targetMusclesAr: ['أوتار الركبة', 'عضلة السمانة', 'عضلات الظهر السفلية'],
        breathingPace: 'slow_parasympathetic',
        iconType: 'stretch',
      },
      {
        id: 's_leg_3',
        name: 'Standing Wall Calf Gastrocnemius / Soleus Stretch',
        nameAr: 'إطالة السمانة ووتر أخيل على الحائط',
        durationSeconds: 90,
        bilateral: true,
        sideSwitchSeconds: 45,
        instructions: 'Stand facing a wall with hands on wall. Step one leg back straight with heel firmly grounded on floor. Lean forward from ankles.',
        instructionsAr: 'قف مواجهاً للحائط واضعاً يديك عليه، وأرجع ساقاً للخلف مع تثبيت الكعب بالكامل على الأرض، وانحنِ بجسمك للأمام من الكاحل.',
        cues: [
          'Keep rear foot pointed directly forward, not flared out',
          'Keep back knee completely straight for gastrocnemius, slight bend for soleus',
          'Feel the calf muscle and Achilles tendon decompress'
        ],
        cuesAr: [
          'اجعل أصابع القدم الخلفية متجهة للأمام مباشرة دون انحراف',
          'حافظ على استقامة ركبة الساق الخلفية',
          'اشعر بانفتاح عضلة السمانة ووتر أخيل'
        ],
        targetMuscles: ['Gastrocnemius', 'Soleus', 'Achilles Tendon'],
        targetMusclesAr: ['السمانة السطحية', 'العضلة النعلية', 'وتر أخيل'],
        breathingPace: 'rhythmic',
        iconType: 'stretch',
      },
    ],
  },
  {
    id: 'stretching-pull-upper-back',
    title: 'Posterior Chain, Lats & Upper Back Static Relief',
    titleAr: 'إطالات ساكنة للظهر واللاتس والترابيس',
    category: 'stretching',
    categoryLabel: 'Targeted Static Stretch',
    categoryLabelAr: 'إطالات ساكنة مستهدفة',
    durationMinutes: 8,
    intensityLevel: 'moderate',
    matchReason: 'Calibrated to release latissimus dorsi, rhomboids, and cervical/trapezius tightness from pulling exercises.',
    matchReasonAr: 'مخصصة لتخفيف توتر المجنص وعضلات أعلى الظهر والترابيس بعد تمارين السحب والظهر.',
    targetMuscles: ['Latissimus Dorsi', 'Rhomboids', 'Trapezius (Upper & Mid)', 'Posterior Deltoid'],
    targetMusclesAr: ['المجنص', 'العضلات المعينية', 'الترابيس العلوية والوسطى', 'الكتف الخلفي'],
    description: 'Targeted static stretching sequence to release the grip, lats, and mid-back after pulling loads.',
    descriptionAr: 'تسلسل إطالات ساكنة مركز لتحرير عضلات السحب والمجنص وأعلى الظهر بعد أوزان الظهر الثقيلة.',
    poses: [
      {
        id: 's_pu_bk_1',
        name: 'Doorframe Single-Arm Lat Hang & Pelvic Drop',
        nameAr: 'إطالة المجنص على إطار الباب مع نزول الحوض',
        durationSeconds: 90,
        bilateral: true,
        sideSwitchSeconds: 45,
        instructions: 'Grip a doorframe or sturdy post at shoulder height with one hand. Push hips back and drop torso, letting bodyweight hang into the lat.',
        instructionsAr: 'امسك إطار باب أو عمود ثابت بمستوى الكتف بيد واحدة، وادفع حوضك للخلف وانزل بجذعك تاركاً وزن جسمك يمدد المجنص.',
        cues: [
          'Let shoulder blade elevate passively as you sit back',
          'Breathe deeply into the side ribs and armpit area',
          'Do not hold your breath; relax into the hanging tension'
        ],
        cuesAr: [
          'اترك لوح الكتف يرتفع للأعلى بحرية مع رجوع الحوض للخلف',
          'تنفس بعمق في جانب القفص الصدري ومنطقة الإبط',
          'لا تكتم نفسك واستسلم للإطالة المعلقة بارتياح'
        ],
        targetMuscles: ['Latissimus Dorsi', 'Teres Major', 'Posterior Deltoid'],
        targetMusclesAr: ['المجنص', 'العضلة المدورة', 'الكتف الخلفي'],
        breathingPace: 'slow_parasympathetic',
        iconType: 'stretch',
      },
      {
        id: 's_pu_bk_2',
        name: 'Standing Clasp Upper Back / Rhomboid Stretch',
        nameAr: 'تشبيك اليدين لإطالة أعلى الظهر والمعينيات',
        durationSeconds: 75,
        instructions: 'Interlace fingers in front of chest, palms facing inward or outward. Push hands forward while rounding upper back and tucking chin.',
        instructionsAr: 'شبك أصابع يديك أمام صدرك، وادفع يديك للأمام بقوة مع تقويس أعلى الظهر وإنزال الذقن نحو الصدر.',
        cues: [
          'Imagine wrapping your arms around a large barrel',
          'Separate shoulder blades as far apart as possible',
          'Breathe into the space between the shoulder blades'
        ],
        cuesAr: [
          'تخيل أنك تحتضن برميلاً كبيراً بذراعيك',
          'باعد بين لوحي الكتف إلى أقصى مسافة ممكنة',
          'تنفس في المساحة بين لوحي الكتف'
        ],
        targetMuscles: ['Rhomboids', 'Middle Trapezius', 'Thoracic Erector Spinae'],
        targetMusclesAr: ['العضلات المعينية', 'الترابيس الوسطى', 'عضلات الظهر المنتصبة'],
        breathingPace: 'slow_parasympathetic',
        iconType: 'spine',
      },
      {
        id: 's_pu_bk_3',
        name: 'Standing Upper Trapezius & Levator Scapulae Stretch',
        nameAr: 'إطالة الترابيس العلوية وعضلات الرقبة الجانبية',
        durationSeconds: 90,
        bilateral: true,
        sideSwitchSeconds: 45,
        instructions: 'Stand tall, place left hand behind lower back. Rest right hand gently over left ear and allow head to tilt softly to the right shoulder.',
        instructionsAr: 'قف مستقيماً، وضع يدك اليسرى خلف أسفل ظهرك، وضع يدك اليمنى برفق فوق أذنك اليسرى ودع رأسك يميل بنعومة نحو الكتف الأيمن.',
        cues: [
          'Do NOT pull hard with hand; hand weight alone is sufficient',
          'Depress the opposite shoulder downward',
          'Slightly rotate chin downward toward armpit for levator scapulae'
        ],
        cuesAr: [
          'لا تشد رأسك بقوة باليد، فوزن اليد وحده كافٍ تماماً',
          'أنزل الكتف المعاكس لأسفل لزيادة التمدد',
          'وجه ذقنك قليلاً للأسفل نحو الإبط لإطالة رافعة لوح الكتف'
        ],
        targetMuscles: ['Upper Trapezius', 'Levator Scapulae', 'Sternocleidomastoid'],
        targetMusclesAr: ['الترابيس العلوية', 'رافعة لوح الكتف', 'عضلات الرقبة الجانبية'],
        breathingPace: 'slow_parasympathetic',
        iconType: 'stretch',
      },
    ],
  },
];
