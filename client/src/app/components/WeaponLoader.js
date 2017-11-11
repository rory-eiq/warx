// @flow

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import type { Connector } from 'react-redux';
import type { State } from '../types/game';
import styles from '../../lib/styled/styles'; // todo nah
import LoadingBarSprite from '../../lib/styled/LoadingBarSprite';

type Props = {
    reloadTime: number,
    weaponLoaded: boolean,
};

type HudState = {
    loading: boolean,
};

const connector: Connector<{}, Props> = connect(
    ({ currentPlayerId, players, rules } : State) => ({
        weaponLoaded: Boolean(players[currentPlayerId] && players[currentPlayerId].weaponLoaded),
        reloadTime: rules.reloadTime,
    })
);

const transitionDownTime = 50;

class Hud extends PureComponent<Props, HudState> {

    state = {
        loading: false,
    };

    componentWillReceiveProps({ weaponLoaded: nextWeaponLoaded }) {
        const { weaponLoaded } = this.props;
        if(weaponLoaded === true && nextWeaponLoaded === false) {
            // when the weaponLoaded goes from true to false, start the loader after downtime seconds
            setTimeout(() => this.setState({ loading: true }), transitionDownTime);
        }else if(weaponLoaded === false && nextWeaponLoaded === true) {
            // when the weaponLoaded goes from false to true, stop the loader
            this.setState({ loading: false });
        }
    }

    render() {
        const { weaponLoaded, reloadTime } = this.props;
        const { loading } = this.state;
        // todo: this is buggy, sometimes the load bar only goes half way
        return (
            <LoadingBarSprite
                color={styles.shotRed}
                percentage={loading || weaponLoaded ? 100 : 0}
                loadTime={weaponLoaded ? 0 : loading ? (reloadTime - transitionDownTime)/1000 : transitionDownTime/1000}
            />
        )
    }
}

export default connector(Hud);