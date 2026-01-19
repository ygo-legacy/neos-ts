/**
 * YGO-Legacy: Configuración de formato
 *
 * Este archivo contiene las configuraciones específicas para el formato Legacy
 * que oculta las mecánicas modernas (Synchro, Xyz, Pendulum, Link).
 */

export const LEGACY_CONFIG = {
    // Habilitar modo Legacy (oculta zonas modernas)
    // NOTA: Deshabilitado temporalmente para verificar que todo funciona
    enabled: false,

    // Ocultar Extra Monster Zones (zonas 5 y 6)
    hideExtraMonsterZones: true,

    // Ocultar zonas de Péndulo (en caso de que existan en el tablero)
    hidePendulumZones: true,

    // Tipos de cartas prohibidas en Legacy (para referencia)
    bannedTypes: {
        TUNER: 0x1000,
        SYNCHRO: 0x2000,
        XYZ: 0x800000,
        PENDULUM: 0x1000000,
        LINK: 0x4000000,
    },
} as const;

// Si queremos habilitar/deshabilitar en runtime
export function isLegacyMode(): boolean {
    return LEGACY_CONFIG.enabled;
}

export function shouldShowExtraMonsterZones(): boolean {
    return !LEGACY_CONFIG.enabled || !LEGACY_CONFIG.hideExtraMonsterZones;
}
