from __future__ import annotations

import os
import sys
import json
import time
import requests
from pathlib import Path
from google import genai
from google.genai import types

# Force unbuffered output
sys.stdout.reconfigure(line_buffering=True)  # type: ignore[union-attr]

# Auto-load .env
for _env_file in [".env", ".env.local", "../.env"]:
    _p = Path(_env_file)
    if _p.exists():
        for _line in _p.read_text().splitlines():
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _v = _line.split("=", 1)
                os.environ.setdefault(_k.strip(), _v.strip().strip('"').strip("'"))
        break

PUBLIC_IMG_DIR = Path("public/images/ibq")
OUTPUT_FILE = Path("data/ibq_bank.json")
PUBLIC_IMG_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# HIGH-YIELD FMGE TARGET LIST ACROSS MULTIPLE MODALITIES WITH FALLBACK QUERIES
# ─────────────────────────────────────────────────────────────────────────────
FMGE_TARGETS = [
    # ── Radiology (X-rays, Barium, CT)
    {
        "subject": "Radiology",
        "topic": "Bird beak appearance (Achalasia)",
        "queries": ["Achalasia bird beak", "Achalasia barium", "Achalasia"]
    },
    {
        "subject": "Radiology",
        "topic": "Double bubble sign (Duodenal Atresia)",
        "queries": ["Duodenal atresia double bubble", "Double bubble sign xray"]
    },
    {
        "subject": "Radiology",
        "topic": "Coffee bean sign (Sigmoid Volvulus)",
        "queries": ["Sigmoid volvulus", "Coffee bean sign volvulus"]
    },
    {
        "subject": "Radiology",
        "topic": "Pneumoperitoneum (Free air under diaphragm)",
        "queries": ["Pneumoperitoneum diaphragm", "Free air under diaphragm X-ray"]
    },
    {
        "subject": "Radiology",
        "topic": "Tension pneumothorax (Chest X-ray)",
        "queries": ["Pneumothorax X-ray", "Tension pneumothorax", "Pneumothorax"]
    },
    {
        "subject": "Radiology",
        "topic": "Colles fracture (Dinner fork deformity / Wrist X-ray)",
        "queries": ["Colles fracture", "Radius fracture xray", "Dinner fork deformity"]
    },
    {
        "subject": "Radiology",
        "topic": "Pleural effusion (Costophrenic blunting)",
        "queries": ["Pleural effusion X-ray", "Pleural effusion radiograph", "Pleural effusion"]
    },
    {
        "subject": "Radiology",
        "topic": "Miliary tuberculosis (Millet seed opacities)",
        "queries": ["Miliary tuberculosis X-ray", "Miliary tuberculosis radiograph", "Miliary tuberculosis"]
    },

    # ── Pathology & Histology (Microscopy, Biopsy)
    {
        "subject": "Pathology",
        "topic": "Reed-Sternberg cells (Hodgkin Lymphoma)",
        "queries": ["Hodgkin Disease Reed-Sternberg Cell", "Reed-Sternberg", "Hodgkin lymphoma histology"]
    },
    {
        "subject": "Pathology",
        "topic": "Auer rods (Acute Myeloid Leukemia)",
        "queries": ["AML-M2", "Auer rods smear", "Acute myeloid leukemia Auer rod"]
    },
    {
        "subject": "Pathology",
        "topic": "Psammoma bodies (Papillary Thyroid Ca)",
        "queries": ["Cytopathology of papillary thyroid carcinoma", "Psammoma bodies thyroid", "Psammoma body"]
    },
    {
        "subject": "Pathology",
        "topic": "Owl eye inclusion (Cytomegalovirus)",
        "queries": ["CMV encephalitis owl eye", "Cytomegalovirus inclusion", "CMV owl eye"]
    },
    {
        "subject": "Pathology",
        "topic": "Caseous necrosis (Tuberculosis granuloma)",
        "queries": ["Caseous necrosis granuloma", "Tuberculoid granuloma", "Caseous necrosis"]
    },
    {
        "subject": "Pathology",
        "topic": "Sickle cells (Sickle Cell Anemia)",
        "queries": ["Sickle cell 01", "Sickle cell smear", "Sickle cell anemia blood film"]
    },
    {
        "subject": "Pathology",
        "topic": "Crescentic glomerulonephritis (RPGN)",
        "queries": ["Crescentic glomerulonephritis", "Rapidly progressive glomerulonephritis histology"]
    },

    # ── Dermatology (Clinical Lesions & Manifestations)
    {
        "subject": "Dermatology",
        "topic": "Target lesions (Erythema Multiforme)",
        "queries": ["Erythema Multiforme target lesions", "Erythema multiforme", "Target lesion skin"]
    },
    {
        "subject": "Dermatology",
        "topic": "Gottron papules (Dermatomyositis)",
        "queries": ["Dermatomyositis 2", "Gottron papules", "Dermatomyositis knuckles"]
    },
    {
        "subject": "Dermatology",
        "topic": "Pemphigus vulgaris (Flaccid bullae & Acantholysis)",
        "queries": ["Pemphigus vulgaris blister", "Pemphigus vulgaris", "Pemphigus"]
    },
    {
        "subject": "Dermatology",
        "topic": "Herald patch (Pityriasis Rosea)",
        "queries": ["Pityriasis rosea", "Pit rosea", "Herald patch"]
    },
    {
        "subject": "Dermatology",
        "topic": "Psoriatic plaques (Psoriasis)",
        "queries": ["Psoriasis", "Psoriatic plaque", "Psoriasis vulgaris"]
    },
    {
        "subject": "Dermatology",
        "topic": "Chickenpox vesicular rash (Dewdrops on rose petal)",
        "queries": ["Chickenpox", "Varicella rash", "Chicken pox vesicles"]
    },

    # ── Microbiology (Stains, Parasites & Smears)
    {
        "subject": "Microbiology",
        "topic": "Banana-shaped gametocyte (P. falciparum)",
        "queries": ["Plasmodium falciparum 01", "Plasmodium falciparum gametocyte", "Falciparum gametocyte"]
    },
    {
        "subject": "Microbiology",
        "topic": "Ring trophozoites (P. falciparum malaria)",
        "queries": ["Malaria Plasmodium falciparum blood smear", "Plasmodium falciparum ring", "Malaria blood film"]
    },
    {
        "subject": "Microbiology",
        "topic": "Gram-positive cocci in clusters (Staphylococcus)",
        "queries": ["Staphylococcus aureus VISA", "Staphylococcus aureus Gram", "Gram-positive cocci"]
    },
    {
        "subject": "Microbiology",
        "topic": "Acid-fast bacilli (Tuberculosis ZN stain)",
        "queries": ["Mycobacterium tuberculosis Ziehl", "Acid-fast bacilli", "Ziehl-Neelsen stain"]
    },

    # ── Ophthalmology (Funduscopy & Cornea)
    {
        "subject": "Ophthalmology",
        "topic": "Cherry red spot (Central Retinal Artery Occlusion)",
        "queries": ["Central retinal artery occlusion", "Cherry red spot retina", "CRAO fundus"]
    },
    {
        "subject": "Ophthalmology",
        "topic": "Papilledema (Raised Intracranial Pressure)",
        "queries": ["Papilledema optic disc", "Papilledema fundus", "Optic disc swelling"]
    },
    {
        "subject": "Ophthalmology",
        "topic": "Diabetic retinopathy fundus (Microaneurysms)",
        "queries": ["Proliferative diabetic retinopathy", "Diabetic retinopathy fundus", "Diabetic Retinopathy"]
    },
    {
        "subject": "Ophthalmology",
        "topic": "Kayser-Fleischer ring (Wilson Disease)",
        "queries": ["Kayser-Fleischer ring", "Kayser Fleischer ring cornea", "Wilson disease cornea"]
    },

    # ── ENT (Otoscopy)
    {
        "subject": "ENT",
        "topic": "Tympanic membrane perforation",
        "queries": ["Tympanic membrane perforation", "Tympanic perforation otoscopy", "Tympanic membrane"]
    },

    # ── Cardiology & ECG Strips
    {
        "subject": "Cardiology",
        "topic": "Atrial fibrillation ECG (irregularly irregular)",
        "queries": ["Afib ecg", "Atrial fibrillation ECG", "Atrial fibrillation rhythm"]
    },
    {
        "subject": "Cardiology",
        "topic": "WPW syndrome ECG (Delta wave & Short PR)",
        "queries": ["WPW ECG", "Wolff-Parkinson-White ECG", "Delta wave ECG"]
    },
    {
        "subject": "Cardiology",
        "topic": "Complete 3rd degree heart block ECG (AV dissociation)",
        "queries": ["Complete heart block ECG", "3rd degree heart block", "AV dissociation ECG"]
    },
    {
        "subject": "Cardiology",
        "topic": "Inferior STEMI ECG (ST elevation II III aVF)",
        "queries": ["Inferior STEMI", "STEMI ECG", "ST elevation myocardial infarction ECG"]
    },

    # ── Obstetrics & Gynecology (Ultrasound)
    {
        "subject": "Obstetrics",
        "topic": "Hydatidiform mole (Snowstorm ultrasound)",
        "queries": ["Hydatidiform mole ultrasound", "Molar pregnancy ultrasound", "Hydatidiform mole"]
    },

    # ── Surgery & Gross Pathology
    {
        "subject": "Surgery",
        "topic": "Thyroid multinodular goiter (Anterior neck swelling)",
        "queries": ["Goiter thyroid", "Struma goiter", "Thyroid goitre"]
    },
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}


