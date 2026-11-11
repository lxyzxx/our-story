import { contentRepository } from '@/lib/content';
import { getPremiereState } from '@/lib/premiere-server';
export const dynamic = 'force-dynamic';
export async function GET() {
  const headers = { 'Cache-Control': 'no-store, max-age=0', Pragma: 'no-cache' };
  try {
    const content = await contentRepository.getArchive();
    return Response.json(getPremiereState(content.premiere), { headers });
  } catch {
    return Response.json({ error: '首映状态暂时无法确认' }, { status: 503, headers });
  }
}
