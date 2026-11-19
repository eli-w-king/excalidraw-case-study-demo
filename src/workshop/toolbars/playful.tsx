import { useEffect, useId, useRef, useState } from "react";

import {
  LockedIcon,
  UnlockedIcon,
} from "@excalidraw/excalidraw/components/icons";
import { t } from "@excalidraw/excalidraw/i18n";

import type { ToolbarMeta, ToolbarProps, ToolbarTool } from "../types";

export const meta: ToolbarMeta = {
  name: "Playful and expressive",
  idea: "A sketchbook palette groups tools by task, with labeled stickers, a tool pocket, and a live mark for the active tool.",
};

const groups = [
  { name: "Move & edit", tone: "mint", tools: ["selection", "hand", "eraser"] },
  {
    name: "Make marks",
    tone: "lilac",
    tools: ["freedraw", "rectangle", "diamond", "ellipse", "arrow", "line"],
  },
  { name: "Add a note", tone: "peach", tools: ["text", "stickynote"] },
] as const;

const toolLabel = (tool: ToolbarTool) => {
  if (tool.type === "hand") {
    return tool.label.split(" (")[0];
  }
  return tool.label;
};

function ToolSticker({
  tool,
  inPocket,
  onSelect,
}: {
  tool: ToolbarTool;
  inPocket?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      className="sketch-tool"
      title={tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label}
      aria-pressed={tool.active}
      disabled={tool.disabled}
      onClick={() => {
        tool.select();
        onSelect?.();
      }}
    >
      <span className="sketch-icon" aria-hidden="true">
        {tool.icon}
      </span>
      <span>{toolLabel(tool)}</span>
      {inPocket && tool.keyHint && <kbd aria-hidden="true">{tool.keyHint}</kbd>}
    </button>
  );
}

