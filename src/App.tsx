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
  DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import PuzzleDiagram from "./components/PuzzleDiagram";
import { MouseEventHandler, TouchEventHandler, useRef, useState } from "react";
import { PieceSize, PuzzlePiece } from "./components/PuzzleGenerator";
import { Node, XYPosition } from "react-cosmos-diagram";
import { NodeData } from "./components/PuzzleNode";

const getId = (pieceId: number) => `puzzle-node-${pieceId}`;

const getTranslateValues = (transformString: string) => {
  const translateRegex = /translate\(\s*([^\s,]+)px\s*,\s*([^\s,]+)px\s*\)/;
  const scaleRegex = /scale\(\s*([^\s,]+)\s*(?:,\s*([^\s,]+))?\s*\)/;

  const matches = transformString.match(translateRegex);
  const scaleMatches = transformString.match(scaleRegex);

  let x = 0,
    y = 0,
    scale = 1;

  if (matches) {
    x = parseFloat(matches[1]);
    y = parseFloat(matches[2]);
  }

  if (scaleMatches) {
    scale = parseFloat(scaleMatches[1]);
  }
  return { x, y, scale };
};

const getTranslateXYValues = (element: HTMLElement | null) => {
  if (!element) return { x: 0, y: 0, z: 0 };
  const style = window.getComputedStyle(element);
  const matrix = new WebKitCSSMatrix(style.transform);

  return {
    x: matrix.m41, // translateX
    y: matrix.m42, // translateY
    z: matrix.m43,
  };
};

const hasMouseSupport = (): boolean => {
  const hasPointerFine = window.matchMedia("(pointer: fine)").matches;

  const hasTouchSupport =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  return hasPointerFine && !hasTouchSupport;
};

function App() {
  const ref = useRef<HTMLDivElement>(null);

  const [activeId, setActiveId] = useState<number | null>(null);
  const [droppedPuzzle, setDroppedPuzzle] = useState<PuzzlePiece | null>(null);
  const [sizes, setSizes] = useState<PieceSize | null>(null);
  const [distance, setDistance] = useState<XYPosition | null>(null);

  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);

  const [puzzleNode, setPuzzleNode] = useState<Node<NodeData> | null>(null);

  const sensors = useSensors(
    useSensor(hasMouseSupport() ? PointerSensor : TouchSensor),
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
    const { active, over, activatorEvent } = event;
    if (!over) return;

    const { id: activeId } = active;
    const { id: overId } = over;

    if (hasMouseSupport()) {
      const pointerEvent = activatorEvent as PointerEvent;

      setDistance({
        x: pointerEvent.layerX,
        y: pointerEvent.layerY,
      });
    } else {
      const touchEvent = activatorEvent as TouchEvent;
      const touch = touchEvent.touches[0];

      const target = activatorEvent.target as HTMLElement;

      const { x, y } = getTranslateXYValues(target.parentElement);
      const rect = target.getBoundingClientRect();

      const layerX = touch.clientX - rect.left + x;
      const layerY = touch.clientY - rect.top + y;

      setDistance({
        x: layerX,
        y: layerY,
      });
    }

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

  const handleNodeUpdate = ({ x, y }: XYPosition) => {
    if (!droppedPuzzle) return;
    if (!distance) return;
    if (!sizes) return;

    const viewport = ref.current?.querySelector(
      ".react-diagram__viewport"
    ) as HTMLDivElement;

    if (!viewport) return;

    const isIn = x < viewport.offsetWidth && y < viewport.offsetHeight;
    if (!isIn) return;

    const translate = getTranslateValues(viewport?.style.transform);
    const position = {
      x: (x - distance.x - translate.x) / translate.scale,
      y: (y - distance.y - translate.y) / translate.scale,
    };

    const newNode = {
      id: getId(droppedPuzzle.id),
      type: "puzzle",
      position,
      data: {
        piece: droppedPuzzle,
        size: sizes,
      },
    };

    setPuzzleNode(newNode);
    setPieces((pieces) => pieces.filter((piece) => piece.id !== activeId));
  };
  const handleMouseUp: MouseEventHandler<HTMLDivElement> = (e) => {
    handleNodeUpdate({ x: e.clientX, y: e.clientY });
  };

  const handleTouchEnd: TouchEventHandler<HTMLDivElement> = (e) => {
    handleNodeUpdate({
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    });
  };

  const handleUpdateSuccess = () => {
    setActiveId(null);
    setDroppedPuzzle(null);
    setDistance(null);
    setPuzzleNode(null);
  };

  return (
    <div
      ref={ref}
      className="dnd-container"
      onMouseUp={handleMouseUp}
      onTouchEnd={handleTouchEnd}
    >
      <PuzzleDiagram
        puzzleNode={puzzleNode}
        onUpdateSuccess={handleUpdateSuccess}
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