def search_and_download_image(queries: list[str], target_path: Path) -> bool:
    """Automated media fetcher using Wikimedia Commons API with fallback search queries."""
    if target_path.exists():
        data = target_path.read_bytes()
        if data.startswith(b"\xff\xd8\xff") or data.startswith(b"\x89PNG") or data.startswith(b"RIFF"):
            return True
        target_path.unlink(missing_ok=True)

    url = "https://commons.wikimedia.org/w/api.php"

    for query in queries:
        params = {
            "action": "query",
            "generator": "search",
            "gsrsearch": query,
            "gsrnamespace": "6",
            "gsrlimit": "4",
            "prop": "imageinfo",
            "iiprop": "url|mime|size",
            "format": "json",
        }

        try:
            r = requests.get(url, params=params, headers=HEADERS, timeout=12)
            if r.status_code != 200:
                continue
            try:
                data = r.json()
            except Exception:
                continue

            pages = data.get("query", {}).get("pages", {})

            for pid, pdata in pages.items():
                for info in pdata.get("imageinfo", []):
                    img_url = info.get("url", "")
                    mime = info.get("mime", "")
                    size = info.get("size", 0)

                    if mime in ("image/jpeg", "image/png", "image/webp") and size > 4000:
                        img_resp = requests.get(img_url, headers=HEADERS, stream=True, timeout=20)
                        if img_resp.status_code == 200:
                            content = img_resp.content
                            # Strictly verify image binary headers
                            if content.startswith(b"\xff\xd8\xff") or content.startswith(b"\x89PNG") or content.startswith(b"RIFF"):
                                target_path.write_bytes(content)
                                return True
        except Exception as e:
            print(f"   ⚠️ Search error for '{query}': {e}")

        time.sleep(1)

    return False


