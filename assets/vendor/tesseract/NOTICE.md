# Tesseract.js

Vendored unmodified runtime files for local image text recognition:

- Tesseract.js 7.0.0 (`tesseract.min.js`, `worker.min.js`): https://github.com/naptha/tesseract.js
- Tesseract.js Core 7.0.0 (`tesseract-core-lstm.wasm.js`, including its embedded WebAssembly): https://github.com/naptha/tesseract.js-core
- English integer LSTM language data, `@tesseract.js-data/eng` 1.0.0, `4.0.0_best_int`: https://github.com/naptha/tessdata

The files were obtained from their versioned npm distributions on jsDelivr. The upstream projects are licensed under the Apache License 2.0; see `LICENSE.txt`. Copyright belongs to their respective upstream contributors. Additional notices bundled with upstream distributions remain in the runtime files.

The reader loads these assets from this website. Product images are processed in the browser during text recognition.
