import { readFile } from 'fs/promises';
import path from 'path';

/**
 * Serves a pre-built zip of ../extension (repo root). That file is NOT
 * auto-generated — run `npm run pack-extension` in frontend/ after any
 * extension change, commit public/extension.zip, then redeploy.
 */
export async function GET() {
  const file = await readFile(path.join(process.cwd(), 'public/extension.zip'));
  return new Response(file, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="codey-village-extension.zip"',
    },
  });
}
