import { json, rejected } from "@/lib/api";
import { homeBoard } from "@/lib/home";

export async function GET(request: Request) {
  const block = rejected(request);
  if (block) return block;
  const board = await homeBoard();
  return json(request, board);
}
