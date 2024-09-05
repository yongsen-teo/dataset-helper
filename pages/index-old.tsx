import { useState, useEffect } from "react";
import Head from "next/head";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import Anthropic from "@anthropic-ai/sdk";

import { useSession } from "next-auth/react";

interface Todo {
  id: string;
  text: string;
  category: "work" | "personal" | "errands";
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [session, loading] = useSession();

  useEffect(() => {
    if (session) {
      // Fetch todos specific to the authenticated user
      fetchUserTodos();
    }
  }, [session]);

  const fetchUserTodos = async () => {
    try {
      const response = await fetch("/api/user-todos", {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (response.ok) {
        const userTodos = await response.json();
        setTodos(userTodos);
      } else {
        throw new Error("Failed to fetch user todos");
      }
    } catch (error) {
      console.error("Error fetching user todos:", error);
    }
  };

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      let category: "work" | "personal" | "errands" = "personal"; // default category
      let text = newTodo.trim();

      if (text.startsWith("ww ")) {
        category = "work";
        text = text.slice(3);
      } else if (text.startsWith("pp ")) {
        category = "personal";
        text = text.slice(3);
      } else if (text.startsWith("ee ")) {
        category = "errands";
        text = text.slice(3);
      }

      setTodos([
        ...todos,
        {
          id: Date.now().toString(),
          text: text,
          category: category,
        },
      ]);
      setNewTodo("");
    }
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const editTodo = (id: string, newText: string) => {
    setTodos(
      todos.map((todo) => (todo.id === id ? { ...todo, text: newText } : todo))
    );
  };

  const sortByAI = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai-sort-todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ todos }),
      });

      if (response.ok) {
        const { sortedTodos } = await response.json();
        const newTodoOrder = sortedTodos.map(
          (sortedText: string) =>
            todos.find((todo) => todo.text === sortedText) || todos[0]
        );
        setTodos(newTodoOrder);
      } else {
        throw new Error("Failed to sort todos with AI");
      }
    } catch (error) {
      console.error("Error sorting todos with AI:", error);
      alert("An error occurred while sorting with AI. Please try again.");
    }

    setIsLoading(false);
  };

  const sortByCategory = () => {
    setTodos([...todos].sort((a, b) => a.category.localeCompare(b.category)));
  };

  const sortByLength = () => {
    setTodos([...todos].sort((a, b) => b.text.length - a.text.length));
  };

  const filteredTodos = filterCategory
    ? todos.filter((todo) => todo.category === filterCategory)
    : todos;

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(todos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setTodos(items);
  };

  const saveChanges = async () => {
    try {
      const response = await fetch("/api/save-todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(todos),
      });

      if (response.ok) {
        alert("Changes saved successfully!");
      } else {
        throw new Error("Failed to save changes");
      }
    } catch (error) {
      console.error("Error saving changes:", error);
      alert("An error occurred while saving changes. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-200">
      <Head>
        <title>Lazy Todo App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="max-w-lg mx-auto p-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-purple-800">
          Lazy Todo
        </h1>

        <div className="flex space-x-2 mb-4">
          <button
            onClick={sortByAI}
            disabled={isLoading}
            className={`px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Sorting..." : "Sort by AI"}
          </button>

          <button
            onClick={sortByCategory}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Sort by Category
          </button>

          <button
            onClick={sortByLength}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Sort by Length
          </button>
        </div>

        <div className="mb-4">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full p-2 rounded-lg border-2 border-purple-300 focus:outline-none focus:border-purple-500"
          >
            <option value="">All Categories</option>
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="errands">Errands</option>
          </select>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="todos">
            {(provided) => (
              <ul
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {filteredTodos.map((todo, index) => (
                  <Draggable key={todo.id} draggableId={todo.id} index={index}>
                    {(provided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between"
                      >
                        <div>
                          <span className="text-gray-800">{todo.text}</span>
                          <span className="ml-2 text-sm text-gray-500">
                            {todo.category}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              const newText = prompt("Edit task:", todo.text);
                              if (newText) editTodo(todo.id, newText);
                            }}
                            className="text-blue-500 hover:text-blue-600"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => deleteTodo(todo.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>

        <form onSubmit={addTodo} className="mt-8 space-y-2">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Enter a new task (ww for work, pp for personal, ee for errands)"
            className="w-full p-2 rounded-lg border-2 border-purple-300 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            className="w-full p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Add Todo
          </button>
        </form>

        <button
          onClick={saveChanges}
          className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
        >
          Save Changes
        </button>
      </main>
    </div>
  );
}
