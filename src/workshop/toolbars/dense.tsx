import { DEFAULT_SIDEBAR } from "@excalidraw/common";
import { getShortcutFromShortcutName } from "@excalidraw/excalidraw/actions/shortcuts";
import {
  LibraryIcon,
  LockedIcon,
  RedoIcon,
  UndoIcon,
  UnlockedIcon,
  searchIcon,
} from "@excalidraw/excalidraw/components/icons";
import { t } from "@excalidraw/excalidraw/i18n";
import { getShortcutKey } from "@excalidraw/excalidraw/shortcut";

import type { ReactNode } from "react";
import type { ToolbarMeta, ToolbarProps, ToolbarTool } from "../types";

export const meta: ToolbarMeta = {
  name: "Dense for power users",
  idea: "Every tool and existing shortcut in a compact, grouped command deck.",
};

const styles = `
  .toolbar-dense {
    inline-size: min(568px, calc(100vw - 120px));
    min-inline-size: 0;
  }
  .toolbar-dense .dense-deck {
    display: grid;
    gap: 5px;
    padding: 6px;
    color: var(--color-on-surface);
    background: var(--island-bg-color);
    border: 1px solid var(--color-surface-low);
    border-radius: 10px;
    box-shadow: var(--shadow-island);
  }
  .toolbar-dense .dense-row {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    min-inline-size: 0;
  }
  .toolbar-dense .dense-group {
    box-sizing: border-box;
    flex: 1 1 auto;
    min-inline-size: 0;
    padding: 5px 5px 4px;
    border: 1px solid var(--color-surface-low);
    border-radius: 6px;
    background: var(--color-surface-mid);
  }
  .toolbar-dense .dense-primary > :nth-child(1) {
    flex-basis: 130px;
  }
  .toolbar-dense .dense-primary > :nth-child(2) {
    flex-basis: 224px;
  }
  .toolbar-dense .dense-primary > :nth-child(3) {
    flex-basis: 182px;
  }
  .toolbar-dense .dense-label {
    margin: 0 0 3px 4px;
    font: 700 10px/13px system-ui, sans-serif;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .toolbar-dense .dense-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
  }
  .toolbar-dense .dense-button {
    display: grid;
    flex: 1 0 auto;
    justify-items: center;
    align-content: center;
    gap: 4px;
    min-inline-size: 38px;
    min-block-size: 37px;
    padding: 2px 1px;
    border: 1px solid transparent;
    border-radius: 4px;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
  .toolbar-dense .dense-button:hover:not(:disabled) {
    background: var(--button-hover-bg);
  }
  .toolbar-dense .dense-button[aria-pressed="true"] {
    background: var(--color-surface-primary-container);
    border-color: var(--color-primary);
  }
  .toolbar-dense .dense-button:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: -2px;
  }
  .toolbar-dense .dense-button:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .toolbar-dense .dense-icon {
    display: grid;
    place-items: center;
    inline-size: 15px;
    block-size: 15px;
  }
  .toolbar-dense .dense-icon svg {
    display: block;
    width: 15px;
    height: 15px;
  }
  .toolbar-dense .dense-key {
    padding-inline: 1px;
    border-radius: 3px;
    background: var(--island-bg-color);
    white-space: nowrap;
    font: 600 9px/12px ui-monospace, monospace;
  }
  .toolbar-dense .dense-key--empty {
    visibility: hidden;
  }
  .toolbar-dense .dense-hint {
    position: relative;
    text-align: center;
  }
`;

const groupFor = (tool: ToolbarTool) => {
  switch (tool.type) {
    case "hand":
    case "selection":
    case "lasso":
      return "Navigate";
    case "rectangle":
    case "diamond":
    case "ellipse":
    case "arrow":
    case "line":
      return "Geometry";
    default:
      return tool.group === "more" ? "Extras" : "Markup";
  }
};

function DeckGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="dense-group" role="group" aria-label={label}>
      <div className="dense-label" aria-hidden="true">
        {label}
      </div>
      <div className="dense-buttons">{children}</div>
    </div>
  );
}

function DeckButton({
  label,
  icon,
  shortcut,
  onClick,
  pressed,
  disabled,
}: {
  label: string;
  icon: ReactNode;
  shortcut?: string | null;
  onClick: () => void;
  pressed?: boolean;
  disabled?: boolean;
}) {
  const description = shortcut ? `${label} (${shortcut})` : label;
  return (
    <button
      className="dense-button"
      type="button"
      aria-label={label}
      aria-description={shortcut || undefined}
      aria-pressed={pressed}
      title={description}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="dense-icon" aria-hidden="true">
        {icon}
      </span>
      <kbd
        className={shortcut ? "dense-key" : "dense-key dense-key--empty"}
        aria-hidden="true"
      >
        {shortcut || "-"}
      </kbd>
    </button>
  );
}

export default function DenseToolbar({
  tools,
  locked,
  toggleLock,
  openLibrary,
  openCommandPalette,
  undo,
  redo,
  appState,
  renderHint,
}: ToolbarProps) {
  // The selection binding follows the user's preferred selection tool.
  const selectionShortcut = tools.find(({ type }) => type === "selection")
    ?.shortcut;
  const renderToolGroup = (label: ReturnType<typeof groupFor>) => (
    <DeckGroup key={label} label={label}>
      {tools
        .filter((tool) => groupFor(tool) === label)
        .map((tool) => {
          const usesSelectionShortcut =
            tool.type === "selection" || tool.type === "lasso";
          const shortcut = usesSelectionShortcut
            ? tool.type === appState.preferredSelectionTool.type
              ? selectionShortcut
              : null
            : tool.shortcut;

          return (
            <DeckButton
              key={tool.type}
              label={tool.label}
              icon={tool.icon}
              shortcut={shortcut}
              onClick={tool.select}
              pressed={tool.active}
              disabled={tool.disabled}
            />
          );
        })}
    </DeckGroup>
  );

  return (
    <div className="toolbar-dense">
      <style>{styles}</style>
      <div className="dense-deck" role="group" aria-label="Drawing toolbar">
        <div className="dense-row dense-primary">
          {(["Navigate", "Geometry", "Markup"] as const).map(renderToolGroup)}
        </div>
        <div className="dense-row">
          {renderToolGroup("Extras")}
          <DeckGroup label="Workspace">
            <DeckButton
              label={t("toolBar.lock")}
              icon={locked ? LockedIcon : UnlockedIcon}
              shortcut={getShortcutFromShortcutName("toolLock")}
              onClick={toggleLock}
              pressed={locked}
            />
            <DeckButton
              label={t("buttons.undo")}
              icon={UndoIcon}
              shortcut={getShortcutKey("CtrlOrCmd+Z")}
              onClick={undo}
            />
            <DeckButton
              label={t("buttons.redo")}
              icon={RedoIcon}
              shortcut={getShortcutKey("CtrlOrCmd+Shift+Z")}
              onClick={redo}
            />
            <DeckButton
              label={t("toolBar.library")}
              icon={LibraryIcon}
              onClick={openLibrary}
              pressed={
                appState.openSidebar?.name === DEFAULT_SIDEBAR.name &&
                appState.openSidebar.tab === DEFAULT_SIDEBAR.defaultTab
              }
            />
            <DeckButton
              label={t("commandPalette.title")}
              icon={searchIcon}
              shortcut={getShortcutFromShortcutName("commandPalette")}
              onClick={openCommandPalette}
            />
          </DeckGroup>
        </div>
      </div>
      <div className="dense-hint">{renderHint()}</div>
    </div>
  );
}
