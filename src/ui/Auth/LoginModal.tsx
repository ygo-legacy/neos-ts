import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { login as apiLogin, type AuthUser } from "@/api/legacyAuth";
import { CookieKeys, setCookie } from "@/api/cookies";
import { accountStore } from "@/stores";

import styles from "./index.module.scss";

interface LoginModalProps {
    open: boolean;
    onClose: () => void;
    onSwitchToRegister: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
    open,
    onClose,
    onSwitchToRegister,
}) => {
    const { t: i18n } = useTranslation("Auth");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const user: AuthUser = await apiLogin({ username, password });

            // Store user in cookie and store
            setCookie(CookieKeys.USER, JSON.stringify(user));
            accountStore.login(user);

            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={handleOverlayClick}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{i18n("LoginTitle", "Iniciar Sesión")}</h2>
                    <p className={styles.subtitle}>
                        {i18n("LoginSubtitle", "Bienvenido a YGO Legacy")}
                    </p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>
                            {i18n("Username", "Usuario")}
                        </label>
                        <input
                            type="text"
                            className={styles.input}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder={i18n("UsernamePlaceholder", "Tu nombre de usuario")}
                            required
                            autoComplete="username"
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>
                            {i18n("Password", "Contraseña")}
                        </label>
                        <input
                            type="password"
                            className={styles.input}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={i18n("PasswordPlaceholder", "Tu contraseña")}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.actions}>
                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={loading}
                        >
                            {loading
                                ? i18n("LoggingIn", "Iniciando sesión...")
                                : i18n("Login", "Iniciar Sesión")}
                        </button>

                        <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={onClose}
                        >
                            {i18n("Cancel", "Cancelar")}
                        </button>
                    </div>

                    <p className={styles.switchText}>
                        {i18n("NoAccount", "¿No tienes cuenta?")}{" "}
                        <span className={styles.switchLink} onClick={onSwitchToRegister}>
                            {i18n("RegisterHere", "Regístrate aquí")}
                        </span>
                    </p>
                </form>
            </div>
        </div>
    );
};
