import type { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import Cors from "cors";

// Initialize the cors middleware
const cors = Cors({
  methods: ["POST", "GET", "HEAD"],
});

// Helper method to wait for a middleware to execute before continuing
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
  // Run the cors middleware
  await runMiddleware(req, res, cors);

  if (req.method === "POST") {
    try {
      const todos = req.body;

      // First, clear existing todos
      await sql`DELETE FROM todos`;

      // Then, insert new todos
      for (const todo of todos) {
        await sql`
          INSERT INTO todos (text, category)
          VALUES (${todo.text}, ${todo.category})
        `;
      }

      res.status(200).json({ message: "Todos saved successfully" });
    } catch (error) {
      console.error("Error saving todos:", error);
      res.status(500).json({ message: "Failed to save todos" });
    }
  } else if (req.method === "GET") {
    try {
      const { rows } = await sql`SELECT * FROM todos`;
      res.status(200).json(rows);
    } catch (error) {
      console.error("Error fetching todos:", error);
      res.status(500).json({ message: "Failed to fetch todos" });
    }
  } else {
    res.setHeader("Allow", ["POST", "GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
