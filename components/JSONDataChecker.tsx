import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";

interface DataPoint {
  id: string;
  original: any;
  edited: any;
}

const FieldSelector: React.FC<{
  structure: any;
  selectedFields: Set<string>;
  onSelectField: (field: string) => void;
  path?: string[];
}> = ({ structure, selectedFields, onSelectField, path = [] }) => {
  if (typeof structure !== "object" || structure === null) {
    const fieldPath = path.join(".");
    return (
      <div className="ml-2">
        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            checked={selectedFields.has(fieldPath)}
            onChange={() => onSelectField(fieldPath)}
            className="mr-1"
          />
          {path[path.length - 1] || "Root"}
        </label>
      </div>
    );
  }

  return (
    <div className="ml-2">
      {Object.entries(structure).map(([key, value]) => (
        <FieldSelector
          key={key}
          structure={value}
          selectedFields={selectedFields}
          onSelectField={onSelectField}
          path={[...path, key]}
        />
      ))}
    </div>
  );
};

const RecursiveJsonEditor: React.FC<{
  data: any;
  onChange: (newData: any) => void;
  onDelete: () => void;
  path: string[];
  selectedFields: Set<string>;
}> = ({ data, onChange, onDelete, path, selectedFields }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const currentPath = path.join(".");
  const isSelected = selectedFields.has(currentPath);

  if (typeof data !== "object" || data === null) {
    if (!isSelected) {
      return null;
    }
    const fieldName = path[path.length - 1];
    if (fieldName === "role") {
      return null; // We'll handle 'role' display in the parent component
    }
    return (
      <div className="mb-1 flex items-center">
        <div className="flex-grow">
          <label className="text-sm font-medium text-purple-700 block">
            {fieldName}:
          </label>
          <textarea
            value={String(data)}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-1 text-sm rounded border border-gray-300 min-h-[60px]"
          />
        </div>
        <button
          onClick={onDelete}
          className="ml-2 p-1 text-red-500 hover:text-red-700"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const ToggleIcon = isExpanded ? ChevronDownIcon : ChevronRightIcon;
  const roleValue = data.role ? ` (${data.role})` : "";

  return (
    <div className="mb-1">
      <div className="flex items-center">
        <div
          className="flex items-center cursor-pointer text-sm flex-grow"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <ToggleIcon className="h-4 w-4 mr-1 text-purple-500" />
          <span className="font-medium">
            {path[path.length - 1] || "Root"}
            {roleValue}
          </span>
        </div>
        <button
          onClick={onDelete}
          className="ml-2 p-1 text-red-500 hover:text-red-700"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
      {isExpanded && (
        <div className="ml-4">
          {Object.entries(data).map(
            ([key, value]) =>
              key !== "role" && (
                <RecursiveJsonEditor
                  key={key}
                  data={value}
                  onChange={(newValue) => {
                    const newData = { ...data, [key]: newValue };
                    onChange(newData);
                  }}
                  onDelete={() => {
                    const { [key]: deletedKey, ...rest } = data;
                    onChange(rest);
                  }}
                  path={[...path, key]}
                  selectedFields={selectedFields}
                />
              )
          )}
        </div>
      )}
    </div>
  );
};

const JSONDataChecker: React.FC = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [visibleData, setVisibleData] = useState<DataPoint[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [jsonInput, setJsonInput] = useState("");
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [structure, setStructure] = useState<any>(null);

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
          const newData = Array.isArray(content) ? content : [content];
          setData(
            newData.map((item, index) => ({
              id: `item-${index}`,
              original: item,
              edited: JSON.parse(JSON.stringify(item)),
            }))
          );
          setStructure(newData[0]);
          setCurrentPage(1);
          setSelectedFields(new Set());
        } catch (error) {
          console.error("Error parsing JSON:", error);
          alert("Invalid JSON file. Please try again.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleJSONInput = () => {
    try {
      const parsedData = JSON.parse(jsonInput);
      const newData = Array.isArray(parsedData) ? parsedData : [parsedData];
      setData(
        newData.map((item, index) => ({
          id: `item-${index}`,
          original: item,
          edited: JSON.parse(JSON.stringify(item)),
        }))
      );
      setStructure(newData[0]);
      setCurrentPage(1);
      setSelectedFields(new Set());
      setJsonInput("");
    } catch (error) {
      console.error("Error parsing JSON:", error);
      alert("Invalid JSON input. Please try again.");
    }
  };

  const handleEdit = (id: string, newValue: any) => {
    setData(
      data.map((item) =>
        item.id === id ? { ...item, edited: newValue } : item
      )
    );
  };

  const handleDelete = (id: string) => {
    setData(data.filter((item) => item.id !== id));
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
    const items = Array.from(data);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setData(items);
  };

  const handleSave = () => {
    const jsonString = JSON.stringify(
      data.map((item) => item.edited),
      null,
      2
    );
    const blob = new Blob([jsonString], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = "edited_data.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(startIndex + itemsPerPage - 1, data.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-200 p-4">
      <h1 className="text-3xl font-bold text-center mb-4 text-purple-800">
        JSON Data Checker
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

      {structure && (
        <div className="mb-2 bg-white p-2 rounded-lg shadow-md">
          <h2 className="text-lg font-bold mb-1">Select Fields to Focus</h2>
          <FieldSelector
            structure={structure}
            selectedFields={selectedFields}
            onSelectField={handleSelectField}
          />
        </div>
      )}

      <div className="mb-2 flex items-center justify-between">
        <div>
          <label className="mr-2 text-sm">Items per page:</label>
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
          Showing {startIndex}-{endIndex} of {data.length} items
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {visibleData.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="bg-white p-3 rounded-lg shadow-md"
                    >
                      <RecursiveJsonEditor
                        data={item.edited}
                        onChange={(newValue) => handleEdit(item.id, newValue)}
                        onDelete={() => handleDelete(item.id)}
                        path={[]}
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

      <div className="mt-2 flex justify-between items-center">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          Previous Page
        </button>
        <span className="text-sm">
          Page {currentPage} of {Math.ceil(data.length / itemsPerPage)}
        </span>
        <button
          onClick={() =>
            setCurrentPage((prev) =>
              Math.min(Math.ceil(data.length / itemsPerPage), prev + 1)
            )
          }
          disabled={currentPage === Math.ceil(data.length / itemsPerPage)}
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
