import { BulbOutlined, LockOutlined } from "@ant-design/icons";
import { App, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";

import {
    getCreateRoomPasswd,
    getJoinRoomPasswd,
    getPrivateRoomID,
} from "@/api";
import { useConfig } from "@/config";
import { accountStore } from "@/stores";
import { ScrollableArea } from "@/ui/Shared";
import { matchmakingStore } from "@/api/legacy/matchmaking";

import {
    CustomRoomContent,
    CustomRoomFooter,
    mcCustomRoomStore,
} from "../../CustomRoomContent";
import { connectSrvpro } from "../../util";
import styles from "../../index.module.scss";

const { servers: serverList } = useConfig();

export const PrivateMode: React.FC = () => {
    const { message, modal } = App.useApp();
    const { t: i18n } = useTranslation("Match");
    const user = accountStore.user;
    const matchmaking = useSnapshot(matchmakingStore);

    // Bloquear si está en cola de ranked
    const isBlocked = matchmaking.inQueue;

    // Crear sala privada MC
    const onCreateRoom = async () => {
        if (user) {
            const mcServer = serverList.find(
                (server) => server.name === "mycard-custom"
            );
            if (mcServer) {
                const passWd = getCreateRoomPasswd(
                    mcCustomRoomStore.options,
                    String(getPrivateRoomID(user.external_id)),
                    user.external_id,
                    true
                );
                await connectSrvpro({
                    ip: mcServer.ip + ":" + mcServer.port,
                    player: user.username,
                    passWd,
                });
            }
        }
    };

    // Unirse a sala privada MC
    const onJoinRoom = async () => {
        if (user) {
            if (mcCustomRoomStore.friendPrivateID !== undefined) {
                const mcServer = serverList.find(
                    (server) => server.name === "mycard-custom"
                );
                if (mcServer) {
                    const passWd = getJoinRoomPasswd(
                        String(mcCustomRoomStore.friendPrivateID),
                        user.external_id,
                        true
                    );
                    await connectSrvpro({
                        ip: mcServer.ip + ":" + mcServer.port,
                        player: user.username,
                        passWd,
                    });
                }
            } else {
                message.error(i18n("EnterFriendPassword", "Ingresa la contraseña de tu amigo"));
            }
        }
    };

    const onPrivateRoom = () => {
        if (isBlocked) {
            message.warning(i18n("LeaveQueueFirst", "Primero sal de la cola de ranked"));
            return;
        }

        if (!user) {
            message.error(i18n("PleaseLoginFirst", "Por favor, inicia sesión primero"));
            return;
        }

        modal.info({
            icon: null,
            centered: true,
            maskClosable: true,
            content: <CustomRoomContent />,
            footer: (
                <CustomRoomFooter onCreateRoom={onCreateRoom} onJoinRoom={onJoinRoom} />
            ),
        });
    };

    return (
        <Tooltip title={isBlocked ? i18n("InQueueTooltip", "Estás buscando rival en ranked") : ""}>
            <div
                className={`${styles.mode} ${isBlocked ? styles.modeDisabled : ""}`}
                onClick={onPrivateRoom}
                style={{ opacity: isBlocked ? 0.5 : 1, cursor: isBlocked ? "not-allowed" : "pointer" }}
            >
                <ScrollableArea maxHeight="15rem">
                    <div className={styles.icon}>
                        {isBlocked ? (
                            <LockOutlined style={{ fontSize: 24 }} />
                        ) : (
                            <BulbOutlined />
                        )}
                    </div>
                    <div className={styles.title}>{i18n("PrivateRoomTitle", "Sala Privada")}</div>
                    <div className={styles.desc}>
                        {isBlocked
                            ? i18n("BlockedByRanked", "Sal de la cola de ranked primero")
                            : i18n("PrivateRoomDesc", "Crea o únete a una sala privada para jugar con amigos.")
                        }
                    </div>
                </ScrollableArea>
            </div>
        </Tooltip>
    );
};
