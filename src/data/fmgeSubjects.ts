import { FMGESubject } from '../types';

export const FMGE_SUBJECTS: FMGESubject[] = [
  // =================== PRE-CLINICAL (Paper 1) ===================
  {
    id: 'anatomy',
    name: 'Anatomy',
    code: 'ANAT',
    phase: 'pre-clinical',
    weightage: 17,
    color: '#f97316', // Red
    iconName: 'Activity',
    description: 'Gross anatomy, embryology, histology, neuroanatomy, and clinical anatomical spaces.',
    highYieldTips: 'High focus on Brachial plexus, Cranial nerve exits, Perineal pouches, Inguinal canal, Pharyngeal arches, and Circle of Willis.',
    topics: [
      { id: 'anat-1', name: 'Upper Limb - Brachial Plexus & Nerve Injuries', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'anat-2', name: 'Upper Limb - Spaces, Arteries & Anatomical Snuffbox', isHighYield: false, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'anat-3', name: 'Lower Limb - Femoral Triangle, Canal & Popliteal Fossa', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'anat-4', name: 'Lower Limb - Knee Joint & Nerve Lesions (Peroneal/Tibial)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'anat-5', name: 'Thorax - Mediastinum, Heart & Coronary Circulation', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'anat-6', name: 'Thorax - Lungs, Bronchopulmonary Segments & Pleura', isHighYield: false, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'anat-7', name: 'Abdomen - Inguinal Canal & Hernia Anatomy', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'anat-8', name: 'Abdomen - Peritoneum, Epiploic Foramen & Celiac Trunk', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'anat-9', name: 'Pelvis & Perineum - Ischiorectal Fossa & Pudendal Canal', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'anat-10', name: 'Head & Neck - Cranial Nerves Foramina & Dural Sinuses', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'anat-11', name: 'Head & Neck - Triangles of Neck & Thyroid Gland', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'anat-12', name: 'Neuroanatomy - Brainstem, Pathways & Circle of Willis', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'anat-13', name: 'Embryology - Pharyngeal Arches, Pouches & Heart Dev', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'anat-14', name: 'General Histology - Epithelium, Cartilage & Bone', isHighYield: false, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false }
    ]
  },
  {
    id: 'physiology',
    name: 'Physiology',
    code: 'PHYS',
    phase: 'pre-clinical',
    weightage: 17,
    color: '#f97316', // Orange (cooler tone)
    iconName: 'HeartPulse',
    description: 'Organ systems, cellular transport, cardiac cycle, respiratory mechanics, and endocrine feedback loops.',
    highYieldTips: 'High focus on Wiggers cardiac cycle, Acid-base Nomograms, Nephron transport mechanisms, and Endocrine negative feedbacks.',
    topics: [
      { id: 'phys-1', name: 'General Physiology & Cell Membrane Transport', isHighYield: false, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'phys-2', name: 'Nerve-Muscle Physiology & Action Potentials', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'phys-3', name: 'CVS - Cardiac Cycle, Wiggers Diagram & PV Loops', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'phys-4', name: 'CVS - Blood Pressure Regulation & Shock', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'phys-5', name: 'Respiratory - Lung Volumes, Capacities & Compliance', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'phys-6', name: 'Respiratory - Oxygen-Hemoglobin Dissociation & Regulation', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'phys-7', name: 'Renal - GFR, Tubular Reabsorption & Countercurrent', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'phys-8', name: 'Renal - Acid-Base Balance & Davenport Diagram', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'phys-9', name: 'Endocrine - Pituitary, Thyroid & Adrenal Axis', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'phys-10', name: 'Endocrine - Calcium Metabolism (PTH, Calcitriol)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'phys-11', name: 'CNS - Sensory, Motor Tracts & Cerebellum / Basal Ganglia', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'phys-12', name: 'Special Senses - Auditory & Visual Pathways', isHighYield: false, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false }
    ]
  },
  {
    id: 'biochemistry',
    name: 'Biochemistry',
    code: 'BIO',
    phase: 'pre-clinical',
    weightage: 17,
    color: '#eab308', // Amber (warm accent, now in cool clinical palette)
    iconName: 'Dna',
    description: 'Enzyme kinetics, inborn errors of metabolism, vitamins, molecular biology, and lipid/carbohydrate pathways.',
    highYieldTips: 'High focus on Enzyme inhibitors (Lineweaver-Burk plots), Inborn errors (PKU, Alkaptonuria, MSUD), Glycogen storage diseases, and Vitamins deficiencies.',
    topics: [
      { id: 'bio-1', name: 'Enzyme Kinetics & Lineweaver-Burk Plots', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'bio-2', name: 'Carbohydrate Metabolism - Glycolysis, TCA & ETC Inhibitors', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'bio-3', name: 'Glycogen Storage Diseases (Von Gierke, Pompe, McArdle)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'bio-4', name: 'Lipid Metabolism - Beta-oxidation & Dyslipidemias', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'bio-5', name: 'Sphingolipidoses (Gaucher, Niemann-Pick, Tay-Sachs)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'bio-6', name: 'Amino Acid Disorders (PKU, Alkaptonuria, MSUD, Homocystinuria)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'bio-7', name: 'Heme Synthesis & Porphyrias', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'bio-8', name: 'Vitamins (Fat & Water Soluble) & Deficiencies', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'bio-9', name: 'Nucleotide Metabolism & Gout / Lesch-Nyhan', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'bio-10', name: 'Molecular Biology - Replication, Transcription & Translation', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'bio-11', name: 'Molecular Techniques (PCR, Blotting, Flow Cytometry)', isHighYield: false, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false }
    ]
  },

  // =================== PARA-CLINICAL (Paper 1 & 2) ===================
  {
    id: 'pathology',
    name: 'Pathology',
    code: 'PATH',
    phase: 'para-clinical',
    weightage: 13,
    color: '#84cc16', // Lime
    iconName: 'Microscope',
    description: 'General pathology, cell injury, inflammation, neoplasia, hematology, and systemic histopathology.',
    highYieldTips: 'High focus on Oncogenes/Tumor suppressors, Leukemias/Lymphomas immunophenotyping, Glomerulonephritis electron microscopy, and Amyloidosis.',
    topics: [
      { id: 'path-1', name: 'Cell Injury, Necrosis, Apoptosis & Amyloidosis', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'path-2', name: 'Acute & Chronic Inflammation & Wound Healing', isHighYield: false, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'path-3', name: 'Genetics & Chromosomal Disorders (Down, Turner, Klinefelter)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'path-4', name: 'Neoplasia - Hallmarks, Oncogenes & Tumor Markers', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'path-5', name: 'Hematology - Microcytic & Macrocytic Anemias', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'path-6', name: 'Hematology - Hemolytic Anemias & Hemoglobinopathies', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'path-7', name: 'Hematology - Acute & Chronic Leukemias, Translocations', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'path-8', name: 'Hematology - Hodgkin & Non-Hodgkin Lymphomas', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'path-9', name: 'Renal Pathology - Nephritic & Nephrotic Syndromes', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'path-10', name: 'CVS & Respiratory Pathology (Atherosclerosis, Vasculitis, ILD)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'path-11', name: 'GIT & Liver Pathology (Cirrhosis, Hepatitis, Polyps)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false }
    ]
  },
  {
    id: 'pharmacology',
    name: 'Pharmacology',
    code: 'PHARM',
    phase: 'para-clinical',
    weightage: 13,
    color: '#10b981', // Emerald
    iconName: 'Pill',
    description: 'General pharmacology, ANS, CVS, CNS, Antimicrobials, Chemotherapy, and Endocrine drugs.',
    highYieldTips: 'High focus on Drug of Choice (DOC), Anti-hypertensives in pregnancy, Antimicrobial mechanisms & side effects, and Antidotes.',
    topics: [
      { id: 'pharm-1', name: 'General Pharmacology - Kinetics, Dynamics & Biotransformation', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'pharm-2', name: 'ANS - Cholinergic & Anticholinergic Drugs (Atropine/OP Poisoning)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'pharm-3', name: 'ANS - Adrenergic Agonists & Alpha/Beta Blockers', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'pharm-4', name: 'CVS - Anti-hypertensives, Anti-arrhythmics & Heart Failure', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'pharm-5', name: 'CNS - Anti-epileptics (Teratogenicity & Spectrum)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'pharm-6', name: 'CNS - Antipsychotics, Antidepressants & Parkinson Drugs', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'pharm-7', name: 'Antimicrobials - Beta-lactams, Aminoglycosides, Macrolides', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'pharm-8', name: 'Antimicrobials - Anti-tubercular & Anti-malarial Regimens', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'pharm-9', name: 'Antimicrobials - Anti-retroviral & Anti-fungal Drugs', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'pharm-10', name: 'Antineoplastic Chemotherapy & Targeted Monoclonals', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'pharm-11', name: 'Endocrine - Anti-diabetics, Steroids & Thyroid Drugs', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'pharm-12', name: 'Toxicology, Antidotes & Teratogenic Drugs List', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false }
    ]
  },
  {
    id: 'microbiology',
    name: 'Microbiology',
    code: 'MICRO',
    phase: 'para-clinical',
    weightage: 13,
    color: '#06b6d4', // Cyan
    iconName: 'Bug',
    description: 'Bacteriology, virology, mycology, parasitology, immunology, and hospital infection control.',
    highYieldTips: 'High focus on Parasitology life cycles & egg morphologies, Viral hepatitis serology, HIV opportunistic infections, and Hypersensitivity reactions.',
    topics: [
      { id: 'micro-1', name: 'General Microbiology, Sterilization & Disinfection', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'micro-2', name: 'Immunology - Hypersensitivity, MHC & Immunoglobulins', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'micro-3', name: 'Gram Positive Cocci (Staph, Strep, Pneumo, Entero)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'micro-4', name: 'Gram Positive Bacilli (Coryne, Bacillus, Clostridium, Listeria)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'micro-5', name: 'Gram Negative Organisms (Enterobacteriaceae, Pseudomonas, Vibrio)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'micro-6', name: 'Mycobacteria (TB, Leprosy & Atypical Mycobacteria)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'micro-7', name: 'Virology - Hepatitis Viruses (HBV Serology)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'micro-8', name: 'Virology - HIV, Herpesviruses & Arboviruses (Dengue/Rabies)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'micro-9', name: 'Mycology - Dermatophytes, Candida, Aspergillus, Mucor', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'micro-10', name: 'Parasitology - Protozoa (Malaria, Amoeba, Leishmania, Giardia)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'micro-11', name: 'Parasitology - Helminths (Nematodes, Cestodes, Trematodes)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false }
    ]
  },
  {
    id: 'fmt',
    name: 'Forensic Medicine & Toxicology',
    code: 'FMT',
    phase: 'para-clinical',
    weightage: 10,
    color: '#64748b', // Slate
    iconName: 'ShieldAlert',
    description: 'Thanatology, mechanical injuries, firearm wounds, sexual jurisprudence, and toxic poisons.',
    highYieldTips: 'High focus on Post-mortem changes (Rigor mortis, Algor, Livor), Firearm entry/exit wounds, IPC/BNS sections, and Plant/Metallic poisons.',
    topics: [
      { id: 'fmt-1', name: 'Thanatology - Post-mortem Changes & Time Since Death', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'fmt-2', name: 'Identification - Dactylography, Dental & Age Estimation', isHighYield: false, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'fmt-3', name: 'Mechanical Injuries - Abrasions, Contusions, Lacerations, Incised', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'fmt-4', name: 'Firearm & Blast Injuries - Range, Wounds & Ballistics', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'fmt-5', name: 'Asphyxial Deaths - Hanging, Strangulation, Drowning', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'fmt-6', name: 'Sexual Jurisprudence, Virginity, Rape & POCSO', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'fmt-7', name: 'Medical Law, Ethics, Negligence & Legal Courts', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'fmt-8', name: 'General Toxicology & Agricultural Poisons (OP, Aluminum Phosphide)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'fmt-9', name: 'Plant & Animal Poisons (Dhatura, Snakebite, Scorpion)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'fmt-10', name: 'Heavy Metal Poisoning (Lead, Arsenic, Mercury)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false }
    ]
  },
  {
    id: 'psm',
    name: 'Community Medicine (PSM)',
    code: 'PSM',
    phase: 'para-clinical',
    weightage: 30, // Extremely high yield subject!
    color: '#0284c7', // Sky blue
    iconName: 'Users',
    description: 'Epidemiology, Biostatistics, National Health Programs, Vaccines, Nutrition, Environmental health, and Demography.',
    highYieldTips: 'MEGA HIGH YIELD (30 Marks). Must master National Immunization Schedule, Study designs (Cohort vs Case-Control, Odds ratio), Screening tests (Sensitivity/Specificity/PPV), and Health Programs (NTEP, NVBDCP).',
    topics: [
      { id: 'psm-1', name: 'Epidemiology - Study Designs (RCT, Cohort, Case-Control)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'psm-2', name: 'Epidemiology - Measures of Association (RR, OR, Attributable Risk)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'psm-3', name: 'Screening of Disease (Sensitivity, Specificity, PPV, NPV, ROC curve)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'psm-4', name: 'Biostatistics - Tests of Significance (t-test, Chi-square, ANOVA)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'psm-5', name: 'Biostatistics - Normal Distribution, Mean, Median, Mode & Skewness', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'psm-6', name: 'National Immunization Schedule (NIS) & Cold Chain Equipment', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'psm-7', name: 'Infectious Disease Epidemiology (TB, Malaria, Polio, COVID)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'psm-8', name: 'National Health Programs (NTEP, NVBDCP, NACP, RMNCH+A)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'psm-9', name: 'Nutrition & Health (Protein Energy Malnutrition, RDA, Vitamins)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'psm-10', name: 'Demography & Family Planning (Contraceptives Pearl Guide)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'psm-11', name: 'Environmental Health, Water Purification & Air Pollution', isHighYield: false, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'psm-12', name: 'Biomedical Waste Management (BMWM Color Coding Rules)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'psm-13', name: 'Occupational Health & Pneumoconiosis (Silicosis, Asbestosis)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false }
    ]
  },

  // =================== CLINICAL (Paper 2) ===================
  {
    id: 'ophthalmology',
    name: 'Ophthalmology',
    code: 'OPHTH',
    phase: 'clinical',
    weightage: 15,
    color: '#6366f1', // Indigo
    iconName: 'Eye',
    description: 'Cornea, lens & cataract, glaucoma, retina, uvea, optics, and strabismus.',
    highYieldTips: 'High focus on Cataract surgeries, Open vs Closed Angle Glaucoma, Diabetic Retinopathy staging, Retinoblastoma, and Corneal ulcers.',
    topics: [
      { id: 'oph-1', name: 'Optics, Refraction & Contact Lenses', isHighYield: false, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'oph-2', name: 'Conjunctiva & Trachoma (WHO Grading)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'oph-3', name: 'Cornea - Ulcers (Bacterial, Fungal, Viral) & Keratoconus', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'oph-4', name: 'Lens - Cataract Types, Surgical Techniques (Phaco/SICS)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'oph-5', name: 'Glaucoma - Primary Open Angle vs Angle Closure & Drugs', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'oph-6', name: 'Uvea - Anterior Uveitis, HLA-B27 & Endophthalmitis', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'oph-7', name: 'Retina - Diabetic Retinopathy, CRVO, CRAO & Retinal Detachment', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'oph-8', name: 'Neuro-ophthalmology & Visual Field Defects', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'oph-9', name: 'Strabismus, Amblyopia & Pediatric Tumors (Retinoblastoma)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false }
    ]
  },
  {
    id: 'ent',
    name: 'ENT (Otorhinolaryngology)',
    code: 'ENT',
    phase: 'clinical',
    weightage: 15,
    color: '#a855f7', // Purple
    iconName: 'Ear',
    description: 'Ear (Audiometry, Otitis Media, Otosclerosis), Nose (Epistaxis, Sinusitis), and Throat (Laryngeal tumors, Stridor).',
    highYieldTips: 'High focus on Tuning fork tests (Rinne/Weber), CSOM (Safe vs Unsafe/Cholesteatoma), Audiograms, Epistaxis Littles area, and Vocal cord palsy.',
    topics: [
      { id: 'ent-1', name: 'Ear - Pure Tone Audiometry & Tuning Fork Tests (Rinne/Weber)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'ent-2', name: 'Ear - ASOM, CSOM (Mucosal vs Squamosal/Cholesteatoma)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'ent-3', name: 'Ear - Otosclerosis, Meniere Disease & Acoustic Neuroma', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'ent-4', name: 'Ear - Facial Nerve Anatomy, Palsy & Bell Palsy', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'ent-5', name: 'Nose - Epistaxis (Kiesselbach Plexus & Woodruff Area)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'ent-6', name: 'Nose - Sinusitis, Polyps (Antrochoanal vs Ethmoidal) & Deviated Septum', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'ent-7', name: 'Nose - Juvenile Nasopharyngeal Angiofibroma (JNA)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'ent-8', name: 'Pharynx - Tonsillitis, Quinsy (Peritonsillar Abscess) & Retropharyngeal Abscess', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'ent-9', name: 'Larynx - Stridor, Croup, Epiglottitis & Carcinoma Larynx', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'ent-10', name: 'Larynx - Vocal Cord Paralysis & Tracheostomy Indications', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false }
    ]
  },
  {
    id: 'medicine',
    name: 'General Medicine',
    code: 'MED',
    phase: 'clinical',
    weightage: 35, // Mega clinical subject!
    color: '#ec4899', // Pink (cooler pink tone)
    iconName: 'Stethoscope',
    description: 'Cardiology, Pulmonology, Nephrology, Gastroenterology, Neurology, Endocrinology, Rheumatology, and Infectious Diseases.',
    highYieldTips: 'MEGA HIGH YIELD (35 Marks). Must master ECG patterns, Heart Failure (GDMT), Stroke localization, Acid-Base arterial blood gases, Diabetes guidelines, and Tuberculosis regimens.',
    topics: [
      { id: 'med-1', name: 'Cardiology - ECGs (STEMI, Arrhythmias, Heart Blocks, WPW)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'med-2', name: 'Cardiology - Acute Coronary Syndromes (ACS) & Heart Failure', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'med-3', name: 'Cardiology - Valvular Heart Diseases & Infective Endocarditis (Duke Criteria)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'med-4', name: 'Pulmonology - Asthma (GINA Guidelines), COPD (GOLD Guidelines)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'med-5', name: 'Pulmonology - Pneumonia (CURB-65) & Tuberculosis (NTEP Guidelines)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'med-6', name: 'Nephrology - AKI (KDIGO Criteria), CKD & Glomerular Diseases', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'med-7', name: 'Gastroenterology - Cirrhosis, Portal HTN, Ascites & Viral Hepatitis', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'med-8', name: 'Gastroenterology - Peptic Ulcer Disease & Inflammatory Bowel Disease (IBD)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'med-9', name: 'Neurology - Stroke (Ischemic vs Hemorrhagic & Thrombolysis Window)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'med-10', name: 'Neurology - Epilepsy Classification & Antiepileptic Drugs', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'med-11', name: 'Neurology - Meningitis, Encephalitis & Guillain-Barre Syndrome (GBS)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'med-12', name: 'Endocrinology - Diabetes Mellitus (Diagnostic Criteria & Emergencies DKA/HHS)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'med-13', name: 'Endocrinology - Thyroid Disorders (Graves, Hashimoto, Thyroid Storm)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'med-14', name: 'Endocrinology - Adrenal Disorders (Cushing, Addison, Pheochromocytoma)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'med-15', name: 'Infectious Diseases - Malaria, Typhoid, Dengue & HIV Opportunistic Infections', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'med-16', name: 'Rheumatology - SLE, Rheumatoid Arthritis & Vasculitis', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false }
    ]
  },
  {
    id: 'surgery',
    name: 'General Surgery',
    code: 'SURG',
    phase: 'clinical',
    weightage: 35, // Mega clinical subject!
    color: '#0284c7', // Teal-dark
    iconName: 'Scissors',
    description: 'Trauma & ATLS, burns, shock, surgical oncology, GI surgery, thyroid/breast lesions, and urology.',
    highYieldTips: 'MEGA HIGH YIELD (30 Marks). Must master ATLS protocols, Burns fluid Parkland formula, Breast cancer staging/triple assessment, Thyroid swellings, and Acute Abdomen.',
    topics: [
      { id: 'surg-1', name: 'Trauma & ATLS Protocol (Primary & Secondary Survey, FAST)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'surg-2', name: 'Burns Management - Parkland Formula & Rule of Nines', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'surg-3', name: 'Wound Healing, Surgical Site Infections & Suture Materials', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'surg-4', name: 'Thyroid & Parathyroid Surgery (Papillary/Follicular/Medullary CA)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'surg-5', name: 'Breast Diseases - Fibroadenoma, Breast Cancer Staging & Triple Assessment', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'surg-6', name: 'GI - Esophagus (Achalasia, Ca Esophagus) & Stomach (Peptic Ulcer, Ca Stomach)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'surg-7', name: 'GI - Small & Large Bowel Obstruction, Appendicitis (Alvarado score)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'surg-8', name: 'GI - Colorectal Cancer, Polyps & Perianal Conditions (Fistula, Fissure, Hemorrhoids)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'surg-9', name: 'Hepatobiliary - Gallstones, Cholecystitis, Choledochal Cyst & Pancreatitis', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'surg-10', name: 'Hernias - Inguinal (Direct vs Indirect), Femoral, Umbilical Repairs', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'surg-11', name: 'Vascular - Peripheral Arterial Disease, DVT & Varicose Veins', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'surg-12', name: 'Urology - Renal Stones, BPH, Renal Cell Carcinoma & Testicular Tumors', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false }
    ]
  },
  {
    id: 'obg',
    name: 'Obstetrics & Gynecology (OBGYN)',
    code: 'OBG',
    phase: 'clinical',
    weightage: 30, // Mega clinical subject!
    color: '#8b5cf6', // Fuchsia (cooler purple tone)
    iconName: 'Baby',
    description: 'Antenatal care, labor & delivery complications, postpartum hemorrhage, gynecological malignancies, and infertility.',
    highYieldTips: 'MEGA HIGH YIELD (30 Marks). Must master Partogram, PPH management steps, Hypertensive disorders of pregnancy (Preeclampsia/Eclampsia MgSO4), and Cervical/Ovarian cancers.',
    topics: [
      { id: 'obg-1', name: 'Normal Pregnancy - Antenatal Care, Physiological Changes & USG Dating', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'obg-2', name: 'Normal Labor - Stages of Labor, Mechanism & WHO Modified Partogram', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'obg-3', name: 'Abnormal Labor - Malpresentations (Breech, Face, Brow) & Obstructed Labor', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'obg-4', name: 'Hypertensive Disorders - Gestational HTN, Preeclampsia & Eclampsia (Pritchard/Zuspan MgSO4)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'obg-5', name: 'Antepartum Hemorrhage (APH) - Placenta Previa vs Abruptio Placentae', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'obg-6', name: 'Postpartum Hemorrhage (PPH) - Active Management (AMTSL) & Medical/Surgical Steps', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'obg-7', name: 'Medical Disorders in Pregnancy - Gestational Diabetes (DIPSI) & Anemia', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'obg-8', name: 'Multiple Gestation & Twin-to-Twin Transfusion Syndrome', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'obg-9', name: 'Gynecology - Menstrual Cycle Disorders & Abnormal Uterine Bleeding (PALM-COEIN)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'obg-10', name: 'Gynecology - PCOS (Rotterdam Criteria) & Endometriosis/Adenomyosis', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'obg-11', name: 'Gynecology - Cervical Cancer Screening (Pap Smear, HPV) & Staging (FIGO)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'obg-12', name: 'Gynecology - Endometrial & Ovarian Tumors / Germ Cell Tumors', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'obg-13', name: 'Infertility Evaluation, Ovulation Induction & ART', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false }
    ]
  },
  {
    id: 'pediatrics',
    name: 'Pediatrics',
    code: 'PEDS',
    phase: 'clinical',
    weightage: 15,
    color: '#0284c7', // Teal
    iconName: 'Smile',
    description: 'Growth & development, neonatal resuscitation, congenital heart diseases, pediatric nutrition, and genetic disorders.',
    highYieldTips: 'High focus on Developmental Milestones, Neonatal Resuscitation (NRP steps), Cyanotic vs Acyanotic Heart diseases, and Inborn errors of metabolism in newborns.',
    topics: [
      { id: 'ped-1', name: 'Growth & Anthropometry (Weight, Height, Head Circumference Velocity)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'ped-2', name: 'Developmental Milestones (Gross Motor, Fine Motor, Language, Social)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'ped-3', name: 'Neonatal Resuscitation (NRP 2020 Guidelines & APGAR Score)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'ped-4', name: 'Neonatal Jaundice (Physiological vs Pathological, Phototherapy)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'ped-5', name: 'Respiratory Distress in Newborn (RDS/HMD, TTNB, MAS)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'ped-6', name: 'Congenital Heart Diseases - Acyanotic (VSD, ASD, PDA, Coarctation)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'ped-7', name: 'Congenital Heart Diseases - Cyanotic (TOF, TGA, TAPVC, Truncus)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'ped-8', name: 'Pediatric Nutrition - Breastfeeding, SAM vs MAM, Rickets & Scurvy', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'ped-9', name: 'Pediatric Infectious Diseases (Measles, Mumps, Rubella, Chickenpox, Kawasaki)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'ped-10', name: 'Pediatric Nephrology (Minimal Change Disease, Nephroblastoma/Wilms Tumor)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false }
    ]
  },
  {
    id: 'orthopedics',
    name: 'Orthopedics',
    code: 'ORTHO',
    phase: 'clinical',
    weightage: 5,
    color: '#8b5cf6', // Violet (cooler purple tone)
    iconName: 'Bone',
    description: 'Fractures & dislocations, bone tumors, infections (Osteomyelitis, Pott spine), and pediatric deformities (CTEV).',
    highYieldTips: 'High focus on Fracture classification (Colles, Monteggia vs Galeazzi, Scaphoid), Bone tumors (Osteosarcoma, Ewings, Giant cell), and CTEV management.',
    topics: [
      { id: 'ortho-1', name: 'Upper Limb Fractures - Clavicle, Humerus, Supracondylar Humerus', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'ortho-2', name: 'Forearm Fractures - Monteggia vs Galeazzi, Colles vs Smiths & Scaphoid', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'ortho-3', name: 'Lower Limb Fractures - Neck of Femur, Intertrochanteric & Tibia', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'ortho-4', name: 'Joint Dislocations - Shoulder (Anterior vs Posterior), Hip (Posterior)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'ortho-5', name: 'Bone Tumors - Osteosarcoma, Ewing Sarcoma, Giant Cell Tumor, Osteoid Osteoma', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'ortho-6', name: 'Infections - Acute Osteomyelitis, Septic Arthritis & Pott Spine (TB Spine)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'ortho-7', name: 'Pediatric Ortho - CTEV (Clubfoot/Ponseti Method) & DDH (Ortolani/Barlow)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'ortho-8', name: 'Nerve Injuries associated with fractures & Compartment Syndrome', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false }
    ]
  },
  {
    id: 'dermatology',
    name: 'Dermatology',
    code: 'DERM',
    phase: 'clinical',
    weightage: 5,
    color: '#eab308', // Amber-warm (now in cool clinical palette)
    iconName: 'Sparkles',
    description: 'Papulosquamous disorders, vesiculobullous diseases, sexually transmitted infections, Hansen disease, and drug reactions.',
    highYieldTips: 'High focus on Psoriasis (Auspitz sign), Pemphigus Vulgaris vs Bullous Pemphigoid (Nikolsky sign), Hansen disease classification, and STI syndromes.',
    topics: [
      { id: 'derm-1', name: 'Papulosquamous - Psoriasis, Lichen Planus & Pityriasis Rosea', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'derm-2', name: 'Vesiculobullous - Pemphigus Vulgaris vs Bullous Pemphigoid & Dermatitis Herpetiformis', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'derm-3', name: 'Infections - Leprosy (Ridley-Jopling Classification & Reactions)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'derm-4', name: 'STIs - Syphilis, Chancroid, Donovanosis, LGV & Syndromic Management', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'derm-5', name: 'Fungal Infections - Tinea types, Pityriasis Versicolor, Scabies', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'derm-6', name: 'Drug Reactions - SJS / TEN, Erythema Multiforme & DRESS Syndrome', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'derm-7', name: 'Hair & Pigmentation Disorders - Vitiligo, Alopecia Areata, Melasma', isHighYield: false, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false }
    ]
  },
  {
    id: 'psychiatry',
    name: 'Psychiatry',
    code: 'PSYCH',
    phase: 'clinical',
    weightage: 5,
    color: '#059669', // Green
    iconName: 'Brain',
    description: 'Schizophrenia, mood disorders, anxiety & OCD, substance abuse, sleep disorders, and psychopharmacology.',
    highYieldTips: 'High focus on Schizophrenia first-rank symptoms (Schneider), Lithium toxicity, Bipolar disorder management, and Defense mechanisms.',
    topics: [
      { id: 'psych-1', name: 'Schizophrenia & Other Psychotic Disorders (Schneiderian First Rank Symptoms)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'psych-2', name: 'Mood Disorders - Major Depression, Bipolar Disorder & Suicide Risk', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'psych-3', name: 'Anxiety Disorders, Panic, Phobias & OCD', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'psych-4', name: 'Substance Use Disorders - Alcohol Withdrawal (Delirium Tremens) & Opioid Abuse', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'psych-5', name: 'Delirium vs Dementia (Alzheimer, Vascular, Lewy Body)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'psych-6', name: 'Eating Disorders (Anorexia vs Bulimia) & Sleep Disorders (Narcolepsy)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'psych-7', name: 'Psychopharmacology & Side Effects (NMS, Serotonin Syndrome, Tardive Dyskinesia)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false }
    ]
  },
  {
    id: 'radiology',
    name: 'Radiology',
    code: 'RAD',
    phase: 'clinical',
    weightage: 5,
    color: '#3b82f6', // Blue
    iconName: 'ScanLine',
    description: 'X-Ray, CT, MRI, Ultrasound features, Radiation safety, and classic imaging signs.',
    highYieldTips: 'High focus on Classic chest X-ray signs, Acute abdomen signs (Rigler sign, Coffee bean sign), Brain CT imaging (EDH vs SDH vs SAH), and Radiation units.',
    topics: [
      { id: 'rad-1', name: 'Physics, Radiation Units, Radiation Protection & Contrast Media Reactions', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'rad-2', name: 'Chest Imaging - Pneumothorax, Pleural Effusion, Tuberculosis & Masses', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'rad-3', name: 'Abdominal Radiology - Pneumoperitoneum, Bowel Obstruction Signs & Barium studies', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'rad-4', name: 'Neuroradiology - Intracranial Hemorrhages (EDH, SDH, SAH, ICH) on CT', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'rad-5', name: 'Musculoskeletal Imaging - Classic Bone Tumor Signs (Sunburst, Codman, Soap Bubble)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'rad-6', name: 'Obstetric & Gynecological Ultrasound (Biophysical Profile, Dating)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false }
    ]
  },
  {
    id: 'anesthesia',
    name: 'Anesthesia',
    code: 'ANES',
    phase: 'clinical',
    weightage: 5,
    color: '#0891b2', // Cyan-dark
    iconName: 'Gauge',
    description: 'General anesthesia agents, neuromuscular blockers, local & spinal anesthesia, airway management, and CPR.',
    highYieldTips: 'High focus on Malignant Hyperthermia (Dantrolene), Inhalational agents (MAC values), Spinal vs Epidural anesthesia complications, and ACLS cardiac arrest algorithms.',
    topics: [
      { id: 'anes-1', name: 'Pre-anesthetic Evaluation & ASA Physical Status Classification', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'anes-2', name: 'Airway Management - Mallampati Classification, Intubation & Difficult Airway', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'anes-3', name: 'Intravenous Anesthetics (Propofol, Ketamine, Etomidate, Thiopental)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'anes-4', name: 'Inhalational Anesthetics - MAC Values, Sevoflurane, Halothane & Malignant Hyperthermia', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'anes-5', name: 'Neuromuscular Blockers (Succinylcholine, Vecuronium, Rocuronium) & Reversal Agents', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'anes-6', name: 'Regional Anesthesia - Spinal vs Epidural (Landmarks, Complications, Local Anesthetic Toxicity)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'anes-7', name: 'CPR & ACLS 2020 Guidelines (Shockable vs Non-shockable Rhythms, Defibrillation)', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false },
      { id: 'anes-8', name: 'Anesthesia Machines, Vaporizers & Medical Gas Cylinders Color Coding', isHighYield: true, notesDone: false, qBankDone: false, r1Done: false, r2Done: false, r3Done: false }
    ]
  }
];
