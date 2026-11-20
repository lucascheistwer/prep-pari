import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const hopByHop = new Set(["connection", "content-length", "host", "transfer-encoding"]);

async function proxy(request: NextRequest, path: string[]) {
  const api = process.env.API_URL ?? "http://localhost:8080";
  const target = new URL(`${api}/api/${path.join("/")}`);
  target.search = request.nextUrl.search;
  const headers = new Headers(request.headers);
  hopByHop.forEach((name) => headers.delete(name));
  const response = await fetch(target, {
    method: request.method,
    headers,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer(),
    redirect: "manual",
  });
  const outgoing = new Headers();
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "set-cookie" && !hopByHop.has(key.toLowerCase())) {
      outgoing.append(key, value);
    }
  });
  for (const cookie of response.headers.getSetCookie()) {
    outgoing.append("set-cookie", cookie);
  }
  return new NextResponse(response.body, { status: response.status, headers: outgoing });
}

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: Context) {
  return proxy(request, (await context.params).path);
}

export async function POST(request: NextRequest, context: Context) {
  return proxy(request, (await context.params).path);
}

export async function PUT(request: NextRequest, context: Context) {
  return proxy(request, (await context.params).path);
}

export async function PATCH(request: NextRequest, context: Context) {
  return proxy(request, (await context.params).path);
}

export async function DELETE(request: NextRequest, context: Context) {
  return proxy(request, (await context.params).path);
}
