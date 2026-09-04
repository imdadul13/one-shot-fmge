from __future__ import annotations

import os
import sys
import json
import time
from pathlib import Path
from google import genai
from google.genai import types

sys.stdout.reconfigure(line_buffering=True)  # type: ignore[union-attr]

# Auto-load .env
for _f in [".env", ".env.local"]:
    _p = Path(_f)
    if _p.exists():
        for _line in _p.read_text().splitlines():
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _v = _line.split("=", 1)
                os.environ.setdefault(_k.strip(), _v.strip().strip('"').strip("'"))
        break

PUBLIC_IMG_DIR = Path("public/images/ibq")
OUTPUT_FILE    = Path("data/ibq_bank.json")
OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

# ── Mapping: local filename → (subject, topic) ──────────────────────────────
IMAGE_METADATA = [
    # Radiology
    ("radiology_achalasia_bird_beak.jpg",     "Radiology",     "Bird beak appearance (Achalasia)"),
    ("radiology_double_bubble.jpg",           "Radiology",     "Double bubble sign (Duodenal Atresia)"),
    ("radiology_sigmoid_volvulus.jpg",        "Radiology",     "Coffee bean sign (Sigmoid Volvulus)"),
    ("radiology_pneumothorax.jpg",            "Radiology",     "Tension pneumothorax (Chest X-ray)"),
    ("radiology_colles_fracture.jpg",         "Radiology",     "Colles fracture (Wrist X-ray)"),
    ("radiology_pleural_effusion.jpg",        "Radiology",     "Pleural effusion (Blunting of costophrenic angle)"),
    ("radiology_miliary_tb.jpg",              "Radiology",     "Miliary tuberculosis (chest X-ray)"),
    # Pathology
    ("pathology_reed_sternberg.jpg",          "Pathology",     "Reed-Sternberg cells (Hodgkin Lymphoma)"),
    ("pathology_auer_rods.jpg",               "Pathology",     "Auer rods (Acute Myeloid Leukemia)"),
    ("pathology_psammoma_bodies.jpg",         "Pathology",     "Psammoma bodies (Papillary Thyroid Carcinoma)"),
    ("pathology_cmv_owl_eye.jpg",             "Pathology",     "Owl eye inclusion (Cytomegalovirus)"),
    ("pathology_tb_granuloma.jpg",            "Pathology",     "Caseous necrosis (Tuberculosis granuloma)"),
    ("pathology_sickle_cells.jpg",            "Pathology",     "Sickle cells (Sickle Cell Disease)"),
    ("pathology_fibrinoid_necrosis.jpg",      "Pathology",     "Fibrinoid necrosis (Malignant Hypertension)"),
    # Dermatology
    ("dermatology_gottron_papules.jpg",       "Dermatology",   "Gottron papules (Dermatomyositis)"),
    ("dermatology_pemphigus.jpg",             "Dermatology",   "Pemphigus vulgaris blisters"),
    ("dermatology_pityriasis_rosea.jpg",      "Dermatology",   "Herald patch (Pityriasis Rosea)"),
    ("dermatology_psoriasis.jpg",             "Dermatology",   "Psoriatic plaques (Psoriasis)"),
    ("dermatology_chickenpox.jpg",            "Dermatology",   "Vesicular rash (Chickenpox)"),
    # Microbiology
    ("micro_falciparum_ring_trophozoite.jpg", "Microbiology",  "Ring trophozoite (P. falciparum blood smear)"),
    ("micro_staph_gram_stain.jpg",            "Microbiology",  "Gram-positive cocci in clusters (Staphylococcus)"),
    # Ophthalmology
    ("ophthal_cherry_red_spot.jpg",           "Ophthalmology", "Cherry red spot (Central Retinal Artery Occlusion)"),
    ("ophthal_papilledema.jpg",               "Ophthalmology", "Papilledema (Raised ICP)"),
    ("ophthal_diabetic_retinopathy.jpg",      "Ophthalmology", "Diabetic retinopathy fundus (flame haemorrhages)"),
    ("ophthal_kayser_fleischer.jpg",          "Ophthalmology", "Kayser-Fleischer ring (Wilson Disease)"),
    # ENT
    ("ent_tympanic_perforation.jpg",          "ENT",           "Tympanic membrane perforation (Otoscopy)"),
    # Cardiology ECG
    ("cardio_afib_ecg.jpg",                   "Cardiology",    "Atrial fibrillation ECG (irregularly irregular)"),
    ("cardio_wpw_ecg.jpg",                    "Cardiology",    "WPW syndrome ECG (delta wave, short PR)"),
    ("cardio_complete_heart_block.jpg",       "Cardiology",    "Complete heart block ECG (AV dissociation)"),
    ("cardio_inferior_stemi.jpg",             "Cardiology",    "Inferior STEMI ECG (ST elevation II III aVF)"),
    # Obstetrics
    ("obs_hydatidiform_mole.jpg",             "Obstetrics",    "Hydatidiform mole (snowstorm appearance USS)"),
    # Surgery
    ("surgery_thyroid_goiter.jpg",            "Surgery",       "Thyroid goiter (neck swelling)"),
]


