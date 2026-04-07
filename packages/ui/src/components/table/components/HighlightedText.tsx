interface HighlightedTextProps {
  text: string
  highlight: string
}

export function HighlightedText({ text, highlight }: Readonly<HighlightedTextProps>) {
  if (!highlight.trim()) return <>{text}</>;

  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase()
          ? (
            <mark
              key={i}
              className="bg-primary/20 text-primary font-medium rounded-sm px-0.5"
            >
              {part}
            </mark>
          )
          : (
            part
          ),
      )}
    </>
  );
}
