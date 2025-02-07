import { getExistingElements } from "@/lib/getExistingElements";
import { WS_BACKEND_URL } from "@workspace/backend-common/config";

import React, { useEffect, useRef, useState } from "react";
import rough from "roughjs";
import { Drawable } from "roughjs/bin/core";
import { Loading } from "./text-rotate";
import { toast } from "@workspace/ui/hooks/use-toast";
import { Toast } from "@workspace/ui/components/toast";
import { DotPattern } from "@workspace/ui/components/dot-pattern";
import { ShareButton } from "./ShareButton";

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
  const [token, setToken] = useState("");
  const [selectedElement, setSelectedElement] = useState<Element>();

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
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    }
  }, [token]);

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
    if (!token) return;

    const ws = new WebSocket(`${WS_BACKEND_URL}?token=${token}`);

    ws.onopen = () => {
      console.log("WebSocket connected");
      ws.send(JSON.stringify({ type: "join_room", roomId }));
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast({
        title: "Websocket Error",
      });
    };

    ws.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data);
        if (data.type === "chat") {
          const newElement = deserializeElement(JSON.parse(data.message));
          setElements((prev) => [...prev, newElement]);
          console.log("message arrived");
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      } finally {
        console.log("error");
      }
    };

    wsRef.current = ws;
    return () => ws.close();
  }, [token, roomId]); // Add token as dependency

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
        console.log("Fetching existing shapes for room:", roomId);
        const existingShapes = await getExistingElements(roomId);
        console.log("Received shapes:", existingShapes);

        // Recreate rough elements
        const generator = rough.generator();
        const recreatedShapes = existingShapes.map((shape) => {
          const roughElement = createElement(shape.tool, {
            x1: shape.x1,
            y1: shape.y1,
            x2: shape.x2,
            y2: shape.y2,
          });
          return roughElement;
        });

        setElements(recreatedShapes);
      } catch (error) {
        console.error("Error fetching shapes:", error);
      }
    };

    if (roomId) {
      fetchExistingShapes();
    }
  }, [roomId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rc.current) return;

    console.log("Rendering elements:", elements);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(offset.x / scale, offset.y / scale);

    elements.forEach((element) => {
      if (element.roughElement) {
        rc.current?.draw(element.roughElement);
      }
    });

    ctx.restore();
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
    const selected = elements.find(
      (el) => x >= el.x1 && x <= el.x2 && y >= el.y1 && y <= el.y2
    );
    if (selected) {
      setSelectedElement(selected);
      return;
    }
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
    } else if (selectedElement) {
      const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
      const deltaX = x - selectedElement.x1;
      const deltaY = y - selectedElement.y1;

      const updatedElement = {
        ...selectedElement,
        x1: selectedElement.x1 + deltaX,
        y1: selectedElement.y1 + deltaY,
        x2: selectedElement.x2 + deltaX,
        y2: selectedElement.y2 + deltaY,
      };

      setSelectedElement(updatedElement);
      setElements((prev) =>
        prev.map((el) => (el === selectedElement ? updatedElement : el))
      );
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    } else if (
      (drawingElementRef.current || selectedElement) &&
      wsRef.current?.readyState === WebSocket.OPEN
    ) {
      const elementData = {
        type: "chat",
        message: JSON.stringify(
          serializeElement(drawingElementRef.current || selectedElement!)
        ),
        roomId,
      };
      wsRef.current.send(JSON.stringify(elementData));
      toast({
        title: "message sent",
      });
    }
    setDrawing(false);
    drawingElementRef.current = null;
    setSelectedElement(undefined);
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
      <DotPattern
        width={15}
        height={15}
        cx={1}
        cy={1}
        cr={1}
        className="absolute inset-0 z-10"
      />
      <div className="top-7 right-7  absolute z-50">
        <ShareButton />
      </div>

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