def generate_mcq(client, image_path: Path, subject: str, topic: str, max_retries: int = 5) -> dict:
    ext  = image_path.suffix.lower().lstrip(".")
    mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg",
            "png": "image/png",  "webp": "image/webp"}.get(ext, "image/jpeg")

    with open(image_path, "rb") as f:
        img_bytes = f.read()

    prompt = f"""You are a senior NBE question setter for the FMGE exam.
Examine the attached medical image carefully.
Target concept: {topic} ({subject}).

1. Identify the EXACT finding visible in this image.
2. Write a 2-sentence FMGE clinical vignette.
3. Give 4 plausible options (A–D) — no obviously silly distractors.
4. State the correct answer and a concise high-yield explanation with buzzwords.

Return ONLY valid JSON — no markdown fences:
{{
  "vignette": "A [age]-year-old [sex] presents with [chief complaint]. [Investigation] is shown in the image. What is the most likely diagnosis?",
  "options": [
    {{"id":"A","text":"..."}},{{"id":"B","text":"..."}},{{"id":"C","text":"..."}},{{"id":"D","text":"..."}}
  ],
  "correctOptionId": "A",
  "explanation": {{
    "imageFinding": "Exact description of what is visible",
    "highYieldBuzzwords": ["word1","word2","word3"],
    "detailedRationale": "Why correct answer, why each distractor is wrong."
  }}
}}"""

    for attempt in range(1, max_retries + 1):
        try:
            resp = client.models.generate_content(
                model="gemini-3.6-flash",
                contents=[
                    types.Part.from_bytes(data=img_bytes, mime_type=mime),
                    prompt,
                ],
                config=types.GenerateContentConfig(response_mime_type="application/json"),
            )

            text = resp.text.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            return json.loads(text.strip())

        except Exception as e:
            err_msg = str(e)
            if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg:
                wait_sec = 60
                print(f"   ⏳ Quota limit (429) on attempt {attempt}/{max_retries}. Waiting {wait_sec}s...")
                time.sleep(wait_sec)
                continue
            elif attempt < max_retries and "400" not in err_msg:
                print(f"   ⚠️ Transient error (attempt {attempt}/{max_retries}): {e}. Retrying in 10s...")
                time.sleep(10)
                continue
            else:
                raise e

    raise RuntimeError(f"Failed after {max_retries} attempts")


def run():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise EnvironmentError("Set GEMINI_API_KEY before running.")

    client = genai.Client(api_key=api_key)

    # Load existing bank
    bank: list[dict] = []
    if OUTPUT_FILE.exists():
        try:
            with open(OUTPUT_FILE) as f:
                bank = json.load(f)
            print(f"▶  Resuming — {len(bank)} entries already saved.\n")
        except Exception:
            bank = []

    already_done = {e["topic"] for e in bank}

    # Collect all local images that exist
    available = [
        (fname, subj, topic)
        for fname, subj, topic in IMAGE_METADATA
        if (PUBLIC_IMG_DIR / fname).exists()
    ]

    print(f"Found {len(available)}/{len(IMAGE_METADATA)} images locally.")
    missing = [t for fname, _, t in IMAGE_METADATA if not (PUBLIC_IMG_DIR / fname).exists()]
    if missing:
        print(f"Missing images: {len(missing)}")

    ok = skip = fail = 0
    total = len(available)

    for idx, (fname, subject, topic) in enumerate(available, 1):
        image_path = PUBLIC_IMG_DIR / fname

        if topic in already_done:
            print(f"[{idx:02d}/{total}] ↷  SKIP: {topic}")
            skip += 1
            continue

        print(f"\n[{idx:02d}/{total}] ── [{subject}] {topic}")
        print(f"   ↳  Generating MCQ via Gemini 3.6 Flash Vision...")

        try:
            mcq = generate_mcq(client, image_path, subject, topic)

            entry = {
                "id":              f"fmge_ibq_{len(bank)+1}",
                "subject":         subject,
                "topic":           topic,
                "imageSrc":        f"/images/ibq/{fname}",
                "vignette":        mcq["vignette"],
                "options":         mcq["options"],
                "correctOptionId": mcq["correctOptionId"],
                "explanation":     mcq["explanation"],
            }

            bank.append(entry)
            already_done.add(topic)
            ok += 1
            print(f"   ✓  Generated! Correct: {mcq['correctOptionId']}  |  Bank size: {len(bank)}")

            # Save after every success
            with open(OUTPUT_FILE, "w") as f:
                json.dump(bank, f, indent=2, ensure_ascii=False)

        except Exception as e:
            print(f"   ✗  Error: {e}")
            fail += 1

        time.sleep(13)  # 13s between calls to stay comfortably under 5 requests/min quota

    with open(OUTPUT_FILE, "w") as f:
        json.dump(bank, f, indent=2, ensure_ascii=False)

    print(f"\n{'='*60}")
    print(f" FMGE IBQ Bank — Phase 2 Complete")
    print(f"   ✓  Generated : {ok}")
    print(f"   ↷  Skipped   : {skip}")
    print(f"   ✗  Failed    : {fail}")
    print(f"   📚 Total      : {len(bank)} verified image-based questions")
    print(f"   📁 Output     : {OUTPUT_FILE.resolve()}")
    print(f"{'='*60}")



if __name__ == "__main__":
    run()
