// @flow

import 'rxjs';
import { Observable } from 'rxjs/Observable';
import { combineEpics } from 'redux-observable';
import { createKeyHandlerEpic } from "./module-game";
import { sendAction } from '../socket';
import type { ActionInterface, ActionOrigin } from '../types/framework';
import type { State, PlayerId, Direction } from '../types/game';

// types
type MoveToAction = {
    +type: 'MOVE_TO',
    +origin: ActionOrigin,
    +data: {
        +playerId: PlayerId,
        +direction: Direction,
        +x: number,
        +y: number,
    }
};

type MoveSyncsAction = {
    +type: 'MOVE_SYNCS',
    +origin: ActionOrigin,
    +data: {
        [playerId: PlayerId]: {
            +direction: Direction,
            +x: number,
            +y: number,
        }
    }
};

type MoveStoppedAction = {
    +type: 'MOVE_STOPPED',
    +origin: ActionOrigin,
    +data: {
        +playerId: PlayerId,
        +x: number,
        +y: number,
    }
};

type Action = MoveToAction | MoveSyncsAction | MoveStoppedAction;

// actions
// to be used from the UI
export const selfMoveStart = ({ direction } : { direction: Direction }): ActionInterface => ({
    type: 'SELF_MOVE_STARTED',
    origin: 'client',
    data: {
        direction
    }
});

export const selfMoveStop = ({ direction } : { direction: Direction }): ActionInterface => ({
    type: 'SELF_MOVE_STOPPED',
    origin: 'client',
    data: {
        direction
    }
});

// to send to server
export const moveStartToServer = ({ direction }: { direction: Direction }): ActionInterface => ({
    type: 'MOVE_START_REQUESTED',
    data: {
        direction
    }
});

// to send to server
export const moveStopToServer = ({ direction }: { direction: Direction }): ActionInterface => ({
    type: 'MOVE_STOP_REQUESTED',
    data: {
        direction
    }
});

// reducer
export const reducer = (state: State, action: Action): State => {
    const {players} = state;
    switch (action.type) {
        case 'MOVE_TO': {
            const { data: { direction, playerId, x, y }} = action;
            const player = players[playerId];
            if (!player) return state;
            return {
                ...state,
                players: {
                    ...players,
                    [playerId]: {
                        ...player,
                        direction,
                        x,
                        y,
                    },
                },
            };
        }

        case 'MOVE_SYNCS': {
            const { data: moves } = action;
            if (!moves) return state;

            const oldPlayers = state.players;
            const replacePlayers = Object
                .entries(moves)
                .reduce((acc, [id, move]) => ({
                    ...acc,
                    [id]: { ...players[id], ...move }
                }), oldPlayers);

            return {
                ...state,
                players: replacePlayers,
            };
        }

        case 'MOVE_STOPPED': {
            const {data: {playerId, x, y,}} = action;
            const player = players[playerId];
            if (!player) return state;
            return {
                ...state,
                players: {
                    ...players,
                    [playerId]: {
                        ...player,
                        x,
                        y,
                    }
                },
            };
        }

        default:
            return state;
    }
};

// epics
const keyDownMoves = createKeyHandlerEpic({
    ArrowLeft: () => selfMoveStart({ direction: 'left' }),
    ArrowUp: () => selfMoveStart({ direction: 'up' }),
    ArrowRight: () => selfMoveStart({ direction: 'right' }),
    ArrowDown: () => selfMoveStart({ direction: 'down' }),
}, true);

const keyUpMoves = createKeyHandlerEpic({
    ArrowLeft: () => selfMoveStop({ direction: 'left' }),
    ArrowUp: () => selfMoveStop({ direction: 'up' }),
    ArrowRight: () => selfMoveStop({ direction: 'right' }),
    ArrowDown: () => selfMoveStop({ direction: 'down' }),
}, false);

const selfStartMoves = (action$) => action$
    .ofType('SELF_MOVE_STARTED')
    .do(({ data: { direction }}) => sendAction(moveStartToServer({ direction })))
    .ignoreElements();

const selfStopMoves = (action$: Observable<ActionInterface>) => action$
    .ofType('SELF_MOVE_STOPPED')
    .do(({ data: { direction }}) => sendAction(moveStopToServer({ direction })))
    .ignoreElements();

export const epic = combineEpics(
    keyDownMoves,
    keyUpMoves,
    selfStartMoves,
    selfStopMoves,
);
