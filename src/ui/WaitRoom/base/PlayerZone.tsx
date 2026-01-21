import { CheckCircleFilled } from "@ant-design/icons";
import { Avatar, Skeleton } from "antd";
import classNames from "classnames";
import React from "react";

import { useConfig } from "@/config";
import { Player } from "@/stores";
import { ygopro } from "@/api";
import PlayerState = ygopro.StocHsPlayerChange.State;

import styles from "../index.module.scss";

const NeosConfig = useConfig();

export enum Who {
    Me = "me",
    Op = "op",
}

export interface PlayerZoneProps {
    btn?: React.ReactNode;
    who: Who;
    player?: Player;
    avatar?: string;
    ready: boolean;
}

/**
 * PlayerZone - Displays a player slot in the wait room
 * Reusable component for showing player avatar, name, and ready state
 */
export const PlayerZone: React.FC<PlayerZoneProps> = ({
    btn,
    who,
    player,
    avatar,
    ready
}) => {
    return (
        <div
            className={classNames(styles["side-box"], styles[who], {
                [styles.ready]: ready,
            })}
        >
            <div className={styles.inner}></div>
            <div style={{ position: "relative" }}>
                <Avatar
                    src={
                        avatar && player
                            ? avatar
                            : player && player.state !== PlayerState.LEAVE
                                ? `${NeosConfig.assetsPath}/default-avatar.png`
                                : ""
                    }
                    size={48}
                />
                {player?.state === PlayerState.READY && (
                    <CheckCircleFilled className={styles.check} />
                )}
            </div>
            <div className={styles.name}>
                {player && player.state !== PlayerState.LEAVE ? (
                    player.name
                ) : (
                    <Skeleton.Input size="small" />
                )}
            </div>
            {btn}
        </div>
    );
};
