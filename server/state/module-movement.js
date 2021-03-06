// @flow

import 'rxjs';
import { combineEpics } from 'redux-observable';
import loop from '../shared/loop';
import { replacePlayerProps } from "./helpers";
import { getPlayerById, getRules } from "./module-game";

import type { State as FullState, ActionInterface } from './types';
import type { Store } from '../../client/src/types/framework';
import type {
    Player, Direction, Rules,
    PlayerId
} from '../../client/src/types/game';

const calculateMovement = (
    startX: number, startY: number, startTime: number, endTime: number, rules: Rules, direction: Direction
) => {
    const { moveTime, moveDistance } = rules;
    const deltaTime = endTime - startTime;
    const distance = Math.round(deltaTime/moveTime * moveDistance);
    const newX = direction === 'right'
        ? startX + distance
        : direction === 'left'
            ? startX - distance
            : startX;

    const newY = direction === 'down'
        ? startY + distance
        : direction === 'up'
            ? startY - distance
            : startY;

    return { x: newX, y: newY }
};

const canMove = (player: Player, direction: Direction, rules: Rules): boolean => {
    const { moveDistance, worldWidth, worldHeight } = rules;
    const { x, y } = player;
    return (direction === 'left' && x - moveDistance >= 0) ||
        (direction === 'right' && x + moveDistance < worldWidth) ||
        (direction === 'up' && y - moveDistance >= 0) ||
        (direction === 'down' && y + moveDistance < worldHeight);
};

// actions
// export const doThing = (): ActionType => ({
//      type: 'THING_DONE',
//      origin: 'client',
//      data: {}
// });

// reducer
export const reducer = (state: FullState, action: ActionInterface): FullState => {
    switch (action.type) {
        case 'MOVE_STARTED': {
            const { data: { direction, playerId } } = action;
            return replacePlayerProps(state, playerId, {
                direction,
                isMoving: true,
            });
        }

        case 'MOVE_STOPPED': {
            const { data: { direction, playerId } } = action;
            return replacePlayerProps(state, playerId, {
                direction,
                isMoving: false,
            });
        }

        case 'MOVE_TO': {
            const { data: { direction, playerId, x, y } } = action;
            return replacePlayerProps(state, playerId, {
                direction,
                x,
                y,
            });
        }

        default:
            return state;
    }
};

// selectors

// epics
const moves = (action$, store: Store) => action$
    .ofType('MOVE_STARTED')
    .map(({ data: { direction, playerId } }) => ({
        direction,
        playerId,
        player: getPlayerById(store.getState(), playerId)
    }))
    .filter(({ player }) => player)
    .flatMap(({ direction, player, playerId }: { direction: Direction, player: Player, playerId: PlayerId }) => {
        const startTime = Number(Date.now());
        const { x: startX, y: startY } = player;
        return loop
            .map(() => getPlayerById(store.getState(), player.id))
            .filter(player => player)
            .map(player => {
                const state = store.getState();
                const rules = getRules(state);
                const endTime = Number(Date.now());
                const { x, y } = calculateMovement(startX, startY, startTime, endTime, rules, direction);
                return canMove(player, direction, rules) ? {
                    type: 'MOVE_TO',
                    sendToClient: false,
                    toAll: false,
                    data: {
                        direction,
                        playerId,
                        x,
                        y,
                    }
                } : {
                    type: 'MOVE_STOPPED',
                    origin: 'server',
                    sendToClient: true,
                    toAll: true,
                    data: {
                        playerId,
                        direction,
                        x: player.x,
                        y: player.y,
                    },
                };
            })
            .takeUntil(action$
                .filter(({type, data: {direction: stopDirection, playerId: stopPlayerId}}) =>
                    (type === 'MOVE_STOPPED' &&
                        stopDirection === direction && playerId === stopPlayerId) ||
                    (type === 'DISCONNECTION_REQUESTED' && playerId === stopPlayerId)
                )
            )
    });

const moveStarts = (action$, store: Store) => action$
    .ofType('MOVE_START_REQUESTED')
    .map(({ data: { direction, playerId } }) => ({
        direction,
        playerId,
        player: getPlayerById(store.getState(), playerId)
    }))
    .filter(({ player }) => player)
    .flatMap(({ direction, player, playerId }: { direction: Direction, player: Player, playerId: PlayerId }) => {
        // stop any current movement
        return [{
            type: 'MOVE_STOPPED',
            origin: 'server',
            sendToClient: true,
            toAll: true,
            data: {
                playerId,
                direction: player.direction,
            },
        }, {
            type: 'MOVE_STARTED',
            origin: 'server',
            sendToClient: true,
            toAll: true,
            data: {
                playerId,
                direction,
                x: player.x,
                y: player.y,
            },
        }];
    });


const moveStops = (action$, store: Store) => action$
    .ofType('MOVE_STOP_REQUESTED')
    .map(({ data: { direction, playerId } }) => ({
        direction,
        playerId,
        player: getPlayerById(store.getState(), playerId)
    }))
    .filter(({ player }) => player)
    .map(({ player, direction, playerId }) => {
        return {
            type: 'MOVE_STOPPED',
            origin: 'server',
            sendToClient: true,
            toAll: true,
            data: {
                playerId,
                direction,
                x: player.x,
                y: player.y,
            },
        };
    });

// todo: or just loop every 1000ms and send all the player x/y which have moved since the last iteration using lastMove
const moveSyncs = (action$, store: Store) => action$
    .ofType('MOVE_TO')
    .groupBy(payload => payload.data.playerId)
    .flatMap(group => group
        .throttleTime(store.getState().rules.syncTime)
        .map(payload => {
            const { direction, playerId, x, y, step } = payload.data;
            return {
                data: {
                    direction,
                    playerId,
                    x,
                    y,
                    step,
                },
                type: 'MOVE_SYNC',
                origin: 'server',
                sendToClient: true,
                toAll: true,
            };
        })
    );

export const epic = combineEpics(
    moves,
    moveStarts,
    moveStops,
    moveSyncs,
);
