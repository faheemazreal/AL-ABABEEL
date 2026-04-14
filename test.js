import fs from 'fs';
import('./server/index.js').catch(e => {
    fs.writeFileSync('errorDetails.json', JSON.stringify({ message: e.message, code: e.code, stack: e.stack }, null, 2));
});
