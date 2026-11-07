window.__ModuleLoader__.load({
	id: "dsh-anysearch-ev",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_react = require("react");
var REF = "ANYSEARCH_API_KEY";
var state = {
  /** Whether the host reports a configured credential; undefined until known. */
  configured: void 0,
  /** Whether the credentials domain accepts a write. */
  writable: true,
  /** Whether a save is in flight. */
  saving: false,
  /** One-line result of the last save attempt. */
  message: ""
};
var listeners = /* @__PURE__ */ new Set();
var clientCtx = null;
function setState(patch) {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}
async function refresh(ctx) {
  if (ctx === null || ctx === void 0) return;
  try {
    const response = await ctx.remote.credentials.describe([REF]);
    if (response?.ok !== true) {
      setState({ configured: void 0 });
      return;
    }
    const view = response.value?.[REF];
    setState({
      configured: view?.configured === true,
      writable: view?.writable !== false
    });
  } catch {
    setState({ configured: void 0 });
  }
}
async function save(ctx, value) {
  if (ctx === null || ctx === void 0) return;
  setState({ saving: true, message: "" });
  try {
    const trimmed = value.trim();
    if (trimmed === "") {
      await ctx.remote.credentials.unset(REF);
      setState({ message: "\u5DF2\u6E05\u9664\u5BC6\u94A5\uFF0C\u4F7F\u7528\u533F\u540D\u989D\u5EA6\u3002" });
    } else {
      await ctx.remote.credentials.set(REF, trimmed);
      setState({ message: "\u5DF2\u4FDD\u5B58\u3002\u4E0B\u4E00\u6B21\u641C\u7D22\u751F\u6548\u3002" });
    }
    await refresh(ctx);
  } catch {
    setState({ message: "\u4FDD\u5B58\u5931\u8D25\uFF1A\u8BE5\u51ED\u636E\u5F53\u524D\u4E0D\u53EF\u5199\uFF0C\u6216\u63A5\u53E3\u62D2\u7EDD\u4E86\u672C\u6B21\u5199\u5165\u3002" });
  } finally {
    setState({ saving: false });
  }
}
var styles = {
  card: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "14px 16px",
    border: "1px solid color-mix(in srgb, currentColor 14%, transparent)",
    borderRadius: "10px"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px"
  },
  title: { fontSize: "14px", fontWeight: 600 },
  badge: (configured) => ({
    fontSize: "12px",
    opacity: configured === void 0 ? 0.5 : 0.85
  }),
  hint: { fontSize: "12px", opacity: 0.65, lineHeight: 1.5 },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "8px 10px",
    fontSize: "13px",
    color: "inherit",
    background: "transparent",
    border: "1px solid color-mix(in srgb, currentColor 22%, transparent)",
    borderRadius: "8px",
    outline: "none"
  },
  footer: { display: "flex", alignItems: "center", gap: "12px" },
  button: {
    padding: "7px 16px",
    fontSize: "13px",
    color: "inherit",
    background: "color-mix(in srgb, currentColor 10%, transparent)",
    border: "1px solid color-mix(in srgb, currentColor 22%, transparent)",
    borderRadius: "8px",
    cursor: "pointer"
  },
  message: { fontSize: "12px", opacity: 0.75 }
};
function KeyCard() {
  const [, force] = (0, import_react.useReducer)((n) => n + 1, 0);
  const [draft, setDraft] = (0, import_react.useState)("");
  (0, import_react.useEffect)(() => {
    const listener = () => force(0);
    listeners.add(listener);
    void refresh(clientCtx);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  const configured = state.configured;
  const disabled = state.writable !== true || state.saving === true;
  return (0, import_react.createElement)(
    "div",
    { style: styles.card },
    (0, import_react.createElement)(
      "div",
      { style: styles.header },
      (0, import_react.createElement)("span", { style: styles.title }, "AnySearch API Key"),
      (0, import_react.createElement)(
        "span",
        { style: styles.badge(configured) },
        configured === void 0 ? "\u72B6\u6001\u672A\u77E5" : configured ? "\u25CF \u5DF2\u914D\u7F6E\u5BC6\u94A5" : "\u25CB \u533F\u540D\u989D\u5EA6"
      )
    ),
    (0, import_react.createElement)(
      "div",
      { style: styles.hint },
      "\u5BC6\u94A5\u53EA\u5199\u5165 DSH \u7684\u51ED\u636E\u6587\u4EF6\uFF08.credentials.yaml\uFF09\uFF0C\u4E0D\u4F1A\u5199\u8FDB\u63D2\u4EF6\u8BBE\u7F6E\uFF0C\u4E5F\u4E0D\u4F1A\u56DE\u663E\u3002"
    ),
    (0, import_react.createElement)("input", {
      type: "password",
      value: draft,
      placeholder: "as_sk_...\uFF08\u7559\u7A7A\u8868\u793A\u533F\u540D\u989D\u5EA6\uFF09",
      disabled,
      autoComplete: "off",
      spellCheck: false,
      style: styles.input,
      onChange: (event) => setDraft(event.target.value)
    }),
    (0, import_react.createElement)("div", { style: styles.hint }, "\u7559\u7A7A\u540E\u70B9\u4FDD\u5B58 = \u6E05\u9664\u5DF2\u5B58\u5BC6\u94A5\uFF0C\u56DE\u5230 AnySearch \u533F\u540D\u989D\u5EA6\u3002"),
    (0, import_react.createElement)(
      "div",
      { style: styles.footer },
      (0, import_react.createElement)(
        "button",
        {
          type: "button",
          disabled,
          style: styles.button,
          onClick: async () => {
            await save(clientCtx, draft);
            setDraft("");
          }
        },
        state.saving ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58"
      ),
      state.message !== "" ? (0, import_react.createElement)("span", { style: styles.message }, state.message) : null
    )
  );
}
var inject = ["slots", "remote", "remote.credentials"];
function apply(ctx) {
  clientCtx = ctx;
  ctx.effect(
    () => ctx.slots.inject(
      "plugins.item",
      () => ctx.slots.register(
        {
          name: "plugins.item",
          id: "anysearch-key",
          order: 30,
          label: () => "AnySearch API Key"
        },
        KeyCard
      )
    ),
    "anysearch-ev: settings card"
  );
  ctx.effect(
    () => ctx.remote.$on("credentials/reference-updated", (ref) => {
      if (ref === REF) void refresh(ctx);
    }),
    "anysearch-ev: credential invalidations"
  );
}
		return module.exports;
	}
});
