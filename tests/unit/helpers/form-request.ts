/** POST mit FormData und echter Content-Length – wie ein Browser (Node setzt sie nicht selbst). */
export async function formRequest(url: string, fd: FormData): Promise<Request> {
  const encoded = new Response(fd);
  const body = await encoded.arrayBuffer();
  return new Request(url, {
    method: "POST",
    body,
    headers: {
      "content-type": encoded.headers.get("content-type") ?? "",
      "content-length": String(body.byteLength),
    },
  });
}