def generate_mcq(client, image_path: Path, subject: str, topic: str, max_retries: int = 4) -> dict:
    """Inspect image with Gemini Vision and generate an NBE-standard clinical vignette MCQ."""
    ext = image_path.suffix.lower().lstrip(".")
    mime = "image/png" if ext == "png" else "image/jpeg"

    with open(image_path, "rb") as f:
        img_bytes = f.read()

    prompt = f"""You are a senior National Board of Examinations (NBE) question setter for the FMGE medical exam.
Examine the attached medical image carefully.
Target concept: {topic} ({subject}).

Instructions:
1. Identify the EXACT diagnostic finding, sign, or histological structure visible in this image.
2. Write a realistic 2-3 sentence FMGE clinical vignette presenting a patient scenario.
3. Formulate 4 single-best-response options (A, B, C, D) with plausible, FMGE-level distractors.
4. Specify the correct answer and a high-yield explanation with pathognomonic buzzwords.

Return ONLY valid JSON — no markdown fences:
{{
  "vignette": "A [age]-year-old [sex] presents with [chief complaint]. [Investigation] is shown in the image. What is the most likely diagnosis / next best step?",
  "options": [
    {{"id":"A","text":"..."}},{{"id":"B","text":"..."}},{{"id":"C","text":"..."}},{{"id":"D","text":"..."}}
  ],
  "correctOptionId": "A",
  "explanation": {{
    "imageFinding": "Exact description of what is visible in this image",
    "highYieldBuzzwords": ["Buzzword 1", "Buzzword 2", "Buzzword 3"],
    "detailedRationale": "Why the correct answer is correct and why each distractor is wrong."
  }}
}}"""

    models_to_try = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.6-flash"]

    for attempt in range(1, max_retries + 1):
        for model_name in models_to_try:
            try:
                resp = client.models.generate_content(
                    model=model_name,
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
                    print(f"   ⏳ Rate limit on {model_name}. Waiting 20s...")
                    time.sleep(20)
                    continue
                elif "503" in err_msg or "UNAVAILABLE" in err_msg:
                    continue
                elif attempt < max_retries and "400" not in err_msg:
                    time.sleep(4)
                    continue
                else:
                    pass

    raise RuntimeError(f"Failed to generate MCQ after {max_retries} attempts across models")


def run():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise EnvironmentError("GEMINI_API_KEY is not set.")

    client = genai.Client(api_key=api_key)

    # Load existing bank to resume
    bank: list[dict] = []
    if OUTPUT_FILE.exists():
        try:
            with open(OUTPUT_FILE) as f:
                bank = json.load(f)
            print(f"▶ Resuming — {len(bank)} verified questions already in bank.\n")
        except Exception:
            bank = []

    already_done = {e["topic"] for e in bank}
    total = len(FMGE_TARGETS)
    ok = skip = fail = 0

    print(f"=== Starting FMGE Automated IBQ Ingestion Pipeline ({total} Targets) ===")

    for idx, item in enumerate(FMGE_TARGETS, 1):
        subj = item["subject"]
        topic = item["topic"]
        queries = item["queries"]

        if topic in already_done:
            print(f"[{idx:02d}/{total}] ↷ SKIP (already in bank): [{subj}] {topic}")
            skip += 1
            continue

        print(f"\n[{idx:02d}/{total}] ── [{subj}] {topic}")

        # Construct clean filename
        clean_name = topic.split("(")[0].strip().lower().replace(" ", "_").replace("-", "_")[:32]
        filename = f"{subj.lower()}_{clean_name}.jpg"
        img_path = PUBLIC_IMG_DIR / filename

        # Step 1: Automated Media Fetcher from Wikimedia Commons
        print(f"   ↳ Fetching medical media via Commons API (queries: {queries[:2]})...")
        if not search_and_download_image(queries, img_path):
            print(f"   ✗ Image not found on Commons. Skipping.")
            fail += 1
            time.sleep(1)
            continue

        print(f"   ✓ Image ready: {filename} ({img_path.stat().st_size} bytes)")
        time.sleep(1)

        # Step 2: Gemini Vision Inspection & MCQ Generation
        print(f"   ↳ Inspecting image & generating FMGE MCQ via Gemini Vision...")
        try:
            mcq = generate_mcq(client, img_path, subj, topic)

            entry = {
                "id": f"fmge_ibq_{len(bank) + 1}",
                "subject": subj,
                "topic": topic,
                "imageSrc": f"/images/ibq/{filename}",
                "vignette": mcq["vignette"],
                "options": mcq["options"],
                "correctOptionId": mcq["correctOptionId"],
                "explanation": mcq["explanation"],
            }

            bank.append(entry)
            already_done.add(topic)
            ok += 1
            print(f"   ✓ Generated! Answer: [{mcq['correctOptionId']}] | Bank total: {len(bank)}")

            # Checkpoint save after every entry
            with open(OUTPUT_FILE, "w") as f:
                json.dump(bank, f, indent=2, ensure_ascii=False)

        except Exception as e:
            print(f"   ✗ Generation error: {e}")
            fail += 1

        time.sleep(3)

    with open(OUTPUT_FILE, "w") as f:
        json.dump(bank, f, indent=2, ensure_ascii=False)

    print(f"\n{'='*60}")
    print(f" FMGE IBQ Bank Pipeline Complete!")
    print(f"   ✓ Newly Generated : {ok}")
    print(f"   ↷ Skipped (Prior) : {skip}")
    print(f"   ✗ Failed / Missing: {fail}")
    print(f"   📚 Total In Bank   : {len(bank)} verified questions")
    print(f"   📁 Bank Output    : {OUTPUT_FILE.resolve()}")
    print(f"{'='*60}")


if __name__ == "__main__":
    run()
