import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";

interface Message {
  role: string;
  content: string;
}

interface DataPoint {
  id: string;
  messages: Message[];
}

const FieldSelector: React.FC<{
  selectedFields: Set<string>;
  onSelectField: (field: string) => void;
}> = ({ selectedFields, onSelectField }) => {
  return (
    <div className="ml-2">
      {["role", "content"].map((field) => (
        <div key={field} className="ml-2">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={selectedFields.has(field)}
              onChange={() => onSelectField(field)}
              className="mr-1"
            />
            {field}
          </label>
        </div>
      ))}
    </div>
  );
};

const MessageEditor: React.FC<{
  message: Message;
  onChange: (newMessage: Message) => void;
  onDelete: () => void;
  selectedFields: Set<string>;
}> = ({ message, onChange, onDelete, selectedFields }) => {
  return (
    <div className="mb-1 p-2 border border-gray-300 rounded">
      {selectedFields.has("role") && (
        <div className="mb-1">
          <label className="text-sm font-medium text-purple-700 block">
            Role:
          </label>
          <input
            type="text"
            value={message.role}
            onChange={(e) => onChange({ ...message, role: e.target.value })}
            className="w-full p-1 text-sm rounded border border-gray-300"
          />
        </div>
      )}
      {selectedFields.has("content") && (
        <div className="mb-1">
          <label className="text-sm font-medium text-purple-700 block">
            Content:
          </label>
          <textarea
            value={message.content}
            onChange={(e) => onChange({ ...message, content: e.target.value })}
            className="w-full p-1 text-sm rounded border border-gray-300 min-h-[60px]"
          />
        </div>
      )}
      <button
        onClick={onDelete}
        className="mt-1 p-1 text-red-500 hover:text-red-700"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

const JSONDataChecker: React.FC = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [visibleData, setVisibleData] = useState<DataPoint[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [jsonInput, setJsonInput] = useState("");
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(["role", "content"])
  );

  useEffect(() => {
    updateVisibleData();
  }, [data, currentPage, itemsPerPage]);

  const updateVisibleData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    setVisibleData(data.slice(startIndex, startIndex + itemsPerPage));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target?.result as string);
          if (content.messages && Array.isArray(content.messages)) {
            setData([
              {
                id: "item-0",
                messages: content.messages,
              },
            ]);
            setCurrentPage(1);
          } else {
            throw new Error("Invalid JSON structure");
          }
        } catch (error) {
          console.error("Error parsing JSON:", error);
          alert("Invalid JSON file. Please ensure it has a 'messages' array.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleJSONInput = () => {
    try {
      const parsedData = JSON.parse(jsonInput);
      if (parsedData.messages && Array.isArray(parsedData.messages)) {
        setData([
          {
            id: "item-0",
            messages: parsedData.messages,
          },
        ]);
        setCurrentPage(1);
        setJsonInput("");
      } else {
        throw new Error("Invalid JSON structure");
      }
    } catch (error) {
      console.error("Error parsing JSON:", error);
      alert("Invalid JSON input. Please ensure it has a 'messages' array.");
    }
  };

  const handleEdit = (id: string, newMessages: Message[]) => {
    setData(
      data.map((item) =>
        item.id === id ? { ...item, messages: newMessages } : item
      )
    );
  };

  const handleSelectField = (field: string) => {
    setSelectedFields((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(field)) {
        newSet.delete(field);
      } else {
        newSet.add(field);
      }
      return newSet;
    });
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(data[0].messages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setData([{ ...data[0], messages: items }]);
  };

  const handleSave = () => {
    const jsonString = JSON.stringify({ messages: data[0].messages }, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = "edited_messages.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(
    startIndex + itemsPerPage - 1,
    data[0]?.messages.length || 0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-200 p-4">
      <h1 className="text-3xl font-bold text-center mb-4 text-purple-800">
        JSON Message Checker
      </h1>

      <div className="mb-2">
        <input type="file" onChange={handleFileUpload} className="mb-1" />
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="Or paste your JSON here"
          className="w-full p-2 text-sm rounded-lg border-2 border-purple-300 focus:outline-none focus:border-purple-500 min-h-[80px]"
        />
        <button
          onClick={handleJSONInput}
          className="mt-1 px-3 py-1 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          Load JSON
        </button>
      </div>

      <div className="mb-2 bg-white p-2 rounded-lg shadow-md">
        <h2 className="text-lg font-bold mb-1">Select Fields to Display</h2>
        <FieldSelector
          selectedFields={selectedFields}
          onSelectField={handleSelectField}
        />
      </div>

      <div className="mb-2 flex items-center justify-between">
        <div>
          <label className="mr-2 text-sm">Messages per page:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="p-1 text-sm rounded-lg border-2 border-purple-300 focus:outline-none focus:border-purple-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
        <div className="text-sm font-medium text-purple-700">
          Showing {startIndex}-{endIndex} of {data[0]?.messages.length || 0}{" "}
          messages
        </div>
      </div>

      {data.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {visibleData[0]?.messages.map((message, index) => (
                  <Draggable
                    key={index}
                    draggableId={`message-${index}`}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="bg-white p-3 rounded-lg shadow-md"
                      >
                        <MessageEditor
                          message={message}
                          onChange={(newMessage) => {
                            const newMessages = [...data[0].messages];
                            newMessages[index] = newMessage;
                            handleEdit(data[0].id, newMessages);
                          }}
                          onDelete={() => {
                            const newMessages = data[0].messages.filter(
                              (_, i) => i !== index
                            );
                            handleEdit(data[0].id, newMessages);
                          }}
                          selectedFields={selectedFields}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      <div className="mt-2 flex justify-between items-center">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          Previous Page
        </button>
        <span className="text-sm">
          Page {currentPage} of{" "}
          {Math.ceil((data[0]?.messages.length || 0) / itemsPerPage)}
        </span>
        <button
          onClick={() =>
            setCurrentPage((prev) =>
              Math.min(
                Math.ceil((data[0]?.messages.length || 0) / itemsPerPage),
                prev + 1
              )
            )
          }
          disabled={
            currentPage ===
            Math.ceil((data[0]?.messages.length || 0) / itemsPerPage)
          }
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          Next Page
        </button>
      </div>

      <button
        onClick={handleSave}
        className="mt-2 px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
      >
        Save Changes
      </button>
    </div>
  );
};

export default JSONDataChecker;
