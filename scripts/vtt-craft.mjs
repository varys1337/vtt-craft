const MODULE_ID = "vtt-craft";

const SETTINGS = Object.freeze({
  THEME: "chosenTheme",
  CORE_UI: "skinCoreInterface",
  CHAT_PARCHMENT: "chatParchment",
  CURSOR_THEME: "cursorTheme"
});

const THEMES = Object.freeze({
  NONE: "0",
  NEUTRAL: "wow-neutral",
  HORDE: "wow-horde",
  ALLIANCE: "wow-alliance"
});

const THEME_CHOICES = Object.freeze({
  [THEMES.NONE]: "None",
  [THEMES.NEUTRAL]: "Neutral",
  [THEMES.HORDE]: "Horde",
  [THEMES.ALLIANCE]: "Alliance"
});

const CHAT_PARCHMENTS = Object.freeze({
  PARCHMENT: "parchment",
  PARCHMENT_2: "parchment2",
  PARCHMENT_3: "parchment3"
});

const CHAT_PARCHMENT_CHOICES = Object.freeze({
  [CHAT_PARCHMENTS.PARCHMENT]: "Parchment",
  [CHAT_PARCHMENTS.PARCHMENT_2]: "Parchment 2",
  [CHAT_PARCHMENTS.PARCHMENT_3]: "Parchment 3"
});

const CURSOR_THEMES = Object.freeze({
  NONE: "none",
  HUMAN: "human",
  NIGHTELF: "nightelf",
  ORC: "orc",
  UNDEAD: "undead"
});

const CURSOR_THEME_CHOICES = Object.freeze({
  [CURSOR_THEMES.NONE]: "Foundry Default",
  [CURSOR_THEMES.HUMAN]: "Human",
  [CURSOR_THEMES.NIGHTELF]: "Night Elf",
  [CURSOR_THEMES.ORC]: "Orc",
  [CURSOR_THEMES.UNDEAD]: "Undead"
});

const THEME_CLASSES = Object.freeze([
  "vtt-craft-active",
  "vtt-craft-core-enabled",
  "vtt-craft-cursor-active",
  "wow-general",
  THEMES.NEUTRAL,
  THEMES.HORDE,
  THEMES.ALLIANCE,
  ...Object.values(CHAT_PARCHMENTS).map(parchment => `vtt-craft-parchment-${parchment}`),
  ...Object.values(CURSOR_THEMES).filter(cursor => cursor !== CURSOR_THEMES.NONE).map(cursor => `vtt-craft-cursor-${cursor}`)
]);

const CORE_APP_NAMES = new Set([
  "Sidebar",
  "AbstractSidebarTab",
  "ChatLog",
  "CombatTracker",
  "CompendiumDirectory",
  "SceneControls",
  "SceneNavigation",
  "Hotbar",
  "Players",
  "HeadsUpDisplayContainer",
  "GamePause",
  "MainMenu"
]);

const CURSOR_ACTION_SELECTOR = [
  "a[href]",
  "button",
  ".button",
  "select",
  "input[type='button']",
  "input[type='submit']",
  "input[type='reset']",
  "input[type='checkbox']",
  "input[type='radio']",
  "input[type='range']",
  "input[type='color']",
  "input[type='file']",
  ".ui-control",
  ".header-control",
  ".vtt-craft-sidebar-tab-button",
  "[role='button']",
  "[role='tab']",
  "[role='menuitem']",
  "[data-action]",
  "[data-control]",
  "[data-tool]",
  "summary",
  "label[for]",
  "nav.tabs a",
  "nav.tabs button",
  ".tabs a",
  ".tabs button",
  "#sidebar .directory-item",
  "#sidebar li.directory-item",
  "#sidebar .folder",
  "#sidebar .combatant",
  ".rollable",
  ".item-control",
  ".item-action",
  ".effect-control",
  ".activity-control",
  ".document-control",
  ".item-name.rollable",
  ".activity-name.rollable",
  ".feature-name.rollable",
  ".inventory-element [data-action]",
  ".items-list [data-action]",
  ".features-list [data-action]",
  "#hotbar .slot",
  "#hotbar .macro",
  "#hotbar .macro-slot",
  "#hotbar .hotbar-slot",
  ].join(",");

