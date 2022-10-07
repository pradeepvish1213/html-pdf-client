import Worker from './worker.js';
import './plugin/jspdf-plugin.js';
import './plugin/pagebreaks.js';
import './plugin/hyperlinks.js';

/**
 * Generate a PDF from an HTML element or string using html2canvas and jsPDF.
 *
 * @param {Element|string} source The source element or HTML string.
 * @param {Object=} opt An object of optional settings: 'margin', 'filename',
 *    'image' ('type' and 'quality'), and 'html2canvas' / 'jspdf', which are
 *    sent as settings to their corresponding functions.
 */
var htmlPdfClient = function htmlPdfClient(src, opt) {
  // Create a new worker with the given options.
  var worker = new htmlPdfClient.Worker(opt);

  if (src) {
    // If src is specified, perform the traditional 'simple' operation.
    return worker.from(src).save();
  } else {
    // Otherwise, return the worker for new Promise-based operation.
    return worker;
  }
}
htmlPdfClient.Worker = Worker;

// Expose the htmlPdfClient function.
export default htmlPdfClient;
