# html-pdf-client

html-pdf-client converts any webpage or element into a printable PDF entirely client-side using [html2canvas](https://github.com/niklasvh/html2canvas) and [jsPDF](https://github.com/MrRio/jsPDF).

## Table of contents

- [Getting started](#getting-started)
  - [CDN](#cdn)
  - [Raw JS](#raw-js)
  - [NPM](#npm)
  - [Bower](#bower)
  - [Console](#console)
- [Usage](#usage)
  - [Advanced usage](#advanced-usage)
    - [Workflow](#workflow)
    - [Worker API](#worker-api)
- [Options](#options)
  - [Page-breaks](#page-breaks)
    - [Page-break settings](#page-break-settings)
    - [Page-break modes](#page-break-modes)
    - [Example usage](#example-usage)
  - [Image type and quality](#image-type-and-quality)
- [Progress tracking](#progress-tracking)
- [Dependencies](#dependencies)
- [Contributing](#contributing)
  - [Issues](#issues)
  - [Tests](#tests)
  - [Pull requests](#pull-requests)
- [Credits](#credits)
- [License](#license)

## Getting started

#### NPM

Install html-pdf-client and its dependencies using NPM with `npm install --save html-pdf-client` (make sure to include `.js` in the package name).

*Note: You can use NPM to create your project, but html-pdf-client **will not run in Node.js**, it must be run in a browser.*

#### Bower

Install html-pdf-client and its dependencies using Bower with `bower install --save html-pdf-client` (make sure to include `.js` in the package name).

## Usage

Once installed, html-pdf-client is ready to use. The following command will generate a PDF of `#element-to-print` and prompt the user to save the result:

```js
var element = document.getElementById('element-to-print');
htmlPdfClient(element);
```

### Advanced usage

Every step of html-pdf-client is configurable, using its new Promise-based API. If html-pdf-client is called without arguments, it will return a `Worker` object:

```js
var worker = htmlPdfClient();  // Or:  var worker = new html2pdf.Worker;
```

This worker has methods that can be chained sequentially, as each Promise resolves, and allows insertion of your own intermediate functions between steps. A prerequisite system allows you to skip over mandatory steps (like canvas creation) without any trouble:

```js
// This will implicitly create the canvas and PDF objects before saving.
var worker = htmlPdfClient().from(element).save();
```

#### Workflow

The basic workflow of html-pdf-client tasks (enforced by the prereq system) is:

```
.from() -> .toContainer() -> .toCanvas() -> .toImg() -> .toPdf() -> .save()
```

#### Worker API

| Method       | Arguments          | Description |
|--------------|--------------------|-------------|
| from         | src, type          | Sets the source (HTML string or element) for the PDF. Optional `type` specifies other sources: `'string'`, `'element'`, `'canvas'`, or `'img'`. |
| to           | target             | Converts the source to the specified target (`'container'`, `'canvas'`, `'img'`, or `'pdf'`). Each target also has its own `toX` method that can be called directly: `toContainer()`, `toCanvas()`, `toImg()`, and `toPdf()`. |
| output       | type, options, src | Routes to the appropriate `outputPdf` or `outputImg` method based on specified `src` (`'pdf'` (default) or `'img'`). |
| outputPdf    | type, options      | Sends `type` and `options` to the jsPDF object's `output` method, and returns the result as a Promise (use `.then` to access). See the [jsPDF source code](https://rawgit.com/MrRio/jsPDF/master/docs/jspdf.js.html#line992) for more info. |
| outputImg    | type, options      | Returns the specified data type for the image as a Promise (use `.then` to access). Supported types: `'img'`, `'datauristring'`/`'dataurlstring'`, and `'datauri'`/`'dataurl'`. |
| save         | filename           | Saves the PDF object with the optional filename (creates user download prompt). |
| set          | opt                | Sets the specified properties. See [Options](#options) below for more details. |
| get          | key, cbk           | Returns the property specified in `key`, either as a Promise (use `.then` to access), or by calling `cbk` if provided. |
| then         | onFulfilled, onRejected | Standard Promise method, with `this` re-bound to the Worker, and with added progress-tracking (see [Progress](#progress) below). Note that `.then` returns a `Worker`, which is a subclass of Promise. |
| thenCore     | onFulFilled, onRejected | Standard Promise method, with `this` re-bound to the Worker (no progress-tracking). Note that `.thenCore` returns a `Worker`, which is a subclass of Promise. |
| thenExternal | onFulfilled, onRejected | True Promise method. Using this 'exits' the Worker chain - you will not be able to continue chaining Worker methods after `.thenExternal`. |
| catch, catchExternal | onRejected | Standard Promise method. `catchExternal` exits the Worker chain - you will not be able to continue chaining Worker methods after `.catchExternal`. |
| error        | msg                | Throws an error in the Worker's Promise chain. |

A few aliases are also provided for convenience:

| Method    | Alias     |
|-----------|-----------|
| save      | saveAs    |
| set       | using     |
| output    | export    |
| then      | run       |

## Options

html-pdf-client can be configured using an optional `opt` parameter:

```js
var element = document.getElementById('element-to-print');
var opt = {
  margin:       1,
  filename:     'myfile.pdf',
  image:        { type: 'jpeg', quality: 0.98 },
  html2canvas:  { scale: 2 },
  jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
};

// New Promise-based usage:
htmlPdfClient().set(opt).from(element).save();

// Old monolithic-style usage:
htmlPdfClient(element, opt);
```

The `opt` parameter has the following optional fields:

|Name        |Type            |Default                         |Description                                                                                                 |
|------------|----------------|--------------------------------|------------------------------------------------------------------------------------------------------------|
|margin      |number or array |`0`                             |PDF margin (in jsPDF units). Can be a single number, `[vMargin, hMargin]`, or `[top, left, bottom, right]`. |
|filename    |string          |`'file.pdf'`                    |The default filename of the exported PDF.                                                                   |
|pagebreak   |object          |`{mode: ['css', 'legacy']}`     |Controls the pagebreak behaviour on the page. See [Page-breaks](#page-breaks) below.                        |
|image       |object          |`{type: 'jpeg', quality: 0.95}` |The image type and quality used to generate the PDF. See [Image type and quality](#image-type-and-quality) below.|
|enableLinks |boolean         |`true`                          |If enabled, PDF hyperlinks are automatically added ontop of all anchor tags.                                |
|html2canvas |object          |`{ }`                           |Configuration options sent directly to `html2canvas` ([see here](https://html2canvas.hertzen.com/configuration) for usage).|
|jsPDF       |object          |`{ }`                           |Configuration options sent directly to `jsPDF` ([see here](http://rawgit.com/MrRio/jsPDF/master/docs/jsPDF.html) for usage).|

### Page-breaks

html-pdf-client has the ability to automatically add page-breaks to clean up your document. Page-breaks can be added by CSS styles, set on individual elements using selectors, or avoided from breaking inside all elements (`avoid-all` mode).

By default, html-pdf-client will respect most CSS [`break-before`](https://developer.mozilla.org/en-US/docs/Web/CSS/break-before), [`break-after`](https://developer.mozilla.org/en-US/docs/Web/CSS/break-after), and [`break-inside`](https://developer.mozilla.org/en-US/docs/Web/CSS/break-inside) rules, and also add page-breaks after any element with class `htmlPdfClient__page-break` (for legacy purposes).

#### Page-break settings

|Setting   |Type            |Default             |Description |
|----------|----------------|--------------------|------------|
|mode      |string or array |`['css', 'legacy']` |The mode(s) on which to automatically add page-breaks. One or more of `'avoid-all'`, `'css'`, and `'legacy'`. |
|before    |string or array |`[]`                |CSS selectors for which to add page-breaks before each element. Can be a specific element with an ID (`'#myID'`), all elements of a type (e.g. `'img'`), all of a class (`'.myClass'`), or even `'*'` to match every element. |
|after     |string or array |`[]`                |Like 'before', but adds a page-break immediately after the element. |
|avoid     |string or array |`[]`                |Like 'before', but avoids page-breaks on these elements. You can enable this feature on every element using the 'avoid-all' mode. |

#### Page-break modes

| Mode      | Description |
|-----------|-------------|
| avoid-all | Automatically adds page-breaks to avoid splitting any elements across pages. |
| css       | Adds page-breaks according to the CSS `break-before`, `break-after`, and `break-inside` properties. Only recognizes `always/left/right` for before/after, and `avoid` for inside. |
| legacy    | Adds page-breaks after elements with class `htmlPdfClient__page-break`. This feature may be removed in the future. |

#### Example usage

```js
// Avoid page-breaks on all elements, and add one before #page2el.
htmlPdfClient().set({
  pagebreak: { mode: 'avoid-all', before: '#page2el' }
});

// Enable all 'modes', with no explicit elements.
htmlPdfClient().set({
  pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
});

// No modes, only explicit elements.
htmlPdfClient().set({
  pagebreak: { before: '.beforeClass', after: ['#after1', '#after2'], avoid: 'img' }
});
```

### Image type and quality

You may customize the image type and quality exported from the canvas by setting the `image` option. This must be an object with the following fields:

|Name        |Type            |Default                       |Description                                                                                  |
|------------|----------------|------------------------------|---------------------------------------------------------------------------------------------|
|type        |string          |'jpeg'                        |The image type. HTMLCanvasElement only supports 'png', 'jpeg', and 'webp' (on Chrome).       |
|quality     |number          |0.95                          |The image quality, from 0 to 1. This setting is only used for jpeg/webp (not png).           |

These options are limited to the available settings for [HTMLCanvasElement.toDataURL()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL), which ignores quality settings for 'png' images. To enable png image compression, try using the [canvas-png-compression shim](https://github.com/ShyykoSerhiy/canvas-png-compression), which should be an in-place solution to enable png compression via the `quality` option.

## Progress tracking

The Worker object returned by `htmlPdfClient()` has a built-in progress-tracking mechanism. It will be updated to allow a progress callback that will be called with each update, however it is currently a work-in-progress.

## Dependencies

html-pdf-client depends on the external packages [html2canvas](https://github.com/niklasvh/html2canvas), [jsPDF](https://github.com/MrRio/jsPDF), and [es6-promise](https://github.com/stefanpenner/es6-promise). These dependencies are automatically loaded when using NPM or the bundled package.

If using the unbundled `dist/htmlPdfClient.min.js` (or its un-minified version), you must also include each dependency. Order is important, otherwise html2canvas will be overridden by jsPDF's own internal implementation:

```html
<script src="es6-promise.auto.min.js"></script>
<script src="jspdf.min.js"></script>
<script src="html2canvas.min.js"></script>
<script src="html2pdf.min.js"></script>
```

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2019-2022 Pradeep Kumar Vishwakarma [http://www.pv-dev.me](http://www.pv-dev.me)
