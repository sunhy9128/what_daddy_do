const XLSX = require('xlsx');
const path = '/Users/mac/Downloads/WHO_0-3岁儿童生长标准百分位值_豆包AI生成.xlsx';
const wb = XLSX.readFile(path);

wb.SheetNames.forEach(name => {
  console.log(`\n========== Sheet: ${name} ==========`);
  const ws = wb.Sheets[name];
  const range = XLSX.utils.decode_range(ws['!ref']);
  
  // Print ALL rows
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row = {};
    let hasData = false;
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const val = ws[addr]?.v;
      if (val !== undefined) {
        row[addr] = val;
        hasData = true;
      }
    }
    if (hasData) {
      console.log(`Row${r}:`, JSON.stringify(row));
    }
  }
});