const CURSOR_TEXT_SELECTOR = [
  "input:not([type='button']):not([type='submit']):not([type='reset'])",
  "textarea",
  "[contenteditable='true']",
  ".editor",
  ".prosemirror",
  ".tox",
  ".tox-edit-area",
  ".ProseMirror",
  ".cm-editor",
  ".cm-content",
  "code-mirror"
].join(",");

let coreObserver = null;
let decorateQueued = false;
let cursorListenersActive = false;
let cursorCanvasStyles = null;

Hooks.once("init", () => {
  registerSettings();
});

Hooks.once("ready", () => {
  applyTheme();
  decorateExistingApplications();
  decorateCoreUi();
  setupCoreObserver();
});

Hooks.on("canvasReady", () => {
  if (isThemeActive() && getCursorTheme() !== CURSOR_THEMES.NONE) syncCanvasCursorStyles();
});

Hooks.on("renderApplicationV2", (application, element) => {
  if (!isThemeActive()) return;

  queueMicrotask(() => {
    decorateApplication(application, element);
    decorateCoreUi();
  });
});

Hooks.on("renderChatMessageHTML", (message, html) => {
  if (!isThemeActive() || !skinCoreUi()) return;
  const messageElement = resolveRenderedElement(html);
  if (!messageElement) return;
  decorateChatMessage(message, messageElement);
});

