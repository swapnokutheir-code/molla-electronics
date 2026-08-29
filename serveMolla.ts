export default async function(req: any, res: any) {
  try {
    const response = await fetch('https://media.base44.com/files/public/6a7c4932fc99670f477f810c/1a7b96d76_index.html');
    const html = await response.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(html);
  } catch (error: any) {
    res.status(500).send('Error loading page: ' + error?.message);
  }
}
