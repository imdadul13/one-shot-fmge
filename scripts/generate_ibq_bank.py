from __future__ import annotations

import os
import json
import requests
from pathlib import Path
from typing import Optional
from google import genai
from google.genai import types

# Auto-load .env file if present
for _env_file in [".env", ".env.local", "../.env"]:
    _env_path = Path(_env_file)
    if _env_path.exists():
        for _line in _env_path.read_text().splitlines():
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _v = _line.split("=", 1)
                os.environ.setdefault(_k.strip(), _v.strip().strip('"').strip("'"))
        break

# Setup folders
PUBLIC_IMG_DIR = Path("public/images/ibq")
OUTPUT_FILE = Path("data/ibq_bank.json")
PUBLIC_IMG_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

# 1. High-Yield FMGE Target List
FMGE_HIGH_YIELD_TARGETS = [
    # Radiology
    {"subject": "Radiology", "topic": "Bird beak appearance (Achalasia)", "query": "Achalasia bird beak sign barium swallow"},
    {"subject": "Radiology", "topic": "Steeple sign (Croup)", "query": "Steeple sign croup neck xray"},
    {"subject": "Radiology", "topic": "Thumb sign (Epiglottitis)", "query": "Thumb sign epiglottitis lateral neck xray"},
    {"subject": "Radiology", "topic": "Double bubble sign", "query": "Double bubble sign duodenal atresia xray"},
    {"subject": "Radiology", "topic": "Coffee bean sign", "query": "Sigmoid volvulus coffee bean sign abdominal xray"},
    {"subject": "Radiology", "topic": "Sail sign (Thymic Shadow)", "query": "Sail sign thymic shadow pediatric chest xray"},
    {"subject": "Radiology", "topic": "String of beads sign", "query": "String of beads sign small bowel obstruction xray"},
    {"subject": "Radiology", "topic": "Pneumoperitoneum - free air under diaphragm", "query": "Pneumoperitoneum free air under diaphragm erect xray"},
    {"subject": "Radiology", "topic": "Tension pneumothorax", "query": "Tension pneumothorax chest xray mediastinal shift"},

    # Pathology & Hematology
    {"subject": "Pathology", "topic": "Reed-Sternberg cells", "query": "Reed Sternberg cell Hodgkin lymphoma histology"},
    {"subject": "Pathology", "topic": "Auer rods (AML)", "query": "Auer rods acute myeloid leukemia blood smear"},
    {"subject": "Pathology", "topic": "Psammoma bodies", "query": "Psammoma bodies papillary thyroid carcinoma histology"},
    {"subject": "Pathology", "topic": "Kimmelstiel-Wilson lesions", "query": "Kimmelstiel Wilson nodules diabetic nephropathy histology"},
    {"subject": "Pathology", "topic": "Subepithelial humps (PSGN)", "query": "Subepithelial humps post streptococcal glomerulonephritis electron microscopy"},
    {"subject": "Pathology", "topic": "Podocyte foot process effacement (MCD)", "query": "Podocyte foot process effacement minimal change disease electron microscopy"},
    {"subject": "Pathology", "topic": "Fibrinoid necrosis (Malignant hypertension)", "query": "Fibrinoid necrosis malignant hypertension kidney histology"},
    {"subject": "Pathology", "topic": "Caseous necrosis (Tuberculosis)", "query": "Caseous necrosis tuberculosis granuloma histology"},

    # Dermatology
    {"subject": "Dermatology", "topic": "Target lesions (Erythema multiforme)", "query": "Target lesions erythema multiforme skin"},
    {"subject": "Dermatology", "topic": "Wickham striae", "query": "Wickham striae lichen planus oral skin"},
    {"subject": "Dermatology", "topic": "Gottron papules", "query": "Gottron papules dermatomyositis hands"},
    {"subject": "Dermatology", "topic": "Nikolsky sign (Pemphigus)", "query": "Pemphigus vulgaris blister bullous skin lesion"},
    {"subject": "Dermatology", "topic": "Herald patch (Pityriasis rosea)", "query": "Pityriasis rosea herald patch skin"},
    {"subject": "Dermatology", "topic": "Koplik spots (Measles)", "query": "Koplik spots measles oral mucosa"},

    # Microbiology & Parasitology
    {"subject": "Microbiology", "topic": "Negri bodies (Rabies)", "query": "Negri bodies rabies histology Purkinje cell"},
    {"subject": "Microbiology", "topic": "Safety pin appearance (Yersinia)", "query": "Yersinia pestis safety pin appearance Wayson stain bipolar"},
    {"subject": "Microbiology", "topic": "Trophozoites of Giardia", "query": "Giardia lamblia trophozoite stool smear Giemsa"},
    {"subject": "Microbiology", "topic": "Owl eye inclusion (CMV)", "query": "Owl eye inclusion cytomegalovirus CMV histology"},
    {"subject": "Microbiology", "topic": "Banana-shaped gametocyte (Malaria)", "query": "Plasmodium falciparum gametocyte crescent banana blood smear"},

    # Ophthalmology & ENT
    {"subject": "Ophthalmology", "topic": "Kayser-Fleischer ring (Wilson disease)", "query": "Kayser Fleischer ring cornea slit lamp Wilson disease"},
    {"subject": "Ophthalmology", "topic": "Cherry red spot (CRAO)", "query": "Cherry red spot central retinal artery occlusion fundus photo"},
    {"subject": "Ophthalmology", "topic": "Roth spots (IE)", "query": "Roth spots infective endocarditis fundus retina"},
    {"subject": "ENT", "topic": "Schwartze sign (Otosclerosis)", "query": "Schwartze sign otosclerosis flamingo pink tympanic membrane otoscopy"},
    {"subject": "ENT", "topic": "Cholesteatoma", "query": "Cholesteatoma ear attic perforation squamous epithelium"},

    # Cardiology ECG
    {"subject": "Cardiology", "topic": "Complete 3rd degree heart block ECG", "query": "Complete heart block third degree AV dissociation ECG"},
    {"subject": "Cardiology", "topic": "Inferior STEMI ECG (ST elevation II, III, aVF)", "query": "Inferior STEMI ST elevation leads II III aVF ECG"},
    {"subject": "Cardiology", "topic": "WPW syndrome ECG (Delta wave)", "query": "Wolff Parkinson White WPW delta wave short PR ECG"},
    {"subject": "Cardiology", "topic": "Mobitz type II (2nd degree AV block)", "query": "Mobitz type II second degree AV block ECG fixed PR dropped beat"},

    # Surgery
    {"subject": "Surgery", "topic": "Carcinoid tumor (silver stain)", "query": "Carcinoid tumor argentaffin cells silver stain Kulchitsky"},
    {"subject": "Surgery", "topic": "Lump in neck (thyroid swelling)", "query": "Midline neck swelling thyroid goiter clinical photo"},
]


