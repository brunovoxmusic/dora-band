import { NextRequest, NextResponse } from "next/server";
import { authenticate, createSession, SESSION_COOKIE, COOKIE_OPTIONS } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json().catch(() => ({}));
    if (!email || !password) {
      return NextResponse.json({ error: "E-mail a heslo sú povinné." }, { status: 422 });
    }
    const user = await authenticate(email, password);
    if (!user) {
      return NextResponse.json({ error: "Nesprávny e-mail alebo heslo." }, { status: 401 });
    }
    const token = await createSession(user.id, user.email);
    const res = NextResponse.json({ ok: true, user: { email: user.email, name: user.name } });
    res.cookies.set(SESSION_COOKIE, token, COOKIE_OPTIONS);
    return res;
  } catch (err) {
    console.error("[auth/login] error:", err);
    return NextResponse.json({ error: "Serverová chyba." }, { status: 500 });
  }
}
