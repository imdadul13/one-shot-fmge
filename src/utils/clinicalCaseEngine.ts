import { ClinicalCaseItem, TopicClinicalCasesDeck, TopicLearningContext } from '../types';
import { getTopicLearningContext } from './topicIntelligence';
import { shuffleQuestionOptions } from './practiceSessionEngine';
import { getMedicalTopicKnowledge } from './topicKnowledgeBase';
import { filterTopicSafeContent } from './contentValidator';

export const VERIFIED_TOPIC_CLINICAL_CASES: Record<string, Array<Omit<ClinicalCaseItem, 'id' | 'options' | 'correctOptionId' | 'correctAnswer'> & { options: Array<{ key: string; text: string; isCorrect: boolean }> }>> = {
  // Anatomy - Knee Joint & Nerve Lesions
  'anat-4': [
    {
      caseNumber: 1,
      title: 'Acute Valgus Blow with Joint Swelling in a Football Athlete',
      patientDemographics: '22-year-old collegiate football player',
      presentation: 'Presented to the emergency clinic immediately following a tackle where another player crashed into the lateral aspect of his planted right knee. He heard an audible "pop" followed by severe pain and rapid joint swelling within 2 hours.',
      physicalExamOrLabs: 'Marked knee hemarthrosis. Lachman test demonstrates 8 mm anterior tibial displacement with a soft endpoint compared to the contralateral normal knee. McMurray test produces a painful click on external rotation with valgus stress.',
      diagnosticQuestion: 'Which triad of anatomical structures is classically injured in this high-energy trauma mechanism?',
      options: [
        { key: 'A', text: 'Anterior Cruciate Ligament (ACL), Medial Collateral Ligament (MCL), and Medial Meniscus', isCorrect: true },
        { key: 'B', text: 'Posterior Cruciate Ligament (PCL), Lateral Collateral Ligament (LCL), and Lateral Meniscus', isCorrect: false },
        { key: 'C', text: 'Patellar tendon, Popliteus tendon, and Plantaris', isCorrect: false },
        { key: 'D', text: 'Anterior Cruciate Ligament (ACL), Iliotibial band, and Biceps femoris', isCorrect: false },
      ],
      clinicalExplanation: 'This is O\'Donoghue\'s Unholy Triad. A violent valgus blow to a planted, flexed knee ruptures the MCL first, followed by tearing of the ACL and Medial Meniscus (due to its firm attachment to the deep fibers of the MCL).',
      examPearl: 'Unholy Triad = ACL + MCL + Medial Meniscus. Lachman Test is the most sensitive physical examination test for ACL integrity (tested at 20-30° flexion).',
      focusArea: 'Trauma Biomechanics & Physical Maneuvers',
    },
    {
      caseNumber: 2,
      title: 'Post-Traumatic Foot Drop Following Motorcycle Spill',
      patientDemographics: '29-year-old male motorcyclist',
      presentation: 'Brought to emergency after a low-speed skidding collision resulting in direct blunt impact to the proximal lateral right leg. He is unable to lift his right foot off the floor when walking and complains of tripping over small rug edges.',
      physicalExamOrLabs: 'Tenderness and crepitus over the neck of the fibula. Neurological exam reveals 0/5 power in ankle dorsiflexion and foot eversion. Sensation is lost over the anterolateral leg and the entire dorsum of the foot.',
      diagnosticQuestion: 'Which peripheral nerve is compressed or transected at the neck of the fibula?',
      options: [
        { key: 'A', text: 'Common Peroneal (Fibular) Nerve', isCorrect: true },
        { key: 'B', text: 'Tibial Nerve in Popliteal Fossa', isCorrect: false },
        { key: 'C', text: 'Saphenous Nerve', isCorrect: false },
        { key: 'D', text: 'Obturator Nerve', isCorrect: false },
      ],
      clinicalExplanation: 'The Common Peroneal Nerve winds directly around the subcutaneous neck of the fibula, making it the most commonly injured lower limb nerve. Injury produces "Foot Drop" due to paralysis of the anterior (deep peroneal) and lateral (superficial peroneal) leg compartments.',
      examPearl: 'PED = Peroneal Everts and Dorsiflexes; TIP = Tibial Inverts and Plantarflexes. Deep peroneal nerve supplies 1st dorsal web space.',
      focusArea: 'Nerve Entrapment & Bone Fractures',
    },
    {
      caseNumber: 3,
      title: 'Pulsatile Mass in the Popliteal Fossa',
      patientDemographics: '68-year-old male with long-standing atherosclerosis',
      presentation: 'Complains of a fullness behind the left knee and cramping calf pain upon walking 100 meters. Over the last 2 days, he noticed mild swelling of the left ankle.',
      physicalExamOrLabs: 'A prominent 4 cm expansile pulsatile mass is palpated within the popliteal fossa. Compression of adjacent structures is noted. Distal dorsalis pedis pulse is diminished.',
      diagnosticQuestion: 'Regarding the anatomical relationship of neurovascular structures in the popliteal fossa from superficial to deep, which is the correct order?',
      options: [
        { key: 'A', text: 'Tibial Nerve → Popliteal Vein → Popliteal Artery', isCorrect: true },
        { key: 'B', text: 'Popliteal Artery → Popliteal Vein → Tibial Nerve', isCorrect: false },
        { key: 'C', text: 'Popliteal Vein → Tibial Nerve → Popliteal Artery', isCorrect: false },
        { key: 'D', text: 'Common Peroneal Nerve → Popliteal Artery → Popliteal Vein', isCorrect: false },
      ],
      clinicalExplanation: 'In the popliteal fossa, the structures lie in the order N-V-A from superficial to deep: Tibial Nerve is most superficial, Popliteal Vein lies in the middle, and Popliteal Artery is deepest, lying directly against the popliteal surface of the femur and knee joint capsule.',
      examPearl: 'Superficial to Deep in Popliteal Fossa: Nerve → Vein → Artery. Popliteal artery is the most common site of peripheral artery aneurysm.',
      focusArea: 'Surgical Anatomy & Vascular Spaces',
    },
  ],

  // Anatomy - Thorax: Mediastinum, Heart & Coronary Circulation
  'anat-5': [
    {
      caseNumber: 1,
      title: 'Hypotension and Bradycardia in Acute Inferior Wall STEMI',
      patientDemographics: '62-year-old male with type 2 diabetes',
      presentation: 'Presents to the emergency department with acute crushing substernal chest pressure radiating to the epigastrium and jaw. Blood pressure is 80/50 mmHg, Heart rate is 44 bpm (sinus bradycardia).',
      physicalExamOrLabs: 'ECG shows 3 mm ST-segment elevation in leads II, III, and aVF with reciprocal depressions in leads I and aVL. Right-sided ECG lead V4R demonstrates 2 mm ST elevation.',
      diagnosticQuestion: 'Which coronary artery is occluded, and which nodal tissue blood supply is compromised?',
      options: [
        { key: 'A', text: 'Right Coronary Artery (RCA); SA node and AV node', isCorrect: true },
        { key: 'B', text: 'Left Anterior Descending Artery (LAD); Bundle of His', isCorrect: false },
        { key: 'C', text: 'Left Circumflex Artery (LCx); Purkinje fibers', isCorrect: false },
        { key: 'D', text: 'Obtuse Marginal Branch; Papillary muscles only', isCorrect: false },
      ],
      clinicalExplanation: 'ST elevation in leads II, III, and aVF denotes an Inferior Wall Myocardial Infarction, supplied by the Right Coronary Artery (RCA). The RCA gives off the SA nodal artery (in 60% of individuals) and the AV nodal artery (in 90% of individuals). Concomitant Right Ventricular MI (V4R ST elevation) produces severe preload dependence—Nitrates and Diuretics are strictly contraindicated!',
      examPearl: 'RCA supplies SA node in 60% and AV node in 90%. Right Ventricular MI is preload-dependent; treat with IV crystalloids and NEVER give Nitrates.',
      focusArea: 'Coronary Territory & Conduction Anatomy',
    },
    {
      caseNumber: 2,
      title: 'Facial Swelling and Dilated Chest Wall Veins (SVC Syndrome)',
      patientDemographics: '54-year-old heavy smoker',
      presentation: 'Complains of progressive puffiness of the face, neck fullness, and shortness of breath that worsens when bending forward or lying supine. He notes dilated, tortuous superficial veins across his anterior chest wall.',
      physicalExamOrLabs: 'Plethoric, cyanotic facies with non-pulsatile jugular venous distension. Chest CT demonstrates a 5 cm lobulated mass in the Superior Mediastinum compressing the Superior Vena Cava.',
      diagnosticQuestion: 'Which anatomical plane marks the boundary between the Superior and Inferior Mediastinum?',
      options: [
        { key: 'A', text: 'Transverse Thoracic Plane passing from Sternal Angle of Louis to T4/T5 intervertebral disc', isCorrect: true },
        { key: 'B', text: 'Horizontal line through the 2nd costal cartilage to T2 vertebra', isCorrect: false },
        { key: 'C', text: 'Plane passing from Xiphisternal joint to T9 vertebra', isCorrect: false },
        { key: 'D', text: 'Superior border of the clavicle to C7 vertebra', isCorrect: false },
      ],
      clinicalExplanation: 'The Transverse Thoracic Plane of Ludwig extends from the Sternal Angle of Louis (manubriosternal joint) anteriorly to the T4-T5 intervertebral disc posteriorly. It demarcates the boundary between the Superior and Inferior Mediastinum and marks the bifurcation of the trachea (carina), the arch of the aorta, and the entry of the azygos vein into the SVC.',
      examPearl: 'Sternal Angle of Louis (T4/T5 disc plane) landmark: Arch of Aorta begins/ends, Trachea bifurcates, Azygos vein arches into SVC, Thoracic duct crosses from right to left.',
      focusArea: 'Mediastinal Compartments & Landmarks',
    },
    {
      caseNumber: 3,
      title: 'Pulsus Paradoxus and Beck\'s Triad Following Chest Trauma',
      patientDemographics: '34-year-old driver in a steering wheel impact collision',
      presentation: 'Arrives in severe respiratory distress and restlessness. Blood pressure drops from 110/70 mmHg during expiration to 90/65 mmHg during inspiration (>10 mmHg systolic drop).',
      physicalExamOrLabs: 'Blood pressure is 88/60 mmHg, heart sounds are distant and muffled, and neck veins are visibly engorged (Beck\'s Triad). Bedside echocardiography demonstrates a large circumferential pericardial effusion compressing the right ventricle.',
      diagnosticQuestion: 'For emergency pericardiocentesis, what is the anatomical landmark and angle for needle insertion?',
      options: [
        { key: 'A', text: 'Subxiphoid approach (Larrey space) between xiphoid process and left 7th costal cartilage angled at 45° towards left shoulder', isCorrect: true },
        { key: 'B', text: 'Right 2nd intercostal space midclavicular line perpendicular to chest wall', isCorrect: false },
        { key: 'C', text: 'Left 5th intercostal space midaxillary line pointing towards right atrium', isCorrect: false },
        { key: 'D', text: 'Suprasternal notch pointing downwards behind the sternum', isCorrect: false },
      ],
      clinicalExplanation: 'Beck\'s Triad for Cardiac Tamponade consists of: (1) Hypotension, (2) Jugular Venous Distension, and (3) Muffled Heart Sounds. Emergency subxiphoid pericardiocentesis enters the Larrey triangle (between xiphoid and left costal margin) aiming toward the left shoulder at 45° to aspirate blood from the fibrous pericardial sac.',
      examPearl: 'Beck Triad = Hypotension + JVD + Muffled heart sounds. Pulsus Paradoxus = >10 mmHg systolic blood pressure drop during normal inspiration.',
      focusArea: 'Pericardial Anatomy & Emergency Procedures',
    },
  ],

  // Anatomy - Upper Limb Brachial Plexus
  'anat-1': [
    {
      caseNumber: 1,
      title: 'Difficult Breech Delivery with Asymmetrical Arm Movement',
      patientDemographics: 'Newborn male infant following prolonged labor with shoulder dystocia',
      presentation: 'On initial neonatal examination, the infant exhibits asymmetric Moro reflex. The right upper limb remains limply at the side with internal rotation and pronation.',
      physicalExamOrLabs: 'Right arm is adducted, internally rotated, forearm extended and pronated, with wrist flexed ("Waiter\'s tip" / "Policeman\'s tip" sign). Biceps jerk is absent.',
      diagnosticQuestion: 'Which roots of the brachial plexus are torn in Erb-Duchenne palsy?',
      options: [
        { key: 'A', text: 'C5 and C6 roots (Upper Trunk of Brachial Plexus)', isCorrect: true },
        { key: 'B', text: 'C8 and T1 roots (Lower Trunk of Brachial Plexus)', isCorrect: false },
        { key: 'C', text: 'C7 root alone (Middle Trunk)', isCorrect: false },
        { key: 'D', text: 'Posterior Cord branches exclusively', isCorrect: false },
      ],
      clinicalExplanation: 'Erb-Duchenne palsy results from excessive traction between the head and shoulder, tearing the C5 and C6 roots (Erb\'s point). Muscles paralyzed include Deltoid (axillary n.), Supraspinatus/Infraspinatus (suprascapular n.), and Biceps brachii (musculocutaneous n.), yielding the characteristic waiter\'s tip hand.',
      examPearl: 'Erb\'s Palsy = C5-C6 upper trunk. Klumpke\'s Palsy = C8-T1 lower trunk with Total Claw Hand and Horner Syndrome.',
      focusArea: 'Brachial Plexus Roots & Postures',
    },
    {
      caseNumber: 2,
      title: 'Midshaft Humerus Fracture with Inability to Extend the Wrist',
      patientDemographics: '30-year-old construction worker',
      presentation: 'Sustained a direct blow to the mid-arm from falling scaffolding. Plain radiography demonstrates a displaced spiral fracture of the middle third of the humerus.',
      physicalExamOrLabs: 'Physical examination shows complete inability to extend the wrist and metacarpophalangeal joints (Wrist Drop). Sensation is diminished over the dorsal aspect of the first web space.',
      diagnosticQuestion: 'Which nerve courses directly through the radial groove against the midshaft of the humerus?',
      options: [
        { key: 'A', text: 'Radial Nerve', isCorrect: true },
        { key: 'B', text: 'Median Nerve', isCorrect: false },
        { key: 'C', text: 'Ulnar Nerve', isCorrect: false },
        { key: 'D', text: 'Musculocutaneous Nerve', isCorrect: false },
      ],
      clinicalExplanation: 'The Radial Nerve winds around the posterior surface of the humerus in the radial (spiral) groove accompanied by the profunda brachii artery. Midshaft fractures compress or lacerate this nerve, paralyzing wrist extensors (Wrist Drop). Triceps extension is usually spared because branches to triceps arise proximal to the groove.',
      examPearl: 'Midshaft humerus = Radial nerve (wrist drop). Surgical neck of humerus = Axillary nerve (deltoid). Medial epicondyle = Ulnar nerve (claw hand).',
      focusArea: 'Fractures & Peripheral Nerve Traps',
    },
  ],

  // Medicine - Cardiology: Arrhythmias & ACS
  'med-1': [
    {
      caseNumber: 1,
      title: 'Palpitations with Regular Narrow-Complex Tachycardia',
      patientDemographics: '28-year-old female medical resident',
      presentation: 'Experiences sudden onset of fluttering in her chest while on duty after drinking 3 cups of coffee. She feels lightheaded but has no chest pain or shortness of breath.',
      physicalExamOrLabs: 'Blood pressure is 118/76 mmHg. ECG demonstrates a regular narrow-complex tachycardia at a rate of 190 bpm with retrogradely conducted P waves buried inside the QRS complexes.',
      diagnosticQuestion: 'After unsuccessful carotid sinus massage, what is the first-line pharmacotherapeutic agent?',
      options: [
        { key: 'A', text: 'Intravenous Adenosine (6 mg rapid IV bolus with saline flush)', isCorrect: true },
        { key: 'B', text: 'Intravenous Amiodarone 300 mg over 1 hour', isCorrect: false },
        { key: 'C', text: 'Oral Digoxin 0.25 mg daily', isCorrect: false },
        { key: 'D', text: 'Immediate Synchronized DC Cardioversion at 200 Joules', isCorrect: false },
      ],
      clinicalExplanation: 'This is stable AV Nodal Reentrant Tachycardia (AVNRT / PSVT). In a hemodynamically stable patient, after vagal maneuvers, the first-line medication is rapid IV Adenosine (6 mg, then 12 mg), which transiently blocks AV nodal conduction with a half-life of <10 seconds.',
      examPearl: 'Stable PSVT = Vagal maneuvers → IV Adenosine (6 mg then 12 mg). Unstable PSVT = Synchronized DC Cardioversion.',
      focusArea: 'Emergency Antiarrhythmic Protocols',
    },
    {
      caseNumber: 2,
      title: 'Inferior STEMI with Severe Hypotension Precipitated by Sublingual Nitroglycerin',
      patientDemographics: '64-year-old male with sudden substernal chest heaviness',
      presentation: 'Administered 3 doses of sublingual nitroglycerin by ambulance crew. On arrival, blood pressure has collapsed to 72/40 mmHg with cold, clammy extremities.',
      physicalExamOrLabs: 'ECG demonstrates ST elevation in leads II, III, and aVF. Clear lung fields on bilateral auscultation with elevated jugular venous pulse (Triad of RVMI). Lead V4R reveals 2.5 mm ST elevation.',
      diagnosticQuestion: 'What is the immediate corrective resuscitation therapy for this Right Ventricular Infarction?',
      options: [
        { key: 'A', text: 'Immediate rapid infusion of 1 to 2 Liters of IV Isotonic Normal Saline', isCorrect: true },
        { key: 'B', text: 'Intravenous Furosemide 40 mg bolus', isCorrect: false },
        { key: 'C', text: 'Intravenous Morphine 5 mg bolus', isCorrect: false },
        { key: 'D', text: 'Continuous Nitroglycerin infusion titrated to blood pressure', isCorrect: false },
      ],
      clinicalExplanation: 'Right Ventricular Myocardial Infarction (RVMI) is severely preload-dependent. Nitroglycerin venodilation precipitously drops RV filling pressure, causing catastrophic cardiogenic shock. Immediate volume resuscitation with IV crystalloid fluids restores cardiac output. Nitrates, Diuretics, and Morphine are contraindicated.',
      examPearl: 'RVMI Triad: Hypotension + Elevated JVP + Clear Lungs. Management: IV fluids (NO nitrates/diuretics).',
      focusArea: 'Coronary Territory & Hemodynamics',
    },
  ],

  // Medicine - Cardiology: Valvular Heart Diseases & Infective Endocarditis
  'med-3': [
    {
      caseNumber: 1,
      title: 'Fever, New Murmur, and Painless Palmar Macules in a Dental Extraction Patient',
      patientDemographics: '42-year-old male with a history of bicuspid aortic valve',
      presentation: 'Presents with a 3-week history of low-grade fever, night sweats, anorexia, and malaise following an unprophylaxed molar extraction. Over the last 2 days, he noticed painless red spots on his palms and soles.',
      physicalExamOrLabs: 'Temperature is 38.6°C. Auscultation reveals a new high-pitched early diastolic decrescendo murmur at the left sternal border. Examination of the hands demonstrates non-tender erythematous macules on the palms (Janeway lesions) and subungual linear dark streaks (splinter hemorrhages). Transthoracic echo reveals a 12 mm mobile vegetation on the aortic valve.',
      diagnosticQuestion: 'According to the Modified Duke Criteria, which classification category and definitive diagnosis is established?',
      options: [
        { key: 'A', text: 'Definite Infective Endocarditis (Echocardiographic vegetation + Janeway lesions/Splinter hemorrhages + Predisposing heart condition + Fever)', isCorrect: true },
        { key: 'B', text: 'Possible Infective Endocarditis requiring biopsy confirmation', isCorrect: false },
        { key: 'C', text: 'Acute Rheumatic Fever based on Jones Criteria', isCorrect: false },
        { key: 'D', text: 'Non-bacterial Thrombotic (Marantic) Endocarditis', isCorrect: false },
      ],
      clinicalExplanation: 'The patient fulfills Modified Duke Criteria for Definite Infective Endocarditis: 1 Major Criterion (Echocardiogram showing oscillating intracardiac vegetation on valve) + 3 Minor Criteria (Predisposing heart condition, Fever >= 38°C, Vascular phenomena: Janeway lesions and splinter hemorrhages).',
      examPearl: 'Janeway lesions are painless micro-abscesses (vascular); Osler nodes are painful immune complex nodules on finger pulp (immunologic).',
      focusArea: 'Duke Diagnostic Criteria & Stigmata',
    },
    {
      caseNumber: 2,
      title: 'Exertional Syncope and Harsh Systolic Ejection Murmur',
      patientDemographics: '71-year-old male with progressive breathlessness',
      presentation: 'Brought to the clinic by his wife after experiencing a syncopal episode while climbing a flight of stairs. He also reports recent exertional chest tightness (angina) and shortness of breath.',
      physicalExamOrLabs: 'Pulse is slow-rising with low amplitude (Pulsus parvus et tardus). Auscultation reveals a harsh crescendo-decrescendo systolic ejection murmur at the right upper sternal border that radiates to the carotid arteries with a single/diminished S2.',
      diagnosticQuestion: 'What is the definitive diagnosis and primary indication for Surgical/Transcatheter Aortic Valve Replacement (SAVR/TAVR)?',
      options: [
        { key: 'A', text: 'Severe Aortic Stenosis; onset of symptoms (Syncope, Angina, Dyspnea triad)', isCorrect: true },
        { key: 'B', text: 'Hypertrophic Obstructive Cardiomyopathy (HOCM); septal myectomy', isCorrect: false },
        { key: 'C', text: 'Mitral Regurgitation; urgent annuloplasty', isCorrect: false },
        { key: 'D', text: 'Aortic Regurgitation; oral Vasodilator therapy', isCorrect: false },
      ],
      clinicalExplanation: 'The classic triad of Severe Aortic Stenosis is SAD: Syncope, Angina, and Dyspnea. Auscultation features a crescendo-decrescendo systolic murmur radiating to carotids with pulsus parvus et tardus. The onset of symptoms in severe AS carries a dramatic drop in survival and is the definitive indication for valve replacement (SAVR or TAVR).',
      examPearl: 'Aortic Stenosis Triad = Syncope (avg survival 3 yrs), Angina (5 yrs), Dyspnea (2 yrs). Carotid radiation + Pulsus parvus et tardus is classic.',
      focusArea: 'Valvular Murmurs & Interventions',
    },
  ],

  // Medicine - Pulmonology (Asthma & COPD)
  'med-4': [
    {
      caseNumber: 1,
      title: 'Nocturnal Cough and Episodic Breathlessness in a College Student',
      patientDemographics: '21-year-old female university student',
      presentation: 'Presents with a 6-month history of dry nocturnal cough that wakes her up 3 times a week, as well as shortness of breath and wheezing during cold weather and cardio exercise. Daytime physical exam in clinic is completely unremarkable.',
      physicalExamOrLabs: 'Pre-bronchodilator Spirometry: FEV1 2.1 L (68% predicted), FEV1/FVC 0.65. Following administration of 400 mcg inhaled Salbutamol, repeat spirometry shows FEV1 2.55 L (an increase of 450 mL and 21.4%).',
      diagnosticQuestion: 'Which diagnosis is confirmed, and according to GINA Track 1, what is the initial preferred management?',
      options: [
        { key: 'A', text: 'Bronchial Asthma (documented post-BD FEV1 reversibility > 12% and > 200 mL); As-needed Low-Dose ICS-Formoterol', isCorrect: true },
        { key: 'B', text: 'COPD; initiate Long-Acting Muscarinic Antagonist (Tiotropium) monotherapy', isCorrect: false },
        { key: 'C', text: 'Gastroesophageal Reflux Disease (GERD); oral Proton Pump Inhibitor trial', isCorrect: false },
        { key: 'D', text: 'Mild Intermittent Asthma; as-needed Salbutamol SABA monotherapy alone', isCorrect: false },
      ],
      clinicalExplanation: 'The spirometry definitively proves Asthma by demonstrating reversible airflow obstruction (FEV1 increased by 450 mL and 21.4%, well exceeding the guideline requirement of > 12% and > 200 mL). Per GINA 2023/2024 Track 1 guidelines, SABA monotherapy is no longer recommended due to exacerbation risks; as-needed low-dose Inhaled Corticosteroid (ICS) + Formoterol is the preferred strategy.',
      examPearl: 'Asthma reversibility threshold = FEV1 increase > 12% AND > 200 mL. GINA Track 1 prefers as-needed ICS-formoterol over SABA alone.',
      focusArea: 'Spirometry & GINA Stepwise Therapy',
    },
    {
      caseNumber: 2,
      title: 'Chronic Productive Cough in a Long-Term Smoker with Barrel Chest',
      patientDemographics: '62-year-old male with a 40 pack-year smoking history',
      presentation: 'Presents with chronic progressive dyspnea on exertion and morning sputum production for the past 4 years. Examination reveals barrel chest, pursed-lip breathing, prolonged expiratory phase, and distant heart sounds.',
      physicalExamOrLabs: 'Post-bronchodilator Spirometry: FEV1/FVC ratio is 0.58 (Fixed obstruction). Post-BD FEV1 is 44% of predicted. Arterial Blood Gas on room air: pH 7.37, PaO2 53 mmHg, PaCO2 48 mmHg, SaO2 86%.',
      diagnosticQuestion: 'What GOLD severity stage is present and which intervention will definitively improve this patient\'s long-term survival?',
      options: [
        { key: 'A', text: 'GOLD Stage 3 (Severe COPD, FEV1 30-49%); Smoking Cessation and Long-Term Oxygen Therapy (LTOT >= 15h/day)', isCorrect: true },
        { key: 'B', text: 'GOLD Stage 1 (Mild COPD); Inhaled Theophylline oral maintenance', isCorrect: false },
        { key: 'C', text: 'Bronchial Asthma Step 4; High-dose Oral Prednisolone maintenance', isCorrect: false },
        { key: 'D', text: 'GOLD Stage 4 (Very Severe COPD); Long-acting Beta-2 Agonist monotherapy', isCorrect: false },
      ],
      clinicalExplanation: 'Post-bronchodilator FEV1/FVC < 0.70 establishes COPD. An FEV1 of 44% predicted classifies as GOLD Stage 3 (Severe COPD, range 30-49%). With resting PaO2 <= 55 mmHg (53 mmHg) and SaO2 <= 88% (86%), the patient strictly meets criteria for Long-Term Oxygen Therapy (LTOT >= 15 hours/day), which along with smoking cessation are the only interventions proven to reduce mortality.',
      examPearl: 'GOLD staging: 1 (>=80%), 2 (50-79%), 3 (30-49%), 4 (<30%). Mortality reducers in COPD = Smoking cessation + LTOT (PaO2 <= 55 mmHg).',
      focusArea: 'GOLD Staging & LTOT Mortality Criteria',
    },
  ],

  // Pharmacology - Autonomic Drugs
  'pharm-1': [
    {
      caseNumber: 1,
      title: 'Agricultural Worker with Hypersalivation and Pinpoint Pupils',
      patientDemographics: '38-year-old pesticide sprayer',
      presentation: 'Rushed to the emergency department after spraying cotton crops without protective masks. He is confused, vomiting, wheezing diffusely, and drenched in cold sweat with fecal and urinary incontinence.',
      physicalExamOrLabs: 'Heart rate is 42 bpm (severe bradycardia), pupils are pinpoint (1 mm bilaterally, unreactive), and chest auscultation reveals bilateral diffuse coarse rales and rhonchi.',
      diagnosticQuestion: 'Which antidote combination is required and what is the endpoint of Atropine titration?',
      options: [
        { key: 'A', text: 'Atropine + Pralidoxime (2-PAM); endpoint is drying of bronchial secretions', isCorrect: true },
        { key: 'B', text: 'Physostigmine + Neostigmine; endpoint is pupillary dilation', isCorrect: false },
        { key: 'C', text: 'Naloxone + Flumazenil; endpoint is normal respiratory rate', isCorrect: false },
        { key: 'D', text: 'Glucagon + Calcium Gluconate; endpoint is heart rate > 100 bpm', isCorrect: false },
      ],
      clinicalExplanation: 'Organophosphates irreversibly inhibit Acetylcholinesterase, leading to cholinergic crisis (DUMBBELLS). Atropine blocks muscarinic receptors (titrated until lung secretions dry, NOT pupil dilation). Pralidoxime (2-PAM) reactivates acetylcholinesterase before chemical aging occurs.',
      examPearl: 'Atropine endpoint is DRY LUNG SECRETIONS (clearing of chest rales), NOT mydriasis or tachycardia. Pralidoxime must be given before aging occurs.',
      focusArea: 'Toxicology & Antidote Mechanisms',
    },
    {
      caseNumber: 2,
      title: 'Propranolol Overdose with Bradycardia and Refractory Hypotension',
      patientDemographics: '25-year-old male with intentional ingestion of 40 tablets of Propranolol',
      presentation: 'Found unresponsive with heart rate of 34 bpm and blood pressure 68/40 mmHg. Blood glucose is 55 mg/dL (hypoglycemia).',
      physicalExamOrLabs: 'Sinus bradycardia with PR prolongation on ECG. IV Atropine and IV Epinephrine fail to adequately restore blood pressure or heart rate.',
      diagnosticQuestion: 'What is the specific first-line pharmacological antidote for severe Beta-Blocker toxicity?',
      options: [
        { key: 'A', text: 'Intravenous Glucagon (bypasses beta receptors via adenylate cyclase stimulation)', isCorrect: true },
        { key: 'B', text: 'Intravenous Flumazenil', isCorrect: false },
        { key: 'C', text: 'Intravenous Digoxin-specific Fab antibodies', isCorrect: false },
        { key: 'D', text: 'Intravenous Sodium Bicarbonate', isCorrect: false },
      ],
      clinicalExplanation: 'IV Glucagon is the drug of choice for beta-blocker overdose. Glucagon binds to specific myocardial receptors and activates adenylate cyclase, increasing intracellular cAMP independent of beta-adrenergic receptors, restoring inotropy and chronotropy.',
      examPearl: 'Beta-blocker toxicity antidote = IV Glucagon. Calcium channel blocker toxicity antidote = IV Calcium Gluconate + High-Dose Insulin Euglycemia (HIET).',
      focusArea: 'Cardiovascular Pharmacology & Antidotes',
    },
  ],

  // Pathology - Neoplasia
  'path-4': [
    {
      caseNumber: 1,
      title: 'Multiple Family Members with Early-Onset Sarcomas and Carcinomas',
      patientDemographics: '24-year-old female with newly diagnosed osteosarcoma',
      presentation: 'History reveals her mother died of premenopausal breast cancer at age 31, her maternal uncle had an adrenocortical carcinoma at age 14, and her brother was treated for a brain glioblastoma at age 19.',
      physicalExamOrLabs: 'Genetic pedigree analysis shows an autosomal dominant pattern of diverse early-onset mesenchymal and epithelial malignancies (Li-Fraumeni Syndrome).',
      diagnosticQuestion: 'Which tumor suppressor gene and chromosomal locus is mutated in this syndrome?',
      options: [
        { key: 'A', text: 'TP53 on Chromosome 17p (encodes p53 transcription factor)', isCorrect: true },
        { key: 'B', text: 'RB1 on Chromosome 13q (encodes retinoblastoma protein)', isCorrect: false },
        { key: 'C', text: 'APC on Chromosome 5q (Wnt signaling regulator)', isCorrect: false },
        { key: 'D', text: 'WT1 on Chromosome 11p (Wilms tumor suppressor)', isCorrect: false },
      ],
      clinicalExplanation: 'Li-Fraumeni syndrome is caused by germline mutations in the TP53 gene on chromosome 17p. p53 is the "Guardian of the Genome," inducing p21-mediated cell cycle arrest at G1/S in response to DNA damage or triggering apoptosis via BAX.',
      examPearl: 'TP53 (17p) = Li-Fraumeni syndrome (Sarcoma, Breast, Brain, Adrenal). RB1 (13q) = Retinoblastoma & Osteosarcoma. APC (5q) = Familial Adenomatous Polyposis.',
      focusArea: 'Oncogenes & Genetic Syndromes',
    },
    {
      caseNumber: 2,
      title: 'Endemic African Child with Rapidly Growing Mandibular Mass',
      patientDemographics: '7-year-old Ugandan boy',
      presentation: 'Presents with a large, rapidly growing destructive osteolytic mass involving the left mandible, causing tooth loosening and facial distortion. Serology is positive for Epstein-Barr Virus (EBV).',
      physicalExamOrLabs: 'Biopsy demonstrates a uniform diffuse infiltrate of intermediate-sized B-lymphocytes interspersed with pale, lipid-laden tingible-body macrophages, yielding a classic "Starry Sky" appearance.',
      diagnosticQuestion: 'Which chromosomal translocation and oncogene deregulation characterizes this neoplasm?',
      options: [
        { key: 'A', text: 't(8;14) translocation leading to c-MYC oncogene overexpression', isCorrect: true },
        { key: 'B', text: 't(14;18) translocation leading to BCL2 overexpression', isCorrect: false },
        { key: 'C', text: 't(9;22) translocation creating BCR-ABL fusion kinase', isCorrect: false },
        { key: 'D', text: 't(11;14) translocation leading to Cyclin D1 overexpression', isCorrect: false },
      ],
      clinicalExplanation: 'Burkitt Lymphoma is characterized by t(8;14)(q24;q32), which translocates the c-MYC proto-oncogene on chromosome 8 to the Immunoglobulin Heavy Chain (IgH) enhancer on chromosome 14, driving constitutive cellular proliferation. Histology demonstrates a classic "starry sky" pattern.',
      examPearl: 'Burkitt lymphoma = t(8;14) c-MYC (Starry sky histology). Follicular lymphoma = t(14;18) BCL2. Mantle cell = t(11;14) Cyclin D1.',
      focusArea: 'Translocations & Histopathology',
    },
  ],

  // OBGYN - Pre-eclampsia & MgSO4
  'obg-2': [
    {
      caseNumber: 1,
      title: 'Generalized Tonic-Clonic Seizures at 34 Weeks Gestation',
      patientDemographics: '21-year-old primigravida at 34 weeks gestation',
      presentation: 'Presented with severe persistent frontal headache, visual blurring (scotomata), and epigastric pain. In the triage room, she suddenly develops generalized tonic-clonic convulsions lasting 90 seconds.',
      physicalExamOrLabs: 'Blood pressure is 170/114 mmHg. Urine dipstick demonstrates 3+ proteinuria. Deep tendon reflexes are brisk with 4 beats of ankle clonus. Fetal heart rate is 130 bpm.',
      diagnosticQuestion: 'What is the drug of choice for controlling eclamptic seizures, and what is the standard loading dose in the Pritchard regimen?',
      options: [
        { key: 'A', text: 'Magnesium Sulfate (MgSO4): 4 g IV over 5 min PLUS 10 g IM (5 g in each buttock)', isCorrect: true },
        { key: 'B', text: 'Intravenous Diazepam 10 mg bolus followed by Phenytoin infusion', isCorrect: false },
        { key: 'C', text: 'Oral Labetalol 200 mg single dose', isCorrect: false },
        { key: 'D', text: 'Intravenous Sodium Valproate 1 g bolus', isCorrect: false },
      ],
      clinicalExplanation: 'Magnesium Sulfate (MgSO4) is the anticonvulsant of choice in Eclampsia. The Pritchard Regimen loading dose is 4 g IV (20% solution over 5 minutes) PLUS 10 g IM (5 g in each buttock of 50% solution). Maintenance is 5 g IM 4-hourly in alternate buttocks.',
      examPearl: 'MgSO4 is superior to Phenytoin and Diazepam for Eclampsia. Antidote for Mg toxicity is 10 mL of 10% Calcium Gluconate IV.',
      focusArea: 'Emergency Obstetric Management',
    },
    {
      caseNumber: 2,
      title: 'Hyporeflexia and Bradypnea During Maintenance MgSO4 Infusion',
      patientDemographics: '28-year-old pregnant female being treated for severe pre-eclampsia',
      presentation: 'Receiving continuous intravenous Magnesium Sulfate. 4 hours into therapy, nurse notes the patient is somnolent with slurred speech.',
      physicalExamOrLabs: 'Patellar deep tendon reflexes are completely absent bilaterally. Respiratory rate has decreased to 9 breaths/min. Urine output over the preceding 2 hours was only 15 mL/hr.',
      diagnosticQuestion: 'What is the definitive immediate clinical step in managing this Magnesium toxicity?',
      options: [
        { key: 'A', text: 'Immediately discontinue MgSO4 and administer 10 mL of 10% Calcium Gluconate IV slowly over 10 minutes', isCorrect: true },
        { key: 'B', text: 'Administer IV Furosemide to increase renal magnesium clearance', isCorrect: false },
        { key: 'C', text: 'Administer IV Naloxone 0.4 mg bolus', isCorrect: false },
        { key: 'D', text: 'Increase rate of normal saline without stopping magnesium', isCorrect: false },
      ],
      clinicalExplanation: 'Earliest sign of magnesium toxicity is loss of deep tendon reflexes (patellar reflex at 8-10 mEq/L), followed by respiratory arrest (>12 mEq/L) and cardiac arrest (>15 mEq/L). Renal oliguria (<30 mL/hr) accelerates toxic accumulation. Antidote: Stop infusion immediately and administer 10 mL 10% Calcium Gluconate IV slowly over 10 minutes.',
      examPearl: 'Loss of Patellar reflex is the earliest warning sign of MgSO4 toxicity. Always keep Calcium Gluconate at bedside.',
      focusArea: 'Toxicity Monitoring & Antidotes',
    },
  ],

  // =================== BIOCHEMISTRY ===================
  'bio-1': [
    {
      caseNumber: 1,
      title: 'Statin Pharmacodynamics & HMG-CoA Reductase Inhibition Kinetics',
      patientDemographics: '52-year-old male with familial hypercholesterolemia',
      presentation: 'Initiated on Atorvastatin 40 mg daily. In vitro enzymatic analysis evaluates the effect of Atorvastatin on purified human HMG-CoA reductase across varying concentrations of HMG-CoA substrate.',
      physicalExamOrLabs: 'At increasing concentrations of Atorvastatin, the apparent Km for HMG-CoA increases from 12 μM to 48 μM, while the Vmax remains constant at 150 nmol/min/mg protein. Lineweaver-Burk plots demonstrate identical y-axis intercepts.',
      diagnosticQuestion: 'Which mechanism of enzyme inhibition is demonstrated by this pharmacological agent?',
      options: [
        { key: 'A', text: 'Reversible Competitive Inhibition (binds enzyme active catalytic site)', isCorrect: true },
        { key: 'B', text: 'Noncompetitive Inhibition (binds allosteric regulatory site)', isCorrect: false },
        { key: 'C', text: 'Uncompetitive Inhibition (binds only to Enzyme-Substrate complex)', isCorrect: false },
        { key: 'D', text: 'Irreversible Suicide Inhibition (covalent active site inactivation)', isCorrect: false },
      ],
      clinicalExplanation: 'Statins are structural analogues of HMG-CoA and act as reversible competitive inhibitors of HMG-CoA reductase. Competitive inhibitors increase Km (lower apparent affinity) without altering Vmax because excess substrate can outcompete the inhibitor. On a Lineweaver-Burk plot, the y-intercept (1/Vmax) remains unchanged while the x-intercept (-1/Km) shifts rightward toward zero.',
      examPearl: 'Competitive Inhibition: ↑Km, unchanged Vmax (lines intersect on vertical y-axis). Noncompetitive: unchanged Km, ↓Vmax (lines intersect on horizontal x-axis).',
      focusArea: 'Enzyme Inhibition Kinetics & Lineweaver-Burk Graphs',
    },
    {
      caseNumber: 2,
      title: 'Methotrexate Toxicity Reversal via Leucovorin Rescue',
      patientDemographics: '24-year-old female receiving high-dose chemotherapy for osteosarcoma',
      presentation: 'Receives high-dose Methotrexate. 24 hours post-infusion, her serum methotrexate level is dangerously elevated. To prevent lethal bone marrow suppression and gastrointestinal mucositis, an antidote is urgently infused.',
      physicalExamOrLabs: 'Methotrexate competitively inhibits Dihydrofolate Reductase (DHFR), arresting thymidylate and purine synthesis.',
      diagnosticQuestion: 'Which agent is administered as "rescue therapy" to bypass DHFR inhibition in normal host cells?',
      options: [
        { key: 'A', text: 'Folinic Acid (Leucovorin / 5-formyl-THF)', isCorrect: true },
        { key: 'B', text: 'Folic acid (pteroylglutamic acid)', isCorrect: false },
        { key: 'C', text: 'Vitamin B12 (Cyanocobalamin)', isCorrect: false },
        { key: 'D', text: 'N-acetylcysteine', isCorrect: false },
      ],
      clinicalExplanation: 'Methotrexate competitively inhibits Dihydrofolate Reductase (DHFR). Leucovorin (folinic acid) is a fully reduced folate derivative that is converted directly to tetrahydrofolate (THF) without requiring the DHFR enzyme, thereby rescuing normal bone marrow and mucosal cells from fatal toxicity.',
      examPearl: 'Leucovorin (folinic acid) bypasses DHFR. Folic acid itself is useless because it requires functional DHFR to become active.',
      focusArea: 'Clinical Pharmacological Inhibition & Antidotes',
    },
  ],

  // =================== PHARMACOLOGY ===================
  'pharm-2': [
    {
      caseNumber: 1,
      title: 'Accidental Overdose of Metoprolol with Severe Bradycardia',
      patientDemographics: '64-year-old male with coronary artery disease and hypertension',
      presentation: 'Brought to the ER by family after ingesting 20 tablets of Metoprolol Tartrate. He is lethargic with cold clammy extremities. Blood pressure is 70/40 mmHg, Heart rate is 32 bpm.',
      physicalExamOrLabs: 'ECG demonstrates severe sinus bradycardia with prolonged PR interval. Atropine 1 mg IV produces no change in heart rate or blood pressure.',
      diagnosticQuestion: 'Which intravenous antidote of choice should be administered immediately to restore cardiac output?',
      options: [
        { key: 'A', text: 'Intravenous Glucagon', isCorrect: true },
        { key: 'B', text: 'Intravenous Flumazenil', isCorrect: false },
        { key: 'C', text: 'Intravenous Naloxone', isCorrect: false },
        { key: 'D', text: 'Intravenous Physostigmine', isCorrect: false },
      ],
      clinicalExplanation: 'Intravenous Glucagon is the first-line antidote for Beta-blocker overdose. Glucagon stimulates dedicated myocardial glucagon receptors coupled to Gs, activating Adenylyl Cyclase and elevating intracellular cAMP independent of beta-adrenergic receptors, thereby increasing heart rate and contractility.',
      examPearl: 'Beta-blocker toxicity antidote = IV Glucagon (bypasses beta receptors). Calcium channel blocker antidote = IV Calcium Gluconate + High-Dose Insulin Euglycemia.',
      focusArea: 'Toxicology & Receptor Signaling',
    },
  ],

  // =================== PATHOLOGY ===================
  'path-8': [
    {
      caseNumber: 1,
      title: 'Painless Cervical Lymphadenopathy with Pel-Ebstein Fever',
      patientDemographics: '22-year-old female college student',
      presentation: 'Presents with a 3-month history of painless, rubbery right-sided cervical lymph node enlargement. She reports cyclical fevers that spike for 7 days then remit (Pel-Ebstein fever) and drenching night sweats.',
      physicalExamOrLabs: 'Excisional lymph node biopsy shows broad collagen bands dividing the lymphoid tissue into circumscribed nodules. Diagnostic binucleated giant cells with prominent nucleoli ("owl-eye" appearance) within clear lacunar spaces are identified.',
      diagnosticQuestion: 'Which immunohistochemical marker profile confirms the classic diagnosis in these diagnostic cells?',
      options: [
        { key: 'A', text: 'CD15 (+) and CD30 (+); CD45 (-) and CD20 (-)', isCorrect: true },
        { key: 'B', text: 'CD20 (+) and CD45 (+); CD15 (-) and CD30 (-)', isCorrect: false },
        { key: 'C', text: 'CD3 (+) and CD5 (+); CD15 (-)', isCorrect: false },
        { key: 'D', text: 'CD138 (+) and CD38 (+); CD56 (+)', isCorrect: false },
      ],
      clinicalExplanation: 'The biopsy is classic for Nodular Sclerosis Hodgkin Lymphoma, showing collagen bands and lacunar Reed-Sternberg cells. Classic Reed-Sternberg cells characteristically express CD15 and CD30, while lacking leukocyte common antigen (CD45) and B-cell marker (CD20).',
      examPearl: 'Classic Hodgkin RS cells = CD15(+) and CD30(+). Most common subtype = Nodular Sclerosis (young females, mediastinal mass).',
      focusArea: 'Immunophenotyping & Histopathology',
    },
  ],

  // =================== PHYSIOLOGY ===================
  'phys-2': [
    {
      caseNumber: 1,
      title: 'Paresthesias and Muscle Weakness Following Fugu Fish Ingestion',
      patientDemographics: '38-year-old sushi chef',
      presentation: 'Presented to emergency 45 minutes after consuming improperly prepared Pufferfish (Fugu). He developed rapid perioral numbness, paresthesias in both hands, ascending flaccid paralysis, and progressive respiratory failure.',
      physicalExamOrLabs: 'Neurological examination reveals generalized flaccid quadriparesis with absent deep tendon reflexes. Sensory testing shows loss of light touch and pinprick across all limbs.',
      diagnosticQuestion: 'What is the molecular mechanism of Tetrodotoxin toxicity in nerve axons?',
      options: [
        { key: 'A', text: 'Blockade of voltage-gated Sodium (Na+) channels, preventing Phase 0 depolarization', isCorrect: true },
        { key: 'B', text: 'Blockade of voltage-gated Potassium (K+) channels, preventing repolarization', isCorrect: false },
        { key: 'C', text: 'Irreversible inhibition of Acetylcholinesterase at the neuromuscular junction', isCorrect: false },
        { key: 'D', text: 'Blockade of presynaptic Calcium (Ca2+) influx and ACh release', isCorrect: false },
      ],
      clinicalExplanation: 'Tetrodotoxin (found in pufferfish gonads and liver) binds specifically to the extracellular pore of voltage-gated Na+ channels on excitable membranes, blocking Na+ influx and preventing Phase 0 depolarization of the action potential in both sensory and motor nerves.',
      examPearl: 'Tetrodotoxin (TTX) and Saxitoxin block voltage-gated Na+ channels. Tetraethylammonium (TEA) blocks voltage-gated K+ channels.',
      focusArea: 'Ion Channels & Membrane Biophysics',
    },
  ],
};

