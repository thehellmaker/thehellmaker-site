import { useEffect, useRef } from "react";
import anime from "animejs";

interface NodeProps {
  hash: number;
  color: string;
}

const Node: React.FC<NodeProps> = ({ hash, color }) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const CENTER = { x: 250, y: 250 };
  const RADIUS = 200;

  useEffect(() => {
    if (!nodeRef.current) return;

    const angle = (hash / 360) * Math.PI * 2;
    const x = CENTER.x + RADIUS * Math.cos(angle);
    const y = CENTER.y + RADIUS * Math.sin(angle);

    anime({
      targets: nodeRef.current,
      left: `${x}px`,
      top: `${y}px`,
      duration: 1000,
      easing: "easeOutElastic",
    });
  }, [hash]);

  return (
    <div
      ref={nodeRef}
      style={{
        position: "absolute",
        width: "10px",
        height: "10px",
        background: color,
        borderRadius: "50%",
        transform: "translate(-50%, -50%)",
      }}
    />
  );
};

export default Node;
