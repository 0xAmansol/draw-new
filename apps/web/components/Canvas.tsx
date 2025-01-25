"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import rough from "roughjs/bin/rough";
import type { Drawable } from "roughjs/bin/core";

import {
  getExistingShapes,
  pushExistingShape,
} from "@/hooks/getExistingShapes";

const generator = rough.generator();

interface ElementParams {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Element extends ElementParams {
  roughElement: Drawable;
}

type CanvasProps = {
  selectedTool: string;
  userId: string;
  params: {
    roomId: string;
  };
};

function createElement(params: ElementParams, tool: string): Element {
  let roughElement;
  switch (tool) {
    case "Rectangle":
      roughElement = generator.rectangle(
        params.x1,
        params.y1,
        params.x2 - params.x1,
        params.y2 - params.y1,
        { stroke: "white" }
      );
      break;
    case "Arrow":
      roughElement = generator.line(
        params.x1,
        params.y1,
        params.x2,
        params.y2,
        { stroke: "white" }
      );
      break;
    case "Circle":
      roughElement = generator.ellipse(
        params.x1,
        params.y1,
        params.x2 - params.x1,
        params.y2 - params.y1,
        { stroke: "white" }
      );
      break;
    default:
      roughElement = generator.rectangle(
        params.x1,
        params.y1,
        params.x2 - params.x1,
        params.y2 - params.y1,
        { stroke: "white" }
      );
  }
  return { ...params, roughElement };
}

const Canvas = ({ selectedTool, params, userId }: CanvasProps) => {
  const [elements, setElements] = useState<Element[]>([]);
  const [drawing, setDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const roomId = params.roomId;

  useEffect(() => {
    const fetchShapes = async () => {
      const shapes = await getExistingShapes({ params: { roomId } });

      setElements(shapes);
    };
    fetchShapes();
  }, [roomId]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;

    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const roughCanvas = rough.canvas(canvas);
        elements.forEach(({ roughElement }) => roughCanvas.draw(roughElement));
      }
    }
  }, [elements]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const roughCanvas = rough.canvas(canvas);
          elements.forEach(({ roughElement }) =>
            roughCanvas.draw(roughElement)
          );
        }
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [elements]);

  const handleMouseDown = (event: React.MouseEvent) => {
    setDrawing(true);
    const { clientX, clientY } = event;
    const element = createElement(
      {
        x1: clientX,
        y1: clientY,
        x2: clientX,
        y2: clientY,
      },
      selectedTool
    );
    setElements((prevState) => [...prevState, element]);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!drawing) return;

    const { clientX, clientY } = event;
    const index = elements.length - 1;
    const element = elements[index];
    if (!element) return;

    const { x1, y1 } = element;
    const updatedElement = createElement(
      { x1, y1, x2: clientX, y2: clientY },
      selectedTool
    );

    setElements((prevState) => {
      const newElements = [...prevState];
      newElements[index] = updatedElement;
      return newElements;
    });
  };

  const handleMouseUp = () => {
    setDrawing(false);
    const shape = elements[elements.length - 1];
    if (!shape) return;
    pushExistingShape({ roomId: Number(roomId), message: shape, userId });
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="bg-black"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      ></canvas>
    </div>
  );
};

export default Canvas;
