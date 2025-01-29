import { getExistingElements } from "@/lib/getExistingElements";
import { WS_BACKEND_URL } from "@workspace/backend-common/config";
import React, { useEffect, useRef, useState } from "react";
import rough from "roughjs";
import { Drawable } from "roughjs/bin/core";

interface CanvasProps {
  selectedTool: string;
  roomId: string;
}

export interface Params {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

export interface Element extends Params {
  roughElement: Drawable; // Make required
  tool: string;
}

// Add serialization helpers
const serializeElement = (element: Element) => ({
  x1: element.x1,
  y1: element.y1,
  x2: element.x2,
  y2: element.y2,
  tool: element.tool,
  roughElement: {
    shape: element.roughElement.shape,
    options: element.roughElement.options,
    sets: element.roughElement.sets.map((set) => ({
      type: set.type,
      ops: set.ops.map((op) => ({
        op: op.op,
        data: op.data,
      })),
    })),
  },
});

const deserializeElement = (data: any): Element => {
  return {
    x1: data.x1,
    y1: data.y1,
    x2: data.x2,
    y2: data.y2,
    tool: data.tool,
    roughElement: {
      ...data.roughElement,
      sets: data.roughElement.sets,
    },
  };
};

const Canvas = ({ selectedTool, roomId }: CanvasProps) => {
  const [elements, setElements] = useState<Element[]>([]);
  const [drawing, setDrawing] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const drawingElementRef = useRef<Element | null>(null);
  const elementsRef = useRef<Element[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rc = useRef<ReturnType<typeof rough.canvas> | null>(null);
  const generator = useRef<ReturnType<typeof rough.generator> | null>(null);

  // Sync ref with elements state
  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  // WebSocket setup
  useEffect(() => {
    const ws = new WebSocket(
      `${WS_BACKEND_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbTZpMTd6MWgwMDAwaWx6ODdnb2YzdGRrIiwiaWF0IjoxNzM4MTYyNzU2fQ.9DuYwSm74XOjrnfCUVyfIHv3mqwz2A2oJu6y0l8Y4FM`
    );

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join_room", roomId }));
    };

    ws.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data);
        if (data.type === "chat") {
          const elementData = JSON.parse(data.message);
          const newElement = deserializeElement(elementData);
          setElements((prev) => [...prev, newElement]);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    wsRef.current = ws;
    return () => ws.close();
  }, [roomId]);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    rc.current = rough.canvas(canvas);
    generator.current = rough.generator();

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, []);

  // Fetch initial elements
  useEffect(() => {
    const fetchExistingShapes = async () => {
      const existingShapes = await getExistingElements(roomId);
      setElements(existingShapes);
    };
    fetchExistingShapes();
  }, [roomId]);

  // Drawing logic
  const createElement = (tool: string, params: Params): Element => {
    let roughElement;
    const options = { stroke: "black" };

    switch (tool) {
      case "Rectangle":
        roughElement = generator.current?.rectangle(
          params.x1,
          params.y1,
          params.x2 - params.x1,
          params.y2 - params.y1,
          options
        );
        break;
      case "Arrow":
        roughElement = generator.current?.line(
          params.x1,
          params.y1,
          params.x2,
          params.y2,
          options
        );
        break;
      case "Circle":
        roughElement = generator.current?.ellipse(
          (params.x1 + params.x2) / 2,
          (params.y1 + params.y2) / 2,
          params.x2 - params.x1,
          params.y2 - params.y1,
          options
        );
        break;
      default:
        roughElement = undefined;
    }

    if (!roughElement) {
      throw new Error(`Failed to create element for tool: ${tool}`);
    }
    return { ...params, tool, roughElement };
  };

  // Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rc.current) return;

    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);

    elements.forEach(({ roughElement }) => {
      if (roughElement) rc.current?.draw(roughElement);
    });
  }, [elements]);

  // Event handlers
  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
    setDrawing(true);

    const newElement = createElement(selectedTool, {
      x1: x,
      y1: y,
      x2: x,
      y2: y,
    });

    drawingElementRef.current = newElement;
    setElements((prev) => [...prev, newElement]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing || !drawingElementRef.current) return;

    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
    const { x1, y1, tool } = drawingElementRef.current;

    const updatedElement = createElement(tool, {
      x1,
      y1,
      x2: x,
      y2: y,
    });

    drawingElementRef.current = updatedElement;
    setElements((prev) => {
      const newElements = [...prev];
      newElements[newElements.length - 1] = updatedElement;
      return newElements;
    });
  };

  const handleMouseUp = () => {
    setDrawing(false);

    if (
      drawingElementRef.current &&
      wsRef.current?.readyState === WebSocket.OPEN
    ) {
      const elementData = {
        type: "chat",
        message: JSON.stringify(serializeElement(drawingElementRef.current)),
        roomId,
      };
      wsRef.current.send(JSON.stringify(elementData));
    }

    drawingElementRef.current = null;
  };

  return (
    <div
      className="canvas-container"
      style={{ width: "100%", height: "100vh" }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default Canvas;
