import { formatRequirementsHeuristic } from "@/lib/utils/format-requirements-heuristic";

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[var(--foreground)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let listItems: string[] = [];

  function flushList() {
    if (listItems.length === 0) return;
    nodes.push(
      <ul key={`ul-${nodes.length}`} className="list-disc pl-4 space-y-1.5 my-2">
        {listItems.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed">
            {renderInline(item)}
          </li>
        ))}
      </ul>
    );
    listItems = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      nodes.push(
        <h4
          key={`h-${nodes.length}`}
          className="font-bold text-sm mt-3 mb-1.5 first:mt-0 text-[var(--accent)]"
        >
          {trimmed.slice(3)}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      listItems.push(trimmed.slice(2));
      continue;
    }
    flushList();
    nodes.push(
      <p key={`p-${nodes.length}`} className="text-sm leading-relaxed my-1">
        {renderInline(trimmed)}
      </p>
    );
  }
  flushList();
  return nodes;
}

export function FormattedRequirements({
  raw,
  formatted,
}: {
  raw: string;
  formatted?: string | null;
}) {
  const content = formatted?.trim() || formatRequirementsHeuristic(raw);
  return <div className="formatted-requirements">{renderMarkdown(content)}</div>;
}
