import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function Portal({ children }) {
  const elRef = useRef(null);
  if (!elRef.current) {
    const div = document.createElement("div");
    div.style.position = "relative";
    elRef.current = div;
  }
  useEffect(() => {
    const el = elRef.current;
    document.body.appendChild(el);
    return () => { document.body.removeChild(el); };
  }, []);
  return createPortal(children, elRef.current);
}
