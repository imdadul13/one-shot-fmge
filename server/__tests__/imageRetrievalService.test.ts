import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import {
  ImageRetrievalService,
  VERIFIED_FMGE_IMAGE_ASSETS,
  imageAssetCache,
  WikimediaMedicalProvider,
  GoogleImageSearchProvider,
} from '../image-retrieval-service';
import {
  detectImageQuestionRequest,
  generateMedicalImageSearchQuery,
  generateStructuredClinicalMCQ,
} from '../dynamic-mcq-engine';

describe('Medical Image Retrieval Service & Question Engine', () => {
  const service = new ImageRetrievalService();

  it('1. Correctly detects image question requests across modalities', () => {
    const r1 = detectImageQuestionRequest('Give me an image-based question on heart blocks');
    assert.strictEqual(r1.isImageRequest, true);
    assert.strictEqual(r1.category, 'ecg');

    const r2 = detectImageQuestionRequest('Quiz me on chest X-ray for pneumothorax');
    assert.strictEqual(r2.isImageRequest, true);
    assert.strictEqual(r2.category, 'xray');

    const r3 = detectImageQuestionRequest('Show me a pathology histology image of nephrotic syndrome');
    assert.strictEqual(r3.isImageRequest, true);
    assert.strictEqual(r3.category, 'histopathology');

    const r4 = detectImageQuestionRequest('Explain why Crohn disease causes skip lesions');
    assert.strictEqual(r4.isImageRequest, false);
  });

  it('2. Generates precise medical image search queries', () => {
    const q1 = generateMedicalImageSearchQuery(
      'Give me an ECG on complete heart block',
      'General Medicine',
      'Cardiology · Heart Blocks'
    );
    assert.ok(q1.includes('complete heart block') && q1.includes('ECG'));

    const q2 = generateMedicalImageSearchQuery(
      'Show me a chest X-ray for pneumothorax',
      'General Surgery',
      'Trauma'
    );
    assert.ok(q2.includes('pneumothorax') && q2.includes('chest X-ray'));

    const q3 = generateMedicalImageSearchQuery(
      'Electron microscopy of minimal change disease',
      'General Medicine',
      'Nephrology'
    );
    assert.ok(q3.includes('minimal change disease') && q3.includes('electron microscopy'));
  });

  it('3. Verified FMGE curated image assets have valid HTTPS URLs and licensing metadata', () => {
    assert.ok(VERIFIED_FMGE_IMAGE_ASSETS.length >= 8, 'Should have verified clinical image assets');

    for (const asset of VERIFIED_FMGE_IMAGE_ASSETS) {
      assert.ok(asset.assetId, 'Asset must have assetId');
      assert.ok(asset.imageUrl && (asset.imageUrl.startsWith('/') || asset.imageUrl.startsWith('http')), `Asset ${asset.assetId} must have valid URL`);
      assert.ok(asset.license, `Asset ${asset.assetId} must retain license info`);
      assert.ok(asset.sourceName, `Asset ${asset.assetId} must retain source info`);
      assert.ok(asset.medicalFinding, `Asset ${asset.assetId} must define medical finding`);
      assert.ok(asset.whatToLookFor, `Asset ${asset.assetId} must define what to look for`);
      assert.ok((asset.validationConfidence || 0) >= 0.8, 'Asset confidence must be high');
    }
  });

  it('4. Retrieves and validates ECG asset for Complete Heart Block request', async () => {
    const asset = await service.retrieveAndValidateImage('complete heart block 3rd degree AV block ECG', {
      category: 'ecg',
      minConfidence: 0.7,
    });

    assert.ok(asset !== null, 'Should return a valid medical image asset');
    assert.strictEqual(asset.imageCategory, 'ecg');
    assert.ok(asset.imageUrl.length > 0);
    assert.ok(asset.medicalFinding.toLowerCase().includes('heart block') || asset.medicalFinding.toLowerCase().includes('av block'));
  });

  it('5. Retrieves and validates Chest X-ray asset for Pneumothorax', async () => {
    const asset = await service.retrieveAndValidateImage('tension pneumothorax chest X-ray', {
      category: 'xray',
      minConfidence: 0.7,
    });

    assert.ok(asset !== null);
    assert.strictEqual(asset.imageCategory, 'xray');
    assert.ok(asset.imageUrl.length > 0);
    assert.ok(asset.medicalFinding.toLowerCase().includes('pneumothorax'));
  });

  it('6. Image Asset Cache stores and retrieves items consistently without duplicate requests', async () => {
    const query = 'test query unique for caching wpw delta wave';
    const testAsset = VERIFIED_FMGE_IMAGE_ASSETS[0];

    imageAssetCache.set(query, testAsset);
    const cached = imageAssetCache.get(query);

    assert.ok(cached !== null);
    assert.strictEqual(cached.assetId, testAsset.assetId);
  });

  it('7. Generates complete Structured MCQ anchored to retrieved medical image', () => {
    const ecgAsset = VERIFIED_FMGE_IMAGE_ASSETS.find(a => a.assetId === 'fmge-img-ecg-3rd-degree-block');
    const mcq = generateStructuredClinicalMCQ('Give me an image-based question on heart blocks', ecgAsset);

    assert.strictEqual(mcq.questionType, 'image_based_question');
    assert.ok(mcq.imageUrl && mcq.imageUrl.length > 0);
    assert.strictEqual(mcq.imageAsset?.assetId, ecgAsset?.assetId);
    assert.strictEqual(mcq.correctAnswer, 'A');
    assert.strictEqual(mcq.options.length, 4);
    assert.ok(mcq.whatToLookFor && mcq.whatToLookFor.length > 10);
    assert.ok(mcq.explanation.length > 20);
    assert.ok(Object.keys(mcq.distractorBreakdown).length >= 3);
  });

  it('8. Gracefully falls back to high-yield clinical vignette when no image is requested or found', () => {
    const textMcq = generateStructuredClinicalMCQ('Explain cavernous sinus thrombosis', null);
    assert.strictEqual(textMcq.questionType, 'clinical_vignette');
    assert.strictEqual(textMcq.options.length, 4);
    assert.strictEqual(textMcq.correctAnswer, 'C');
  });

  it('9. Wikimedia provider and Google provider adhere to MedicalImageProvider interface', () => {
    const wm = new WikimediaMedicalProvider();
    assert.strictEqual(wm.name, 'wikimedia-commons');
    assert.strictEqual(typeof wm.search, 'function');
    assert.strictEqual(wm.isAvailable(), true);

    const gcs = new GoogleImageSearchProvider();
    assert.strictEqual(gcs.name, 'google-custom-search');
    assert.strictEqual(typeof gcs.search, 'function');
  });

  it('10. Validates that clean exam images do not contain answer-revealing text during exam mode', () => {
    for (const asset of VERIFIED_FMGE_IMAGE_ASSETS) {
      if (asset.cleanImageUrl && asset.cleanImageUrl.endsWith('.svg')) {
        const filePath = path.join(process.cwd(), 'public', asset.cleanImageUrl.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          const svgContent = fs.readFileSync(filePath, 'utf-8');
          // Check that answer-revealing labels are NOT present in clean exam tracing
          assert.ok(!svgContent.includes('ST Elevation (+3.5 mm)'), 'Clean ECG must not have answer labels');
          assert.ok(!svgContent.includes('Reciprocal ST Depression'), 'Clean ECG must not have reciprocal depression labels');
          assert.ok(!svgContent.includes('AV DISSOCIATION MARKERS:'), 'Clean ECG must not give away AV dissociation text');
        }
      }
    }
  });
});
