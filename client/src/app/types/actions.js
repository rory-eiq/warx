// @flow
import type { State, Player, PlayerId, Direction } from './game.js'

export type ActionOrigin = 'server' | 'client' | 'all';

// todo figure out subtypes or interfaces for this
export type ActionInterface = {
    +type: string,
    +origin?: ActionOrigin,
    +sendToServer?: boolean,
    +data?: any,
}

export type ReduxInitAction = {
    +type: '@@INIT',
    +origin: 'client',
};

export type SelfJoinAction = {
    +type: 'SELF_JOINED',
    +origin: 'client',
    +data: {
        +playerName: string
    }
};

export type PlayerJoinAction = {
    +type: 'PLAYER_JOINED',
    +origin: 'server',
    +data: {
        +player: Player
    }
};

export type PlayerLeftAction = {
    +type: 'PLAYER_LEFT',
    +origin: 'server',
    +data: {
        +playerId: PlayerId,
    }
};

export type MoveAction = {
    +type: 'MOVE',
    +origin: ActionOrigin,
    +data: {
        +playerId: PlayerId,
        +direction: Direction,
    }
};

// when the current client fires a shot
export type SelfShotFireAction = {
    +type: 'SELF_SHOT_FIRED',
    +origin: 'client',
};

// when the server
export type ShotFireAction = {
    +type: 'SHOT_FIRED',
    +origin: ActionOrigin,
    +data: {
        +playerId: PlayerId,
    }
};

export type ShotCoolAction = {
    +type: 'SHOT_COOLED',
    +origin: ActionOrigin,
    +data: {
        +playerId: PlayerId,
    }
};

export type WeaponReloadAction = {
    +type: 'WEAPON_RELOADED',
    +origin: ActionOrigin,
    +data: {
        +playerId: PlayerId,
    }
};

export type GameStateChangedAction = {
    +type: 'GAME_STATE_CHANGED',
    +origin: 'server',
    +data: {
        +state: State, // todo client and server state?
    }
};

export type SpawnAction = {
    +type: 'SPAWN',
    +origin: 'server',
    +data: {
        +playerId: PlayerId,
        +x: number,
        +y: number,
    }
};

export type HitAction = {
    +type: 'HIT',
    +origin: 'server',
    +data: {
        +hits: [PlayerId],
        +shooter: PlayerId,
    }
};

export type PingLatencyAction = {
    +type: 'PING_LATENCY',
    +origin: 'client',
    +data: {
        +latency: number,
    }
};

export type KeyDownAction = {
    +type: 'KEY_DOWN',
    +origin: 'client',
    +data: {
        +key: string,
    }
};

export type KeyUpAction = {
    +type: 'KEY_UP',
    +origin: 'client',
    +data: {
        +key: string,
    }
};

export type AddMessageAction = {
    +type: 'MESSAGE_ADDED',
    +origin: 'client',
    +data: {
        +message: string,
        +id: number,
    }
};

export type RemoveMessageAction = {
    +type: 'MESSAGE_CLEANUP',
    +origin: 'client',
    +data: {
        +id: number,
    }
};
export type AddExplosionAction = {
    +type: 'EXPLOSION_ADDED',
    +origin: 'client',
    +data: {
        +id: number,
        +x: number,
        +y: number,
        +size: number,
    }
};

export type RemoveExplosionAction = {
    +type: 'EXPLOSION_REMOVED',
    +origin: 'client',
    +data: {
        +id: number,
    }
};

export type Action = ReduxInitAction | SelfJoinAction | PlayerJoinAction | PlayerLeftAction | MoveAction |
    ShotFireAction | ShotCoolAction | GameStateChangedAction | GameStateChangedAction | SpawnAction |
    WeaponReloadAction | HitAction | PingLatencyAction | KeyDownAction | KeyUpAction | AddMessageAction |
    RemoveMessageAction | AddExplosionAction | RemoveExplosionAction;
