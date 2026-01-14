import {
  CookieKeys,
  forbidden,
  forbidden_408,
  getCookie,
  initStrings,
  initSuperPrerelease,
} from "@/api";
import { useConfig } from "@/config";
import sqliteMiddleWare, { sqliteCmd } from "@/middleware/sqlite";
import { accountStore, deckStore, initStore, type User } from "@/stores";

const { releaseResource, preReleaseResource, env408Resource } = useConfig();

/** 加载ygodb */
export const initSqlite = async () => {
  if (!initStore.sqlite.progress) {
    const { sqlite } = initStore;
    const progressCallback = (progress: number) =>
      (sqlite.progress = progress * 0.9);
    sqlite.progress = 0.01;
    await sqliteMiddleWare({
      cmd: sqliteCmd.INIT,
      initInfo: {
        releaseDbUrl: releaseResource.cdb,
        preReleaseDbUrl: preReleaseResource.cdb,
        progressCallback,
      },
    });
    sqlite.progress = 1;
  }
};

/** 加载卡组 */
export const initDeck = async () => {
  if (!initStore.decks) {
    await deckStore.initialize();
    initStore.decks = true;
  }
};

/** 加载禁限卡表 */
export const initForbidden = async () => {
  if (!initStore.forbidden) {
    await forbidden.init(releaseResource.lflist);
    await forbidden_408.init(env408Resource.lflist);
    initStore.forbidden = true;
  }
};

/** 加载I18N文案 */
export const initI18N = async () => {
  if (!initStore.i18n) {
    await initStrings();
    initStore.i18n = true;
  }
};

/** 加载超先行服配置 */
export const initSuper = async () => {
  if (!initStore.superprerelease) {
    await initSuperPrerelease();
    initStore.superprerelease = true;
  }
};

/** 从cookie获取登录态 - YGO Legacy auth */
export const getLoginStatus = async () => {
  try {
    const userJson = getCookie<string>(CookieKeys.USER);
    if (userJson && typeof userJson === "string") {
      const user = JSON.parse(userJson) as User;
      if (user && user.id && user.username) {
        accountStore.login(user);
      }
    }
  } catch {
    // Invalid cookie data, ignore
  }
};
