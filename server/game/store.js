import { applyMiddleware, createStore } from 'redux';
import createNodeLogger from 'redux-node-logger'
import { createEpicMiddleware } from 'redux-observable';
import epic from './epics';
import reducers from './reducers';
import type { Store } from '../../client/src/types/framework';

const store: Store = createStore(
    reducers,
    applyMiddleware(createNodeLogger({ }), createEpicMiddleware(epic))
);

export default store;
