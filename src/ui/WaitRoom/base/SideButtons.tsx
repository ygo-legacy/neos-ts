import { Button } from "antd";
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { getUIContainer } from "@/container/compat";
import { closeSocket } from "@/middleware/socket";
import { resetUniverse } from "@/stores";
import { IconFont } from "@/ui/Shared";

import styles from "../index.module.scss";

export interface SideButtonsProps {
    switchCollapse: () => void;
    collapsed: boolean;
}

/**
 * SideButtons - Navigation buttons for the wait room sidebar
 * Includes Leave Room and Collapse/Expand buttons
 */
export const SideButtons: React.FC<SideButtonsProps> = ({
    switchCollapse,
    collapsed
}) => {
    const navigate = useNavigate();
    const { t: i18n } = useTranslation("WaitRoom");

    return (
        <div className={styles["btns-side"]}>
            <Button
                className={styles["btn"]}
                danger
                icon={
                    <span className={styles["btn-icon"]}>
                        <IconFont type="icon-exit" size={17} />
                        <span className={styles["btn-text"]}>
                            &nbsp;&nbsp;{i18n("LeaveRoom")}
                        </span>
                    </span>
                }
                onClick={() => {
                    closeSocket(getUIContainer().conn);
                    resetUniverse();
                    navigate("/match");
                }}
            />
            <Button
                className={styles["btn"]}
                icon={
                    <span className={styles["btn-icon"]}>
                        <IconFont type="icon-side-bar-fill" size={16} />
                        <span className={styles["btn-text"]}>
                            &nbsp;&nbsp;{collapsed ? i18n("Expand") : i18n("Collapse")}{" "}
                            {i18n("Sidebar")}
                        </span>
                    </span>
                }
                onClick={switchCollapse}
            />
        </div>
    );
};
