import 'rxjs';
import loop from '../shared/loop';
import type { Store } from '../types/framework';
import { sendAction } from '../socket';
import { selfMoveStart, selfMoveStop, selfShotFire, moveStartToServer, moveStopToServer, move } from './actions';
import { canMove, calculateMovement } from "./move-helpers";
import { getRules } from "./selectors";
import { getPlayerById } from "./selectors";

export const keyDownActionMap = {
    ArrowLeft: () => selfMoveStart({ direction: 'left' }),
    ArrowUp: () => selfMoveStart({ direction: 'up' }),
    ArrowRight: () => selfMoveStart({ direction: 'right' }),
    ArrowDown: () => selfMoveStart({ direction: 'down' }),
    ' ': () => selfShotFire(), // todo: move to shot-epics.js
};

export const keyDownMoves = (action$) => action$
    .ofType('KEY_DOWN')
    .filter(({ data: { key } }) => keyDownActionMap[key])
    .map(({ data: { key: downKey } }) => keyDownActionMap[downKey]());

export const keyUpActionMap = {
    ArrowLeft: () => selfMoveStop({ direction: 'left' }),
    ArrowUp: () => selfMoveStop({ direction: 'up' }),
    ArrowRight: () => selfMoveStop({ direction: 'right' }),
    ArrowDown: () => selfMoveStop({ direction: 'down' }),
};

export const keyUpMoves = (action$) => action$
    .ofType('KEY_UP')
    .filter(({ data: { key } }) => keyUpActionMap[key])
    .map(({ data: { key: downKey } }) => keyUpActionMap[downKey]());

export const selfStartMoves = (action$) => action$
    .ofType('SELF_MOVE_STARTED')
    .do(({ data: { direction }}) => sendAction(moveStartToServer({ direction })))
    .ignoreElements();

export const selfStopMoves = (action$) => action$
    .ofType('SELF_MOVE_STOPPED')
    .do(({ data: { direction }}) => sendAction(moveStopToServer({ direction })))
    .ignoreElements();

export const moveStarts = (action$, store: Store) => action$
    .ofType('MOVE_STARTED')
    .switchMap(({ data: { direction, playerId } }) => {
        const startTime = Number(Date.now());
        const player = getPlayerById(store.getState(), playerId);
        const { x: startX, y: startY } = player;
        return loop
            .filter(() => {
                const { rules, players } = store.getState();
                const player = players[playerId]; // todo use selector function for getting players?
                return player && canMove(player, direction, rules);
            })
            .map(() => {
                const endTime = Number(Date.now());
                const rules = getRules(store.getState());
                const { x, y } = calculateMovement(startX, startY, startTime, endTime, rules, direction);
                return {
                    type: 'MOVE_TO',
                    origin: 'client',
                    data: {
                        direction,
                        playerId,
                        x,
                        y,
                    }
                };
            })
            .takeUntil(
                action$
                    .ofType('MOVE_STOPPED')
                    .filter(({ type, data: { direction: stopDirection, playerId: stopPlayerId } }) =>
                        stopDirection === direction && playerId === stopPlayerId
                    )
            );

    });
