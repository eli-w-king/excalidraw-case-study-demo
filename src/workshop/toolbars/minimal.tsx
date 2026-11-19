import { useEffect, useId, useRef, useState } from "react";

import { getShortcutFromShortcutName } from "@excalidraw/excalidraw/actions/shortcuts";
import {
  hideTooltip,
  showTooltip,
} from "@excalidraw/excalidraw/components/Tooltip";
import { t } from "@excalidraw/excalidraw/i18n";

import type { ToolbarMeta, ToolbarProps, ToolbarTool } from "../types";
import type { ComponentProps } from "react";

export const meta: ToolbarMeta = {
  name: "Minimal and calm",
  idea: "Keep five sketching essentials in view and tuck the rest behind More tools.",
};

const essentials = new Set<ToolbarTool["type"]>([
  "selection",
  "rectangle",
  "arrow",
  "freedraw",
  "text",
]);

function tooltipProps(
  name: string,
  shortcut = "Enter or Space when focused",
): Pick<
  ComponentProps<"button">,
  | "aria-description"
  | "onPointerEnter"
  | "onPointerLeave"
  | "onFocus"
  | "onBlur"
> {
  const label = `${name} (${shortcut})`;
  return {
    "aria-description": shortcut,
    onPointerEnter: (event) => {
      if (event.pointerType === "mouse") {
        showTooltip(event.currentTarget, label, { delay: true });
      }
    },
    onPointerLeave: hideTooltip,
    onFocus: (event) => {
      if (event.currentTarget.matches(":focus-visible")) {
        showTooltip(event.currentTarget, label);
      }
    },
    onBlur: hideTooltip,
  };
}

const styles = `
  .toolbar-minimal {
    position: relative;
    color: var(--color-on-surface);
  }
  .toolbar-minimal .minimal-strip,
  .toolbar-minimal .minimal-panel {
    background: var(--island-bg-color);
    border: 1px solid var(--default-border-color);
    border-radius: 12px;
    box-shadow: 0 2px 6px rgb(0 0 0 / 8%);
  }
  .toolbar-minimal .minimal-strip {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px;
  }
  .toolbar-minimal button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-width: 40px;
    min-height: 40px;
    padding: 0 8px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 0.8125rem;
    cursor: pointer;
  }
  .toolbar-minimal button:hover:not(:disabled) {
    background: var(--color-surface-high);
  }
  .toolbar-minimal button[aria-pressed="true"],
  .toolbar-minimal button[aria-expanded="true"],
  .toolbar-minimal button[data-active-tool] {
    background: var(--color-surface-primary-container);
    color: var(--color-on-primary-container);
  }
  .toolbar-minimal button:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: -2px;
  }
  .toolbar-minimal button:disabled {
    cursor: default;
    opacity: 0.45;
  }
  .toolbar-minimal .minimal-icon {
    display: flex;
    flex: none;
  }
  .toolbar-minimal .minimal-icon svg {
    width: 18px;
    height: 18px;
  }
  .toolbar-minimal .minimal-more {
    margin-inline-start: 4px;
    white-space: nowrap;
  }
  .toolbar-minimal .minimal-caret {
    width: 5px;
    height: 5px;
    border: solid currentColor;
    border-width: 0 1px 1px 0;
    transform: translateY(-2px) rotate(45deg);
  }
  .toolbar-minimal .minimal-panel {
    position: absolute;
    z-index: 1;
    inset-block-start: calc(100% + 6px);
    inset-inline-end: 0;
    width: min(22rem, calc(100vw - 24px));
    max-height: 65vh;
    overflow: auto;
    box-sizing: border-box;
    padding: 6px;
  }
  .toolbar-minimal .minimal-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2px;
  }
  .toolbar-minimal .minimal-grid + .minimal-grid {
    border-top: 1px solid var(--default-border-color);
    margin-top: 6px;
    padding-top: 6px;
  }
  .toolbar-minimal .minimal-grid button {
    justify-content: flex-start;
    text-align: start;
  }
  .toolbar-minimal kbd {
    margin-inline-start: auto;
    font-size: 0.6875rem;
    opacity: 0.75;
  }
`;