function registerSettings() {
  game.settings.register(MODULE_ID, SETTINGS.THEME, {
    name: "VTT Craft | Theme",
    hint: "Select the active VTT Craft UI skin for this user.",
    scope: "user",
    config: true,
    type: String,
    default: THEMES.NONE,
    choices: THEME_CHOICES,
    onChange: theme => {
      applyTheme(theme);
      decorateExistingApplications();
      decorateCoreUi();
      setupCoreObserver();
      notifyThemeSelection(theme);
    }
  });

  game.settings.register(MODULE_ID, SETTINGS.CORE_UI, {
    name: "VTT Craft | Skin Core Interface",
    hint: "Apply VTT Craft skinning to core Foundry UI surfaces such as sidebar tabs, chat, scene controls, hotbar, and player list. Foundry keeps ownership of tab switching and directory layout.",
    scope: "user",
    config: false,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, SETTINGS.CHAT_PARCHMENT, {
    name: "VTT Craft | Chat Parchment",
    hint: "Select the parchment texture used for VTT Craft chat message cards.",
    scope: "user",
    config: true,
    type: String,
    default: CHAT_PARCHMENTS.PARCHMENT,
    choices: CHAT_PARCHMENT_CHOICES,
    onChange: () => {
      applyTheme();
      decorateChatMessages();
    }
  });

  game.settings.register(MODULE_ID, SETTINGS.CURSOR_THEME, {
    name: "VTT Craft | Cursor Theme",
    hint: "Select the VTT Craft cursor artwork used for passive and clickable hover states.",
    scope: "user",
    config: true,
    type: String,
    default: CURSOR_THEMES.NONE,
    choices: CURSOR_THEME_CHOICES,
    onChange: () => applyTheme()
  });
}

function getTheme() {
  return normalizeChoice(game.settings.get(MODULE_ID, SETTINGS.THEME), THEME_CHOICES, THEMES.NONE);
}

function skinCoreUi() {
  return true;
}

function isThemeActive() {
  return getTheme() !== THEMES.NONE;
}

function getChatParchment() {
  return normalizeChoice(game.settings.get(MODULE_ID, SETTINGS.CHAT_PARCHMENT), CHAT_PARCHMENT_CHOICES, CHAT_PARCHMENTS.PARCHMENT);
}

function getCursorTheme() {
  return normalizeChoice(game.settings.get(MODULE_ID, SETTINGS.CURSOR_THEME), CURSOR_THEME_CHOICES, CURSOR_THEMES.NONE);
}

function normalizeChoice(value, choices, fallback) {
  return Object.hasOwn(choices, value) ? value : fallback;
}

function applyTheme(theme = getTheme()) {
  const selectedTheme = normalizeChoice(theme, THEME_CHOICES, THEMES.NONE);
  const enabled = selectedTheme !== THEMES.NONE;
  const coreEnabled = enabled && skinCoreUi();
  const selectedParchment = getChatParchment();
  const selectedCursor = getCursorTheme();

  for (const root of getThemeRoots()) {
    root.classList.remove(...THEME_CLASSES);

    if (!enabled) continue;
    root.classList.add("vtt-craft-active", "wow-general", selectedTheme);
    root.classList.add(`vtt-craft-parchment-${selectedParchment}`);
    if (selectedCursor !== CURSOR_THEMES.NONE) root.classList.add(`vtt-craft-cursor-${selectedCursor}`);
    if (coreEnabled) root.classList.add("vtt-craft-core-enabled");
  }

  setupCursorStateListeners(enabled && selectedCursor !== CURSOR_THEMES.NONE);

  if (!coreEnabled) {
    teardownCoreObserver();
    clearDecorations();
    clearPlayerAvatars();
  }
}

function getThemeRoots() {
  const roots = new Set();
  if (document.body) roots.add(document.body);
  const foundryRoot = document.querySelector(".vtt");
  if (foundryRoot) roots.add(foundryRoot);
  return roots;
}

function notifyThemeSelection(theme) {
  if (theme === THEMES.HORDE) ui.notifications?.info("For the Horde!!!");
  else if (theme === THEMES.ALLIANCE) ui.notifications?.info("For the Alliance!!!");
}

function decorateExistingApplications() {
  if (!isThemeActive()) return;

  const ApplicationV2 = globalThis.foundry?.applications?.api?.ApplicationV2;
  const applications = ApplicationV2?.instances?.() ?? [];
  for (const application of applications) decorateApplication(application, application.element);

  for (const frame of document.querySelectorAll(":is(.application, .app, .window-app, dialog)")) {
    frame.classList.add("vtt-craft-application");
    if (isCoreFrame(frame)) frame.classList.add("vtt-craft-core-ui");
    decorateDocumentSheetClasses(frame, getDocumentSheetType(null, frame));
    if (isRollDialog(null, frame)) frame.classList.add("vtt-craft-roll-dialog");
  }
}

function decorateApplication(application, renderedElement) {
  const frame = resolveApplicationFrame(application, renderedElement);
  if (!frame) return;

  frame.classList.add("vtt-craft-application");

  if (isCoreApplication(application, frame)) frame.classList.add("vtt-craft-core-ui");
  else frame.classList.remove("vtt-craft-core-ui");

  const documentType = getDocumentSheetType(application, frame);
  decorateDocumentSheetClasses(frame, documentType);
  frame.classList.toggle("vtt-craft-dialog", isDialogApplication(application, frame));
  frame.classList.toggle("vtt-craft-roll-dialog", isRollDialog(application, frame));
  if (isPlayersApplication(application, frame)) clearPlayerAvatars(frame);
}

function decorateDocumentSheetClasses(frame, documentType) {
  frame.classList.toggle("vtt-craft-document-sheet", Boolean(documentType));
  frame.classList.toggle("vtt-craft-actor-sheet", documentType === "Actor");
  frame.classList.toggle("vtt-craft-item-sheet", documentType === "Item");
  frame.classList.toggle("vtt-craft-journal-sheet", documentType === "JournalEntry");
  frame.classList.toggle("vtt-craft-rolltable-sheet", documentType === "RollTable");
}

function resolveApplicationFrame(application, renderedElement) {
  if (application?.element instanceof HTMLElement) return application.element;
  if (renderedElement instanceof HTMLElement) return renderedElement.closest(":is(.application, .app, .window-app, dialog)");
  return null;
}

function resolveRenderedElement(html) {
  if (html instanceof HTMLElement) return html;
  if (html instanceof DocumentFragment) return html.firstElementChild instanceof HTMLElement ? html.firstElementChild : null;
  if (html?.[0] instanceof HTMLElement) return html[0];
  return null;
}

function decorateCoreUi() {
  if (!isThemeActive() || !skinCoreUi()) return;

  for (const element of document.querySelectorAll("#sidebar, #sidebar-tabs, #chat, #chat-log, #chat-controls, #message-modes, #ui-left, #ui-top, #ui-bottom, #ui-right, #controls, #scene-controls, #hotbar, #players")) {
    element.classList.add("vtt-craft-core-surface");
  }

  decorateSidebarTabs();
  decorateCanvasControls();
  decorateChatMessages();
  clearPlayerAvatars();
}

function decorateSidebarTabs() {
  const sidebarTabs = document.querySelectorAll(`
    #sidebar-tabs > menu :is(button.ui-control, a.ui-control, [role='tab'].ui-control, [data-action='tab'].ui-control, [data-tab].ui-control),
    #sidebar-tabs :is(button, a, [role='tab'], [data-action='tab'], [data-tab])
  `);
  for (const tab of sidebarTabs) {
    if (tab instanceof HTMLElement) tab.classList.add("vtt-craft-sidebar-tab-button");
  }
}

function decorateCanvasControls() {
  const controls = document.querySelectorAll(`
    #ui-left :is(button.ui-control, a.ui-control, [role='button'].ui-control, button.control, a.control, button.tool, a.tool),
    #controls :is(button, a, [role='button']),
    #scene-controls :is(button, a, [role='button']),
    .scene-controls :is(button, a, [role='button']),
    .control-palette :is(button, a, [role='button']),
    .placeable-palette :is(button, a, [role='button']),
    .tool-palette :is(button, a, [role='button']),
    .control-tools :is(button, a, [role='button']),
    .scene-control-tools :is(button, a, [role='button']),
    .controls-tray :is(button, a, [role='button'])
  `);

  for (const control of controls) {
    if (!(control instanceof HTMLElement)) continue;
    if (control.closest("#sidebar, #hotbar, #chat, #players, .window-app, .application")) continue;
    control.classList.add("vtt-craft-core-control-button");
  }
}

function decorateChatMessages() {
  const messages = document.querySelectorAll("#chat-log .chat-message, #chat-notifications .chat-message, .chat-popout .chat-message");
  for (const message of messages) decorateChatMessage(null, message);
}

function decorateChatMessage(message, element) {
  element.classList.add("vtt-craft-chat-message");

  const isDnd5eMessage = element.classList.contains("dnd5e2")
    || Boolean(element.querySelector?.(":is(.dnd5e2, .chat-card, .dice-roll)"))
    || Boolean(message?.speaker?.actor && game.system?.id === "dnd5e");

  if (isDnd5eMessage) element.classList.add("vtt-craft-dnd5e-chat-message");
}

function clearDecorations() {
  for (const element of document.querySelectorAll(".vtt-craft-core-surface, .vtt-craft-sidebar-tab-button, .vtt-craft-core-control-button, .vtt-craft-chat-message, .vtt-craft-dnd5e-chat-message, .vtt-craft-document-sheet, .vtt-craft-actor-sheet, .vtt-craft-item-sheet, .vtt-craft-journal-sheet, .vtt-craft-rolltable-sheet, .vtt-craft-roll-dialog")) {
    element.classList.remove("vtt-craft-core-surface", "vtt-craft-sidebar-tab-button", "vtt-craft-core-control-button", "vtt-craft-chat-message", "vtt-craft-dnd5e-chat-message", "vtt-craft-document-sheet", "vtt-craft-actor-sheet", "vtt-craft-item-sheet", "vtt-craft-journal-sheet", "vtt-craft-rolltable-sheet", "vtt-craft-roll-dialog");
  }
}

function setupCoreObserver() {
  if (!isThemeActive() || !skinCoreUi()) {
    teardownCoreObserver();
    return;
  }
  if (coreObserver || !document.body) return;

  coreObserver = new MutationObserver(mutations => {
    if (!mutations.some(mutation => mutation.addedNodes.length || mutation.type === "attributes")) return;
    queueDecorateCoreUi();
  });

  coreObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "aria-selected", "aria-pressed", "hidden"]
  });
}

