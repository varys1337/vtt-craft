const MODULE_ID = "vtt-craft";

const SETTINGS = Object.freeze({
  THEME: "chosenTheme",
  CORE_UI: "skinCoreInterface",
  CHAT_PARCHMENT: "chatParchment",
  CHAT_BACKGROUND: "showChatBackground",
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
  "vtt-craft-chat-background",
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

const APPLICATION_DECORATION_CLASSES = Object.freeze([
  "vtt-craft-application", "vtt-craft-core-ui", "vtt-craft-document-sheet",
  "vtt-craft-actor-sheet", "vtt-craft-item-sheet", "vtt-craft-journal-sheet", "vtt-craft-journal-page-sheet",
  "vtt-craft-rolltable-sheet", "vtt-craft-dialog", "vtt-craft-roll-dialog", "vtt-craft-uesrpg-frame"
]);

const DECORATION_CLASSES = Object.freeze([
  ...APPLICATION_DECORATION_CLASSES, "vtt-craft-core-surface",
  "vtt-craft-sidebar-tab-button", "vtt-craft-core-control-button",
  "vtt-craft-chat-message", "vtt-craft-dnd5e-chat-message", "vtt-craft-uesrpg-chat-message",
  "vtt-craft-canvas-cursor",
  "vtt-craft-sized-action", "vtt-craft-action-group", "vtt-craft-group-action", "vtt-craft-action-label-wrap", "vtt-craft-action-text"
]);

const CORE_DECORATION_CLASSES = Object.freeze([
  "vtt-craft-core-surface", "vtt-craft-sidebar-tab-button", "vtt-craft-core-control-button",
  "vtt-craft-chat-message", "vtt-craft-dnd5e-chat-message", "vtt-craft-uesrpg-chat-message"
]);
const APPLICATION_SELECTOR = ":is(.application, .app, .window-app, dialog)";
const NATIVE_OVERLAY_SELECTOR = "#token-action-hud-app, #visual-active-effects, #calendaria-hud, #calendaria-mini-cal";
const CORE_CONTROL_OWNER_SELECTOR = "#ui-left, #controls, #scene-controls";
const SIDEBAR_TAB_SELECTOR = "#sidebar-tabs > menu > :is(button, a, [role='tab']), #sidebar-tabs > menu > li > :is(button, a, [role='tab'])";
// Public frame capability belongs to the element across DOM-only scans and adoption.
// Weak references do not retain closed applications or detached documents.
const applicationFrameCapabilities = new WeakMap();
const CORE_SURFACE_SELECTOR = "#sidebar, #sidebar-tabs, #chat, #chat-log, #chat-controls, #chat-form, #chat-message, #message-modes, #ui-left, #ui-top, #ui-bottom, #ui-right, #controls, #scene-controls, #hotbar, #players";
const CORE_SCAN_DELAY = 32;
const uiDocuments = new Map();
const CANVAS_ACTION_CURSORS = new Set(["pointer", "var(--cursor-pointer)"]);
const CANVAS_PASSIVE_CURSORS = new Set(["", "auto", "default", "inherit", "var(--cursor-default)"]);

const ACTION_CONTROL_SELECTOR = "button, a.button, input[type='submit'], input[type='button'], input[type='reset']";
const ACTION_FOOTER_SELECTOR = ".sheet-footer, .form-footer, .dialog-buttons, .social-selector-footer";
const ACTION_EXCLUDED_SELECTOR = [
  ".icon", ".unbutton", ".header-control", ".ui-control", ".control-button", ".config-button",
  ".radio-button", ".split-control", ".split-button", ".split-buttons", ".tox-tbtn", ".tox-mbtn",
  "nav.tabs", ".tabs", ".sheet-tabs", "[role='tab']", ".editor-menu", ".menu-container",
  ".context-menu", "[popover]", "prose-mirror", ".ProseMirror", ".tox",
  "range-picker", "double-range-picker", "color-picker", "file-picker", "number-field", "multi-select",
  ".uesrpg-icon-action", ".uesrpg-image-action", ".uesrpg-plain-control", ".uesrpg-charge-btn",
  ".item-group-add", ".uesrpg-group-toggle-button", ".spell-btn-delete", ".warfare-btn--icon",
  ".commander-card__clear", ".section-header__action", ".uesrpg-loadout-delete", ".member-remove-btn",
  ".sr-only", ".visually-hidden", ".screen-reader-only"
].join(",");
const ACTION_LABEL_IGNORED_SELECTOR = [
  "i", "svg", "img", "foundry-icon", "dnd5e-icon", ".fa", ".fas", ".far", ".fab", ".fa-solid",
  ".fa-regular", ".fa-light", ".fa-duotone", ".sr-only", ".visually-hidden", ".screen-reader-only",
  "[hidden]", "[aria-hidden='true']", "[inert]"
].join(",");
const ACTION_LAYOUT_CLASSES = Object.freeze([
  "vtt-craft-sized-action", "vtt-craft-action-group", "vtt-craft-group-action", "vtt-craft-action-label-wrap", "vtt-craft-action-text"
]);
const ACTION_LAYOUT_PROPERTIES = Object.freeze([
  "--vtt-craft-action-columns", "--vtt-craft-action-column", "--vtt-craft-action-row",
  "--vtt-craft-action-font-size", "--vtt-craft-action-padding-inline", "--vtt-craft-action-row-height"
]);
const ACTION_CLASSIFICATION_ATTRIBUTES = new Set(["class", "type", "role"]);

const CHAT_MESSAGE_SELECTOR = ":is(#chat-log, .chat-log, #chat-notifications, .chat-popout) .chat-message";

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
  "[data-link]",
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
  "input:not([type='button']):not([type='submit']):not([type='reset']):not([type='checkbox']):not([type='radio']):not([type='range']):not([type='color']):not([type='file']):not([type='hidden'])",
  "textarea",
  "[contenteditable='true']",
  ".editor-content",
  ".tox-edit-area",
  ".ProseMirror",
  ".cm-content",
  "code-mirror"
].join(",");

Hooks.once("init", () => {
  registerSettings();
});

Hooks.once("ready", () => {
  applyTheme();
});

Hooks.on("canvasReady", () => {
  if (isThemeActive() && getCursorTheme() !== CURSOR_THEMES.NONE) setupCursorStateListeners(true);
});

Hooks.on("renderApplicationV2", (application, element) => {
  if (!isThemeActive()) return;

  const frame = resolveApplicationFrame(application, element);
  if (!frame) return;
  if (!uiDocuments.has(frame.ownerDocument)) applyTheme(getTheme(), frame.ownerDocument);
  // Decorate synchronously; scan only this application's new descendants.
  decorateApplication(application, element);
  queueDecorateCoreUi(frame);
});

// https://foundryvtt.com/api/v14/functions/hookEvents.closeApplicationV2.html
Hooks.on("closeApplicationV2", application => {
  for (const [ownerDocument, record] of uiDocuments) {
    for (const [frame, state] of record.actionLayout?.frames ?? []) {
      if (state.application === application) removeActionFrame(frame, ownerDocument);
    }
  }
});

// v14 moves the same editor between sidebar/popout/notification containers.
// https://foundryvtt.com/api/v14/functions/hookEvents.renderChatInput.html
Hooks.on("renderChatInput", (application, elements) => {
  for (const root of Object.values(elements ?? {})) {
    if (isHtmlElement(root)) queueDecorateCoreUi(root);
  }
});

// Detached ApplicationV2 windows use their own document and HTMLElement realm.
// https://foundryvtt.com/api/v14/functions/hookEvents.openDetachedWindow.html
Hooks.on("openDetachedWindow", (id, win) => {
  const ownerDocument = win.document;
  const record = getUiDocument(ownerDocument);
  if (!record) return;
  record.windowId = id;
  applyTheme(getTheme(), ownerDocument);
});

Hooks.on("closeDetachedWindow", id => {
  for (const [ownerDocument, record] of uiDocuments) {
    if (record.windowId !== id) continue;
    if (record.readyListener) ownerDocument.removeEventListener("DOMContentLoaded", record.readyListener);
    teardownCoreObserver(ownerDocument);
    teardownCursorStateListeners(ownerDocument);
    teardownActionLayouts(ownerDocument);
    uiDocuments.delete(ownerDocument);
  }
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
      notifyThemeSelection(theme);
    }
  });

  game.settings.register(MODULE_ID, SETTINGS.CORE_UI, {
    name: "VTT Craft | Skin Core Interface",
    hint: "Apply VTT Craft skinning to core Foundry UI surfaces such as sidebar tabs, chat, scene controls, hotbar, and player list. Foundry keeps ownership of tab switching and directory layout.",
    scope: "user",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => applyTheme()
  });

  game.settings.register(MODULE_ID, SETTINGS.CHAT_PARCHMENT, {
    name: "VTT Craft | Chat Parchment",
    hint: "Select the parchment texture used for VTT Craft chat cards and themed item descriptions.",
    scope: "user",
    config: true,
    type: String,
    default: CHAT_PARCHMENTS.PARCHMENT,
    choices: CHAT_PARCHMENT_CHOICES,
    onChange: () => applyTheme()
  });

  game.settings.register(MODULE_ID, SETTINGS.CHAT_BACKGROUND, {
    name: "VTT Craft | Show Chat Panel Background",
    hint: "Show the texture and frame behind chat. Disable to keep only parchment cards and the composer. Popout window controls remain available.",
    scope: "user",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => applyTheme()
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
  return Boolean(game.settings.get(MODULE_ID, SETTINGS.CORE_UI));
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

function getUiDocument(ownerDocument = document) {
  if (!ownerDocument?.defaultView) return null;
  let record = uiDocuments.get(ownerDocument);
  if (!record) {
    record = {
      roots: new Set(), observer: null, pendingRoots: new Set(), coreDecorateTimeout: null,
      cursorListenersActive: false, canvasElement: null, canvasObserver: null,
      windowId: null, readyListener: null, actionLayout: null
    };
    uiDocuments.set(ownerDocument, record);
  }
  return record;
}

function applyTheme(theme = getTheme(), ownerDocument = null) {
  const selectedTheme = normalizeChoice(theme, THEME_CHOICES, THEMES.NONE);
  const enabled = selectedTheme !== THEMES.NONE;
  const coreEnabled = enabled && skinCoreUi();
  const selectedParchment = getChatParchment();
  const selectedCursor = getCursorTheme();
  getUiDocument(ownerDocument ?? document);
  const documents = ownerDocument ? [ownerDocument] : [...uiDocuments.keys()];
  const classes = new Set();
  if (enabled) {
    classes.add("vtt-craft-active").add("wow-general").add(selectedTheme);
    classes.add(`vtt-craft-parchment-${selectedParchment}`);
    if (game.settings.get(MODULE_ID, SETTINGS.CHAT_BACKGROUND)) classes.add("vtt-craft-chat-background");
    if (selectedCursor !== CURSOR_THEMES.NONE) classes.add(`vtt-craft-cursor-${selectedCursor}`);
    if (coreEnabled) classes.add("vtt-craft-core-enabled");
  }

  for (const targetDocument of documents) {
    const record = getUiDocument(targetDocument);
    if (!record) continue;
    if (!targetDocument.body) {
      if (!record.readyListener) {
        record.readyListener = () => {
          record.readyListener = null;
          if (uiDocuments.has(targetDocument)) applyTheme(getTheme(), targetDocument);
        };
        targetDocument.addEventListener("DOMContentLoaded", record.readyListener, {once: true});
      }
      continue;
    }
    const wasEnabled = targetDocument.body.classList.contains("vtt-craft-active");
    const wasCoreEnabled = targetDocument.body.classList.contains("vtt-craft-core-enabled");
    record.roots = getThemeRoots(targetDocument);
    for (const root of record.roots) {
      // Keep pointer state while changing artwork; reset it when cursors disable.
      const managedClasses = THEME_CLASSES.filter(name => name !== "vtt-craft-cursor-active");
      const removed = managedClasses.filter(name => root.classList.contains(name) && !classes.has(name));
      const added = [...classes].filter(name => !root.classList.contains(name));
      if (removed.length) root.classList.remove(...removed);
      if (added.length) root.classList.add(...added);
    }
    setupCursorStateListeners(enabled && selectedCursor !== CURSOR_THEMES.NONE, targetDocument);
    if (!enabled) {
      teardownActionLayouts(targetDocument);
      teardownCoreObserver(targetDocument);
      clearDecorations(targetDocument);
      continue;
    }
    if (!wasEnabled) decorateExistingApplications(targetDocument);
    if (coreEnabled && (!wasEnabled || !wasCoreEnabled)) decorateCoreUi(targetDocument);
    else if (!coreEnabled && wasCoreEnabled) clearDecorations(targetDocument, CORE_DECORATION_CLASSES);
    setupCoreObserver(targetDocument);
  }
}

function getThemeRoots(ownerDocument = document) {
  const roots = new Set();
  if (ownerDocument.body) roots.add(ownerDocument.body);
  const foundryRoot = ownerDocument.querySelector(".vtt");
  if (foundryRoot) roots.add(foundryRoot);
  return roots;
}

function notifyThemeSelection(theme) {
  if (theme === THEMES.HORDE) ui.notifications?.info("For the Horde!!!");
  else if (theme === THEMES.ALLIANCE) ui.notifications?.info("For the Alliance!!!");
}

function isHtmlElement(element) {
  // adoptNode changes ownerDocument without changing the node's JS realm.
  // DOM identity works for both fresh and adopted detached-window elements.
  return element?.nodeType === 1 && element.namespaceURI === "http://www.w3.org/1999/xhtml";
}

function queryElements(root, selector) {
  const elements = [];
  if (root?.nodeType === 1 && root.matches(selector)) elements.push(root);
  if (root?.querySelectorAll) elements.push(...root.querySelectorAll(selector));
  return elements;
}

function decorateExistingApplications(root = document) {
  if (!isThemeActive()) return;

  if (root.nodeType === 9) {
    const applications = globalThis.foundry?.applications?.instances?.values?.() ?? [];
    for (const application of applications) {
      if (application.element?.ownerDocument === root) decorateApplication(application, application.element);
    }
  }

  for (const frame of queryElements(root, APPLICATION_SELECTOR)) {
    if (!frame.classList.contains("vtt-craft-application")) decorateApplication(null, frame);
  }
}

function decorateApplication(application, renderedElement) {
  if (!isThemeActive()) return;
  const frame = resolveApplicationFrame(application, renderedElement);
  if (!frame) return;

  // https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html#hasFrame
  if (typeof application?.hasFrame === "boolean") applicationFrameCapabilities.set(frame, application.hasFrame);
  const core = isCoreApplication(application, frame);
  if (!core && !isFramedApplicationElement(frame)) {
    for (const [ownerDocument, record] of uiDocuments) {
      if (record.actionLayout?.frames.has(frame)) removeActionFrame(frame, ownerDocument);
    }
    // Remove only this root's chrome. A nested independent window keeps its role.
    frame.classList.remove(...APPLICATION_DECORATION_CLASSES);
    return;
  }

  frame.classList.toggle("vtt-craft-application", true);
  frame.classList.toggle("vtt-craft-core-ui", core);

  const documentType = getDocumentSheetType(application, frame);
  decorateDocumentSheetClasses(frame, documentType);
  frame.classList.toggle("vtt-craft-dialog", isDialogApplication(application, frame));
  frame.classList.toggle("vtt-craft-roll-dialog", isRollDialog(application, frame));
  // These UESRPG surfaces already paint a 20px frame in ::before. Repaint that
  // overlay instead of adding another layout border around the application.
  const uesrpgFrame = game.system?.id === "uesrpg-3ev4" && (
    frame.matches(".worldbuilding.sheet.actor, .worldbuilding.sheet.item, .uesrpg, .uesrpg-dialog, .uesrpg-attack-declare, .uesrpg-resource-dialog, .uesrpg-social-selector")
    || (frame.ownerDocument.body?.classList.contains("uesrpg-custom-journals-enabled")
      && frame.matches(".journal-sheet.journal-entry, .sheet.journal-entry, .journal-sheet.journal-entry-page, .sheet.journal-entry-page"))
  );
  frame.classList.toggle("vtt-craft-uesrpg-frame", uesrpgFrame);
  if (!frame.classList.contains("vtt-craft-core-ui")) queueActionLayout(frame, application);
}

function isFramedApplicationElement(frame) {
  if (frame.matches(NATIVE_OVERLAY_SELECTOR)) return false;
  const hasFrame = applicationFrameCapabilities.get(frame);
  if (hasFrame !== undefined) return hasFrame;
  // A conservative DOM fallback, not a claim about another module's framework.
  return Boolean(frame.querySelector(":scope > .window-header") && frame.querySelector(":scope > .window-content"));
}

/**
 * Presentation-only action sizing. Foundry retains ownership of forms, actions,
 * application dimensions and document data. Measure only after DOM insertion.
 */
function queueActionLayout(frame, application = null, classify = true) {
  if (!isThemeActive() || !isHtmlElement(frame)) return;
  const ownerDocument = frame.ownerDocument;
  for (const [otherDocument, record] of uiDocuments) {
    if (otherDocument !== ownerDocument && record.actionLayout?.frames.has(frame)) removeActionFrame(frame, otherDocument);
  }
  const layout = getActionLayout(ownerDocument);
  if (!layout) return;
  let state = layout.frames.get(frame);
  if (!state) {
    state = {application, candidates: null, controls: new Set(), groups: new Map(), connected: false, observer: null};
    layout.frames.set(frame, state);
    layout.targets.set(frame, frame);
    layout.resize.observe(frame);
    state.observer = new ownerDocument.defaultView.MutationObserver(mutations => {
      let changed = false;
      let discover = false;
      for (const mutation of mutations) {
        const target = isHtmlElement(mutation.target) ? mutation.target : mutation.target.parentElement;
        const owner = target?.closest(APPLICATION_SELECTOR);
        // A nested application's own observer handles its contents. A root
        // gaining an application class still releases previously owned actions.
        const ownershipChanged = owner !== frame && mutation.attributeName === "class" && owner === target
          && [...state.controls].some(control => target.contains(control));
        if (target !== frame && owner !== frame && !ownershipChanged) continue;
        if (!isExternalActionMutation(mutation)) continue;
        changed = true;
        discover ||= mutation.type === "childList" || ACTION_CLASSIFICATION_ATTRIBUTES.has(mutation.attributeName);
      }
      if (changed) queueActionLayout(frame, null, discover);
    });
    state.observer.observe(frame, {
      subtree: true, childList: true, characterData: true, attributes: true, attributeOldValue: true,
      attributeFilter: ["class", "type", "role", "style", "hidden", "aria-hidden", "disabled", "aria-disabled", "inert", "value"]
    });
  } else if (application) state.application = application;
  layout.pending.set(frame, classify || layout.pending.get(frame) || false);
  if (layout.animationFrame !== null) return;
  layout.animationFrame = ownerDocument.defaultView.requestAnimationFrame(() => {
    layout.animationFrame = null;
    const pending = [...layout.pending];
    layout.pending.clear();
    if (!isThemeActive()) return;
    for (const [pendingFrame, needsClassification] of pending) {
      const current = layout.frames.get(pendingFrame);
      if (!current) continue;
      if (!pendingFrame.isConnected) {
        if (current.connected) removeActionFrame(pendingFrame, ownerDocument);
        continue; // ResizeObserver will revisit a newly inserted frame.
      }
      current.connected = true;
      const nativeWidth = pendingFrame.getBoundingClientRect().width;
      // Recheck cached candidates on resize: media queries can hide/reveal actions
      // without DOM mutations. Discover descendants only on render/content changes.
      classifyActionControls(pendingFrame, current, layout, needsClassification || !current.candidates);
      for (const [group, controls] of current.groups) fitActionGroup(group, controls);
      for (const control of current.controls) {
        if (!control.classList.contains("vtt-craft-group-action")) fitStandaloneAction(control);
      }
      if (Math.abs(pendingFrame.getBoundingClientRect().width - nativeWidth) > 1) {
        for (const [group, controls] of current.groups) resetActionGroup(group, controls, pendingFrame, layout);
        for (const control of current.controls) resetActionElement(control, pendingFrame, layout);
      }
    }
  });
}

function getActionLayout(ownerDocument) {
  const record = getUiDocument(ownerDocument);
  if (!record) return null;
  if (record.actionLayout) return record.actionLayout;
  const view = ownerDocument.defaultView;
  const layout = {
    frames: new Map(), targets: new Map(), widths: new WeakMap(), pending: new Map(),
    animationFrame: null, resize: null, rootObserver: null, fontsChanged: null
  };
  record.actionLayout = layout;
  layout.resize = new view.ResizeObserver(entries => {
    for (const entry of entries) {
      const frame = layout.targets.get(entry.target);
      if (!frame) continue;
      if (!frame.isConnected && layout.frames.get(frame)?.connected) {
        removeActionFrame(frame, ownerDocument);
        continue;
      }
      const width = entry.contentRect.width;
      const previous = layout.widths.get(entry.target);
      if (previous !== undefined && Math.abs(previous - width) < 1) continue;
      layout.widths.set(entry.target, width);
      queueActionLayout(frame, null, false);
    }
  });
  const refresh = () => {
    if (uiDocuments.get(ownerDocument)?.actionLayout !== layout) return;
    for (const frame of layout.frames.keys()) queueActionLayout(frame, null, false);
  };
  layout.rootObserver = new view.MutationObserver(mutations => {
    if (mutations.some(mutation => isExternalActionMutation(mutation, true))) refresh();
  });
  for (const root of [ownerDocument.documentElement, ownerDocument.body]) {
    if (root) layout.rootObserver.observe(root, {attributes: true, attributeOldValue: true, attributeFilter: ["class", "style"]});
  }
  layout.fontsChanged = refresh;
  ownerDocument.fonts?.addEventListener("loadingdone", refresh);
  ownerDocument.fonts?.ready.then(refresh);
  return layout;
}

function isExternalActionMutation(mutation, ignoreCursorState = false) {
  if (mutation.type !== "attributes") return true;
  if (mutation.attributeName === "class") {
    const stripClasses = value => (value ?? "").split(/\s+/)
      .filter(name => name && !ACTION_LAYOUT_CLASSES.includes(name) && !(ignoreCursorState && name === "vtt-craft-cursor-active"))
      .sort().join(" ");
    return stripClasses(mutation.oldValue) !== stripClasses(mutation.target.getAttribute("class"));
  }
  if (mutation.attributeName === "style") {
    const stripStyles = value => (value ?? "").split(";").map(part => part.trim())
      .filter(part => part && !ACTION_LAYOUT_PROPERTIES.some(property => part.startsWith(property + ":"))).join(";");
    return stripStyles(mutation.oldValue) !== stripStyles(mutation.target.getAttribute("style"));
  }
  return true;
}

function isActionVisible(element) {
  if (!element.isConnected || element.closest("[hidden], [aria-hidden='true']") || !element.getClientRects().length) return false;
  const style = element.ownerDocument.defaultView.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden" && style.visibility !== "collapse";
}

function getActionLabel(control, labels) {
  if (!isActionVisible(control) || control.matches(".small, .compact") || control.closest(ACTION_EXCLUDED_SELECTOR)) return "";
  if (control.localName === "input") return /[\p{L}\p{N}]/u.test(control.value) ? control.value : "";
  const walker = control.ownerDocument.createTreeWalker(control, control.ownerDocument.defaultView.NodeFilter.SHOW_TEXT);
  const text = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.parentElement) continue;
    const ignored = node.parentElement.closest(ACTION_LABEL_IGNORED_SELECTOR);
    if (ignored && ignored !== control && control.contains(ignored)) continue;
    if (/[\p{L}\p{N}]/u.test(node.textContent) && isActionVisible(node.parentElement)) {
      text.push(node.textContent);
      if (node.parentElement !== control) labels.add(node.parentElement);
    }
  }
  return text.join(" ").trim();
}

