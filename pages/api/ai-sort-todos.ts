import { NextApiRequest, NextApiResponse } from "next";
import Anthropic from "@anthropic-ai/sdk";

import Cors from "cors";

// Initialize the cors middleware
const cors = Cors({
  methods: ["POST", "GET", "HEAD"],
});

function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, cors);

  if (req.method === "POST") {
    const { todos } = req.body;

    try {
      const anthropic = new Anthropic({
        apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
      });

      const todoTexts = todos.map((todo: any) => todo.text).join("\n");
      const prompt = `Here's a list of todo items:\n\n${todoTexts}\n\nPlease sort these items in order of priority, with the most important tasks first. Return only the sorted list, with each item on a new line.`;

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 250,
        temperature: 0.7,
        system: `You are an expert task organizer that knows how to sort tasks according to their priority. 
        Prioritize work tasks that are most important.
        `,
        messages: [{ role: "user", content: prompt }],
      });

      const text = (response.content[0] as Anthropic.TextBlock).text;
      const sortedTodos = text
        .split("\n")
        .filter((item: string) => item.trim() !== "");

      res.status(200).json({ sortedTodos });
    } catch (error) {
      console.error("Error sorting todos with AI:", error);
      res.status(500).json({ message: "Failed to sort todos with AI" });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