function teardownCoreObserver() {
  coreObserver?.disconnect();
  coreObserver = null;
  decorateQueued = false;
}

function setupCursorStateListeners(enabled) {
  if (!enabled) {
    teardownCursorStateListeners();
    clearCursorActiveState();
    restoreCanvasCursorStyles();
    return;
  }
  syncCanvasCursorStyles();
  if (cursorListenersActive) return;

  document.addEventListener("pointerover", onCursorPointerActivate, true);
  document.addEventListener("pointermove", onCursorPointerActivate, true);
  document.addEventListener("pointerdown", onCursorPointerActivate, true);
  document.addEventListener("pointerout", onCursorPointerDeactivate, true);
  document.addEventListener("pointerup", onCursorPointerRelease, true);
  document.addEventListener("pointercancel", onCursorPointerCancel, true);
  document.addEventListener("contextmenu", onCursorContextMenu, true);
  cursorListenersActive = true;
}

function teardownCursorStateListeners() {
  if (!cursorListenersActive) return;

  document.removeEventListener("pointerover", onCursorPointerActivate, true);
  document.removeEventListener("pointermove", onCursorPointerActivate, true);
  document.removeEventListener("pointerdown", onCursorPointerActivate, true);
  document.removeEventListener("pointerout", onCursorPointerDeactivate, true);
  document.removeEventListener("pointerup", onCursorPointerRelease, true);
  document.removeEventListener("pointercancel", onCursorPointerCancel, true);
  document.removeEventListener("contextmenu", onCursorContextMenu, true);
  cursorListenersActive = false;
}