export default function PlayfulToolbar({
  tools,
  locked,
  toggleLock,
  renderHint,
  app,
  appState,
}: ToolbarProps) {
  const [pocketOpen, setPocketOpen] = useState(false);
  const pocketId = useId();
  const pocketRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const active = tools.find((tool) => tool.active);
  const lockLabel = t("toolBar.lock");

  useEffect(() => {
    if (!pocketOpen) {
      return;
    }

    const doc = app.ownerDocument;
    const dismissOutside = (event: PointerEvent) => {
      if (!pocketRef.current?.contains(event.target as Node)) {
        setPocketOpen(false);
      }
    };
    doc.addEventListener("pointerdown", dismissOutside);
    return () => doc.removeEventListener("pointerdown", dismissOutside);
  }, [app, pocketOpen]);

  const closePocket = () => {
    setPocketOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div
      className="toolbar-playful"
      data-theme={appState.theme}
      role="group"
      aria-label="Sketchbook drawing tools"
    >
      <style>{styles}</style>
      <div className="sketch-paper">
        <div className="sketch-header">
          <div className="sketch-title">
            <svg
              aria-hidden="true"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2c.5 6 3.5 9 10 10-6.5 1-9.5 4-10 10-1-6-4-9-10-10 6-1 9-4 10-10Z" />
            </svg>
            Sketchbook
          </div>
          {active && (
            <span className="sketch-active" role="status">
              <span>Active</span> {toolLabel(active)}
            </span>
          )}
          <button
            type="button"
            className="sketch-action sketch-lock"
            title={lockLabel}
            aria-label={lockLabel}
            aria-pressed={locked}
            onClick={toggleLock}
          >
            <span className="sketch-icon" aria-hidden="true">
              {locked ? LockedIcon : UnlockedIcon}
            </span>
            Keep tool
          </button>
          <div
            ref={pocketRef}
            className="sketch-pocket"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setPocketOpen(false);
              }
            }}
            onKeyDown={(event) => {
              if (pocketOpen && event.key === "Escape") {
                event.stopPropagation();
                closePocket();
              }
            }}
          >
            <button
              ref={triggerRef}
              type="button"
              className="sketch-action sketch-tab"
              aria-expanded={pocketOpen}
              aria-controls={pocketId}
              onClick={() => setPocketOpen((open) => !open)}
            >
              Tool pocket <span className="sketch-chevron" aria-hidden="true" />
            </button>
            <div
              id={pocketId}
              className="sketch-extras"
              data-tone="peach"
              role="group"
              aria-label="Extra drawing tools"
              hidden={!pocketOpen}
            >
              {tools
                .filter((tool) => tool.group === "more")
                .map((tool) => (
                  <ToolSticker
                    key={tool.type}
                    tool={tool}
                    inPocket
                    onSelect={closePocket}
                  />
                ))}
            </div>
          </div>
        </div>
        <div className="sketch-groups">
          {groups.map((group) => (
            <div
              className="sketch-group"
              data-tone={group.tone}
              key={group.name}
              role="group"
              aria-label={group.name}
            >
              <div className="sketch-caption" aria-hidden="true">
                {group.name}
              </div>
              <div className="sketch-stickers">
                {group.tools.map((type) => {
                  const tool = tools.find((item) => item.type === type);
                  return tool && <ToolSticker key={type} tool={tool} />;
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      {renderHint()}
    </div>
  );
}

const styles = `
  .toolbar-playful {
    --ink: #2e253b;
    --muted: #62526a;
    --paper: #fffcf4;
    --edge: #c9bcb9;
    --rule: #a98d9e26;
    --mint: #d3efe5;
    --lilac: #e8defc;
    --peach: #ffe2cc;
    --shadow: #3e28431c;
    --focus: #6b3db6;
    color: var(--ink);
    max-inline-size: calc(100vw - 9rem);
  }

  .toolbar-playful[data-theme="dark"] {
    --ink: #f9f0ff;
    --muted: #dac9e0;
    --paper: #292330;
    --edge: #706078;
    --rule: #d1a5e326;
    --mint: #254c43;
    --lilac: #483867;
    --peach: #593c36;
    --shadow: #0e0a13a3;
    --focus: #dbc0ff;
  }

  .toolbar-playful .sketch-paper {
    padding: 8px 10px 10px;
    border: 1px solid var(--edge);
    border-radius: 12px 9px 14px 9px;
    background: repeating-linear-gradient(
      transparent 0 22px, var(--rule) 22px 23px
    ), var(--paper);
    box-shadow: 0 3px 0 -1px var(--edge), 0 8px 16px var(--shadow);
  }

  .toolbar-playful .sketch-header {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-block-end: 8px;
  }

  .toolbar-playful .sketch-title {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-inline-end: auto;
    font: 600 21px/1 "Excalifont", sans-serif;
  }

  .toolbar-playful .sketch-title svg {
    color: var(--focus);
  }

  .toolbar-playful .sketch-active {
    display: flex;
    gap: 5px;
    align-items: center;
    padding: 3px 7px;
    font-size: 12px;
    border-block-end: 2px solid var(--focus);
  }

  .toolbar-playful .sketch-active span {
    color: var(--muted);
  }

  .toolbar-playful .sketch-groups,
  .toolbar-playful .sketch-stickers {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .toolbar-playful [data-tone="mint"] { --tint: var(--mint); }
  .toolbar-playful [data-tone="lilac"] { --tint: var(--lilac); }
  .toolbar-playful [data-tone="peach"] { --tint: var(--peach); }

  .toolbar-playful .sketch-group {
    min-inline-size: 0;
    flex: 1 1 auto;
    padding: 3px 5px 5px;
    border: 1px solid var(--edge);
    border-radius: 7px 12px 8px 11px;
    background: var(--tint);
  }

  .toolbar-playful .sketch-caption {
    padding: 1px 3px 4px;
    color: var(--muted);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.075em;
    text-transform: uppercase;
  }

  .toolbar-playful button {
    cursor: pointer;
    color: inherit;
    font: inherit;
    background: var(--paper);
    border: 1px solid transparent;
  }

  .toolbar-playful button:not(:disabled):hover {
    border-color: var(--ink);
    box-shadow: 1px 2px 0 var(--ink);
  }

  .toolbar-playful button:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
  }

  .toolbar-playful button[aria-pressed="true"] {
    border-color: var(--ink);
    box-shadow: inset 0 -3px 0 var(--focus);
    font-weight: 700;
  }

  .toolbar-playful button[aria-pressed="true"]:not(:disabled):hover {
    box-shadow: inset 0 -3px 0 var(--focus), 1px 2px 0 var(--ink);
  }

  .toolbar-playful button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .toolbar-playful .sketch-tool {
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 3px;
    flex: 1 1 auto;
    min-block-size: 43px;
    min-inline-size: 40px;
    padding: 4px 5px;
    border-radius: 5px 8px 5px 7px;
    font-size: 11px;
    line-height: 1.2;
  }

  .toolbar-playful .sketch-icon {
    display: grid;
    place-items: center;
  }

  .toolbar-playful .sketch-icon svg {
    display: block;
    width: 18px;
    height: 18px;
  }

  .toolbar-playful .sketch-action {
    display: flex;
    gap: 5px;
    align-items: center;
    min-block-size: 30px;
    padding: 3px 7px;
    border: 1px solid var(--edge);
    border-radius: 6px;
    font-size: 12px;
  }

  .toolbar-playful .sketch-tab {
    background: var(--peach);
    font-weight: 700;
  }

  .toolbar-playful .sketch-chevron {
    width: 6px;
    height: 6px;
    border: solid currentColor;
    border-width: 0 1.5px 1.5px 0;
    transform: translateY(-2px) rotate(45deg);
  }

  .toolbar-playful .sketch-tab[aria-expanded="true"] .sketch-chevron {
    transform: translateY(2px) rotate(225deg);
  }

  .toolbar-playful .sketch-extras:not([hidden]) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 5px;
    position: absolute;
    z-index: 1;
    inset-block-start: calc(100% + 3px);
    inset-inline-end: 0;
    box-sizing: border-box;
    width: min(290px, 100%);
    padding: 7px;
    border: 1px solid var(--edge);
    border-radius: 8px 5px 12px 8px;
    background: var(--tint);
    box-shadow: 0 4px 0 var(--edge), 0 8px 14px var(--shadow);
  }

  .toolbar-playful .sketch-extras .sketch-tool {
    grid-template-columns: auto 1fr auto;
    align-items: center;
    justify-items: start;
    text-align: start;
  }

  .toolbar-playful .sketch-extras kbd {
    color: var(--muted);
  }

  @media (prefers-reduced-motion: no-preference) {
    .toolbar-playful button {
      transition: transform 120ms ease, box-shadow 120ms ease;
    }
    .toolbar-playful button:not(:disabled):hover {
      transform: translateY(-1px);
    }
    .toolbar-playful button:not(:disabled):active {
      transform: translateY(1px);
    }
    .toolbar-playful .sketch-tool[aria-pressed="true"] .sketch-icon {
      transform: rotate(-9deg);
      transition: transform 140ms cubic-bezier(.2, 1.5, .5, 1);
    }
  }
`;
