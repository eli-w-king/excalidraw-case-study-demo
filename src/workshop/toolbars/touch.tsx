import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { Popover } from "radix-ui";

import {
  DotsHorizontalIcon,
  LockedIcon,
  UnlockedIcon,
} from "@excalidraw/excalidraw/components/icons";
import { t } from "@excalidraw/excalidraw/i18n";

import type { ToolbarMeta, ToolbarProps, ToolbarTool } from "../types";

export const meta: ToolbarMeta = {
  name: "Big and touch friendly",
  idea: "Large labeled tools in a low dock, within easy reach of either hand.",
};

const primaryGroups: ReadonlyArray<ReadonlyArray<ToolbarTool["type"]>> = [
  ["hand", "selection", "rectangle", "ellipse", "arrow"],
  ["freedraw", "text", "eraser"],
];

const styles = `
  .toolbar-touch {
    position: absolute;
    inset-inline: max(12px, var(--editor-container-padding));
    /* Leave room for the bottom controls and the lab pill below the dock. */
    bottom: max(122px, calc(env(safe-area-inset-bottom) + 108px));
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    justify-items: center;
    pointer-events: none;
    color: var(--text-primary-color);
    z-index: 1;
  }

  .toolbar-touch .touch-dock,
  .toolbar-touch .touch-tray {
    box-sizing: border-box;
    padding: 10px;
    border: 1px solid var(--default-border-color);
    border-radius: 20px;
    background: var(--island-bg-color);
    box-shadow: var(--shadow-island);
    pointer-events: var(--ui-pointerEvents);
  }

  .toolbar-touch .touch-dock {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px 14px;
    width: 840px;
    max-width: 100%;
  }

  .toolbar-touch .touch-group {
    flex: 0 1 402px;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 8px;
    min-width: 0;
  }

  @media (max-width: 864px) {
    .toolbar-touch .touch-dock {
      width: 424px;
    }
  }

  .toolbar-touch .touch-target {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 4px;
    min-height: 64px;
    min-width: 0;
    padding: 6px 3px;
    border: 1px solid transparent;
    border-radius: 12px;
    background: var(--color-surface-high);
    color: inherit;
    font: 650 12px/1.1 var(--ui-font);
    overflow-wrap: anywhere;
    text-align: center;
    touch-action: manipulation;
    cursor: pointer;
  }

  .toolbar-touch .touch-icon {
    display: grid;
    place-items: center;
  }

  .toolbar-touch .touch-icon svg {
    width: 23px;
    height: 23px;
  }

  @media (hover: hover) {
    .toolbar-touch .touch-target:not(:disabled):hover {
      border-color: var(--color-primary);
    }
  }

  .toolbar-touch .touch-target:is(:active, [aria-pressed="true"], [aria-expanded="true"], [data-current]) {
    border-color: var(--color-primary);
    background: var(--color-surface-primary-container);
    color: var(--color-on-primary-container);
  }

  .toolbar-touch .touch-target:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .toolbar-touch .touch-target:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .toolbar-touch .touch-tray {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(74px, 1fr));
    gap: 8px;
    width: min(460px, var(--radix-popover-content-available-width));
    max-height: var(--radix-popover-content-available-height);
    overflow: auto;
  }

  .toolbar-touch .HintViewer {
    position: static;
    grid-row: 1;
    margin: 0 0 4px;
    padding: 0;
    width: auto;
  }
`;

const ToolButton = ({
  tool,
  onSelect,
}: {
  tool: ToolbarTool;
  onSelect?: () => void;
}) => (
  <button
    type="button"
    className="touch-target"
    aria-pressed={tool.active}
    disabled={tool.disabled}
    title={tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label}
    onClick={() => {
      tool.select();
      onSelect?.();
    }}
  >
    <span className="touch-icon" aria-hidden="true">
      {tool.icon}
    </span>
    <span>{tool.label}</span>
  </button>
);

export default function TouchToolbar({
  tools,
  locked,
  toggleLock,
  renderHint,
}: ToolbarProps) {
  const [layer, setLayer] = useState<HTMLElement | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const anchor = useCallback((node: HTMLSpanElement | null) => {
    setLayer(node?.closest<HTMLElement>(".layer-ui__wrapper") ?? null);
  }, []);
  const groupedTools = primaryGroups.map((group) =>
    group.flatMap((id) => tools.filter((tool) => tool.type === id)),
  );
  const moreTools = tools.filter(
    (tool) => !primaryGroups.some((group) => group.includes(tool.type)),
  );
  const moreLabel = t("toolBar.extraTools");

  return (
    <>
      <span ref={anchor} hidden />
      {layer &&
        createPortal(
          <div className="toolbar-touch">
            <style>{styles}</style>
            <Popover.Root open={moreOpen} onOpenChange={setMoreOpen}>
              <Popover.Anchor asChild>
                <div
                  className="touch-dock"
                  role="group"
                  aria-label={t("headings.shapes")}
                >
                  <div className="touch-group">
                    {groupedTools[0].map((tool) => (
                      <ToolButton key={tool.type} tool={tool} />
                    ))}
                  </div>
                  <div className="touch-group">
                    {groupedTools[1].map((tool) => (
                      <ToolButton key={tool.type} tool={tool} />
                    ))}
                    <button
                      type="button"
                      className="touch-target"
                      aria-pressed={locked}
                      title={t("toolBar.lock")}
                      onClick={toggleLock}
                    >
                      <span className="touch-icon" aria-hidden="true">
                        {locked ? LockedIcon : UnlockedIcon}
                      </span>
                      <span>{t("toolBar.keepToolActive")}</span>
                    </button>
                    <Popover.Trigger
                      type="button"
                      className="touch-target"
                      data-current={
                        moreTools.some((tool) => tool.active) || undefined
                      }
                    >
                      <span className="touch-icon" aria-hidden="true">
                        {DotsHorizontalIcon}
                      </span>
                      <span>{moreLabel}</span>
                    </Popover.Trigger>
                  </div>
                </div>
              </Popover.Anchor>
              <Popover.Content
                className="touch-tray"
                aria-label={moreLabel}
                side="top"
                sideOffset={10}
                collisionPadding={12}
              >
                {moreTools.map((tool) => (
                  <ToolButton
                    key={tool.type}
                    tool={tool}
                    onSelect={() => setMoreOpen(false)}
                  />
                ))}
              </Popover.Content>
            </Popover.Root>
            {renderHint()}
          </div>,
          layer,
        )}
    </>
  );
}