function onCursorPointerActivate(event) {
  if (isNonPrimaryPointerPress(event)) {
    clearCursorActiveState();
    return;
  }

  const target = getCursorEventTarget(event);
  if (target && isCanvasCursorTarget(target)) {
    clearCursorActiveState();
    setCursorActiveState(isCanvasCursorActive(event));
    return;
  }

  if (!target || isTextCursorTarget(target) || !isActionCursorTarget(target)) {
    clearCursorActiveState();
    return;
  }

  setCursorActiveState(true);
}

function onCursorPointerDeactivate(event) {
  const relatedTarget = event.relatedTarget instanceof Element ? event.relatedTarget : null;
  if (relatedTarget && isCanvasCursorTarget(relatedTarget)) {
    clearCursorActiveState();
    setCursorActiveState(isCanvasCursorActive(event));
    return;
  }
  if (relatedTarget && !isTextCursorTarget(relatedTarget) && isActionCursorTarget(relatedTarget)) {
    setCursorActiveState(true);
    return;
  }
  clearCursorActiveState();
}

function onCursorPointerRelease(event) {
  if (isNonPrimaryPointerPress(event)) {
    clearCursorActiveState();
    return;
  }

  onCursorPointerActivate(event);
}

function onCursorPointerCancel() {
  clearCursorActiveState();
}

function onCursorContextMenu() {
  clearCursorActiveState();
}

function isNonPrimaryPointerPress(event) {
  return (event?.type === "pointerdown" || event?.type === "pointerup") && event.button !== 0;
}

function getCursorEventTarget(event) {
  if (event.target instanceof Element) return event.target;
  const element = document.elementFromPoint?.(event.clientX, event.clientY);
  return element instanceof Element ? element : null;
}

function isActionCursorTarget(target) {
  const action = target.closest?.(CURSOR_ACTION_SELECTOR);
  return Boolean(action && !isDisabledCursorTarget(action));
}

