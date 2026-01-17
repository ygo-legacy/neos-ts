import { LoadingOutlined, TeamOutlined, ClockCircleOutlined, LockOutlined } from "@ant-design/icons";
import { App, Badge, Spin, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";

import { accountStore, roomStore } from "@/stores";
import { IconFont, ScrollableArea } from "@/ui/Shared";

import { matchmakingClient, matchmakingStore, canPlayRanked } from "@/api/legacy/matchmaking";
import { connectSrvpro } from "../../util";
import styles from "../../index.module.scss";

export const RankedMode: React.FC = () => {
    const { message } = App.useApp();
    const { t: i18n } = useTranslation("Match");
    const navigate = useNavigate();
    const user = accountStore.user;
    const { joined } = useSnapshot(roomStore);
    const matchmaking = useSnapshot(matchmakingStore);
    const [connecting, setConnecting] = useState(false);
    const [searchTime, setSearchTime] = useState(0);

    // Connect to matchmaking service when component mounts
    useEffect(() => {
        if (user?.token && !matchmaking.connected) {
            matchmakingClient.connect(user.token);
        }

        return () => {
            // Leave queue on unmount
            if (matchmaking.inQueue) {
                matchmakingClient.leaveQueue();
            }
        };
    }, [user?.token]);

    // Update search time counter
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (matchmaking.inQueue && matchmaking.searchStartTime) {
            interval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - matchmaking.searchStartTime!) / 1000);
                setSearchTime(elapsed);
            }, 1000);
        } else {
            setSearchTime(0);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [matchmaking.inQueue, matchmaking.searchStartTime]);

    // Handle search timeout
    useEffect(() => {
        if (matchmaking.searchTimeoutExpired) {
            message.warning(i18n("NoOpponentsFound", "No se encontraron rivales. Intenta de nuevo más tarde."));
            // Reset timeout state
            matchmakingStore.searchTimeoutExpired = false;
        }
    }, [matchmaking.searchTimeoutExpired]);

    // Handle match found
    useEffect(() => {
        if (matchmaking.matchFound) {
            const match = matchmaking.matchFound;
            message.success(`${i18n("MatchFound", "¡Match encontrado!")} vs ${match.opponent}`);

            // Connect to ygopro server with the match info
            setConnecting(true);
            connectSrvpro({
                ip: `${match.serverAddress}:${match.serverPort}`,
                player: user?.username ?? "Guest",
                passWd: match.roomPassword,
            }).finally(() => {
                setConnecting(false);
                // Clear match found state
                matchmakingStore.matchFound = null;
            });
        }
    }, [matchmaking.matchFound]);

    // Navigate to waitroom when joined
    useEffect(() => {
        if (joined) {
            navigate("/waitroom");
        }
    }, [joined]);

    const hasEnoughPlayers = canPlayRanked();
    const isDisabled = !hasEnoughPlayers || !user?.token;
    const isLoading = matchmaking.inQueue || connecting;

    const onRankedClick = () => {
        if (!user || !user.token) {
            message.error(i18n("PleaseLoginFirst", "Por favor, inicia sesión primero"));
            return;
        }

        if (!hasEnoughPlayers) {
            message.warning(i18n("NotEnoughPlayers", "No hay suficientes jugadores online"));
            return;
        }

        if (!matchmaking.connected) {
            message.info(i18n("MatchmakingConnecting", "Conectando al servicio de matchmaking..."));
            matchmakingClient.connect(user.token);
            return;
        }

        if (matchmaking.inQueue) {
            // Leave queue
            matchmakingClient.leaveQueue();
            message.info(i18n("LeftQueue", "Has salido de la cola"));
        } else {
            // Join queue
            matchmakingClient.joinQueue();
            message.info(i18n("JoinedQueue", "Buscando oponente..."));
        }
    };

    const renderDescription = () => {
        if (!matchmaking.connected) {
            return i18n("ConnectingToMatchmaking", "Conectando...");
        }

        if (!hasEnoughPlayers && !isLoading) {
            return (
                <>
                    <LockOutlined style={{ marginRight: 4 }} />
                    {i18n("WaitingForPlayers", "Esperando más jugadores...")}
                </>
            );
        }

        if (matchmaking.inQueue) {
            return (
                <>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {i18n("SearchingOpponent", "Buscando oponente...")} ({searchTime}s)
                    <br />
                    <span style={{ fontSize: "0.8em", opacity: 0.7 }}>
                        {i18n("ClickToCancel", "Clic para cancelar")}
                    </span>
                </>
            );
        }

        return i18n("RankedDesc", "Combate competitivo contra otros jugadores online. Sistema de matchmaking con ranking.");
    };

    return (
        <Tooltip title={isDisabled && !isLoading ? i18n("RankedDisabledTooltip", "Necesitas al menos 2 jugadores online") : ""}>
            <div
                className={`${styles.mode} ${isDisabled && !isLoading ? styles.modeDisabled : ""}`}
                onClick={isDisabled && !isLoading ? undefined : onRankedClick}
                style={{ opacity: isDisabled && !isLoading ? 0.5 : 1, cursor: isDisabled && !isLoading ? "not-allowed" : "pointer" }}
            >
                <ScrollableArea maxHeight="15rem">
                    <div className={styles.icon}>
                        {isLoading ? (
                            <Spin indicator={<LoadingOutlined spin />} />
                        ) : isDisabled ? (
                            <LockOutlined style={{ fontSize: 32 }} />
                        ) : (
                            <IconFont type="icon-battle" size={32} />
                        )}
                    </div>
                    <div className={styles.title}>
                        {i18n("RankedTitle", "Ranked")}
                        {matchmaking.connected && (
                            <Badge
                                status={hasEnoughPlayers ? "success" : "warning"}
                                style={{ marginLeft: 8 }}
                                title={hasEnoughPlayers ? i18n("Ready", "Listo") : i18n("WaitingPlayers", "Esperando jugadores")}
                            />
                        )}
                    </div>
                    <div className={styles.desc}>
                        {renderDescription()}
                    </div>
                    {matchmaking.connected && matchmaking.onlineUsers.length > 0 && (
                        <div style={{ marginTop: 8, fontSize: "0.85em", opacity: 0.8 }}>
                            <TeamOutlined style={{ marginRight: 4 }} />
                            {matchmaking.onlineUsers.length} {i18n("OnlineNow", "online")}
                        </div>
                    )}
                </ScrollableArea>
            </div>
        </Tooltip>
    );
};
