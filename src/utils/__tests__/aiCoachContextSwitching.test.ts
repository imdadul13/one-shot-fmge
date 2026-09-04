import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { classifyTopicAndSubject, generateStructuredClinicalMCQ } from '../../../server/dynamic-mcq-engine';

describe('AI Coach Topic Classification & Context Switching', () => {
  it('correctly classifies Pulmonology Asthma & COPD query without history', () => {
    const query = 'Explain Pulmonology - Asthma (GINA Guidelines), COPD (GOLD Guidelines) with core FMGE concepts and pearls';
    const classified = classifyTopicAndSubject(query, []);
    assert.equal(classified.subject, 'General Medicine');
    assert.ok(classified.topic.toLowerCase().includes('asthma'));
    assert.ok(classified.topic.toLowerCase().includes('copd'));
  });

  it('correctly classifies Biochemistry Enzyme Kinetics query without history', () => {
    const query = 'Explain Biochemistry - Enzyme Kinetics & Lineweaver-Burk Plots with Km, Vmax and inhibition types';
    const classified = classifyTopicAndSubject(query, []);
    assert.equal(classified.subject, 'Biochemistry');
    assert.ok(classified.topic.toLowerCase().includes('enzyme kinetics'));
  });

  it('correctly classifies Pharmacology Beta Blockers query', () => {
    const query = 'Give me high-yield notes on Beta Blockers, cardioselectivity AMEBA, and Glucagon antidote';
    const classified = classifyTopicAndSubject(query, []);
    assert.equal(classified.subject, 'Pharmacology');
    assert.ok(classified.topic.toLowerCase().includes('beta blocker'));
  });

  it('switches topics authoritatively when user asks about a new topic after a previous topic', () => {
    const history = [
      { role: 'user', content: 'Give me an MCQ on inferior myocardial infarction and RVMI' },
      { role: 'assistant', content: 'Here is an MCQ on Cardiology · Acute Myocardial Infarction...' }
    ];

    // User now introduces a completely new topic
    const newQuery = 'Explain Pulmonology - Asthma (GINA Guidelines), COPD (GOLD Guidelines) with core FMGE concepts';
    const classified = classifyTopicAndSubject(newQuery, history);

    assert.ok(classified.topic.toLowerCase().includes('asthma'));
    assert.ok(!classified.topic.toLowerCase().includes('myocardial'));
    assert.ok(!classified.topic.toLowerCase().includes('cardiology'));
  });

  it('retains active topic when user asks for "another MCQ"', () => {
    const history = [
      { role: 'user', content: 'Explain Pulmonology - Asthma (GINA Guidelines)' },
      { role: 'assistant', content: 'Subject: General Medicine\nTopic: Pulmonology · Asthma (GINA) & COPD (GOLD Guidelines)\nHere is a clinical overview...' }
    ];

    const followUp = 'Give me another MCQ';
    const classified = classifyTopicAndSubject(followUp, history);

    assert.ok(classified.topic.toLowerCase().includes('asthma'));
  });

  it('generates an authentic Pulmonology MCQ when requested', () => {
    const query = 'Give me an MCQ on Asthma GINA guidelines';
    const mcq = generateStructuredClinicalMCQ(query, null, []);

    assert.equal(mcq.subject, 'General Medicine');
    assert.ok(mcq.topic.toLowerCase().includes('asthma'));
    assert.equal(mcq.options.length, 4);
    const fullText = `${mcq.stem} ${mcq.question} ${mcq.explanation} ${mcq.fmgeTakeaway}`.toLowerCase();
    assert.ok(fullText.includes('asthma') || fullText.includes('gina'));
    assert.ok(!fullText.includes('stemi'));
    assert.ok(!fullText.includes('myocardial infarction'));
  });

  it('generates an authentic Biochemistry MCQ when requested', () => {
    const query = 'Give me an MCQ on Enzyme Kinetics Lineweaver-Burk plots';
    const mcq = generateStructuredClinicalMCQ(query, null, []);

    assert.equal(mcq.subject, 'Biochemistry');
    assert.ok(mcq.topic.toLowerCase().includes('enzyme kinetics') || mcq.topic.toLowerCase().includes('lineweaver'));
    assert.equal(mcq.options.length, 4);
    const fullText = `${mcq.stem} ${mcq.question} ${mcq.explanation} ${mcq.fmgeTakeaway}`.toLowerCase();
    assert.ok(fullText.includes('lineweaver') || fullText.includes('vmax') || fullText.includes('km'));
    assert.ok(!fullText.includes('stemi'));
    assert.ok(!fullText.includes('myocardial infarction'));
  });

  it('correctly classifies Nephrotic Syndrome queries', () => {
    const query = 'Explain nephrotic syndrome with high-yield points, biopsy findings, and classic exam traps.';
    const classified = classifyTopicAndSubject(query, []);
    assert.equal(classified.subject, 'General Medicine');
    assert.ok(classified.topic.toLowerCase().includes('nephrolog') || classified.topic.toLowerCase().includes('glomerul') || classified.topic.toLowerCase().includes('nephrotic'));
  });

  it('generates an authentic Minimal Change Disease MCQ for nephrotic syndrome requests', () => {
    const query = 'Give me an MCQ on nephrotic syndrome';
    const mcq = generateStructuredClinicalMCQ(query, null, []);

    assert.equal(mcq.subject, 'General Medicine');
    assert.ok(mcq.topic.toLowerCase().includes('nephrotic') || mcq.topic.toLowerCase().includes('minimal change'));
    assert.equal(mcq.options.length, 4);
    assert.equal(mcq.correctAnswer, 'A');
    const fullText = `${mcq.stem} ${mcq.question} ${mcq.explanation} ${mcq.fmgeTakeaway}`.toLowerCase();
    assert.ok(fullText.includes('proteinuria') || fullText.includes('prednisolone') || fullText.includes('podocyte'));
    assert.ok(!fullText.includes('tuberculosis'));
    assert.ok(!fullText.includes('caseous necrosis'));
  });
});