function isDisabledCursorTarget(target) {
  return Boolean(target.matches?.(":disabled, [disabled], [aria-disabled='true']"))
    || Boolean(target.closest?.(":disabled, [disabled], [aria-disabled='true']"));
}

function isTextCursorTarget(target) {
  return Boolean(target.closest?.(CURSOR_TEXT_SELECTOR));
}

function isCanvasCursorTarget(target) {
  return Boolean(target.closest?.("#board, #canvas, .canvas-container"));
}

function isCanvasCursorActive(event = null) {
  const cursor = getCanvasRendererCursor();
  if (isPointerCursorValue(cursor)) return true;
  if (isDefaultCursorValue(cursor)) return false;

  if (isInteractiveCanvasTarget(getHoveredCanvasPlaceable())) return true;

  const eventTarget = getCanvasEventInteractionTarget(event);
  return isInteractiveCanvasTarget(eventTarget);
}

function getHoveredCanvasPlaceable() {
  const canvasRef = globalThis.canvas;
  return canvasRef?.mouseInteractionManager?.target
    ?? canvasRef?.activeLayer?.hover
    ?? canvasRef?.tokens?.hover
    ?? canvasRef?.tiles?.hover
    ?? canvasRef?.drawings?.hover
    ?? canvasRef?.templates?.hover
    ?? canvasRef?.walls?.hover
    ?? canvasRef?.lighting?.hover
    ?? canvasRef?.sounds?.hover
    ?? canvasRef?.notes?.hover
    ?? null;
}

function getCanvasEventInteractionTarget(event) {
  const nativeEvent = event?.nativeEvent ?? event;
  const pathTarget = nativeEvent?.composedPath?.().find?.(target => isInteractiveCanvasTarget(target));
  return pathTarget ?? null;
}

function isInteractiveCanvasTarget(target) {
  if (!target || target instanceof Element) return false;
  if (target === globalThis.canvas?.stage || target === globalThis.canvas?.app?.stage) return false;
  if (target === globalThis.canvas?.activeLayer) return false;
  if (target === globalThis.canvas?.app?.renderer?.events) return false;

  const constructorName = target.constructor?.name ?? "";
  if (/^(?:Container|Stage|Canvas|Interaction|EventSystem)$/i.test(constructorName)) return false;

  const hasDocument = Boolean(target.document);
  const hasInteraction = Boolean(target.mouseInteractionManager);
  const isStaticTarget = target.eventMode === "static";
  const isInteractive = target.interactive === true;
  const isHoveredPlaceable = target.hover === true;
  const isControlledPlaceable = target.controlled === true;
  const isPlaceableLike = typeof target.control === "function"
    || typeof target.release === "function"
    || typeof target._onHoverIn === "function"
    || typeof target._onClickLeft === "function"
    || typeof target._onClickLeft2 === "function";

  return hasDocument
    || hasInteraction
    || isHoveredPlaceable
    || isControlledPlaceable
    || (isStaticTarget && (isInteractive || isPlaceableLike))
    || (isInteractive && isPlaceableLike);
}

function getCanvasRendererCursor() {
  const events = globalThis.canvas?.app?.renderer?.events;
  return events?.cursor ?? events?._cursor ?? null;
}

function isPointerCursorValue(cursor) {
  return cursor === "pointer";
}

function isDefaultCursorValue(cursor) {
  return cursor === "default" || cursor === "auto" || cursor === "" || cursor == null;
}

function setCursorActiveState(active) {
  for (const root of getThemeRoots()) root.classList.toggle("vtt-craft-cursor-active", active);
}

function clearCursorActiveState() {
  setCursorActiveState(false);
}

function syncCanvasCursorStyles() {
  const cursorStyles = getCanvasCursorStyles();
  if (!cursorStyles) return;

  if (!cursorCanvasStyles) {
    cursorCanvasStyles = {
      cursorStyles,
      default: cursorStyles.default,
      pointer: cursorStyles.pointer
    };
  }

  const root = document.body?.classList.contains("vtt-craft-active") ? document.body : document.querySelector(".vtt.vtt-craft-active");
  if (!root) return;

  const styles = getComputedStyle(root);
  const passive = styles.getPropertyValue("--vtt-craft-cursor-passive").trim();
  const active = styles.getPropertyValue("--vtt-craft-cursor-active").trim();
  if (passive) cursorStyles.default = `${passive}, auto`;
  if (active) cursorStyles.pointer = `${active}, pointer`;
}

