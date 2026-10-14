window.__ModuleLoader__.load({
  id: "dsh-upgrade",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const { jsx, jsxs, Fragment } = require("react/jsx-runtime");
    const { useState, useEffect, useRef } = require("react");
    const ReactDOM = require("react-dom");

    // Inject CSS styles once
    const styleId = "dsh-upgrade-styles";
    if (typeof document !== "undefined" && !document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .dsh-upgrade-trigger {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          height: 38px;
          margin: 3px 0;
          padding: 0 10px;
          box-sizing: border-box;
          border: none;
          border-radius: 10px;
          background: transparent;
          cursor: pointer;
          color: var(--dsw-alias-label-secondary, #999);
          font-family: inherit;
          font-size: 13px;
          line-height: 1;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .dsh-upgrade-trigger:hover {
          background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08));
          color: var(--dsw-alias-label-primary, #fff);
        }
        .dsh-upgrade-trigger.rail {
          width: 36px;
          height: 36px;
          margin: 4px auto;
          justify-content: center;
          padding: 0;
          border-radius: 50%;
        }
        .dsh-upgrade-trigger svg {
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }
        .dsh-upgrade-trigger:hover svg {
          transform: translateY(-2px);
        }
        .dsh-upgrade-label {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dsh-upgrade-badge-dot {
          position: absolute;
          top: 6px;
          right: 8px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4);
          animation: dsh-upgrade-pulse-blue 2s infinite;
        }
        .dsh-upgrade-badge-dot.alpha {
          background: #22c55e;
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.4);
          animation: dsh-upgrade-pulse-green 2s infinite;
        }
        .dsh-upgrade-trigger.rail .dsh-upgrade-badge-dot {
          top: 4px;
          right: 4px;
        }
        @keyframes dsh-upgrade-pulse-blue {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        @keyframes dsh-upgrade-pulse-green {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        .dsh-upgrade-pill {
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 999px;
          background: rgba(59, 130, 246, 0.18);
          color: #60a5fa;
          font-weight: 500;
          margin-left: auto;
          white-space: nowrap;
        }
        .dsh-upgrade-pill.alpha {
          background: rgba(34, 197, 94, 0.18);
          color: #4ade80;
        }

        /* Modal & Overlay */
        .dsh-upgrade-overlay {
          position: fixed;
          inset: 0;
          z-index: 999999;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: dsh-up-fade-in 0.15s ease-out;
        }
        @keyframes dsh-up-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .dsh-upgrade-modal {
          background: var(--dsw-alias-bg-layer-2, #18181c);
          border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.15));
          border-radius: 14px;
          padding: 24px;
          width: 480px;
          max-width: calc(100vw - 32px);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
          color: var(--dsw-alias-label-primary, #f0f0f5);
          font-family: inherit;
          box-sizing: border-box;
          animation: dsh-up-pop-in 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes dsh-up-pop-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .dsh-upgrade-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }
        .dsh-upgrade-header-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .dsh-upgrade-header-icon.spin {
          animation: dsh-up-spin 1.2s linear infinite;
        }
        @keyframes dsh-up-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .dsh-upgrade-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          flex: 1;
        }
        .dsh-upgrade-close {
          border: none;
          background: transparent;
          color: var(--dsw-alias-label-tertiary, #777);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dsh-upgrade-close:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--dsw-alias-label-primary, #fff);
        }

        /* Version Info Card */
        .dsh-up-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08));
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 16px;
        }
        .dsh-up-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13.5px;
        }
        .dsh-up-row + .dsh-up-row {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px dashed rgba(255, 255, 255, 0.08);
        }
        .dsh-up-label {
          color: var(--dsw-alias-label-secondary, #aaa);
        }
        .dsh-up-value {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-weight: 600;
        }
        .dsh-up-badge-new {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 4px;
          font-weight: 500;
          margin-left: 6px;
        }
        .dsh-up-badge-blue {
          background: rgba(59, 130, 246, 0.18);
          color: #60a5fa;
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 4px;
          font-weight: 500;
          margin-left: 6px;
        }
        .dsh-up-badge-green {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 4px;
          font-weight: 500;
          margin-left: 6px;
        }
        .dsh-up-badge-latest {
          background: rgba(255, 255, 255, 0.1);
          color: var(--dsw-alias-label-secondary, #aaa);
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 4px;
          margin-left: 6px;
        }
        .dsh-up-badge-loading {
          background: rgba(255, 255, 255, 0.08);
          color: var(--dsw-alias-label-tertiary, #888);
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 4px;
          margin-left: 6px;
          animation: dsh-up-pulse 1.5s ease-in-out infinite;
        }
        .dsh-up-value-loading {
          color: var(--dsw-alias-label-tertiary, #777);
          font-size: 13px;
          font-style: italic;
          animation: dsh-up-pulse 1.5s ease-in-out infinite;
        }
        @keyframes dsh-up-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }

        /* Tabs & Selector */
        .dsh-up-tabs {
          display: flex;
          gap: 6px;
          margin-bottom: 12px;
          background: rgba(0, 0, 0, 0.2);
          padding: 3px;
          border-radius: 8px;
        }
        .dsh-up-tab-btn {
          flex: 1;
          border: none;
          background: transparent;
          color: var(--dsw-alias-label-secondary, #888);
          font-size: 12px;
          font-weight: 500;
          padding: 6px 0;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .dsh-up-tab-btn.active {
          background: var(--dsw-alias-bg-layer-3, rgba(255, 255, 255, 0.12));
          color: #fff;
        }
        .dsh-up-select {
          width: 100%;
          background: var(--dsw-alias-bg-layer-1, #121215);
          border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.15));
          border-radius: 8px;
          padding: 8px 10px;
          color: #f0f0f5;
          font-size: 13px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          margin-bottom: 16px;
          box-sizing: border-box;
          outline: none;
        }
        .dsh-up-select:focus {
          border-color: #3b82f6;
        }

        /* Stepper */
        .dsh-up-stepper {
          display: flex;
          justify-content: space-between;
          margin: 18px 0 16px 0;
          position: relative;
        }
        .dsh-up-stepper::before {
          content: "";
          position: absolute;
          top: 14px;
          left: 20px;
          right: 20px;
          height: 2px;
          background: rgba(255, 255, 255, 0.08);
          z-index: 0;
        }
        .dsh-up-step {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          width: 70px;
        }
        .dsh-up-step-num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--dsw-alias-bg-layer-2, #18181c);
          border: 2px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: var(--dsw-alias-label-secondary, #888);
        }
        .dsh-up-step.active .dsh-up-step-num {
          border-color: #3b82f6;
          background: #3b82f6;
          color: #fff;
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.5);
        }
        .dsh-up-step.done .dsh-up-step-num {
          border-color: #22c55e;
          background: #22c55e;
          color: #fff;
        }
        .dsh-up-step-text {
          font-size: 11px;
          color: var(--dsw-alias-label-tertiary, #777);
          text-align: center;
          white-space: nowrap;
        }
        .dsh-up-step.active .dsh-up-step-text {
          color: #fff;
          font-weight: 500;
        }

        /* Terminal Console */
        .dsh-up-terminal {
          background: #0d1117;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 10px 12px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11.5px;
          line-height: 1.5;
          color: #8b949e;
          height: 130px;
          overflow-y: auto;
          box-sizing: border-box;
          margin-bottom: 16px;
          word-break: break-all;
        }
        .dsh-up-terminal-line {
          margin-bottom: 2px;
        }
        .dsh-up-terminal-line.highlight {
          color: #58a6ff;
        }
        .dsh-up-terminal-line.success {
          color: #3fb950;
        }
        .dsh-up-terminal-line.error {
          color: #f85149;
        }

        /* Actions */
        .dsh-upgrade-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          align-items: center;
        }
        .dsh-upgrade-btn {
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: filter 0.15s ease, background 0.15s ease, opacity 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .dsh-upgrade-btn-cancel {
          background: var(--dsw-alias-bg-layer-3, rgba(255, 255, 255, 0.08));
          color: var(--dsw-alias-label-secondary, #ccc);
          border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.1));
        }
        .dsh-upgrade-btn-cancel:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
        }
        .dsh-upgrade-btn-primary {
          background: #3b82f6;
          color: #fff;
        }
        .dsh-upgrade-btn-primary:hover {
          filter: brightness(1.1);
        }
        .dsh-upgrade-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .dsh-upgrade-btn-secondary {
          background: transparent;
          color: var(--dsw-alias-label-secondary, #aaa);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .dsh-upgrade-btn-secondary:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.06);
        }
        .dsh-upgrade-btn-restart {
          background: rgba(255, 255, 255, 0.05);
          color: var(--dsw-alias-label-secondary, #bbb);
          border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.12));
          margin-right: auto;
          transition: all 0.15s ease;
        }
        .dsh-upgrade-btn-restart:hover {
          background: rgba(245, 158, 11, 0.14);
          color: #fbbf24;
          border-color: rgba(245, 158, 11, 0.35);
        }
        .dsh-upgrade-btn-restart svg {
          transition: transform 0.3s ease;
        }
        .dsh-upgrade-btn-restart:hover svg {
          transform: rotate(90deg);
        }
        .dsh-upgrade-btn-warning {
          background: #f59e0b;
          color: #111;
          font-weight: 600;
        }
        .dsh-upgrade-btn-warning:hover {
          filter: brightness(1.1);
        }
        .dsh-upgrade-header-icon.restart-amber {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
        }
        .dsh-up-restart-box {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--dsw-alias-border-l1, rgba(255, 255, 255, 0.08));
          border-radius: 10px;
          padding: 16px 18px;
          margin-bottom: 18px;
        }
        .dsh-up-restart-list {
          margin: 10px 0 0 0;
          padding-left: 18px;
          font-size: 12.5px;
          color: var(--dsw-alias-label-secondary, #aaa);
          line-height: 1.7;
        }
        .dsh-up-restart-list li {
          margin-bottom: 4px;
        }
        .dsh-up-restarting-area {
          padding: 24px 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .dsh-up-restarting-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Incompatible plugins warning card */
        .dsh-up-incompatible-card {
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.28);
          border-radius: 9px;
          padding: 12px 14px;
          margin-bottom: 14px;
          animation: dsh-up-fade-in 0.15s ease-out;
        }
        .dsh-up-incompatible-title {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 13px;
          font-weight: 600;
          color: #fbbf24;
          margin-bottom: 6px;
        }
        .dsh-up-incompatible-desc {
          font-size: 12px;
          color: var(--dsw-alias-label-secondary, #ccc);
          line-height: 1.5;
          margin-bottom: 6px;
        }
        .dsh-up-incompatible-list {
          margin: 0 0 8px 0;
          padding-left: 18px;
          font-size: 11.5px;
          line-height: 1.6;
          color: #f0f0f5;
        }
        .dsh-up-incompatible-ver {
          color: var(--dsw-alias-label-tertiary, #999);
          margin-left: 4px;
        }
        .dsh-up-incompatible-reason {
          color: #f59e0b;
          margin-left: 6px;
        }
        .dsh-up-incompatible-tip {
          font-size: 11.5px;
          color: var(--dsw-alias-label-tertiary, #888);
          border-top: 1px dashed rgba(245, 158, 11, 0.18);
          padding-top: 6px;
          margin-top: 2px;
        }
      `;
      document.head.appendChild(style);
    }

    // SVG Icons
    function UpgradeIcon({ size = 16 }) {
      return jsx("svg", {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        children: [
          jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
          jsx("polyline", { points: "17 8 12 3 7 8" }),
          jsx("line", { x1: "12", y1: "3", x2: "12", y2: "15" })
        ]
      });
    }

    function RefreshIcon({ size = 14, spin = false }) {
      return jsx("svg", {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: spin ? { animation: "dsh-up-spin 1s linear infinite" } : {},
        children: [
          jsx("polyline", { points: "23 4 23 10 17 10" }),
          jsx("polyline", { points: "1 20 1 14 7 14" }),
          jsx("path", { d: "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" })
        ]
      });
    }

    function CheckIcon({ size = 16 }) {
      return jsx("svg", {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2.5",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        children: jsx("polyline", { points: "20 6 9 17 4 12" })
      });
    }

    function CloseIcon({ size = 16 }) {
      return jsx("svg", {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        children: [
          jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
          jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
        ]
      });
    }

    function RollbackIcon({ size = 14 }) {
      return jsx("svg", {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        children: [
          jsx("polyline", { points: "1 4 1 10 7 10" }),
          jsx("path", { d: "M3.51 15a9 9 0 1 0 2.13-9.36L1 10" })
        ]
      });
    }

    function AlertIcon({ size = 15 }) {
      return jsx("svg", {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        children: [
          jsx("path", { d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" }),
          jsx("line", { x1: "12", y1: "9", x2: "12", y2: "13" }),
          jsx("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })
        ]
      });
    }

    // Semver parser & comparator
    function parseSemver(v) {
      if (!v) return null;
      const clean = String(v).trim().replace(/^v/, '');
      const m = clean.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/);
      if (!m) return null;
      let prerelease = null;
      if (m[4]) {
        prerelease = [];
        const parts = m[4].split('.');
        for (const p of parts) {
          const sub = p.match(/([a-zA-Z]+|\d+)/g);
          if (sub && sub.length > 1) {
            prerelease.push(...sub);
          } else {
            prerelease.push(p);
          }
        }
      }
      return {
        major: parseInt(m[1], 10),
        minor: parseInt(m[2], 10),
        patch: parseInt(m[3], 10),
        prerelease,
        raw: clean
      };
    }

    function compareSemver(a, b) {
      const pa = parseSemver(a);
      const pb = parseSemver(b);
      if (!pa || !pb) return String(a || '').localeCompare(String(b || ''));
      if (pa.major !== pb.major) return pa.major - pb.major;
      if (pa.minor !== pb.minor) return pa.minor - pb.minor;
      if (pa.patch !== pb.patch) return pa.patch - pb.patch;
      if (!pa.prerelease && !pb.prerelease) return 0;
      if (!pa.prerelease) return 1;
      if (!pb.prerelease) return -1;
      const len = Math.max(pa.prerelease.length, pb.prerelease.length);
      for (let i = 0; i < len; i++) {
        const p1 = pa.prerelease[i];
        const p2 = pb.prerelease[i];
        if (p1 === undefined) return -1;
        if (p2 === undefined) return 1;
        const n1 = Number(p1);
        const n2 = Number(p2);
        const isN1 = !isNaN(n1) && String(n1) === p1;
        const isN2 = !isNaN(n2) && String(n2) === p2;
        if (isN1 && isN2) {
          if (n1 !== n2) return n1 - n2;
        } else if (isN1 && !isN2) {
          return -1;
        } else if (!isN1 && isN2) {
          return 1;
        } else {
          if (p1 !== p2) return p1.localeCompare(p2);
        }
      }
      return 0;
    }

    // Modal dialog
    function UpgradeModal({ isOpen, onClose, onRefreshBadge }) {
      const [loading, setLoading] = useState(false);
      const [checking, setChecking] = useState(false);
      const [info, setInfo] = useState(null);
      const [selectedVersion, setSelectedVersion] = useState("");
      const [channelTab, setChannelTab] = useState("latest"); // 'latest' | 'alpha' | 'all'

      // Modal mode: 'normal' | 'confirm_restart' | 'restarting'
      const [modalMode, setModalMode] = useState("normal");
      const [restartPhase, setRestartPhase] = useState("idle"); // 'idle' | 'waiting' | 'reconnecting' | 'success' | 'error'
      const [restartStatusText, setRestartStatusText] = useState("");
      const [restartSubText, setRestartSubText] = useState("");
      const [restartAttempts, setRestartAttempts] = useState(0);

      // Incompatible plugins for current target
      const [incompatibleList, setIncompatibleList] = useState([]);
      const [checkingCompat, setCheckingCompat] = useState(false);

      // Upgrade runtime state
      const [isUpgrading, setIsUpgrading] = useState(false);
      const [step, setStep] = useState("idle"); // 'idle' | 'backing_up' | 'installing' | 'restarting' | 'reconnecting' | 'success' | 'error'
      const [logs, setLogs] = useState([]);
      const [errorMsg, setErrorMsg] = useState("");
      const [reconnectCount, setReconnectCount] = useState(0);

      const terminalRef = useRef(null);

      // Auto-scroll terminal
      useEffect(() => {
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      }, [logs]);

      // Load info on open
      const loadInfo = async (forceRefresh = false) => {
        setChecking(true);
        try {
          const res = await fetch("/api/dsh-upgrade/info" + (forceRefresh ? "?refresh=true" : ""), {
            cache: "no-store"
          });
          if (res.ok) {
            const data = await res.json();
            setInfo(data);
            if (!selectedVersion || forceRefresh) {
              let target = "";
              if (channelTab === "alpha" && data.alphaVersion) {
                target = data.alphaVersion;
              } else if (data.latestVersion) {
                target = data.latestVersion;
              } else {
                target = data.currentVersion || "";
              }
              if (target) setSelectedVersion(target);
            }
            if (onRefreshBadge) {
              let badgeType = null;
              if (data.hasUpdate) badgeType = 'stable';
              else if (data.hasAlphaUpdate) badgeType = 'alpha';
              onRefreshBadge(badgeType);
            }
          }
        } catch (e) {
          console.warn("[dsh-upgrade] failed to load info", e);
        } finally {
          setChecking(false);
        }
      };

      useEffect(() => {
        if (isOpen) {
          setModalMode("normal");
          setRestartPhase("idle");
          setRestartStatusText("");
          setRestartSubText("");
          setRestartAttempts(0);
          setIncompatibleList([]);
          loadInfo(false);
          // Also poll current status in case a task is already running
          fetch("/api/dsh-upgrade/status")
            .then((r) => r.json())
            .then((st) => {
              if (st && st.running) {
                setIsUpgrading(true);
                setStep(st.step);
                setLogs(st.logs || []);
                startStatusPolling();
              }
            })
            .catch(() => {});
        } else {
          // Reset view if closed after finished
          setModalMode("normal");
          setRestartPhase("idle");
          setIncompatibleList([]);
          if (step === "error" || step === "success") {
            setIsUpgrading(false);
            setStep("idle");
          }
        }
      }, [isOpen]);

      // Check plugin compatibility for selected version
      useEffect(() => {
        if (!isOpen) return;
        const target = (selectedVersion || "").replace(/^v/, "");
        if (!target) {
          setIncompatibleList([]);
          return;
        }
        let isMounted = true;
        setCheckingCompat(true);
        fetch(`/api/dsh-upgrade/compatibility?target=${encodeURIComponent(target)}`)
          .then((r) => r.json())
          .then((d) => {
            if (isMounted && d && d.ok) {
              setIncompatibleList(d.incompatible || []);
            }
          })
          .catch(() => {})
          .finally(() => {
            if (isMounted) setCheckingCompat(false);
          });
        return () => { isMounted = false; };
      }, [selectedVersion, isOpen]);

      // Trigger service restart
      const handleExecuteRestart = async () => {
        setModalMode("restarting");
        setRestartPhase("waiting");
        setRestartStatusText("正在发送重启指令...");
        setRestartSubText("通知 DSH 后台服务平滑重启");

        try {
          await fetch("/api/dsh-upgrade/restart", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
          });
        } catch (e) {
          // process drops connection immediately
        }

        setRestartStatusText("DSH 服务正在重启...");
        setRestartSubText("等待后台进程重新启动并加载插件");

        await new Promise((r) => setTimeout(r, 1200));

        let curAttempts = 0;
        const maxAttempts = 60;
        const pollInterval = 650;

        const poll = async () => {
          curAttempts++;
          setRestartAttempts(curAttempts);
          setRestartPhase("reconnecting");
          setRestartStatusText("正在重新连接服务...");
          setRestartSubText(`等待后台拉起并就绪 (第 ${curAttempts} 次检测)`);

          try {
            const res = await fetch("/api/dsh-upgrade/ping?t=" + Date.now(), { cache: "no-store" });
            if (res.ok) {
              const data = await res.json();
              if (data && data.ok) {
                setRestartPhase("success");
                setRestartStatusText("服务已重新连接成功！");
                setRestartSubText("正在自动刷新页面生效...");
                setTimeout(() => {
                  window.location.reload();
                }, 750);
                return;
              }
            }
          } catch (err) {}

          if (curAttempts < maxAttempts) {
            setTimeout(poll, pollInterval);
          } else {
            setRestartPhase("error");
            setRestartStatusText("等待重连超时");
            setRestartSubText("服务可能启动较慢，请检查日志或手动点击刷新");
          }
        };

        poll();
      };

      // Switch channel tabs and update selected target
      const handleTabChange = (newTab) => {
        setChannelTab(newTab);
        if (!info) return;
        if (newTab === "latest" && info.latestVersion) {
          setSelectedVersion(info.latestVersion);
        } else if (newTab === "alpha" && info.alphaVersion) {
          setSelectedVersion(info.alphaVersion);
        } else if (newTab === "all") {
          if (!selectedVersion) {
            setSelectedVersion(info.currentVersion || info.latestVersion || "");
          }
        }
      };

      // Status polling during upgrade
      const startStatusPolling = () => {
        const pollTimer = setInterval(async () => {
          try {
            const res = await fetch("/api/dsh-upgrade/status?t=" + Date.now(), { cache: "no-store" });
            if (res.ok) {
              const data = await res.json();
              setStep(data.step);
              setLogs(data.logs || []);

              if (data.step === "restarting") {
                clearInterval(pollTimer);
                startReconnectPolling();
                return;
              }

              if (data.step === "error") {
                clearInterval(pollTimer);
                setIsUpgrading(false);
                setErrorMsg(data.error || "升级中断");
                return;
              }
            }
          } catch (err) {
            // Server might have gone down for restart
            clearInterval(pollTimer);
            startReconnectPolling();
          }
        }, 700);
      };

      // Heartbeat reconnection
      const startReconnectPolling = () => {
        setStep("reconnecting");
        let attempts = 0;
        const maxAttempts = 60;

        const pTimer = setInterval(async () => {
          attempts++;
          setReconnectCount(attempts);
          try {
            const res = await fetch("/api/dsh-upgrade/ping?t=" + Date.now(), { cache: "no-store" });
            if (res.ok) {
              const pingData = await res.json();
              if (pingData && pingData.ok) {
                clearInterval(pTimer);
                setStep("success");
                setTimeout(() => {
                  window.location.reload();
                }, 1200);
                return;
              }
            }
          } catch (e) {
            // Still waiting for server boot
          }

          if (attempts >= maxAttempts) {
            clearInterval(pTimer);
            setStep("error");
            setErrorMsg("服务启动响应超时，请查看日志或手动刷新页面。");
          }
        }, 800);
      };

      // Start upgrade
      const handleStartUpgrade = async () => {
        if (!selectedVersion) return;
        setIsUpgrading(true);
        setStep("backing_up");
        setErrorMsg("");
        setLogs([`[准备] 发起升级到 @deepseek-ai/dsh@${selectedVersion}...`]);

        try {
          const res = await fetch("/api/dsh-upgrade/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ version: selectedVersion })
          });
          const result = await res.json();
          if (!result.ok) {
            setIsUpgrading(false);
            setStep("error");
            setErrorMsg(result.error || "启动失败");
            return;
          }
          startStatusPolling();
        } catch (e) {
          setIsUpgrading(false);
          setStep("error");
          setErrorMsg(e.message || "请求异常");
        }
      };

      // Reset error state
      const handleReset = async () => {
        await fetch("/api/dsh-upgrade/reset", { method: "POST" }).catch(() => {});
        setIsUpgrading(false);
        setStep("idle");
        setErrorMsg("");
        setLogs([]);
        loadInfo(false);
      };

      if (!isOpen) return null;

      const currentVer = info ? String(info.currentVersion).replace(/^v/, "") : "";

      // Target version for card display
      let displayTargetVer = "";
      let displayTargetLabel = "远端稳定版本";
      let channelHasUpdate = false;
      let channelIsLatest = false;

      if (info) {
        if (channelTab === "latest") {
          displayTargetVer = String(info.latestVersion || currentVer || "").replace(/^v/, "");
          displayTargetLabel = "远端最新稳定版";
          channelHasUpdate = compareSemver(currentVer, displayTargetVer) < 0;
          channelIsLatest = !channelHasUpdate;
        } else if (channelTab === "alpha") {
          displayTargetVer = String(info.alphaVersion || info.latestVersion || currentVer || "").replace(/^v/, "");
          displayTargetLabel = "远端最新尝鲜版 (Alpha)";
          channelHasUpdate = compareSemver(currentVer, displayTargetVer) < 0;
          channelIsLatest = !channelHasUpdate;
        } else {
          displayTargetVer = String(selectedVersion || currentVer || "").replace(/^v/, "");
          displayTargetLabel = "目标选定版本";
          channelHasUpdate = (currentVer && displayTargetVer) ? compareSemver(currentVer, displayTargetVer) < 0 : false;
          channelIsLatest = (currentVer && displayTargetVer) ? compareSemver(currentVer, displayTargetVer) === 0 : false;
        }
      }

      // Filter version list by tab
      const allList = (info && info.versionList) ? info.versionList : [];
      let filteredVersions = [];
      if (channelTab === "latest") {
        filteredVersions = allList.filter((item) => {
          const v = item.version;
          return !v.includes("-alpha") && !v.includes("-beta");
        });
        if (filteredVersions.length === 0 && info && info.latestVersion) {
          filteredVersions = allList.filter((item) => item.version === info.latestVersion);
        }
      } else if (channelTab === "alpha") {
        filteredVersions = allList.filter((item) => {
          const v = item.version;
          return v.includes("-alpha") || v.includes("-beta") || item.tag === "alpha";
        });
      } else {
        filteredVersions = allList;
      }

      // Format dropdown item label
      const formatOptionText = (item) => {
        const cleanV = item.version.replace(/^v/, "");
        const isCurrent = cleanV === currentVer;
        let tagStr = "";
        if (item.tag === "latest") tagStr = " [最新稳定版]";
        else if (item.tag === "alpha") tagStr = " [最新尝鲜版]";
        else if (item.tag === "next") tagStr = " [Next]";
        else if (item.version.includes("-alpha")) tagStr = " [Alpha]";
        else if (item.version.includes("-beta")) tagStr = " [Beta]";
        else if (item.version.includes("-rc")) tagStr = " [RC]";
        return `${cleanV}${tagStr}${isCurrent ? " (当前安装)" : ""}`;
      };

      // Action button text and icon
      const cleanSelected = (selectedVersion || "").replace(/^v/, "");
      const semverDiff = (cleanSelected && currentVer) ? compareSemver(cleanSelected, currentVer) : 0;

      let btnText = "正在检测版本...";
      let btnIcon = jsx(UpgradeIcon, { size: 14 });
      let btnDisabled = false;

      if (!cleanSelected || !info) {
        btnText = checking ? "正在检测版本..." : "请选择目标版本";
        btnDisabled = true;
      } else if (semverDiff === 0) {
        btnText = `重新安装当前版本 (v${cleanSelected})`;
        btnIcon = jsx(RefreshIcon, { size: 14 });
      } else if (semverDiff > 0) {
        btnText = `一键升级至 v${cleanSelected}`;
        btnIcon = jsx(UpgradeIcon, { size: 14 });
      } else {
        btnText = `一键回滚至 v${cleanSelected}`;
        btnIcon = jsx(RollbackIcon, { size: 14 });
      }

      // Status badge for current version
      let currentBadge = null;
      if (!info || (checking && !currentVer)) {
        currentBadge = jsx("span", { className: "dsh-up-badge-loading", children: "检测中..." });
      } else if (channelTab === "latest") {
        if (channelHasUpdate) {
          currentBadge = jsx("span", { className: "dsh-up-badge-blue", children: "有新版本" });
        } else {
          currentBadge = jsx("span", { className: "dsh-up-badge-latest", children: "已是最新" });
        }
      } else if (channelTab === "alpha") {
        if (channelHasUpdate) {
          currentBadge = jsx("span", { className: "dsh-up-badge-green", children: "有尝鲜版更新" });
        } else {
          currentBadge = jsx("span", { className: "dsh-up-badge-latest", children: "已是最新" });
        }
      } else {
        if (info && info.hasUpdate) {
          currentBadge = jsx("span", { className: "dsh-up-badge-blue", children: "有新版本" });
        } else if (info && info.hasAlphaUpdate) {
          currentBadge = jsx("span", { className: "dsh-up-badge-green", children: "有尝鲜版更新" });
        } else {
          currentBadge = jsx("span", { className: "dsh-up-badge-latest", children: "已是最新" });
        }
      }

      const stepIndex = {
        idle: 0,
        backing_up: 1,
        installing: 2,
        restarting: 3,
        reconnecting: 3,
        success: 4,
        error: -1
      }[step] || 0;

      const modalContent = jsx("div", {
        className: "dsh-upgrade-overlay",
        onClick: (e) => {
          if (!isUpgrading && modalMode !== "restarting" && e.target === e.currentTarget) onClose();
        },
        children: jsx("div", {
          className: "dsh-upgrade-modal",
          role: "dialog",
          "aria-modal": "true",
          children: jsxs("div", {
            children: [
              // Header
              jsxs("div", {
                className: "dsh-upgrade-header",
                children: [
                  jsx("div", {
                    className: "dsh-upgrade-header-icon" + (modalMode === "confirm_restart" ? " restart-amber" : (modalMode === "restarting" ? " restart-amber spin" : (checking ? " spin" : ""))),
                    children: (modalMode === "confirm_restart" || modalMode === "restarting")
                      ? jsx(RefreshIcon, { size: 18, spin: modalMode === "restarting" })
                      : jsx(UpgradeIcon, { size: 20 })
                  }),
                  jsx("h3", {
                    className: "dsh-upgrade-title",
                    children: modalMode === "confirm_restart"
                      ? "重启 DSH 后台服务"
                      : (modalMode === "restarting"
                          ? "DSH 服务正在重启..."
                          : (isUpgrading ? "DSH 正在自动升级" : "DSH 版本检测与升级"))
                  }),
                  (!isUpgrading && modalMode !== "restarting") && jsx("button", {
                    type: "button",
                    className: "dsh-upgrade-close",
                    onClick: () => {
                      if (modalMode === "confirm_restart") setModalMode("normal");
                      else onClose();
                    },
                    "aria-label": "关闭",
                    children: jsx(CloseIcon, { size: 16 })
                  })
                ]
              }),

              // Restart confirmation view
              modalMode === "confirm_restart" ? jsxs(Fragment, {
                children: [
                  jsxs("div", {
                    className: "dsh-up-restart-box",
                    children: [
                      jsx("div", {
                        style: { fontSize: "14px", fontWeight: "600", color: "#f0f0f5", marginBottom: "8px" },
                        children: "确定要重启 DeepSeek Harness 服务吗？"
                      }),
                      jsxs("ul", {
                        className: "dsh-up-restart-list",
                        children: [
                          jsx("li", { children: "重启会重新加载全部扩展插件、用户配置（cordis.patch.yml）与环境变量。" }),
                          jsx("li", { children: "进行中的会话记录已自动保存，但当前正在运行的推理或任务会中断。" }),
                          jsx("li", { children: "服务重启成功后，本页面将自动重新连接并刷新。" })
                        ]
                      })
                    ]
                  }),
                  jsxs("div", {
                    className: "dsh-upgrade-actions",
                    children: [
                      jsx("button", {
                        type: "button",
                        className: "dsh-upgrade-btn dsh-upgrade-btn-cancel",
                        onClick: () => setModalMode("normal"),
                        children: "返回"
                      }),
                      jsx("button", {
                        type: "button",
                        className: "dsh-upgrade-btn dsh-upgrade-btn-warning",
                        onClick: handleExecuteRestart,
                        children: [
                          jsx(RefreshIcon, { size: 14 }),
                          "确定重启"
                        ]
                      })
                    ]
                  })
                ]
              }) : modalMode === "restarting" ? jsxs(Fragment, {
                // Restarting view
                children: [
                  jsxs("div", {
                    className: "dsh-up-restarting-area",
                    children: [
                      jsx("div", {
                        className: "dsh-up-restarting-icon-wrap",
                        children: jsx(RefreshIcon, { size: 22, spin: true })
                      }),
                      jsx("div", {
                        style: { fontSize: "15px", fontWeight: "600", color: "#f0f0f5" },
                        children: restartStatusText
                      }),
                      jsx("div", {
                        style: { fontSize: "12.5px", color: "var(--dsw-alias-label-tertiary, #888)" },
                        children: restartSubText
                      })
                    ]
                  }),
                  restartPhase === "error" ? jsxs("div", {
                    className: "dsh-upgrade-actions",
                    style: { justifyContent: "center" },
                    children: [
                      jsx("button", {
                        type: "button",
                        className: "dsh-upgrade-btn dsh-upgrade-btn-primary",
                        onClick: () => window.location.reload(),
                        children: "手动刷新页面"
                      }),
                      jsx("button", {
                        type: "button",
                        className: "dsh-upgrade-btn dsh-upgrade-btn-cancel",
                        onClick: () => setModalMode("normal"),
                        children: "返回"
                      })
                    ]
                  }) : null
                ]
              }) : !isUpgrading ? jsxs(Fragment, {
                children: [
                  // Version info card
                  jsxs("div", {
                    className: "dsh-up-card",
                    children: [
                      jsxs("div", {
                        className: "dsh-up-row",
                        children: [
                          jsx("span", { className: "dsh-up-label", children: "当前安装版本" }),
                          jsxs("div", {
                            style: { display: "flex", alignItems: "center" },
                            children: [
                              jsx("span", { className: "dsh-up-value", children: currentVer ? ("v" + currentVer) : "检测中..." }),
                              currentBadge
                            ]
                          })
                        ]
                      }),
                      jsxs("div", {
                        className: "dsh-up-row",
                        children: [
                          jsx("span", { className: "dsh-up-label", children: displayTargetLabel }),
                          jsxs("div", {
                            style: { display: "flex", alignItems: "center", gap: "8px" },
                            children: [
                              (!info && checking)
                                ? jsx("span", { className: "dsh-up-value-loading", children: "正在检测..." })
                                : jsx("span", { className: "dsh-up-value", style: { color: "#3b82f6" }, children: displayTargetVer ? ("v" + displayTargetVer) : "..." }),
                              jsx("button", {
                                type: "button",
                                className: "dsh-upgrade-btn dsh-upgrade-btn-secondary",
                                style: { padding: "2px 8px", fontSize: "11px" },
                                onClick: () => loadInfo(true),
                                disabled: checking,
                                title: "强制刷新远端版本",
                                children: [
                                  jsx(RefreshIcon, { size: 12, spin: checking }),
                                  checking ? "检测中" : "检测"
                                ]
                              })
                            ]
                          })
                        ]
                      })
                    ]
                  }),

                  // Channel Tabs
                  jsxs("div", {
                    className: "dsh-up-tabs",
                    children: [
                      jsx("button", {
                        type: "button",
                        className: "dsh-up-tab-btn" + (channelTab === "latest" ? " active" : ""),
                        onClick: () => handleTabChange("latest"),
                        children: "稳定版 (最新)"
                      }),
                      info && info.alphaVersion && jsx("button", {
                        type: "button",
                        className: "dsh-up-tab-btn" + (channelTab === "alpha" ? " active" : ""),
                        onClick: () => handleTabChange("alpha"),
                        children: "尝鲜版 (Alpha)"
                      }),
                      jsx("button", {
                        type: "button",
                        className: "dsh-up-tab-btn" + (channelTab === "all" ? " active" : ""),
                        onClick: () => handleTabChange("all"),
                        children: "全部历史版本 / 回滚"
                      })
                    ]
                  }),

                  // Version select dropdown
                  jsx("select", {
                    className: "dsh-up-select",
                    value: cleanSelected,
                    onChange: (e) => setSelectedVersion(e.target.value),
                    children: (filteredVersions.length > 0)
                      ? filteredVersions.map((item) => jsx("option", {
                          value: item.version.replace(/^v/, ""),
                          children: formatOptionText(item)
                        }, item.version))
                      : (allList.length > 0
                          ? allList.map((item) => jsx("option", {
                              value: item.version.replace(/^v/, ""),
                              children: formatOptionText(item)
                            }, item.version))
                          : jsx("option", { value: currentVer, children: currentVer || "无版本可选" }))
                  }),

                  // Incompatible plugins warning card
                  (incompatibleList.length > 0) && jsxs("div", {
                    className: "dsh-up-incompatible-card",
                    children: [
                      jsxs("div", {
                        className: "dsh-up-incompatible-title",
                        children: [
                          jsx(AlertIcon, { size: 15 }),
                          `检测到 ${incompatibleList.length} 个插件与 v${cleanSelected} 暂不兼容`
                        ]
                      }),
                      jsx("div", {
                        className: "dsh-up-incompatible-desc",
                        children: "以下插件尚未适配该版本。升级时将自动暂时关闭以避免服务启动报错崩溃："
                      }),
                      jsx("ul", {
                        className: "dsh-up-incompatible-list",
                        children: incompatibleList.map((item) => jsxs("li", {
                          children: [
                            jsx("strong", { children: item.bundle }),
                            jsx("span", { className: "dsh-up-incompatible-ver", children: `@${item.version}` }),
                            jsx("span", { className: "dsh-up-incompatible-reason", children: ` (${item.reason})` })
                          ]
                        }, item.bundle))
                      }),
                      jsx("div", {
                        className: "dsh-up-incompatible-tip",
                        children: "💡 提示：插件配置与代码完整保留，待作者发布新版本适配后即可重新启用。"
                      })
                    ]
                  }),

                  // Safe notes
                  jsx("div", {
                    style: { fontSize: "12px", color: "var(--dsw-alias-label-tertiary, #888)", marginBottom: "18px", lineHeight: "1.5" },
                    children: "升级过程会自动将当前 web profile 备份至系统临时目录，并通过 npm 全局更新包。升级成功后将自动重启并重连刷新。"
                  }),

                  // Actions
                  jsxs("div", {
                    className: "dsh-upgrade-actions",
                    children: [
                      jsx("button", {
                        type: "button",
                        className: "dsh-upgrade-btn dsh-upgrade-btn-restart",
                        onClick: () => setModalMode("confirm_restart"),
                        title: "重启 DSH 后台服务（重新加载扩展插件与配置）",
                        children: [
                          jsx(RefreshIcon, { size: 13 }),
                          "重启服务"
                        ]
                      }),
                      jsx("button", {
                        type: "button",
                        className: "dsh-upgrade-btn dsh-upgrade-btn-cancel",
                        onClick: onClose,
                        children: "取消"
                      }),
                      jsx("button", {
                        type: "button",
                        className: "dsh-upgrade-btn dsh-upgrade-btn-primary",
                        onClick: handleStartUpgrade,
                        disabled: btnDisabled || isUpgrading,
                        children: [
                          btnIcon,
                          btnText
                        ]
                      })
                    ]
                  })
                ]
              }) : jsxs(Fragment, {
                // Upgrading in progress view
                children: [
                  // Stepper
                  jsxs("div", {
                    className: "dsh-up-stepper",
                    children: [
                      jsxs("div", {
                        className: "dsh-up-step" + (stepIndex === 1 ? " active" : (stepIndex > 1 ? " done" : "")),
                        children: [
                          jsx("div", { className: "dsh-up-step-num", children: stepIndex > 1 ? jsx(CheckIcon, { size: 14 }) : "1" }),
                          jsx("span", { className: "dsh-up-step-text", children: "备份配置" })
                        ]
                      }),
                      jsxs("div", {
                        className: "dsh-up-step" + (stepIndex === 2 ? " active" : (stepIndex > 2 ? " done" : "")),
                        children: [
                          jsx("div", { className: "dsh-up-step-num", children: stepIndex > 2 ? jsx(CheckIcon, { size: 14 }) : "2" }),
                          jsx("span", { className: "dsh-up-step-text", children: "npm 下载" })
                        ]
                      }),
                      jsxs("div", {
                        className: "dsh-up-step" + (stepIndex === 3 ? " active" : (stepIndex > 3 ? " done" : "")),
                        children: [
                          jsx("div", { className: "dsh-up-step-num", children: stepIndex > 3 ? jsx(CheckIcon, { size: 14 }) : "3" }),
                          jsx("span", { className: "dsh-up-step-text", children: "重启服务" })
                        ]
                      }),
                      jsxs("div", {
                        className: "dsh-up-step" + (stepIndex >= 4 ? " done active" : ""),
                        children: [
                          jsx("div", { className: "dsh-up-step-num", children: stepIndex >= 4 ? jsx(CheckIcon, { size: 14 }) : "4" }),
                          jsx("span", { className: "dsh-up-step-text", children: "完成重连" })
                        ]
                      })
                    ]
                  }),

                  // Console Terminal
                  jsx("div", {
                    className: "dsh-up-terminal",
                    ref: terminalRef,
                    children: logs.map((line, idx) => {
                      let type = "";
                      if (line.includes("[npm err]") || line.includes("error") || line.includes("错误")) type = " error";
                      else if (line.includes("成功") || line.includes("完成")) type = " success";
                      else if (line.includes("第") || line.includes("准备")) type = " highlight";
                      return jsx("div", {
                        className: "dsh-up-terminal-line" + type,
                        children: line
                      }, idx);
                    })
                  }),

                  // Status info & actions
                  jsxs("div", {
                    style: { display: "flex", justifyContent: "space-between", alignItems: "center" },
                    children: [
                      jsx("span", {
                        style: { fontSize: "12.5px", color: step === "error" ? "#f85149" : "var(--dsw-alias-label-secondary, #aaa)" },
                        children: step === "error"
                          ? `错误: ${errorMsg}`
                          : (step === "reconnecting"
                              ? `正在等待服务重新启动 (第 ${reconnectCount} 次探测)...`
                              : (step === "success" ? "升级成功！页面即将自动刷新..." : "正在处理中，请勿关闭页面..."))
                      }),
                      step === "error" ? jsxs("div", {
                        className: "dsh-upgrade-actions",
                        children: [
                          jsx("button", {
                            type: "button",
                            className: "dsh-upgrade-btn dsh-upgrade-btn-cancel",
                            onClick: handleReset,
                            children: "返回重试"
                          }),
                          jsx("button", {
                            type: "button",
                            className: "dsh-upgrade-btn dsh-upgrade-btn-secondary",
                            onClick: () => window.location.reload(),
                            children: "刷新页面"
                          })
                        ]
                      }) : null
                    ]
                  })
                ]
              })
            ]
          })
        })
      });

      return ReactDOM.createPortal(modalContent, document.body);
    }

    // Sidebar footer action button
    function UpgradeFooterEntry({ wide }) {
      const [open, setOpen] = useState(false);
      const [updateType, setUpdateType] = useState(null); // 'stable' | 'alpha' | null

      // Silent initial check
      useEffect(() => {
        const checkSilently = async () => {
          try {
            const res = await fetch("/api/dsh-upgrade/info", { cache: "no-store" });
            if (res.ok) {
              const data = await res.json();
              if (data) {
                if (data.hasUpdate) {
                  setUpdateType("stable");
                } else if (data.hasAlphaUpdate) {
                  setUpdateType("alpha");
                } else {
                  setUpdateType(null);
                }
              }
            }
          } catch (e) {}
        };
        checkSilently();
        // Check every 30 minutes
        const timer = setInterval(checkSilently, 30 * 60 * 1000);
        return () => clearInterval(timer);
      }, []);

      const hasAny = updateType !== null;
      const isAlpha = updateType === "alpha";

      let triggerTitle = "DSH 版本检测与升级";
      if (updateType === "stable") {
        triggerTitle = "发现 DSH 稳定新版本，点击查看升级";
      } else if (updateType === "alpha") {
        triggerTitle = "发现 DSH 尝鲜新版本 (Alpha)，点击查看升级";
      }

      return jsxs(Fragment, {
        children: [
          jsx("button", {
            type: "button",
            className: "dsh-upgrade-trigger" + (wide ? "" : " rail"),
            title: triggerTitle,
            "aria-label": "DSH 版本检测与升级",
            onClick: () => setOpen(true),
            children: [
              jsx(UpgradeIcon, { size: wide ? 15 : 18 }),
              hasAny && jsx("span", { className: "dsh-upgrade-badge-dot" + (isAlpha ? " alpha" : "") }),
              wide && jsx("span", {
                className: "dsh-upgrade-label",
                children: "版本升级"
              }),
              wide && hasAny && jsx("span", {
                className: "dsh-upgrade-pill" + (isAlpha ? " alpha" : ""),
                children: isAlpha ? "有尝鲜版更新" : "有新版本"
              })
            ]
          }),
          jsx(UpgradeModal, {
            isOpen: open,
            onClose: () => setOpen(false),
            onRefreshBadge: (type) => setUpdateType(type)
          })
        ]
      });
    }

    // Export module
    exports.inject = ["slots"];
    exports.apply = function(ctx) {
      ctx.slots.inject("sidebar.footer.action", () => {
        try {
          return ctx.slots.register({
            name: "sidebar.footer.action",
            id: "dsh-upgrade",
            order: 48 // Place beside dsh-restart (order 50)
          }, UpgradeFooterEntry);
        } catch (e) {
          console.warn("[dsh-upgrade] failed to register into sidebar.footer.action", e);
        }
      });
    };

    return exports;
  }
});
