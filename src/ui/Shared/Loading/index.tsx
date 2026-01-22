import { LoadingOutlined } from "@ant-design/icons";
import classNames from "classnames";

import styles from "./index.module.scss";

/**
 * 加载中
 * @param progress 0~1的进度
 * @param hiddenText 是否隐藏文字
 * @param overlay 是否全屏覆盖
 */
export const Loading: React.FC<{ progress?: number; hiddenText?: boolean; overlay?: boolean }> = ({
  progress,
  hiddenText,
  overlay,
}) => (
  <div className={overlay ? styles.overlay : styles.loading}>
    <span className={styles.icon}>
      <LoadingOutlined />
    </span>
    {!hiddenText && (
      <span className={styles.text}>
        {progress ? `${progress.toFixed(2)}%` : "Cargando..."}
      </span>
    )}
  </div>
);
