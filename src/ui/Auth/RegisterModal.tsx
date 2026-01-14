import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { register as apiRegister, type AuthUser } from "@/api/legacyAuth";
import { CookieKeys, setCookie } from "@/api/cookies";
import { accountStore } from "@/stores";

import styles from "./index.module.scss";

interface RegisterModalProps {
    open: boolean;
    onClose: () => void;
    onSwitchToLogin: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
    open,
    onClose,
    onSwitchToLogin,
}) => {
    const { t: i18n } = useTranslation("Auth");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate password match
        if (password !== confirmPassword) {
            setError(i18n("PasswordMismatch", "Las contraseñas no coinciden"));
            return;
        }

        // Validate password length
        if (password.length < 8) {
            setError(i18n("PasswordTooShort", "La contraseña debe tener al menos 8 caracteres"));
            return;
        }

        setLoading(true);

        try {
            const user: AuthUser = await apiRegister({ username, email, password });

            // Store user in cookie and store
            setCookie(CookieKeys.USER, JSON.stringify(user));
            accountStore.login(user);

            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Registration failed");
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
                    <h2 className={styles.title}>{i18n("RegisterTitle", "Crear Cuenta")}</h2>
                    <p className={styles.subtitle}>
                        {i18n("RegisterSubtitle", "Únete a YGO Legacy")}
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
                            placeholder={i18n("UsernamePlaceholder", "Elige un nombre de usuario")}
                            required
                            minLength={3}
                            maxLength={20}
                            pattern="^[a-zA-Z0-9_]+$"
                            autoComplete="username"
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>
                            {i18n("Email", "Correo electrónico")}
                        </label>
                        <input
                            type="email"
                            className={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={i18n("EmailPlaceholder", "tu@email.com")}
                            required
                            autoComplete="email"
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
                            placeholder={i18n("PasswordPlaceholder", "Mínimo 8 caracteres")}
                            required
                            minLength={8}
                            autoComplete="new-password"
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>
                            {i18n("ConfirmPassword", "Confirmar contraseña")}
                        </label>
                        <input
                            type="password"
                            className={styles.input}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={i18n("ConfirmPasswordPlaceholder", "Repite tu contraseña")}
                            required
                            autoComplete="new-password"
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
                                ? i18n("Registering", "Creando cuenta...")
                                : i18n("Register", "Crear Cuenta")}
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
                        {i18n("HasAccount", "¿Ya tienes cuenta?")}{" "}
                        <span className={styles.switchLink} onClick={onSwitchToLogin}>
                            {i18n("LoginHere", "Inicia sesión aquí")}
                        </span>
                    </p>
                </form>
            </div>
        </div>
    );
};
