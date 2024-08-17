import Vivia from '../vivia.js';

const vivia = new Vivia(process.cwd());
await vivia.init();
await vivia.render();
console.log('done');
