import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(path, 'utf8');
const shared = read('src/utils/printEstalioReport.js');
assert.match(shared, /@page\{size:A4/);
assert.match(shared, /escapeHtml/);
assert.match(shared, /print-color-adjust/);
for (const path of ['expenses', 'inventory-management', 'revenues-and-reports']) {
  const source = read(`src/pages/${path}/index.jsx`);
  assert.match(source, /printEstalioReport/);
  assert.match(source, /iconName="Printer"/);
  assert.match(source, /onClick=\{handlePrint\}/);
}
assert.match(read('src/pages/inventory-management/index.jsx'), /rows: filteredItems/);
assert.match(read('src/pages/revenues-and-reports/index.jsx'), /dateRange\.start/);
console.log('Print integration static checks passed.');