function classifyActionControls(frame, state, layout, discover = true) {
  const candidates = discover ? new Set() : state.candidates;
  if (discover) {
    for (const footer of frame.querySelectorAll(ACTION_FOOTER_SELECTOR)) {
      for (const control of footer.children) if (control.matches(ACTION_CONTROL_SELECTOR)) candidates.add(control);
    }
    if (frame.matches(".vtt-craft-actor-sheet, .vtt-craft-item-sheet")) {
      for (const control of frame.querySelectorAll("button.uesrpg-styled-action")) candidates.add(control);
    } else if (!frame.matches(".vtt-craft-document-sheet, .dnd5e2, .vtt-craft-uesrpg-frame")) {
      for (const control of frame.querySelectorAll(ACTION_CONTROL_SELECTOR)) candidates.add(control);
    }
    if (frame.classList.contains("vtt-craft-journal-sheet")) {
      for (const sidebar of frame.querySelectorAll(".journal-sidebar, aside.sidebar")) {
        for (const control of sidebar.querySelectorAll(ACTION_CONTROL_SELECTOR)) candidates.add(control);
      }
    }
    state.candidates = candidates;
  }
  const ownedCandidates = [...candidates].filter(control => control.closest(APPLICATION_SELECTOR) === frame);
  const resetGroups = new Set();
  // Restore native visibility before reading labels. A transferred group can
  // carry layout markers even when this frame has never seen it before.
  for (const [group, controls] of state.groups) {
    if (layout.targets.get(group) !== frame) continue;
    resetActionGroup(group, controls, frame, layout);
    resetGroups.add(group);
  }
  for (const control of ownedCandidates) {
    const parent = control.parentElement;
    if (resetGroups.has(parent) || !(parent.classList.contains("vtt-craft-action-group") || control.classList.contains("vtt-craft-group-action"))) continue;
    const children = [...parent.children].filter(child => child.matches(ACTION_CONTROL_SELECTOR) && child.closest(APPLICATION_SELECTOR) === frame);
    resetActionGroup(parent, children);
    resetGroups.add(parent);
  }
  const labels = new Set();
  const controls = new Set(ownedCandidates.filter(control => getActionLabel(control, labels)));
  // Finish visibility/text reads before applying the typography markers.
  for (const control of state.controls) if (!controls.has(control)) resetActionElement(control, frame, layout);
  for (const label of labels) if (!label.classList.contains("vtt-craft-action-text")) label.classList.add("vtt-craft-action-text");
  for (const control of controls) if (!control.classList.contains("vtt-craft-sized-action")) control.classList.add("vtt-craft-sized-action");
  state.controls = controls;
  const groups = new Map();
  for (const parent of new Set([...controls].map(control => control.parentElement))) {
    if (parent === frame || !isActionVisible(parent)) continue;
    const children = [...parent.children].filter(isActionVisible);
    if (!children.length || !children.every(child => controls.has(child))) continue;
    if (children.length === 1 && !parent.matches(ACTION_FOOTER_SELECTOR)) continue;
    if ([...parent.childNodes].some(node => node.nodeType === 3 && /[\p{L}\p{N}]/u.test(node.textContent))) continue;
    groups.set(parent, children);
  }
  for (const group of state.groups.keys()) {
    if (groups.has(group)) continue;
    if (layout.targets.get(group) === frame) {
      layout.resize.unobserve(group);
      layout.targets.delete(group);
    }
  }
  for (const [group, children] of groups) {
    // New groups also clear standalone fitting properties before native column
    // measurement. Existing and adopted groups were already reset above.
    if (!resetGroups.has(group)) resetActionGroup(group, children);
    if (state.groups.has(group)) {
      for (const old of state.groups.get(group)) if (!children.includes(old)) {
        resetActionElement(old, frame, layout);
        if (controls.has(old)) old.classList.add("vtt-craft-sized-action");
      }
    }
    if (layout.targets.get(group) !== frame) {
      layout.targets.set(group, frame);
      layout.resize.observe(group);
    }
  }
  state.groups = groups;
}

