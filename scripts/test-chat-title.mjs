import { heuristicTitle, shouldRegenerateTitle, normalizeModelTitle, buildTitleRequestPayload } from "../src/utils/chatTitle.js";

const convo1 = [
  { role: 'assistant', content: 'Hi, how can I help?' },
  { role: 'user', content: 'How do I bake sourdough bread at home?' },
  { role: 'assistant', content: 'Here is a recipe...' },
  { role: 'user', content: 'Any tips for starter feeding?' },
];

console.log('Heuristic title 1:', heuristicTitle(convo1));

const convo2 = [
  ...convo1,
  { role: 'assistant', content: 'Here are feeding tips...' },
  { role: 'user', content: 'Switching topics: plan a trip to Japan for 7 days' }
];

console.log('Drift (should be true):', shouldRegenerateTitle(convo2, 'Sourdough Bread Recipe Guide'));

console.log('Normalized:', normalizeModelTitle('  "python code debugging help"  '));

console.log('Payload sample length:', buildTitleRequestPayload(convo2).length);
