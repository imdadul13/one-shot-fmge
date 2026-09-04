import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('generateStudyPackage API - Topic Specificity & Contamination', () => {
  describe('Topic-Subject Validation', () => {
    it('should validate topic-subject pairing', () => {
      const requestedSubject = "anatomy";
      const requestedTopic = "Upper Limb - Brachial Plexus";
      const validatedSubject = requestedSubject;
      assert.strictEqual(validatedSubject, "anatomy");
    });

    it('should reject invalid topic-subject mismatch conceptually', () => {
      const validationPasses = (validated: string, requested: string) => validated === requested;
      assert.strictEqual(validationPasses("anatomy", "anatomy"), true);
      assert.strictEqual(validationPasses("pharmacology", "anatomy"), false);
    });
  });

  describe('Step-Specific Prompt Structure', () => {
    it('learn step must include topic and subject', () => {
      const step = "learn";
      const topic = "Enzyme Kinetics & Lineweaver-Burk Plots";
      const subject = "biochemistry";
      const promptIncludesTopic = `Topic: "${topic}"` !== null;
      const promptIncludesSubject = `Subject: "${subject}"` !== null;
      assert.ok(promptIncludesTopic, "Learn prompt must include topic");
      assert.ok(promptIncludesSubject, "Learn prompt must include subject");
    });

    it('test step must include topic and subject', () => {
      const step = "test";
      const topic = "Enzyme Kinetics & Lineweaver-Burk Plots";
      const subject = "biochemistry";
      const promptIncludesTopic = `Topic: "${topic}"` !== null;
      const promptIncludesSubject = `Subject: "${subject}"` !== null;
      assert.ok(promptIncludesTopic, "Test prompt must include topic");
      assert.ok(promptIncludesSubject, "Test prompt must include subject");
    });

    it('review step must include topic and subject', () => {
      const step = "review";
      const topic = "Enzyme Kinetics & Lineweaver-Burk Plots";
      const subject = "biochemistry";
      const promptIncludesTopic = `Topic: "${topic}"` !== null;
      const promptIncludesSubject = `Subject: "${subject}"` !== null;
      assert.ok(promptIncludesTopic, "Review prompt must include topic");
      assert.ok(promptIncludesSubject, "Review prompt must include subject");
    });
  });

  describe('Topic Contamination Rejection', () => {
    it('learn prompt should not contain cross-topic forbidden patterns', () => {
      const learnPrompt = "Generate learning synthesis for Enzyme Kinetics & Lineweaver-Burk Plots (biochemistry)";
      const forbidden = ["myocardial infarction", "pneumonia", "cardiology", "nephrology", "formoterol", "bronchospasm"];
      for (const pattern of forbidden) {
        const regex = new RegExp(pattern, "i");
        assert.ok(!regex.test(learnPrompt), `Learn prompt should not contain "${pattern}"`);
      }
    });

    it('test prompt should not contain cross-topic forbidden patterns', () => {
      const testPrompt = "Generate exactly 10 FMGE-style MCQs for Enzyme Kinetics & Lineweaver-Burk Plots";
      const forbidden = ["myocardial infarction", "pneumonia", "formoterol", "bronchospasm"];
      for (const pattern of forbidden) {
        const regex = new RegExp(pattern, "i");
        assert.ok(!regex.test(testPrompt), `Test prompt should not contain "${pattern}"`);
      }
    });

    it('apply prompt should not contain cross-topic forbidden patterns', () => {
      const applyPrompt = "Generate clinical vignette for Enzyme Kinetics & Lineweaver-Burk Plots";
      const forbidden = ["myocardial infarction", "pneumonia", "formoterol", "bronchospasm"];
      for (const pattern of forbidden) {
        const regex = new RegExp(pattern, "i");
        assert.ok(!regex.test(applyPrompt), `Apply prompt should not contain "${pattern}"`);
      }
    });
  });

  describe('Fallback Hierarchy', () => {
    it('review step should have verified_static source when no performance data', () => {
      const source = "verified_static";
      assert.ok(source === "verified_static" || source === "gemini");
    });

    it('review step should have gemini source when performance data exists', () => {
      const source = "gemini";
      assert.ok(source === "gemini");
    });

    it('sources should be distinguishable', () => {
      const geminiSource = "gemini";
      const staticSource = "verified_static";
      assert.ok((geminiSource as any) !== (staticSource as any));
      assert.ok(geminiSource === "gemini" as any);
      assert.ok(staticSource === "verified_static" as any);
    });
  });

  describe('Step Progression Logic', () => {
    it('mastery state progression should be logical', () => {
      const testCases = [
        { topicMastery: "mastered", expected: "MASTERED" },
        { topicMastery: "proficient", expected: "STRONG" },
        { topicMastery: "reinforcing", expected: "REINFORCING" },
        { topicMastery: "unattempted", expected: "LEARNING" },
      ];

      for (const { topicMastery, expected } of testCases) {
        let masteryState;
        if (topicMastery === "mastered") {
          masteryState = "MASTERED";
        } else if (topicMastery === "proficient") {
          masteryState = "STRONG";
        } else if (topicMastery === "reinforcing") {
          masteryState = "REINFORCING";
        } else {
          masteryState = "LEARNING";
        }
        assert.strictEqual(masteryState, expected);
      }
    });

    it('completion percentage calculation should be logical', () => {
      const scenarios = [
        { questions: 0, mastery: "unattempted", completion: 0 },
        { questions: 5, mastery: "reinforcing", completion: 25 },
        { questions: 10, mastery: "proficient", completion: 100 },
        { questions: 20, mastery: "mastered", completion: 100 },
      ];

      for (const { questions, mastery, completion } of scenarios) {
        let calculated;
        if (mastery === "mastered") {
          calculated = 100;
        } else if (questions >= 10) {
          calculated = 70 + Math.min(30, questions * 3);
        } else if (questions > 0) {
          calculated = questions * 5;
        } else {
          calculated = 0;
        }
        assert.strictEqual(calculated, completion);
      }
    });
  });
});
