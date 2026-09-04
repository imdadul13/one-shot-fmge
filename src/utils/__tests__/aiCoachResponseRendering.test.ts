import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

describe('FMGE AI Coach - Response Content & Document Rendering', () => {
  it('1. POST /api/ai/chat endpoint is configured with Gemini 3.7 Flash and student context', async () => {
    const routesContent = fs.readFileSync('server/fmge-routes.ts', 'utf8');
    assert.ok(routesContent.includes('app.post("/api/ai/chat"'), 'POST /api/ai/chat must be mounted');
    assert.ok(routesContent.includes('gemini-3.7-flash'), 'Must use Gemini 3.7 Flash');
    assert.ok(routesContent.includes('systemInstruction'), 'Must supply FMGE system instruction');
    assert.ok(routesContent.includes('studentContext'), 'Must inject live student tracker context');
  });

  it('2. Structured MCQ output schema is defined for clinical vignettes', () => {
    const routesContent = fs.readFileSync('server/fmge-routes.ts', 'utf8');
    assert.ok(routesContent.includes('"singleMcq"'), 'Must define singleMcq field in response schema');
    assert.ok(routesContent.includes('"quizSession"'), 'Must define quizSession field in response schema');
    assert.ok(routesContent.includes('"distractorBreakdown"'), 'Must define distractorBreakdown in schema');
  });

  it('3. Heart block MCQ returns complete clinical stem and distractor explanations', () => {
    const bank = JSON.parse(fs.readFileSync('server/data/hy_subject_bank.json', 'utf8'));
    const hb = bank.medicine.find((q: any) => q.topic.includes('Heart Block'));
    assert.ok(hb, 'Heart block question exists');
    assert.ok(hb.question.includes('Stokes-Adams'), 'Contains Stokes Adams attacks');
    assert.ok(hb.question.includes('cannon \'a\' waves'), 'Contains cannon a waves');
    assert.ok(hb.question.includes('AV dissociation'), 'Contains AV dissociation');
    assert.equal(hb.options.length, 4);
    assert.equal(hb.correctKey, 'A');
  });

  it('4. MarkdownRenderer uses clean document flow without multi-column breakdown', () => {
    const mdRenderer = fs.readFileSync('src/components/MarkdownRenderer.tsx', 'utf8');
    assert.ok(!mdRenderer.includes('columns-'), 'Must not contain column classes');
    assert.ok(!mdRenderer.includes('grid-cols-'), 'Must not break normal text into grid columns');
    assert.ok(mdRenderer.includes('w-full'), 'Must render full-width blocks');
    assert.ok(mdRenderer.includes('break-words'), 'Must support word wrapping');
  });

  it('5. MarkdownRenderer contains unconditional loop advancement safeguard', () => {
    const mdRenderer = fs.readFileSync('src/components/MarkdownRenderer.tsx', 'utf8');
    assert.ok(mdRenderer.includes('startIndex'), 'Must track startIndex');
    assert.ok(mdRenderer.includes('i === startIndex'), 'Must verify guaranteed loop advancement');
    assert.ok(mdRenderer.includes('i++;'), 'Must increment i unconditionally');
  });
});
