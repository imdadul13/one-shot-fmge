#!/bin/bash
# Phase 1: Download IBQ images via Wikimedia Special:FilePath (auto-resolves real CDN URL)
# Uses curl -L to follow redirects. 3s delay between downloads.

OUTDIR="public/images/ibq"
mkdir -p "$OUTDIR"
BASE="https://commons.wikimedia.org/wiki/Special:FilePath"

ok=0; fail=0; skip=0

dl() {
  local wikiname="$1"   # Exact Wikimedia Commons filename (spaces OK)
  local localname="$2"  # Local filename to save as
  local dest="$OUTDIR/$localname"

  if [ -f "$dest" ] && [ "$(wc -c < "$dest")" -gt 8000 ]; then
    echo "  ↷ SKIP  (exists): $localname"
    skip=$((skip+1))
    return 0
  fi

  echo -n "  ↳ $localname ... "
  # URL-encode spaces as underscores (Wikimedia accepts both)
  local encoded="${wikiname// /_}"
  if curl -s -L --max-time 30 \
       -A "Mozilla/5.0 (FMGEStudyBot; educational)" \
       -o "$dest" \
       "${BASE}/${encoded}"; then
    local sz
    sz=$(wc -c < "$dest" 2>/dev/null || echo 0)
    if [ "$sz" -gt 8000 ]; then
      echo "OK (${sz} bytes)"
      ok=$((ok+1))
    else
      rm -f "$dest"
      echo "FAIL (${sz} bytes — likely redirect/404)"
      fail=$((fail+1))
    fi
  else
    echo "FAIL (curl error)"
    fail=$((fail+1))
  fi
  sleep 3
}

echo "=== Phase 1: Downloading FMGE IBQ Images ==="
echo ""

echo "── RADIOLOGY ──"
dl "Achalasia_barium.jpg"                           "radiology_achalasia_bird_beak.jpg"
dl "Babygram_duodenal_atresia.jpg"                  "radiology_double_bubble.jpg"
dl "Volvulus2.jpg"                                  "radiology_sigmoid_volvulus.jpg"
dl "Pneumoperitoneum.jpg"                           "radiology_pneumoperitoneum.jpg"
dl "Pneumothorax_ct.jpg"                            "radiology_pneumothorax.jpg"
dl "Colles_fracture_buckle.jpg"                     "radiology_colles_fracture.jpg"
dl "Pleural_effusion_decubitis.jpg"                 "radiology_pleural_effusion.jpg"
dl "Miliary_tuberculosis_-_adult.jpg"               "radiology_miliary_tb.jpg"

echo ""
echo "── PATHOLOGY ──"
dl "CHL_lacunar_cell_x40.jpg"                       "pathology_reed_sternberg.jpg"
dl "Auer_rods.jpg"                                  "pathology_auer_rods.jpg"
dl "Psammoma_bodies_-_low_mag.jpg"                  "pathology_psammoma_bodies.jpg"
dl "CMV_encephalitis_owl_eye_inclusions_HE_stain.jpg" "pathology_cmv_owl_eye.jpg"
dl "Granuloma_2.jpg"                                "pathology_tb_granuloma.jpg"
dl "Sickle_cell_01.jpg"                             "pathology_sickle_cells.jpg"
dl "Fibrinoid_necrosis_-_fibrinoid_change_of_the_vessel_wall.jpg" "pathology_fibrinoid_necrosis.jpg"

echo ""
echo "── DERMATOLOGY ──"
dl "Erythema_multiforme.jpg"                        "dermatology_target_lesions.jpg"
dl "Dermatomyositis15.jpg"                          "dermatology_gottron_papules.jpg"
dl "Pemphigus.jpg"                                  "dermatology_pemphigus.jpg"
dl "Pityriasis_rosea2.jpg"                          "dermatology_pityriasis_rosea.jpg"
dl "Psoriasis_on_back.jpg"                          "dermatology_psoriasis.jpg"
dl "Chicken_pox.jpg"                                "dermatology_chickenpox.jpg"

echo ""
echo "── MICROBIOLOGY ──"
dl "Plasmodium_falciparum_gametocyte.jpg"           "micro_falciparum_gametocyte.jpg"
dl "Malaria_Plasmodium_falciparum_blood_smear.jpg"  "micro_falciparum_ring_trophozoite.jpg"
dl "Staphylococcus_aureus_VISA_2.jpg"               "micro_staph_gram_stain.jpg"
dl "Mycobacterium_tuberculosis_Ziehl-Neelsen_stain.jpg" "micro_afb_zn_stain.jpg"

echo ""
echo "── OPHTHALMOLOGY ──"
dl "Crao.jpg"                                       "ophthal_cherry_red_spot.jpg"
dl "Papilledema.jpg"                                "ophthal_papilledema.jpg"
dl "Proliferative_diabetic_retinopathy.jpg"         "ophthal_diabetic_retinopathy.jpg"
dl "Kayser-Fleischer_ring.jpg"                      "ophthal_kayser_fleischer.jpg"

echo ""
echo "── ENT ──"
dl "Tympanic_membrane_perforation.jpg"              "ent_tympanic_perforation.jpg"

echo ""
echo "── CARDIOLOGY ECG ──"
dl "Afib_ecg.jpg"                                   "cardio_afib_ecg.jpg"
dl "WPW_ECG.jpg"                                    "cardio_wpw_ecg.jpg"
dl "Third_degree_heart_block.jpg"                   "cardio_complete_heart_block.jpg"
dl "Inferior_STEMI_reciprocal_changes.jpg"          "cardio_inferior_stemi.jpg"

echo ""
echo "── OBSTETRICS ──"
dl "Hydatidiform_mole_(1).jpg"                      "obs_hydatidiform_mole.jpg"

echo ""
echo "── SURGERY ──"
dl "Struma2.jpg"                                    "surgery_thyroid_goiter.jpg"

echo ""
echo "========================================"
echo " Download complete"
echo "   ✓ OK     : $ok"
echo "   ↷ Skipped: $skip"
echo "   ✗ Failed : $fail"
echo "   Total files: $(ls "$OUTDIR"/*.jpg 2>/dev/null | wc -l | tr -d ' ')"
ls -lh "$OUTDIR"/*.jpg 2>/dev/null | awk '{print "  "$5, $9}'
echo "========================================"
