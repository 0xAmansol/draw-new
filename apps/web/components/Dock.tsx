import { Button } from "@workspace/ui/components/button";
import {
  Dock,
  DockIcon,
  DockItem,
  DockLabel,
} from "@workspace/ui/components/dock";
import {
  ArrowLeft,
  Circle,
  HomeIcon,
  PencilLine,
  PenLine,
  RectangleHorizontal,
  SunMoon,
} from "lucide-react";
import React from "react";

const data = [
  {
    title: "Home",
    icon: (
      <HomeIcon className="h-full w-full text-neutral-600 dark:text-neutral-300" />
    ),
    tool: "",
  },
  {
    title: "Rectangle",
    icon: (
      <RectangleHorizontal className="h-full w-full text-neutral-600 dark:text-neutral-300" />
    ),
    tool: "Rectangle",
  },
  {
    title: "Arrow",
    icon: (
      <ArrowLeft className="h-full w-full text-neutral-600 dark:text-neutral-300" />
    ),
    tool: "Arrow",
  },
  {
    title: "Circle",
    icon: (
      <Circle className="h-full w-full text-neutral-600 dark:text-neutral-300" />
    ),
    tool: "Circle",
  },
  {
    title: "Pencil",
    icon: (
      <PencilLine className="h-full w-full text-neutral-600 dark:text-neutral-300" />
    ),
    tool: "Pencil",
  },
  {
    title: "Line",
    icon: (
      <PenLine className="h-full w-full text-neutral-600 dark:text-neutral-300" />
    ),
    tool: "Line",
  },
  {
    title: "Theme",
    icon: (
      <SunMoon className="h-full w-full text-neutral-600 dark:text-neutral-300" />
    ),
    tool: "",
  },
];

interface DockProps {
  selectedTool: string;
  setSelectedTool: (tool: string) => void;
}

export function AppleStyleDock({ selectedTool, setSelectedTool }: DockProps) {
  return (
    <div className="absolute flex flex-col items-center gap-4 top-3 left-1/2 max-w-full -translate-x-1/2">
      <Dock className="items-end pb-1">
        {data.map((item, idx) => (
          <DockItem
            key={idx}
            onClick={() => {
              setSelectedTool(item.tool);
            }}
            className={
              selectedTool === item.tool
                ? "aspect-square rounded-full bg-neutral-700 dark:bg-gray-300"
                : "aspect-square rounded-full bg-gray-200 dark:bg-neutral-800"
            }
          >
            <DockLabel>{item.title}</DockLabel>
            <DockIcon>
              {React.cloneElement(item.icon, {
                color: selectedTool === item.tool ? "white" : "black",
              })}
            </DockIcon>
          </DockItem>
        ))}
      </Dock>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        press spacebar to move the canvas, mouse-wheel for zooming
      </p>
    </div>
  );
}
