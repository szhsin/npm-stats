export function pointResponse(input: Parameters<typeof fetch>[0], downloads = 10) {
  const url = input instanceof Request ? input.url : String(input);
  const [, start, end, packageName] = url.match(/point\/([^:]+):([^/]+)\/(.+)$/)!;
  return Response.json({ start, end, package: decodeURIComponent(packageName), downloads });
}

export function searchResponse(names: string[], total = names.length) {
  return Response.json({
    total,
    objects: names.map((name) => ({ package: { name, version: "1.0.0", description: name } })),
  });
}
