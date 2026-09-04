from __future__ import annotations

import os
import sys
import json
import time
import requests
from pathlib import Path
from google import genai
from google.genai import types

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

REMAINING_TARGETS = [
    {"subject": "Radiology", "topic": "Bird beak appearance (Achalasia)", "query": "Achalasia barium"},
    {"subject": "Radiology", "topic": "Tension pneumothorax (Chest X-ray)", "query": "pneumothorax inspiration X-ray"},
    {"subject": "Radiology", "topic": "Colles fracture (Dinner fork deformity)", "query": "Colles Fracture Dinner Fork"},
    {"subject": "Dermatology", "topic": "Herald patch (Pityriasis Rosea)", "query": "Pit rosea small"},
    {"subject": "Dermatology", "topic": "Pemphigus vulgaris (Acantholysis)", "query": "Pemphigus vulgaris blister"},
    {"subject": "Microbiology", "topic": "Banana-shaped gametocyte (P. falciparum)", "query": "Plasmodium falciparum 01"},
    {"subject": "Microbiology", "topic": "Ring trophozoites (P. falciparum)", "query": "Malaria-infected Red Blood Cell"},
    {"subject": "Ophthalmology", "topic": "Diabetic retinopathy (Fundus fluorescein)", "query": "Diabetic Retinopathy FA"},
    {"subject": "Ophthalmology", "topic": "Central retinal artery occlusion (Cherry red spot)", "query": "Central Retinal Artery Embolism"},
    {"subject": "Cardiology", "topic": "Complete 3rd degree heart block ECG", "query": "3rd degree heart block"},
    {"subject": "Cardiology", "topic": "Inferior STEMI ECG (ST elevation)", "query": "12 Lead EKG ST Elevation"},
    {"subject": "Surgery", "topic": "Thyroid goiter (Multinodular goiter)", "query": "Struma goiter thyroid"},
]

HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)"}


def search_and_download(query: str, target_path: Path) -> bool:
    url = "https://commons.wikimedia.org/w/api.php"
    params = {
        "action": "query", "generator": "search", "gsrsearch": query,
        "gsrnamespace": "6", "gsrlimit": "4", "prop": "imageinfo",
        "iiprop": "url|mime|size", "format": "json",
    }
    try:
        r = requests.get(url, params=params, headers=HEADERS, timeout=12)
        pages = r.json().get("query", {}).get("pages", {})
        for pid, pdata in pages.items():
            for info in pdata.get("imageinfo", []):
                mime = info.get("mime", "")
                if mime in ("image/jpeg", "image/png") and info.get("size", 0) > 4000:
                    img_data = requests.get(info.get("url"), headers=HEADERS, timeout=15).content
                    if img_data.startswith(b"\xff\xd8\xff") or img_data.startswith(b"\x89PNG"):
                        target_path.write_bytes(img_data)
                        return True
    except Exception as e:
        print(f"   ⚠️ Download error for {query}: {e}")
    return False


def generate_mcq(client, image_path: Path, subject: str, topic: str) -> dict:
    ext = image_path.suffix.lower().lstrip(".")
    mime = "image/png" if ext == "png" else "image/jpeg"

    with open(image_path, "rb") as f:
        img_bytes = f.read()

    prompt = f"""You are a senior NBE question setter for the FMGE medical exam.
Examine the attached medical image carefully.
Target concept: {topic} ({subject}).

1. Identify the EXACT finding visible in this image.
2. Write a 2-3 sentence FMGE clinical vignette.
3. Formulate 4 single-best-response options (A, B, C, D) with plausible distractors.
4. Specify the correct answer and a high-yield explanation with pathognomonic buzzwords.

Return ONLY valid JSON:
{{
  "vignette": "A [age]-year-old [sex] presents with [symptoms]. [Investigation] is shown. What is the most likely diagnosis / next step?",
  "options": [
    {{"id":"A","text":"..."}},{{"id":"B","text":"..."}},{{"id":"C","text":"..."}},{{"id":"D","text":"..."}}
  ],
  "correctOptionId": "A",
  "explanation": {{
    "imageFinding": "Exact description of what is visible",
    "highYieldBuzzwords": ["word1","word2","word3"],
    "detailedRationale": "Detailed breakdown explaining correct answer and distractors."
  }}
}}"""

    for model_name in ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.6-flash"]:
        try:
            resp = client.models.generate_content(
                model=model_name,
                contents=[types.Part.from_bytes(data=img_bytes, mime_type=mime), prompt],
                config=types.GenerateContentConfig(response_mime_type="application/json"),
            )
            text = resp.text.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            return json.loads(text.strip())
        except Exception as e:
            if "429" in str(e):
                time.sleep(20)
            continue
    raise RuntimeError("All models failed")


def run():
    api_key = os.environ.get("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)

    bank = json.loads(OUTPUT_FILE.read_text()) if OUTPUT_FILE.exists() else []
    already_done = {e["topic"] for e in bank}

    print(f"▶ Generating remaining targets (current bank: {len(bank)})...")

    for idx, item in enumerate(REMAINING_TARGETS, 1):
        subj = item["subject"]
        topic = item["topic"]
        query = item["query"]

        if topic in already_done:
            continue

        clean_name = topic.split("(")[0].strip().lower().replace(" ", "_")[:28]
        filename = f"{subj.lower()}_{clean_name}.jpg"
        img_path = PUBLIC_IMG_DIR / filename

        print(f"\n[{idx}/{len(REMAINING_TARGETS)}] [{subj}] {topic}...")
        if not search_and_download(query, img_path):
            print(f"   ✗ Image not found for '{query}'")
            continue

        print(f"   ✓ Image downloaded ({img_path.stat().st_size} bytes)")
        try:
            mcq = generate_mcq(client, img_path, subj, topic)
            bank.append({
                "id": f"fmge_ibq_{len(bank)+1}",
                "subject": subj,
                "topic": topic,
                "imageSrc": f"/images/ibq/{filename}",
                "vignette": mcq["vignette"],
                "options": mcq["options"],
                "correctOptionId": mcq["correctOptionId"],
                "explanation": mcq["explanation"],
            })
            print(f"   ✓ Generated! Correct: [{mcq['correctOptionId']}] | Total: {len(bank)}")
            OUTPUT_FILE.write_text(json.dumps(bank, indent=2, ensure_ascii=False))
        except Exception as e:
            print(f"   ✗ MCQ generation error: {e}")

        time.sleep(4)

    print(f"\n✅ All remaining targets complete! Total bank size: {len(bank)}")


if __name__ == "__main__":
    run()