function getCanvasCursorStyles() {
  return globalThis.canvas?.app?.renderer?.events?.cursorStyles
    ?? globalThis.canvas?.app?.renderer?.plugins?.interaction?.cursorStyles
    ?? null;
}

function restoreCanvasCursorStyles() {
  if (!cursorCanvasStyles) return;

  const { cursorStyles } = cursorCanvasStyles;
  if (cursorStyles) {
    if (cursorCanvasStyles.default === undefined) delete cursorStyles.default;
    else cursorStyles.default = cursorCanvasStyles.default;
    if (cursorCanvasStyles.pointer === undefined) delete cursorStyles.pointer;
    else cursorStyles.pointer = cursorCanvasStyles.pointer;
  }
  cursorCanvasStyles = null;
}

function queueDecorateCoreUi() {
  if (decorateQueued) return;
  decorateQueued = true;
  window.setTimeout(() => {
    decorateQueued = false;
    decorateCoreUi();
  }, 75);
}

function isCoreApplication(application, frame) {
  const constructorName = application?.constructor?.name;
  return CORE_APP_NAMES.has(constructorName) || isCoreFrame(frame);
}

function isCoreFrame(frame) {
  const id = frame?.id;
  return id === "sidebar" || id === "hotbar" || id === "players"
    || id === "navigation" || id === "scene-navigation" || id === "controls"
    || id === "scene-controls" || id === "pause" || id === "ui-left"
    || id === "ui-top" || id === "ui-bottom" || id === "ui-right";
}

function getDocumentSheetType(application, frame) {
  const documentName = application?.document?.documentName;
  if (documentName) return documentName;

  if (frame?.classList?.contains("actor")) return "Actor";
  if (frame?.classList?.contains("item")) return "Item";
  if (frame?.matches?.(".journal-entry, .journal-sheet, .journal-entry-sheet, [data-document-name='JournalEntry']")) return "JournalEntry";
  if (frame?.matches?.(".roll-table-sheet, .rolltable-sheet, .roll-table, [data-document-name='RollTable']")) return "RollTable";

  const DocumentSheetV2 = globalThis.foundry?.applications?.api?.DocumentSheetV2;
  if (DocumentSheetV2 && application instanceof DocumentSheetV2) return "Document";

  return "";
}

function isDialogApplication(application, frame) {
  const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
  return Boolean(
    (DialogV2 && application instanceof DialogV2)
    || frame?.matches?.("dialog, .dialog")
    || application?.constructor?.name === "DialogV2"
  );
}

function isRollDialog(application, frame) {
  const constructorName = application?.constructor?.name ?? "";
  return Boolean(
    constructorName.includes("RollConfiguration")
    || constructorName.includes("RollDialog")
    || frame?.classList?.contains("roll-configuration")
    || frame?.classList?.contains("roll-dialog")
    || frame?.matches?.(".dnd5e2.roll-configuration, .dnd5e2.roll-dialog")
  );
}

function isPlayersApplication(application, frame) {
  return application?.constructor?.name === "Players" || frame?.id === "players";
}

function clearPlayerAvatars(root = document.querySelector("#players")) {
  const players = root?.id === "players" ? root : root?.querySelector?.("#players");
  if (!players) return;
  for (const activeIndicator of players.querySelectorAll(".player-active")) clearAvatar(activeIndicator);
}

function clearAvatar(activeIndicator) {
  activeIndicator.style.removeProperty("background");
  activeIndicator.style.removeProperty("background-image");
  activeIndicator.style.removeProperty("background-size");
  activeIndicator.style.removeProperty("background-repeat");
  activeIndicator.style.removeProperty("background-position");
}