function getNativeActionColumns(group, count) {
  const style = group.ownerDocument.defaultView.getComputedStyle(group);
  if (style.display === "flex" && style.flexDirection === "row") return count;
  if (style.display === "flex" && style.flexDirection === "column") return 1;
  if (style.display !== "grid" || style.gridTemplateAreas !== "none" || !style.gridAutoFlow.startsWith("row")) return 0;
  // Computed templates may contain named lines. Do not count names or collapsed tracks.
  const template = style.gridTemplateColumns;
  const tracks = template.match(/\[[^\]]*\]|[^\s]+/g) ?? [];
  const widths = tracks.filter(track => !track.startsWith("["));
  if (!widths.length || widths.some(track => !/^\d+(?:\.\d+)?px$/.test(track))) return 0;
  return Math.min(count, widths.filter(track => parseFloat(track) > 0).length);
}

function setActionProperty(element, property, value) {
  if (element.style.getPropertyValue(property) !== value) element.style.setProperty(property, value);
}

function isActionManagedElsewhere(element, frame, layout) {
  if (!frame || !layout) return false;
  const owner = element.closest(APPLICATION_SELECTOR);
  return owner !== frame && Boolean(layout.frames.get(owner)?.controls.has(element));
}

function resetActionElement(element, frame = null, layout = null) {
  if (isActionManagedElsewhere(element, frame, layout)) return;
  element.classList.remove(...ACTION_LAYOUT_CLASSES);
  for (const label of element.querySelectorAll(".vtt-craft-action-text")) label.classList.remove("vtt-craft-action-text");
  for (const property of ACTION_LAYOUT_PROPERTIES) element.style.removeProperty(property);
}

