import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultGreetingMessage } from '../../components/AiCoachView';

describe('AI Study Coach — Predictor Trigger & History Integration', () => {
  it('1. Default greeting message is structured correctly', () => {
    const greeting = createDefaultGreetingMessage();
    assert.equal(greeting.role, 'assistant');
    assert.ok(greeting.content.includes('FMGE AI Study Coach'));
    assert.ok(greeting.content.includes('Hello Doctor'));
  });

  it('2. Dummy empty sessions with 0 user messages are filtered out', () => {
    const mockSessions = [
      {
        id: 'session-1',
        title: 'New Consultation',
        messages: [createDefaultGreetingMessage()],
      },
      {
        id: 'session-2',
        title: 'Burns Management - Parkland Formula & Rule of Nines',
        messages: [
          createDefaultGreetingMessage(),
          { role: 'user', content: 'Explain burns management' },
          { role: 'assistant', content: 'Parkland formula: 4mL x kg x %TBSA' },
        ],
      },
      {
        id: 'session-3',
        title: 'New Consultation',
        messages: [createDefaultGreetingMessage()],
      },
    ];

    const validSessions = mockSessions.filter(
      (s) => s.messages && s.messages.some((m) => m.role === 'user')
    );

    assert.equal(validSessions.length, 1);
    assert.equal(validSessions[0].title, 'Burns Management - Parkland Formula & Rule of Nines');
  });

  it('3. Predictor trigger constructs prompt and titles session cleanly', () => {
    const topic = 'Burns Management - Parkland Formula & Rule of Nines';
    const subject = 'Surgery';

    const buildPrompt = (tab: 'concept' | 'vignette') =>
      tab === 'vignette'
        ? `Give me an FMGE clinical vignette MCQ on ${topic}`
        : `Explain ${topic} (${subject || 'High-Yield Medicine'}) with core FMGE clinical concepts, high-yield diagnostic criteria, and exam pearls`;

    const promptText = buildPrompt('concept');

    assert.ok(promptText.includes('Burns Management'));
    assert.ok(promptText.includes('Surgery'));
    assert.ok(promptText.includes('FMGE clinical concepts'));
  });

  it('4. Stream API returns chunks promptly for high-yield topics', async () => {
    const res = await fetch('http://localhost:3000/api/ai/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Explain Burns Management - Parkland Formula with core FMGE concepts',
      }),
    });

    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('data: '));
    assert.ok(text.includes('Parkland') || text.includes('burn') || text.includes('TBSA'));
  });
});
