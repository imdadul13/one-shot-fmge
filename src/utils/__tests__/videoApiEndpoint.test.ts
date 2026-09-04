import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fmgeRoutes from '../../../server/fmge-routes';

describe('Video Recommendations API Endpoint Handler', () => {
  it('GET /api/videos/recommendations returns valid curated video recommendations', async () => {
    const req: any = {
      method: 'GET',
      url: '/api/videos/recommendations?subjectId=medicine&topicId=med-1',
      query: {
        subjectId: 'medicine',
        topicId: 'med-1',
        query: 'FMGE Cardiology Arrhythmias ECG',
      },
    };

    let resultData: any = null;
    const res: any = {
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(data: any) {
        resultData = data;
      },
    };

    const router = (fmgeRoutes as any)._router;
    const videoLayer = router?.stack?.find(
      (layer: any) => layer.route && layer.route.path === '/api/videos/recommendations'
    );

    assert.ok(videoLayer, 'Route /api/videos/recommendations must exist in fmgeRoutes stack');
    await videoLayer.route.stack[0].handle(req, res);

    assert.ok(resultData, 'Handler must return a response');
    assert.equal(resultData.success, true);
    assert.ok(Array.isArray(resultData.videos) && resultData.videos.length > 0, 'Must return at least 1 video');
    assert.ok(resultData.videos[0].title.length > 5, 'Video title must be valid');
  });
});
