import React, { useEffect, useRef, useState } from "react";
import rough from "roughjs";
import { Drawable } from "roughjs/bin/core";

interface CanvasProps {
  selectedTool: string;
  roomId: string;
}

interface Params {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

interface Element extends Params {
  roughElement: Drawable | undefined;
}

const Canvas = ({ selectedTool, roomId }: CanvasProps) => {
  const [elements, setElements] = useState<Element[]>([]);
  const [drawing, setDrawing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rc = useRef<ReturnType<typeof rough.canvas> | null>(null);
  const generator = useRef<ReturnType<typeof rough.generator> | null>(null);

  // Set canvas dimensions and initialize RoughJS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to match its container
    const updateCanvasSize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Initialize RoughJS canvas and generator
    rc.current = rough.canvas(canvas);
    generator.current = rc.current.generator;

    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  function createElement(tool: string, params: Params): Element {
    let roughElement;
    switch (tool) {
      case "Rectangle":
        roughElement = generator.current?.rectangle(
          params.x1,
          params.y1,
          params.x2 - params.x1,
          params.y2 - params.y1,
          { stroke: "black" }
        );
        break;
      case "Arrow":
        roughElement = generator.current?.line(
          params.x1,
          params.y1,
          params.x2,
          params.y2,
          { stroke: "black" }
        );
        break;
      case "Circle":
        roughElement = generator.current?.ellipse(
          params.x1,
          params.y1,
          params.x2 - params.x1,
          params.y2 - params.y1,
          { stroke: "black" }
        );
        break;
      default:
        roughElement = generator.current?.rectangle(
          params.x1,
          params.y1,
          params.x2 - params.x1,
          params.y2 - params.y1,
          { stroke: "grey" }
        );
    }
    return { ...params, roughElement };
  }

  // Redraw elements when they change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rc.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    elements.forEach(({ roughElement }) => {
      if (!roughElement) return;
      rc.current?.draw(roughElement);
    });
  }, [elements]);

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const HandleMouseDown = (event: React.MouseEvent) => {
    const { clientX, clientY } = event;
    const { x, y } = getCanvasCoordinates(clientX, clientY);
    setDrawing(true);

    const element = createElement(selectedTool, {
      x1: x,
      y1: y,
      x2: x,
      y2: y,
    });
    setElements((prev) => [...prev, element]);
  };

  const HandleMouseMove = (event: React.MouseEvent) => {
    if (!drawing) return;

    const { clientX, clientY } = event;
    const { x, y } = getCanvasCoordinates(clientX, clientY);
    const index = elements.length - 1;
    const element = elements[index];
    if (!element) return;

    const updatedElement = createElement(selectedTool, {
      x1: element.x1,
      y1: element.y1,
      x2: x,
      y2: y,
    });

    setElements((prev) => {
      const newElements = [...prev];
      newElements[index] = updatedElement;
      return newElements;
    });
  };

  const HandleMouseUp = () => {
    setDrawing(false);
  };

  return (
    <div
      className="canvas-container"
      style={{ width: "100%", height: "100vh" }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={HandleMouseDown}
        onMouseUp={HandleMouseUp}
        onMouseMove={HandleMouseMove}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default Canvas;
