import { getExistingElements } from "@/lib/getExistingElements";
import { WS_BACKEND_URL } from "@workspace/backend-common/config";

import React, { useEffect, useRef, useState } from "react";
import rough from "roughjs";
import { Drawable } from "roughjs/bin/core";
import { Loading } from "./text-rotate";

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
  roughElement: Drawable;
  tool: string;
}

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

const deserializeElement = (data: any): Element => ({
  x1: data.x1,
  y1: data.y1,
  x2: data.x2,
  y2: data.y2,
  tool: data.tool,
  roughElement: {
    ...data.roughElement,
    sets: data.roughElement.sets,
  },
});

const Canvas = ({ selectedTool, roomId }: CanvasProps) => {
  // State hooks - keep all state declarations together
  const [elements, setElements] = useState<Element[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Refs - keep all refs together
  const wsRef = useRef<WebSocket | null>(null);
  const drawingElementRef = useRef<Element | null>(null);
  const elementsRef = useRef<Element[]>([]);
  const lastPanPoint = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rc = useRef<ReturnType<typeof rough.canvas> | null>(null);
  const generator = useRef<ReturnType<typeof rough.generator> | null>(null);

  // All useEffect hooks
  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") setIsSpacePressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const ws = new WebSocket(
      `${WS_BACKEND_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbTZpMTd6MWgwMDAwaWx6ODdnb2YzdGRrIiwiaWF0IjoxNzM4MTYyNzU2fQ.9DuYwSm74XOjrnfCUVyfIHv3mqwz2A2oJu6y0l8Y4FM`
    );

    ws.onopen = () => ws.send(JSON.stringify({ type: "join_room", roomId }));
    ws.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data);
        if (data.type === "chat") {
          const newElement = deserializeElement(JSON.parse(data.message));
          setElements((prev) => [...prev, newElement]);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    wsRef.current = ws;
    return () => ws.close();
  }, [roomId]);

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

  useEffect(() => {
    const fetchExistingShapes = async () => {
      try {
        setIsLoading(true);
        const existingShapes = await getExistingElements(roomId);
        setElements(existingShapes);
      } catch (error) {
        console.log("error fetching shapes: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExistingShapes();
  }, [roomId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rc.current) return;

    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);

    ctx?.save();
    ctx?.scale(scale, scale);
    ctx?.translate(offset.x / scale, offset.y / scale);

    elements.forEach(({ roughElement }) => {
      if (roughElement) rc.current?.draw(roughElement);
    });

    ctx?.restore();
  }, [elements, scale, offset]);

  const createElement = (tool: string, params: Params): Element => {
    const options = { stroke: "black" };
    let roughElement;

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
        throw new Error(`Unsupported tool: ${tool}`);
    }

    return { ...params, tool, roughElement: roughElement! };
  };

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - offset.x) / scale,
      y: (clientY - rect.top - offset.y) / scale,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSpacePressed) {
      setIsPanning(true);
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
      return;
    }

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
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.current.x;
      const deltaY = e.clientY - lastPanPoint.current.y;
      setOffset((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
    } else if (drawing && drawingElementRef.current) {
      const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
      const { x1, y1, tool } = drawingElementRef.current;

      const updatedElement = createElement(tool, { x1, y1, x2: x, y2: y });
      drawingElementRef.current = updatedElement;
      setElements((prev) => {
        const newElements = [...prev];
        newElements[newElements.length - 1] = updatedElement;
        return newElements;
      });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    } else if (
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
    setDrawing(false);
    drawingElementRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = scale * delta;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newOffsetX = mouseX - (mouseX - offset.x) * (newScale / scale);
    const newOffsetY = mouseY - (mouseY - offset.y) * (newScale / scale);

    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  // Return canvas directly without conditional rendering
  return (
    <div
      className="canvas-container"
      style={{ width: "100%", height: "100vh" }}
    >
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            <p className="text-sm text-gray-600">Loading canvas...</p>
          </div>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{
            width: "100%",
            height: "100%",
            cursor: isSpacePressed ? "grab" : "crosshair",
            ...(isPanning && { cursor: "grabbing" }),
          }}
        />
      )}
    </div>
  );
};

export default Canvas;
