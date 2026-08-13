import { NextResponse } from "next/server";
import { getTopics } from "../../../lib/db/queries";

export async function GET() {
  const topics = await getTopics();
  return NextResponse.json(topics);
}
