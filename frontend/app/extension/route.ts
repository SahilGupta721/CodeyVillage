import { readFile } from 'fs/promises';
import path from 'path';

export async function GET() {
  const file = await readFile(path.join(process.cwd(), 'public/extension.zip'));
  return new Response(file, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="codey-village-extension.zip"',
    },
  });
}
