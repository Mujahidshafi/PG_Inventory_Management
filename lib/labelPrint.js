// lib/labelPrint.js
import JsBarcode from "jsbarcode";

// persist a user choice; default to browser
const MODE_KEY = "qsage:printerMode"; // "browser" | "qz"
export function getPrinterMode() {
  return localStorage.getItem(MODE_KEY) || "browser";
}
export function setPrinterMode(mode) {
  localStorage.setItem(MODE_KEY, mode);
}

/** Build an SVG string for a Code128 barcode */
export function barcodeSvgString(value, { width = 2, height = 60, fontSize = 12 } = {}) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  JsBarcode(svg, value, {
    format: "CODE128",
    displayValue: true,
    text: value,
    width,
    height,
    fontSize,
    margin: 8,
  });
  return svg.outerHTML;
}

/** Minimal popup for printing arbitrary HTML */
export function openPrintWindow(html) {
  const w = window.open("", "_blank", "width=480,height=640");
  if (!w) return;
  w.document.open();
  w.document.write(`
    <html>
      <head>
        <meta charset="utf-8"/>
        <title>Print Label</title>
        <style>
          @page { size: auto; margin: 8mm; } /* adjust when you create a label preset */
          body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
          .label { display:flex; align-items:center; justify-content:center; height:100%; }
          .wrap { text-align:center; }
          .caption { font-size:12px; margin-bottom:6px; }
        </style>
      </head>
      <body>
        <div class="label"><div class="wrap">${html}</div></div>
        <script>window.onload = () => setTimeout(() => { window.print(); window.close(); }, 250);</script>
      </body>
    </html>
  `);
  w.document.close();
}

/** Browser-print flow (works with any printer) */
export async function printLabelBrowser(boxId) {
  const svg = barcodeSvgString(boxId, { width: 2, height: 60, fontSize: 12 });
  const html = `<div class="caption">BOX ID</div>${svg}`;
  openPrintWindow(html);
}

/** Facade: choose the right method */
export async function printBoxLabel(boxId) {
  const mode = getPrinterMode(); // "browser" by default
  if (mode === "browser") {
    return printLabelBrowser(boxId);
  }
  // QZ path will be added later; we keep API stable
  return printLabelBrowser(boxId);
}