/**
 * Generates structured, interactive clinical cases for any FMGE topic.
 */
export function generateTopicClinicalCasesDeck(
  subjectId: string,
  topicId: string,
  topicName?: string
): TopicClinicalCasesDeck {
  const context: TopicLearningContext = getTopicLearningContext(subjectId, topicId, topicName);
  const verifiedList = VERIFIED_TOPIC_CLINICAL_CASES[topicId] || [];

  let cases: ClinicalCaseItem[] = [];

  if (VERIFIED_TOPIC_CLINICAL_CASES[topicId] && VERIFIED_TOPIC_CLINICAL_CASES[topicId].length > 0) {
    cases = VERIFIED_TOPIC_CLINICAL_CASES[topicId].map((c, idx) => {
      const { shuffledOptions, correctOptionId, correctAnswer } = shuffleQuestionOptions(c.options);
      return {
        ...c,
        id: `case-${subjectId}-${topicId}-${idx + 1}`,
        options: shuffledOptions,
        correctOptionId,
        correctAnswer,
      };
    });
  } else {
    // Dynamic topic-type-aware clinical cases for uncataloged topics
    const kb = getMedicalTopicKnowledge(subjectId, topicId, context.topicName);
    const dynamicTemplates = [
      {
        caseNumber: 1,
        title: kb.clinicalCase.title,
        patientDemographics: kb.clinicalCase.patientDemographics,
        presentation: kb.clinicalCase.presentation,
        physicalExamOrLabs: kb.clinicalCase.physicalExamOrLabs,
        diagnosticQuestion: kb.clinicalCase.diagnosticQuestion,
        rawOptions: kb.clinicalCase.options,
        clinicalExplanation: kb.clinicalCase.clinicalExplanation,
        examPearl: kb.clinicalCase.examPearl,
        focusArea: 'Clinical Diagnostics & Guidelines',
      },
      {
        caseNumber: 2,
        title: `Clinical Vignette & Diagnostic Evaluation: ${kb.topicTitle}`,
        patientDemographics: 'Adult patient presenting for definitive management',
        presentation: kb.classicPresentation,
        physicalExamOrLabs: `Gold-standard diagnostic confirmation: ${kb.goldStandardTest}.`,
        diagnosticQuestion: `Which of the following represents the preferred first-line management or guideline-directed intervention?`,
        rawOptions: [
          { key: 'A', text: kb.firstLineTreatment, isCorrect: true },
          { key: 'B', text: `Withhold all treatment pending long-term observation`, isCorrect: false },
          { key: 'C', text: `Administer empirical therapy contraindicated in this condition`, isCorrect: false },
          { key: 'D', text: `Perform non-indicated invasive emergency surgery`, isCorrect: false },
        ],
        clinicalExplanation: `${kb.highYieldSummary} Key takeaway: ${kb.keyTakeaways[0] || kb.firstLineTreatment}`,
        examPearl: kb.examTrap,
        focusArea: 'High-Yield Management & Discriminators',
      },
    ];

    cases = dynamicTemplates.map((t, idx) => {
      const { shuffledOptions, correctOptionId, correctAnswer } = shuffleQuestionOptions(t.rawOptions);
      return {
        id: `case-${subjectId}-${topicId}-${idx + 1}`,
        caseNumber: t.caseNumber,
        title: t.title,
        patientDemographics: t.patientDemographics,
        presentation: t.presentation,
        physicalExamOrLabs: t.physicalExamOrLabs,
        diagnosticQuestion: t.diagnosticQuestion,
        options: shuffledOptions,
        correctOptionId,
        correctAnswer,
        clinicalExplanation: t.clinicalExplanation,
        examPearl: t.examPearl,
        focusArea: t.focusArea,
      };
    });
  }

  // Shared topic-contamination validation boundary: drop any case whose content carries
  // cross-topic/regional-anatomy contamination for the ACTIVE topic before it reaches the UI.
  const safeCases = filterTopicSafeContent(cases, subjectId, topicId, context.topicName, (c) => `${c.title} ${c.patientDemographics} ${c.presentation} ${c.physicalExamOrLabs} ${c.diagnosticQuestion} ${c.clinicalExplanation} ${c.examPearl} ${(c.options || []).map((o) => o.text).join(' ')}`, context.topicType);

  return {
    topicId: context.topicId,
    topicName: context.topicName,
    subjectId: context.subjectId,
    subjectName: context.subjectName,
    cases: safeCases,
  };
}

