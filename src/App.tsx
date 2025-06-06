import PuzzleSidebar from "./components/PuzzleSidebar";

import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  // TouchSensor,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import PuzzleDiagram from "./components/PuzzleDiagram";
import { useState } from "react";
import { PieceSize, PuzzlePiece } from "./components/PuzzleGenerator";
import { XYPosition } from "react-cosmos-diagram";

function App() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [droppedPuzzle, setDroppedPuzzle] = useState<PuzzlePiece | null>(null);
  const [sizes, setSizes] = useState<PieceSize | null>(null);
  const [distance, setDistance] = useState<XYPosition | null>(null);

  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);

  const sensors = useSensors(
    // useSensor(TouchSensor),
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleImageChange = (pieces: PuzzlePiece[], sizes: PieceSize) => {
    setPieces(pieces);
    setSizes(sizes);
  };

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const { id } = active;

    setActiveId(Number(id));
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);

    const { active, over, activatorEvent } = event;
    if (!over) return;

    const { id: activeId } = active;
    const { id: overId } = over;

    const pointerEvent = activatorEvent as PointerEvent;

    setDistance({
      x: pointerEvent.layerX,
      y: pointerEvent.layerY,
    });

    const droppedPuzzle = pieces.find((piece) => piece.id === activeId);
    if (droppedPuzzle) setDroppedPuzzle(droppedPuzzle);

    // 정렬
    if (activeId === overId) return;
    setPieces((pieces) => {
      const oldIndex = pieces.findIndex((piece) => piece.id === activeId);
      const newIndex = pieces.findIndex((piece) => piece.id === overId);

      return arrayMove(pieces, oldIndex, newIndex);
    });
  };

  const handleMouseUp = (id: number) => {
    setPieces((pieces) => pieces.filter((piece) => piece.id !== id));

    setDroppedPuzzle(null);
    setDistance(null);
  };

  return (
    <div className="dnd-container">
      <PuzzleDiagram
        distance={distance}
        puzzleSizes={sizes}
        droppedPuzzle={droppedPuzzle}
        onMouseUp={handleMouseUp}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <PuzzleSidebar
          activeId={activeId}
          pieces={pieces}
          onImageChange={handleImageChange}
        />
      </DndContext>
    </div>
  );
}

export default App;
