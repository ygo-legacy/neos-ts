import { RightOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LoaderFunction, useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";

import { useConfig } from "@/config";
import { AudioActionType, changeScene } from "@/infra/audio";
import { accountStore, initStore } from "@/stores";
import { Background, Loading, SpecialButton } from "@/ui/Shared";
import { LoginModal, RegisterModal } from "@/ui/Auth";

import styles from "./index.module.scss";

const NeosConfig = useConfig();

export const loader: LoaderFunction = async () => {
  // Update scene audio
  changeScene(AudioActionType.BGM_MENU);
  return null;
};

export const Component: React.FC = () => {
  const { t } = useTranslation("Start");
  const { user } = useSnapshot(accountStore);
  const { progress } = useSnapshot(initStore.sqlite);

  // Auth modal states
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const switchToRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  const switchToLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  return (
    <>
      <Background />

      {/* Auth Modals */}
      <LoginModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={switchToRegister}
      />
      <RegisterModal
        open={showRegister}
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={switchToLogin}
      />

      <div className={styles.wrap}>
        {progress === 1 ? (
          <main className={styles.main}>
            <div className={styles.left}>
              <img
                className={styles["legacy-logo"]}
                src={`${NeosConfig.assetsPath}/ygo-legacy-logo.png`}
                alt="YGO Legacy"
              />
              <div className={styles.title}>{t("Title", "Revive la Era Clásica")}</div>
              <div className={styles.keywords}>{t("Keywords", "Duelos • Nostalgia • GX")}</div>
              <div className={styles.details}>
                {t("Details", "Experimenta Yu-Gi-Oh! como era en sus inicios. Solo cartas hasta la era GX, sin Synchros ni mecánicas modernas. El verdadero duelo clásico.")}
              </div>
              <LoginBtn
                logined={Boolean(user)}
                onLogin={() => setShowLogin(true)}
              />
            </div>
            <div className={styles.right}>
              <div className={styles.logoContainer}>
                <img
                  className={styles["hero-logo"]}
                  src={`${NeosConfig.assetsPath}/ygo-legacy-logo.png`}
                  alt="YGO Legacy"
                />
              </div>
            </div>
          </main>
        ) : (
          <Loading progress={progress * 100} />
        )}
      </div>
    </>
  );
};
Component.displayName = "Start";

interface LoginBtnProps {
  logined: boolean;
  onLogin: () => void;
}

const LoginBtn: React.FC<LoginBtnProps> = ({ logined, onLogin }) => {
  const { t } = useTranslation("Start");
  const navigate = useNavigate();

  const goToMatch = () => navigate("/match");

  return (
    <SpecialButton
      style={{ marginTop: "auto" }}
      onClick={logined ? goToMatch : onLogin}
    >
      <span>{logined ? t("StartGame", "Comenzar Juego") : t("LoginToGame", "Iniciar Sesión")}</span>
      <RightOutlined />
    </SpecialButton>
  );
};
