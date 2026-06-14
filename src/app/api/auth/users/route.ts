import { NextResponse } from "next/server";
import { getAllUsers } from "@/lib/auth";

export async function GET() {
  const users = await getAllUsers();
  return NextResponse.json({ users });
}
