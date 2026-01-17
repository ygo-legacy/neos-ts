import { LoadingOutlined, LockOutlined } from "@ant-design/icons";
import { App, Tooltip } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";

import { useConfig } from "@/config";
import { accountStore } from "@/stores";
import { IconFont, ScrollableArea } from "@/ui/Shared";
import { matchmakingStore } from "@/api/legacy/matchmaking";

import { connectSrvpro } from "../../util";
import styles from "../../index.module.scss";

const { servers: serverList } = useConfig();

export const IAMode: React.FC = () => {
    const { message } = App.useApp();
    const { t: i18n } = useTranslation("Match");
    const user = accountStore.user;
    const matchmaking = useSnapshot(matchmakingStore);
    const [loading, setLoading] = useState(false);
    const server = `${serverList[0].ip}:${serverList[0].port}`;

    // Bloquear si está en cola de ranked
    const isBlocked = matchmaking.inQueue;

    const onAIMatch = async () => {
        if (isBlocked) {
            message.warning(i18n("LeaveQueueFirst", "Primero sal de la cola de ranked"));
            return;
        }

        setLoading(true);
        try {
            await connectSrvpro({
                ip: server,
                player: user?.username ?? "Guest",
                passWd: "AI",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Tooltip title={isBlocked ? i18n("InQueueTooltip", "Estás buscando rival en ranked") : ""}>
            <div
                className={`${styles.mode} ${isBlocked ? styles.modeDisabled : ""}`}
                onClick={onAIMatch}
                style={{ opacity: isBlocked ? 0.5 : 1, cursor: isBlocked ? "not-allowed" : "pointer" }}
            >
                <ScrollableArea maxHeight="15rem">
                    <div className={styles.icon}>
                        {loading ? (
                            <LoadingOutlined />
                        ) : isBlocked ? (
                            <LockOutlined style={{ fontSize: 24 }} />
                        ) : (
                            <IconFont type="icon-chip" size={26} />
                        )}
                    </div>
                    <div className={styles.title}>{i18n("SinglePlayerTitle", "Un Jugador")}</div>
                    <div className={styles.desc}>
                        {isBlocked
                            ? i18n("BlockedByRanked", "Sal de la cola de ranked primero")
                            : i18n("SinglePlayerDesc", "Inicia un duelo contra la IA para probar tu mazo o practicar estrategias.")
                        }
                    </div>
                </ScrollableArea>
            </div>
        </Tooltip>
    );
};
