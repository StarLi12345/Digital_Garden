import { NextRequest, NextResponse } from "next/server";
import { getAllUsers, getUsersByIds } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids");
  if (idsParam) {
    const ids = idsParam.split(",").filter(Boolean);
    const users = await getUsersByIds(ids);
    return NextResponse.json({ users });
  }
  const users = await getAllUsers();
  return NextResponse.json({ users });
}