def search_wikimedia_image(query: str) -> str | None:
    """Search Wikimedia Commons for an image URL matching the query."""
    url = "https://commons.wikimedia.org/w/api.php"
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": f"file:{query}",
        "gsrlimit": 5,
        "prop": "imageinfo",
        "iiprop": "url|mime|extmetadata",
    }
    headers = {"User-Agent": "FMGEPersonalBot/2.0 (medical_study_tool)"}

    try:
        res = requests.get(url, params=params, headers=headers, timeout=15).json()
        pages = res.get("query", {}).get("pages", {})
        for _, page in pages.items():
            for info in page.get("imageinfo", []):
                img_url = info.get("url", "")
                mime = info.get("mime", "")
                # Accept common image types
                if mime.startswith("image/") or any(
                    img_url.lower().endswith(ext)
                    for ext in [".jpg", ".jpeg", ".png", ".webp", ".gif"]
                ):
                    return img_url
    except Exception as e:
        print(f"  Wikimedia fetch error for '{query}': {e}")
    return None


def generate_verified_mcq(client, image_path: Path, subject: str, target_topic: str) -> dict:
    """Use Gemini Vision AI to analyze the image and generate an FMGE MCQ."""
    with open(image_path, "rb") as f:
        img_bytes = f.read()

    # Detect mime type from extension
    ext = image_path.suffix.lower().lstrip(".")
    mime_map = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
                "webp": "image/webp", "gif": "image/gif"}
    mime_type = mime_map.get(ext, "image/jpeg")

    system_prompt = f"""You are a senior National Board of Examinations (NBE) medical question setter for the FMGE exam.
Analyze the attached medical image carefully.
Target Concept: {target_topic} ({subject}).

Instructions:
1. Inspect the image carefully and identify the exact clinical finding, radiological sign, histopathological feature, or dermatological lesion visible.
2. Write a real FMGE-style clinical vignette presenting a patient scenario where this image is the diagnostic investigation.
3. Formulate 4 single-best-response options (A, B, C, D) with 3 clinically sound, FMGE-level distractors (no obviously wrong options).
4. Specify the correct option and provide a high-yield explanation with pathognomonic buzzwords.

Output ONLY valid JSON matching this exact schema:
{{
  "vignette": "A [age]-year-old [gender] presents with [symptoms]. [Investigation] is performed and the finding is shown in the image. What is the most likely diagnosis / next step / causative agent?",
  "options": [
    {{"id": "A", "text": "Clinically distinct option 1"}},
    {{"id": "B", "text": "Clinically distinct option 2"}},
    {{"id": "C", "text": "Clinically distinct option 3"}},
    {{"id": "D", "text": "Clinically distinct option 4"}}
  ],
  "correctOptionId": "A",
  "explanation": {{
    "imageFinding": "Exact description of what is visible in the provided image",
    "highYieldBuzzwords": ["Buzzword 1", "Buzzword 2", "Buzzword 3"],
    "detailedRationale": "Full clinical breakdown explaining the diagnosis, pathognomonic finding, and why each distractor is incorrect."
  }}
}}"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(data=img_bytes, mime_type=mime_type),
            system_prompt,
        ],
        config=types.GenerateContentConfig(response_mime_type="application/json"),
    )

    return json.loads(response.text)


def download_image(img_url: str, local_path: Path) -> bool:
    """Download an image from a URL to a local path."""
    try:
        r = requests.get(
            img_url,
            headers={"User-Agent": "FMGEPersonalBot/2.0"},
            stream=True,
            timeout=30,
        )
        if r.status_code == 200:
            with open(local_path, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
            return True
        else:
            print(f"  Download failed (HTTP {r.status_code}): {img_url}")
    except Exception as e:
        print(f"  Download error: {e}")
    return False


def run():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "GEMINI_API_KEY environment variable is not set. "
            "Run: export GEMINI_API_KEY=your_key_here"
        )

    client = genai.Client(api_key=api_key)

    # Load existing bank (resume if partially done)
    bank: list[dict] = []
    if OUTPUT_FILE.exists():
        try:
            with open(OUTPUT_FILE, "r") as f:
                bank = json.load(f)
            print(f"Resuming — {len(bank)} entries already in bank.\n")
        except Exception:
            bank = []

    already_done = {entry["topic"] for entry in bank}

    success_count = 0
    skip_count = 0
    fail_count = 0

    for idx, item in enumerate(FMGE_HIGH_YIELD_TARGETS, 1):
        subject = item["subject"]
        topic = item["topic"]
        query = item["query"]

        if topic in already_done:
            print(f"[{idx}/{len(FMGE_HIGH_YIELD_TARGETS)}] SKIP (already done): {topic}")
            skip_count += 1
            continue

        print(f"\n[{idx}/{len(FMGE_HIGH_YIELD_TARGETS)}] Processing: [{subject}] {topic}")

        # Step 1: Find image on Wikimedia Commons
        img_url = search_wikimedia_image(query)
        if not img_url:
            print(f"  ↳ No image found for query: '{query}'. Skipping.")
            fail_count += 1
            continue

        ext = img_url.split(".")[-1].split("?")[0].lower()
        if ext not in ("jpg", "jpeg", "png", "webp", "gif"):
            ext = "jpg"

        safe_topic = topic.lower().replace(" ", "_").replace("(", "").replace(")", "")[:35]
        filename = f"{subject.lower()}_{safe_topic}.{ext}"
        local_path = PUBLIC_IMG_DIR / filename

        # Step 2: Download image
        print(f"  ↳ Downloading from: {img_url[:80]}...")
        if not download_image(img_url, local_path):
            fail_count += 1
            continue

        # Step 3: Vision analysis + MCQ generation via Gemini
        print(f"  ↳ Generating FMGE MCQ via Gemini Vision AI...")
        try:
            mcq_data = generate_verified_mcq(client, local_path, subject, topic)

            entry = {
                "id": f"fmge_ibq_{len(bank) + 1}",
                "subject": subject,
                "topic": topic,
                "imageSrc": f"/images/ibq/{filename}",
                "imageUrl": img_url,
                "vignette": mcq_data["vignette"],
                "options": mcq_data["options"],
                "correctOptionId": mcq_data["correctOptionId"],
                "explanation": mcq_data["explanation"],
            }

            bank.append(entry)
            already_done.add(topic)
            success_count += 1
            print(f"  ✓ Verified and added. Correct answer: {mcq_data['correctOptionId']}")

            # Save after each success to preserve progress
            with open(OUTPUT_FILE, "w") as f:
                json.dump(bank, f, indent=2, ensure_ascii=False)

        except Exception as e:
            print(f"  ✗ Gemini Vision generation failed: {e}")
            fail_count += 1

    # Final save
    with open(OUTPUT_FILE, "w") as f:
        json.dump(bank, f, indent=2, ensure_ascii=False)

    print(f"\n{'='*60}")
    print(f"FMGE IBQ Bank Generation Complete!")
    print(f"  ✓ Generated : {success_count}")
    print(f"  ↷ Skipped   : {skip_count} (already existed)")
    print(f"  ✗ Failed    : {fail_count}")
    print(f"  Total bank  : {len(bank)} verified image-based questions")
    print(f"  Output      : {OUTPUT_FILE.resolve()}")
    print(f"  Images      : {PUBLIC_IMG_DIR.resolve()}")
    print(f"{'='*60}")


if __name__ == "__main__":
    run()
