import { Hero } from "@/components/animated-hero";
import { DotPattern } from "@workspace/ui/components/dot-pattern";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-svh relative">
      <DotPattern
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
        className="absolute inset-0 z-0"
      />
      <div className="flex flex-col items-center justify-center gap-4 z-10 relative">
        <Hero />
      </div>
    </div>
  );
}