export default function MinimalToolbar({
  app,
  tools,
  locked,
  toggleLock,
  openCommandPalette,
  renderHint,
}: ToolbarProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const groupRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const moreLabel = t("toolBar.extraTools");
  const lockLabel = t("toolBar.lock");
  const paletteLabel = t("commandPalette.title");
  const deferred = tools.filter((tool) => !essentials.has(tool.type));

  useEffect(() => {
    if (!expanded) {
      return;
    }
    const ownerDocument = app.ownerDocument;
    const dismissOutside = (event: PointerEvent) => {
      if (groupRef.current && !event.composedPath().includes(groupRef.current)) {
        setExpanded(false);
      }
    };
    ownerDocument.addEventListener("pointerdown", dismissOutside, true);
    return () =>
      ownerDocument.removeEventListener("pointerdown", dismissOutside, true);
  }, [app, expanded]);

  function closePanel() {
    setExpanded(false);
    moreRef.current?.focus();
  }

  function chooseAction(action: () => void) {
    closePanel();
    action();
  }

  function renderTool(tool: ToolbarTool, showLabel = false) {
    return (
      <button
        key={tool.type}
        type="button"
        aria-label={tool.label}
        aria-pressed={tool.active}
        disabled={tool.disabled}
        {...tooltipProps(tool.label, tool.shortcut ?? undefined)}
        onClick={() => {
          if (showLabel) {
            chooseAction(tool.select);
          } else {
            setExpanded(false);
            tool.select();
          }
        }}
      >
        <span className="minimal-icon" aria-hidden="true">
          {tool.icon}
        </span>
        {showLabel && tool.label}
        {showLabel && tool.keyHint && (
          <kbd aria-hidden="true">{tool.keyHint}</kbd>
        )}
      </button>
    );
  }

  return (
    <>
      <div
        className="toolbar-minimal"
        ref={groupRef}
        role="group"
        aria-label={t("headings.shapes")}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setExpanded(false);
          }
        }}
        onClick={hideTooltip}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            // Let the focused button activate without sending the key to the canvas.
            event.stopPropagation();
          } else if (event.key === "Escape") {
            if (expanded) {
              event.preventDefault();
              event.stopPropagation();
              closePanel();
            }
            hideTooltip();
          }
        }}
      >
        <style>{styles}</style>
        <div className="minimal-strip">
          {tools
            .filter((tool) => essentials.has(tool.type))
            .map((tool) => renderTool(tool))}
          <button
            ref={moreRef}
            className="minimal-more"
            type="button"
            aria-expanded={expanded}
            aria-controls={panelId}
            data-active-tool={deferred.some((tool) => tool.active) || undefined}
            {...tooltipProps(moreLabel)}
            onClick={() => setExpanded(!expanded)}
          >
            {moreLabel}
            <span className="minimal-caret" aria-hidden="true" />
          </button>
        </div>
        <div className="minimal-panel" id={panelId} hidden={!expanded}>
          <div className="minimal-grid">
            {deferred.map((tool) => renderTool(tool, true))}
          </div>
          <div className="minimal-grid">
            <button
              type="button"
              aria-pressed={locked}
              disabled={app.props.activeTool != null}
              {...tooltipProps(lockLabel, getShortcutFromShortcutName("toolLock"))}
              onClick={toggleLock}
            >
              {lockLabel}
            </button>
            <button
              type="button"
              {...tooltipProps(
                paletteLabel,
                getShortcutFromShortcutName("commandPalette"),
              )}
              onClick={() => chooseAction(openCommandPalette)}
            >
              {paletteLabel}
            </button>
          </div>
        </div>
      </div>
      {renderHint()}
    </>
  );
}
