import { useEffect, useState } from "react";

export function useTypewriter(
  texts: string[],
  speed = 45,
  deleteSpeed = 30,
  holdMs = 1800,
) {
  const [output, setOutput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (texts.length === 0) return;
    const current = texts[index % texts.length];
    let timer: ReturnType<typeof setTimeout>;

    if (!deleting) {
      timer = setTimeout(
        output.length < current.length
          ? () => setOutput(current.slice(0, output.length + 1))
          : () => setDeleting(true),
        output.length < current.length ? speed : holdMs,
      );
    } else if (output.length > 0) {
      timer = setTimeout(
        () => setOutput(current.slice(0, output.length - 1)),
        deleteSpeed,
      );
    } else {
      timer = setTimeout(() => {
        setDeleting(false);
        setIndex((i) => (i + 1) % texts.length);
      }, 10);
    }

    return () => clearTimeout(timer);
  }, [output, deleting, index, texts, speed, deleteSpeed, holdMs]);

  const holding = !deleting && output === texts[index % texts.length];

  return { output, holding };
}
