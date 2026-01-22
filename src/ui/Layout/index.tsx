import {
  DatabaseFilled,
  FullscreenOutlined,
  LoginOutlined,
  LogoutOutlined,
  SettingFilled,
  UserOutlined,
} from "@ant-design/icons";
import { App, Avatar, Dropdown } from "antd";
import classNames from "classnames";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  type LoaderFunction,
  NavLink,
  Outlet,
  redirect,
  useLocation,
} from "react-router-dom";
import { useSnapshot } from "valtio";

import { CookieKeys, removeCookie } from "@/api";
import { useConfig } from "@/config";
import { accountStore } from "@/stores";
import { LoginModal, RegisterModal } from "@/ui/Auth";

import { updateMdproDeck } from "../Decks/BuildDeck/DeckDatabase/DeckResults";
import { setCssProperties } from "../Duel/PlayMat/css";
import { Setting } from "../Setting";
import styles from "./index.module.scss";
import {
  getLoginStatus,
  initDeck,
  initForbidden,
  initI18N,
  initSqlite,
  initSuper,
} from "./utils";

const NeosConfig = useConfig();

export const loader: LoaderFunction = async () => {
  // YGO Legacy: Load authentication from localStorage first
  const isAuthenticated = await accountStore.loadFromStorage();

  // If not authenticated, redirect to login page
  if (!isAuthenticated) {
    return redirect("/login");
  }

  getLoginStatus();
  initDeck();
  initSqlite();
  await initForbidden(); // Critical for limit display
  await initI18N();
  await initSuper(); // Critical for getCardImgUrl
  // TODO: should avoid reloading mdpro deck again
  updateMdproDeck();

  // set some styles
  setCssProperties();

  return null;
};

const HeaderBtn: React.FC<
  React.PropsWithChildren<{ to: string; disabled?: boolean }>
> = ({ to, children, disabled = false }) => {
  const Element = disabled ? "div" : NavLink;
  return (
    <Element
      to={disabled ? "/" : to}
      className={classNames(styles.link, { [styles.disabled]: disabled })}
    >
      {children}
    </Element>
  );
};

export const Component = () => {
  const { t: i18n } = useTranslation("Header");
  const routerLocation = useLocation();

  // Auth modal states
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const logined = Boolean(useSnapshot(accountStore).user);

  const { pathname } = routerLocation;
  // Routes that require fixed layout (no global scroll)
  const fixedRoutes = ["/waitroom", "/duel", "/side"];
  const isFixedLayout = fixedRoutes.some((route) => pathname.startsWith(route));

  React.useEffect(() => {
    // Apply layout class to body to control global scroll behavior
    if (isFixedLayout) {
      document.body.classList.add("layout-fixed");
      document.body.classList.remove("layout-scroll");
    } else {
      document.body.classList.add("layout-scroll");
      document.body.classList.remove("layout-fixed");
    }
    // Cleanup not strictly necessary as we always set one or other, but good practice
    return () => {
      document.body.classList.remove("layout-fixed", "layout-scroll");
    };
  }, [isFixedLayout]);

  const pathnamesHideHeader = ["/waitroom", "/duel", "/side"];
  const { modal } = App.useApp();

  const onLogin = () => setShowLogin(true);
  const onLogout = () => {
    removeCookie(CookieKeys.USER);
    accountStore.logout();
  };

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

      {!pathnamesHideHeader.includes(pathname) && (
        <nav className={styles.navbar}>
          <div className={styles["logo-container"]}>
            <img
              className={styles.logo}
              src={`${NeosConfig.assetsPath}/ygo-legacy-logo.png`}
              alt="YGO Legacy"
            />
          </div>

          <HeaderBtn to="/">{i18n("HomePage")}</HeaderBtn>
          <HeaderBtn to="/match" disabled={!logined}>
            {i18n("Match")}
          </HeaderBtn>
          <HeaderBtn to="/database" disabled={!logined}>
            {i18n("Database")}
          </HeaderBtn>
          <HeaderBtn to="/decks" disabled={!logined}>
            {i18n("DeckBuilding")}
          </HeaderBtn>
          <span style={{ flexGrow: 1 }} />
          <span className={styles.profile}>
            <Dropdown
              arrow
              menu={{
                items: [
                  ...(logined
                    ? [
                      {
                        label: (
                          <>
                            <UserOutlined style={{ fontSize: "16px" }} />{" "}
                            <strong>{i18n("PersonalCenter")}</strong>
                          </>
                        ),
                        key: "profile",
                      },
                    ]
                    : []),
                  {
                    label: (
                      <>
                        <SettingFilled />{" "}
                        <strong>{i18n("SystemSettings")}</strong>
                      </>
                    ),
                    key: "settings",
                    onClick: () => {
                      modal.info({
                        content: (
                          <>
                            <Setting />
                          </>
                        ),
                        centered: true,
                        maskClosable: true,
                        icon: null,
                        footer: null,
                      });
                    },
                  },
                  {
                    label: (
                      <>
                        <strong style={{ color: "#1890ff" }}>
                          <FullscreenOutlined style={{ fontSize: "16px" }} />{" "}
                          {i18n("Fullscreen")}
                        </strong>
                      </>
                    ),
                    key: "fullscreen",
                    onClick: () => document.documentElement.requestFullscreen(),
                  },
                  {
                    label: logined ? (
                      <>
                        <LogoutOutlined style={{ fontSize: "16px" }} />{" "}
                        <strong>{i18n("LogOut")}</strong>
                      </>
                    ) : (
                      <>
                        <LoginOutlined style={{ fontSize: "16px" }} />{" "}
                        <strong>{i18n("Login")}</strong>
                      </>
                    ),
                    key: "auth",
                    onClick: logined ? onLogout : onLogin,
                    danger: logined ? true : false,
                  },
                ],
              }}
            >
              <div>
                <NeosAvatar />
              </div>
            </Dropdown>
          </span>
        </nav>
      )}
      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  );
};

const NeosAvatar = () => {
  const { user } = useSnapshot(accountStore);
  return (
    <Avatar size="small" src={user?.avatar_url} style={{ cursor: "pointer" }} />
  );
};