function resetActionGroup(group, controls, frame = null, layout = null) {
  const owner = layout?.targets.get(group);
  if (frame && owner && owner !== frame) return;
  group.classList.remove("vtt-craft-action-group");
  for (const property of ACTION_LAYOUT_PROPERTIES) group.style.removeProperty(property);
  for (const control of controls) {
    if (isActionManagedElsewhere(control, frame, layout)) continue;
    control.classList.remove("vtt-craft-group-action", "vtt-craft-action-label-wrap");
    for (const property of ACTION_LAYOUT_PROPERTIES) control.style.removeProperty(property);
  }
}

function actionLabelFits(control) {
  const style = control.ownerDocument.defaultView.getComputedStyle(control);
  const available = control.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  if (control.localName === "input") {
    const layout = uiDocuments.get(control.ownerDocument)?.actionLayout;
    const context = layout.measureContext ??= control.ownerDocument.createElement("canvas").getContext("2d");
    if (!context) return true;
    context.font = style.font || `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const spacing = (parseFloat(style.letterSpacing) || 0) * Math.max(0, [...control.value].length - 1);
    return context.measureText(control.value).width + spacing <= available + 0.5;
  }
  if (control.scrollWidth > control.clientWidth + 0.5) return false;
  const range = control.ownerDocument.createRange();
  range.selectNodeContents(control);
  const box = control.getBoundingClientRect();
  const scale = control.offsetWidth ? box.width / control.offsetWidth : 1;
  return range.getBoundingClientRect().width <= available * scale + 0.5;
}

function fitActionGroup(group, controls) {
  if (!isActionVisible(group)) return;
  // classifyActionControls prepares each group in native layout exactly once.
  const maximum = getNativeActionColumns(group, controls.length);
  if (!maximum || !group.clientWidth) return;
  group.classList.add("vtt-craft-action-group");
  for (const control of controls) control.classList.add("vtt-craft-group-action");
  let fitted = false;
  for (let columns = maximum; columns >= 1 && !fitted; columns--) {
    setActionProperty(group, "--vtt-craft-action-columns", String(columns));
    const remainder = controls.length % columns;
    const lastRow = Math.floor((controls.length - 1) / columns);
    for (let index = 0; index < controls.length; index++) {
      const row = Math.floor(index / columns);
      const offset = remainder && row === lastRow ? columns - remainder : 0;
      setActionProperty(controls[index], "--vtt-craft-action-column", String((index % columns) * 2 + 1 + offset));
      setActionProperty(controls[index], "--vtt-craft-action-row", String(row + 1));
    }
    for (const [fontSize, padding] of [[14, 8], [14, 6], [13, 6]]) {
      setActionProperty(group, "--vtt-craft-action-font-size", fontSize + "px");
      setActionProperty(group, "--vtt-craft-action-padding-inline", padding + "px");
      if (controls.every(actionLabelFits)) {
        fitted = true;
        break;
      }
    }
  }
  if (!fitted) {
    for (const control of controls) control.classList.toggle("vtt-craft-action-label-wrap", !actionLabelFits(control));
  }
  // Layout pixels avoid feeding an application transform/zoom back into its height.
  const height = Math.max(32, ...controls.map(control => control.offsetHeight));
  setActionProperty(group, "--vtt-craft-action-row-height", height + "px");
}

function fitStandaloneAction(control) {
  if (!isActionVisible(control)) return;
  control.classList.remove("vtt-craft-action-label-wrap");
  for (const [fontSize, padding] of [[14, 8], [14, 6], [13, 6]]) {
    setActionProperty(control, "--vtt-craft-action-font-size", fontSize + "px");
    setActionProperty(control, "--vtt-craft-action-padding-inline", padding + "px");
    if (actionLabelFits(control)) return;
  }
  control.classList.add("vtt-craft-action-label-wrap");
}

function removeActionFrame(frame, ownerDocument) {
  const layout = uiDocuments.get(ownerDocument)?.actionLayout;
  const state = layout?.frames.get(frame);
  if (!state) return;
  state.observer.disconnect();
  for (const [group, controls] of state.groups) {
    resetActionGroup(group, controls, frame, layout);
    if (layout.targets.get(group) === frame) {
      layout.resize.unobserve(group);
      layout.targets.delete(group);
    }
  }
  for (const control of state.controls) resetActionElement(control, frame, layout);
  layout.resize.unobserve(frame);
  layout.targets.delete(frame);
  layout.pending.delete(frame);
  layout.frames.delete(frame);
}

function teardownActionLayouts(ownerDocument) {
  const record = uiDocuments.get(ownerDocument);
  const layout = record?.actionLayout;
  if (!layout) return;
  if (layout.animationFrame !== null) ownerDocument.defaultView?.cancelAnimationFrame(layout.animationFrame);
  layout.resize.disconnect();
  layout.rootObserver.disconnect();
  ownerDocument.fonts?.removeEventListener("loadingdone", layout.fontsChanged);
  for (const frame of [...layout.frames.keys()]) removeActionFrame(frame, ownerDocument);
  record.actionLayout = null;
}

function decorateDocumentSheetClasses(frame, documentType) {
  frame.classList.toggle("vtt-craft-document-sheet", Boolean(documentType));
  frame.classList.toggle("vtt-craft-actor-sheet", documentType === "Actor");
  frame.classList.toggle("vtt-craft-item-sheet", documentType === "Item");
  frame.classList.toggle("vtt-craft-journal-sheet", documentType === "JournalEntry");
  frame.classList.toggle("vtt-craft-journal-page-sheet", documentType === "JournalEntryPage");
  frame.classList.toggle("vtt-craft-rolltable-sheet", documentType === "RollTable");
}

function resolveApplicationFrame(application, renderedElement) {
  if (isHtmlElement(application?.element)) return application.element;
  if (isHtmlElement(renderedElement)) return renderedElement.closest(APPLICATION_SELECTOR);
  return null;
}

function resolveRenderedElement(html) {
  if (isHtmlElement(html)) return html;
  if (html?.nodeType === 11) return isHtmlElement(html.firstElementChild) ? html.firstElementChild : null;
  if (isHtmlElement(html?.[0])) return html[0];
  return null;
}

function decorateCoreUi(root = document) {
  if (!isThemeActive() || !skinCoreUi()) return;

  for (const element of queryElements(root, CORE_SURFACE_SELECTOR)) {
    element.classList.toggle("vtt-craft-core-surface", true);
  }

  decorateSidebarTabs(root);
  decorateCanvasControls(root);
  decorateChatMessages(root);
}

function decorateSidebarTabs(root = document) {
  const sidebarTabs = queryElements(root, `${SIDEBAR_TAB_SELECTOR}, .vtt-craft-sidebar-tab-button`);
  for (const tab of sidebarTabs) {
    if (isHtmlElement(tab)) tab.classList.toggle("vtt-craft-sidebar-tab-button", tab.matches(SIDEBAR_TAB_SELECTOR));
  }
}

function decorateCanvasControls(root = document) {
  const selector = `
    #ui-left :is(button.ui-control, a.ui-control, [role='button'].ui-control, button.control, a.control, button.tool, a.tool),
    :is(#controls, #scene-controls) :is(button, a, [role='button'])
  `;
  const controls = queryElements(root, `${selector}, .vtt-craft-core-control-button`);

  for (const control of controls) {
    if (!isHtmlElement(control)) continue;
    const owner = control.closest(CORE_CONTROL_OWNER_SELECTOR);
    const applicationFrame = control.closest(APPLICATION_SELECTOR);
    const eligible = control.matches(selector) && Boolean(owner)
      && !control.closest(`#sidebar, #hotbar, #chat, #players, ${NATIVE_OVERLAY_SELECTOR}`)
      && (!applicationFrame || applicationFrame === owner || isCoreFrame(applicationFrame));
    control.classList.toggle("vtt-craft-core-control-button", eligible);
  }
}

function decorateChatMessages(root = document) {
  if (!isThemeActive() || !skinCoreUi()) return;
  const messages = queryElements(root, CHAT_MESSAGE_SELECTOR);
  for (const message of messages) decorateChatMessage(null, message);
}

function decorateChatMessage(message, element) {
  if (!isThemeActive() || !skinCoreUi() || !isHtmlElement(element)) return;
  // Summaries and other embedded content must not acquire a second message frame.
  if (element.parentElement?.closest(".chat-message")) return;
  element.classList.toggle("vtt-craft-chat-message", true);
  // The core hook runs before system enrichment; classify by the active system,
  // then let its later .compact/.dnd5e2 classes select the appropriate CSS.
  element.classList.toggle("vtt-craft-dnd5e-chat-message", game.system?.id === "dnd5e");
  element.classList.toggle("vtt-craft-uesrpg-chat-message", game.system?.id === "uesrpg-3ev4");
}

function clearDecorations(root = document, classes = DECORATION_CLASSES) {
  const selector = classes.map(className => `.${className}`).join(",");
  for (const element of queryElements(root, selector)) {
    element.classList.remove(...classes);
  }
}

function setupCoreObserver(ownerDocument = document) {
  if (!isThemeActive()) {
    teardownCoreObserver(ownerDocument);
    return;
  }
  const record = getUiDocument(ownerDocument);
  if (!record || record.observer || !ownerDocument.body) return;

  record.observer = new ownerDocument.defaultView.MutationObserver(mutations => {
    for (const mutation of mutations) for (const node of mutation.addedNodes) {
      if (isHtmlElement(node)) queueDecorateCoreUi(node);
    }
  });

  // State and visibility are styled by CSS. Observing their attributes also
  // observes our own class decoration and creates recurring full-log scans.
  record.observer.observe(ownerDocument.body, {
    childList: true,
    subtree: true
  });
}

function teardownCoreObserver(ownerDocument = document) {
  const record = uiDocuments.get(ownerDocument);
  if (!record) return;
  record.observer?.disconnect();
  record.observer = null;
  if (record.coreDecorateTimeout !== null) ownerDocument.defaultView?.clearTimeout(record.coreDecorateTimeout);
  record.coreDecorateTimeout = null;
  record.pendingRoots.clear();
}

function setupCursorStateListeners(enabled, ownerDocument = document) {
  const record = getUiDocument(ownerDocument);
  if (!record) return;
  if (!enabled) {
    teardownCursorStateListeners(ownerDocument);
    clearCursorActiveState(ownerDocument);
    return;
  }
  setupCanvasCursorObserver(ownerDocument);
  if (record.cursorListenersActive) return;

  ownerDocument.addEventListener("pointerover", onCursorPointerActivate, true);
  ownerDocument.addEventListener("pointerdown", onCursorPointerActivate, true);
  ownerDocument.addEventListener("pointerout", onCursorPointerDeactivate, true);
  ownerDocument.addEventListener("pointerup", onCursorPointerRelease, true);
  ownerDocument.addEventListener("pointercancel", onCursorPointerCancel, true);
  ownerDocument.addEventListener("contextmenu", onCursorPointerCancel, true);
  ownerDocument.defaultView.addEventListener("blur", onCursorPointerCancel);
  record.cursorListenersActive = true;
}

function teardownCursorStateListeners(ownerDocument = document) {
  const record = uiDocuments.get(ownerDocument);
  if (!record) return;
  record.canvasObserver?.disconnect();
  record.canvasObserver = null;
  record.canvasElement?.classList.remove("vtt-craft-canvas-cursor");
  record.canvasElement = null;
  if (!record.cursorListenersActive) return;

  ownerDocument.removeEventListener("pointerover", onCursorPointerActivate, true);
  ownerDocument.removeEventListener("pointerdown", onCursorPointerActivate, true);
  ownerDocument.removeEventListener("pointerout", onCursorPointerDeactivate, true);
  ownerDocument.removeEventListener("pointerup", onCursorPointerRelease, true);
  ownerDocument.removeEventListener("pointercancel", onCursorPointerCancel, true);
  ownerDocument.removeEventListener("contextmenu", onCursorPointerCancel, true);
  ownerDocument.defaultView?.removeEventListener("blur", onCursorPointerCancel);
  record.cursorListenersActive = false;
}

function onCursorPointerActivate(event) {
  const ownerDocument = getCursorEventDocument(event);
  if (isNonPrimaryPointerPress(event)) {
    clearCursorActiveState(ownerDocument);
    return;
  }

  const target = getCursorEventTarget(event);
  if (target && isCanvasCursorTarget(target)) {
    const canvasElement = uiDocuments.get(ownerDocument)?.canvasElement;
    setCursorActiveState(CANVAS_ACTION_CURSORS.has(canvasElement?.style.cursor), ownerDocument);
    return;
  }

  if (!target || isTextCursorTarget(target) || !isActionCursorTarget(target)) {
    clearCursorActiveState(ownerDocument);
    return;
  }

  setCursorActiveState(true, ownerDocument);
}

function onCursorPointerDeactivate(event) {
  const ownerDocument = getCursorEventDocument(event);
  const relatedTarget = event.relatedTarget?.nodeType === 1 ? event.relatedTarget : null;
  if (relatedTarget && isCanvasCursorTarget(relatedTarget)) {
    const canvasElement = uiDocuments.get(ownerDocument)?.canvasElement;
    setCursorActiveState(CANVAS_ACTION_CURSORS.has(canvasElement?.style.cursor), ownerDocument);
    return;
  }
  if (relatedTarget && !isTextCursorTarget(relatedTarget) && isActionCursorTarget(relatedTarget)) {
    setCursorActiveState(true, ownerDocument);
    return;
  }
  clearCursorActiveState(ownerDocument);
}

function onCursorPointerRelease(event) {
  if (isNonPrimaryPointerPress(event)) {
    clearCursorActiveState(getCursorEventDocument(event));
    return;
  }

  onCursorPointerActivate(event);
}

function onCursorPointerCancel(event) {
  clearCursorActiveState(getCursorEventDocument(event));
}

function isNonPrimaryPointerPress(event) {
  return (event?.type === "pointerdown" || event?.type === "pointerup") && event.button !== 0;
}

function getCursorEventTarget(event) {
  const target = event.composedPath?.().find(node => node?.nodeType === 1) ?? event.target;
  return target?.nodeType === 1 ? target : null;
}

function getCursorEventDocument(event) {
  const currentTarget = event?.currentTarget;
  if (currentTarget?.nodeType === 9) return currentTarget;
  return currentTarget?.document ?? event?.target?.ownerDocument ?? document;
}

function isActionCursorTarget(target) {
  const action = target.closest?.(CURSOR_ACTION_SELECTOR);
  return Boolean(action && !isDisabledCursorTarget(action));
}

function isDisabledCursorTarget(target) {
  if (target?.localName === "label" && target.control) return isDisabledCursorTarget(target.control);
  return Boolean(target.matches?.(":disabled, [disabled], [aria-disabled='true']"))
    || Boolean(target.closest?.(":disabled, [disabled], [aria-disabled='true'], [inert]"));
}

function isTextCursorTarget(target) {
  return Boolean(target.closest?.(CURSOR_TEXT_SELECTOR));
}

function isCanvasCursorTarget(target) {
  return Boolean(target.closest?.("#board, #canvas, .canvas-container"));
}

function setCursorActiveState(active, ownerDocument = document) {
  const record = uiDocuments.get(ownerDocument);
  if (!record) return;
  for (const root of record.roots) {
    if (root.classList.contains("vtt-craft-cursor-active") !== Boolean(active)) root.classList.toggle("vtt-craft-cursor-active", Boolean(active));
  }
}

function clearCursorActiveState(ownerDocument = document) {
  setCursorActiveState(false, ownerDocument);
}

function setupCanvasCursorObserver(ownerDocument = document) {
  const record = getUiDocument(ownerDocument);
  if (!record) return;
  const canvasElement = ownerDocument.getElementById("board") ?? ownerDocument.querySelector("canvas#canvas, .canvas-container canvas");
  if (record.canvasElement === canvasElement && record.canvasObserver) return;
  record.canvasObserver?.disconnect();
  record.canvasElement?.classList.remove("vtt-craft-canvas-cursor");
  record.canvasElement = canvasElement;
  record.canvasObserver = null;
  if (!isHtmlElement(canvasElement)) return;
  // Use the renderer's public DOM output, not PIXI internals or hit-test guesses.
  record.canvasObserver = new ownerDocument.defaultView.MutationObserver(() => syncCanvasCursorState(canvasElement));
  record.canvasObserver.observe(canvasElement, {attributes: true, attributeFilter: ["style"]});
  syncCanvasCursorState(canvasElement);
}

function syncCanvasCursorState(canvasElement) {
  const nativeCursor = canvasElement.style.cursor;
  // Crosshair, grab, resize and other system cursors keep their native meaning.
  const decorate = CANVAS_PASSIVE_CURSORS.has(nativeCursor) || CANVAS_ACTION_CURSORS.has(nativeCursor);
  canvasElement.classList.toggle("vtt-craft-canvas-cursor", decorate);
  if (canvasElement.matches(":hover")) setCursorActiveState(CANVAS_ACTION_CURSORS.has(nativeCursor), canvasElement.ownerDocument);
}

function queueDecorateCoreUi(root = document) {
  if (!isThemeActive() || !root?.nodeType) return;
  const ownerDocument = root.nodeType === 9 ? root : root.ownerDocument;
  const record = getUiDocument(ownerDocument);
  if (!record) return;
  if (root === ownerDocument) {
    record.pendingRoots.clear();
    record.pendingRoots.add(root);
  } else {
    for (const pending of record.pendingRoots) {
      if (pending === root || pending.contains(root)) return;
      if (root.contains(pending)) record.pendingRoots.delete(pending);
    }
    record.pendingRoots.add(root);
  }
  if (record.coreDecorateTimeout !== null) return;
  record.coreDecorateTimeout = ownerDocument.defaultView.setTimeout(() => {
    record.coreDecorateTimeout = null;
    const roots = [...record.pendingRoots];
    record.pendingRoots.clear();
    if (!isThemeActive()) return;
    for (const changedRoot of roots) {
      if (changedRoot !== ownerDocument && !changedRoot.isConnected) continue;
      decorateExistingApplications(changedRoot);
      decorateCoreUi(changedRoot);
    }
    if (record.cursorListenersActive && (!record.canvasElement?.isConnected)) setupCanvasCursorObserver(ownerDocument);
  }, CORE_SCAN_DELAY);
}

function isCoreApplication(application, frame) {
  const constructorName = application?.constructor?.name;
  return CORE_APP_NAMES.has(constructorName) || isCoreFrame(frame);
}

function isCoreFrame(frame) {
  const id = frame?.id;
  return id === "sidebar" || id === "hotbar" || id === "players"
    || id === "chat" || id === "chat-log" || id === "chat-notifications"
    || Boolean(frame?.matches?.(".chat-sidebar, .chat-popout"))
    || id === "navigation" || id === "scene-navigation" || id === "controls"
    || id === "scene-controls" || id === "pause" || id === "ui-left"
    || id === "ui-top" || id === "ui-bottom" || id === "ui-right";
}

function getDocumentSheetType(application, frame) {
  const DocumentSheetV2 = globalThis.foundry?.applications?.api?.DocumentSheetV2;
  const isDocumentSheet = DocumentSheetV2 && application instanceof DocumentSheetV2;
  const documentName = application?.document?.documentName;
  if (documentName && (isDocumentSheet || frame?.matches?.(".sheet, .document-sheet"))) return documentName;

  if (frame?.classList?.contains("actor")) return "Actor";
  if (frame?.classList?.contains("item")) return "Item";
  if (frame?.matches?.(".journal-entry-page, .journal-sheet.journal-page, [data-document-name='JournalEntryPage']")) return "JournalEntryPage";
  if (frame?.matches?.(".journal-entry, .journal-sheet, .journal-entry-sheet, [data-document-name='JournalEntry']")) return "JournalEntry";
  if (frame?.matches?.(".roll-table-sheet, .rolltable-sheet, .roll-table, [data-document-name='RollTable']")) return "RollTable";

  if (isDocumentSheet) return "Document";

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

