const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) { 
      results.push(file);
    }
  });
  return results;
}

const srcDir = path.join(process.cwd(), 'src');
const files = walk(srcDir);

const folderNameMappings = [
  { oldBare: 'delivery', newBare: 'delivery' },
  { oldBare: 'purchase order', newBare: 'purchase-order' },
  { oldBare: 'purchase requisition', newBare: 'purchase-requisition' },
  { oldBare: 'purhcase receipt', newBare: 'purchase-receipt' },
  { oldBare: 'sale allocation', newBare: 'sale-allocation' },
  { oldBare: 'sale allocation requisition', newBare: 'sale-allocation-requisition' },
  { oldBare: 'purchase invoice', newBare: 'purchase-invoice' },
  { oldBare: 'sale invoice', newBare: 'sale-invoice' },
  { oldBare: 'sale order', newBare: 'sale-order' }
];

let changedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const initialContent = content;

  const isInsidePages = file.includes(path.join(srcDir, 'pages'));
  
  if (isInsidePages) {
     folderNameMappings.forEach(mapping => {
        content = content.replace(new RegExp("from '(?:\\.\\./)+" + mapping.oldBare + "(/.*)?'", 'g'), "from '../" + mapping.newBare + "$1'");
        content = content.replace(new RegExp("import\\('(?:\\.\\./)+" + mapping.oldBare + "(/.*)?'\\)", 'g'), "import('../" + mapping.newBare + "$1')");
     });

     const genericSrcEntities = ['components', 'utils', 'hooks', 'routes', 'theme', 'styles', 'assets', 'catalogueFilters', 'formLayoutRegistry', 'purchaseRequisitionCatalogueData'];
     genericSrcEntities.forEach(entity => {
        content = content.replace(new RegExp("from '\\.\\./" + entity, 'g'), "from '../../" + entity);
        content = content.replace(new RegExp("import\\('\\.\\./" + entity, 'g'), "import('../../" + entity);
     });
     
  } else {
     folderNameMappings.forEach(mapping => {
        content = content.replace(new RegExp("from '\\.\\./" + mapping.oldBare, 'g'), "from '../pages/" + mapping.newBare);
        content = content.replace(new RegExp("import\\('\\.\\./" + mapping.oldBare, 'g'), "import('../pages/" + mapping.newBare);
        
        content = content.replace(new RegExp("from '\\./" + mapping.oldBare, 'g'), "from './pages/" + mapping.newBare);
        content = content.replace(new RegExp("import\\('\\./" + mapping.oldBare, 'g'), "import('./pages/" + mapping.newBare);
     });
  }

  content = content.replace(/purhcase/g, 'purchase');
  content = content.replace(/Purhcase/g, 'Purchase');

  if (content !== initialContent) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
  }
}
console.log('Fixed imports in', changedCount, 'files.');
