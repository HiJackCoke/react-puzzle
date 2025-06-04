import PuzzleSidebar from "./components/PuzzleSidebar";

import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
  DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import PuzzleDiagram from "./components/PuzzleDiagram";
import { useState } from "react";

function App() {
  const [activeId, setActiveId] = useState<number>();

  const sensors = useSensors(
    useSensor(TouchSensor),
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const { id } = active;

    setActiveId(Number(id));
  }

  return (
    <div className="dnd-container">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
      >
        <PuzzleDiagram />
        <PuzzleSidebar activeId={activeId} />
      </DndContext>
    </div>
  );
}

export default App;
