/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

/*
 * `require("@heroui/react")` a ete retire d'ici.
 *
 * <p>Le plugin `heroui()` n'etait PLUS APPELE depuis qu'il a ete remplace par les
 * utilitaires recopies ci-dessous : l'import etait mort. Il gardait pourtant le paquet
 * de la v2 vivant, et sa suppression a fait tomber le serveur avec « Cannot find module
 * @heroui/react », dans un fichier que `tsc` ne lit pas et qu'aucun grep sur `.ts` /
 * `.tsx` ne trouve.</p>
 *
 * <p>⚠ `@heroui/theme` est un paquet DIFFERENT, toujours dependance directe, et le motif
 * de `content` plus bas en depend. Ne pas confondre les deux.</p>
 */

const rotateX = plugin(function ({ addUtilities }) {
    addUtilities({
        '.rotate-y-180': {
            transform: 'rotateY(180deg)',
        },
    });
});

/**
 * Utilitaires repris du plugin `heroui()`, qui doit disparaitre.
 *
 * <p>Tailwind 4 REFUSE de charger une configuration contenant un
 * `addUtilities({ ':root': ... })`, et c'est ainsi que `heroui()` injecte ses variables :
 * l'outil officiel de montee s'arrete dessus. HeroUI v3 le supprime de toute facon,
 * `@heroui/styles` etant un paquet CSS et non plus un plugin JS.</p>
 *
 * <p>Retirer le plugin coutait 193 selecteurs, mesures sur le CSS produit. Les couleurs
 * et les entrees de theme sont reprises dans `theme.extend` ci-dessous ; ces
 * utilitaires-la ne passent pas par le theme et doivent etre redeclares. Valeurs
 * relevees dans `@heroui/theme/dist/plugin.js`, pas devinees.</p>
 */
const DUREE = '250ms';
const transition = (proprietes) => ({
    'transition-property': proprietes,
    'transition-timing-function': 'ease',
    'transition-duration': DUREE,
});
const utilitairesHeroui = plugin(function ({ addUtilities }) {
    addUtilities({
        '.transition-background': transition('background'),
        '.transition-colors-opacity': transition('color, background-color, border-color, text-decoration-color, fill, stroke, opacity'),
        '.transition-width': transition('width'),
        '.transition-height': transition('height'),
        '.transition-size': transition('width, height'),
        '.transition-left': transition('left'),
        '.transition-transform-opacity': transition('transform, opacity'),
        '.transition-transform-background': transition('transform, background'),
        '.transition-transform-colors': transition('transform, color, background, background-color, border-color, text-decoration-color, fill, stroke'),
        '.transition-transform-colors-opacity': transition('transform, color, background, background-color, border-color, text-decoration-color, fill, stroke, opacity'),
        '.scrollbar-hide': {
            '-ms-overflow-style': 'none',
            'scrollbar-width': 'none',
            '&::-webkit-scrollbar': { display: 'none' },
        },
        '.scrollbar-default': {
            '-ms-overflow-style': 'auto',
            'scrollbar-width': 'auto',
            '&::-webkit-scrollbar': { display: 'block' },
        },
        '.leading-inherit': { 'line-height': 'inherit' },
        '.bg-img-inherit': { 'background-image': 'inherit' },
        '.bg-clip-inherit': { 'background-clip': 'inherit' },
        '.text-fill-inherit': { '-webkit-text-fill-color': 'inherit' },
        '.tap-highlight-transparent': { '-webkit-tap-highlight-color': 'transparent' },
        '.input-search-cancel-button-none': {
            '&::-webkit-search-cancel-button': { '-webkit-appearance': 'none' },
        },
    });
});

module.exports = {
    content: [
        './App.tsx',
        './app/**/*.{js,ts,jsx,tsx}',
        './pages/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
        './features/**/*.{js,ts,jsx,tsx}',
        './src/**/*.{js,ts,jsx,tsx}',
        // ⚠ NE PAS RETIRER `@heroui/theme` DES DEPENDANCES DIRECTES.
        // Ce motif scanne le paquet PAR CHEMIN pour generer les classes des
        // composants HeroUI. Avec pnpm, une dependance seulement TRANSITIVE vit
        // dans `.pnpm/` et n'apparait pas ici : le motif ne correspond alors a
        // rien, et la moitie du CSS disparait (mesure : 312 + 339 ko -> 180 + 153).
        // Ni `tsc` ni `next build` ne le signalent — le build reste vert et l'ERP
        // part sans ses styles. Seule la MESURE du CSS produit le voit.
        "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        container: {
            center: true,
        },
        extend: {

            /*
             * EXTENSIONS NON COLOREES DU PLUGIN HEROUI, reprises ici a l'identique.
             *
             * <p>Retirer `heroui()` ne coutait pas que les couleurs : la mesure du CSS
             * produit a montre 107 selecteurs perdus APRES avoir replique les echelles —
             * ombres, rayons, opacites, epaisseurs, tailles de police, degrades a rayures
             * et hauteur de separateur. Toutes viennent du plugin, aucune n'est signalee
             * par `tsc` ni par le build.</p>
             *
             * <p>Valeurs relevees dans la source du plugin
             * (`@heroui/theme/dist/plugin.js`), pas devinees.</p>
             */
            opacity: {
                hover: 'var(--heroui-hover-opacity)',
                disabled: 'var(--heroui-disabled-opacity)',
            },
            fontSize: {
                tiny: '0.75rem',
                small: '0.875rem',
                medium: '1rem',
                large: '1.125rem',
            },
            lineHeight: {
                tiny: '1rem',
                small: '1.25rem',
                medium: '1.5rem',
                large: '1.75rem',
            },
            borderWidth: {
                1: '1px',
                2: '2px',
                3: '3px',
                small: '1px',
                medium: '2px',
                large: '3px',
            },
            height: {
                divider: 'var(--heroui-divider-weight)',
            },
            width: {
                divider: 'var(--heroui-divider-weight)',
            },
            backgroundSize: {
                'stripe-size': '1.25rem 1.25rem',
            },
            backgroundImage: {
                'stripe-gradient-default': 'linear-gradient(45deg, hsl(var(--heroui-default-200)) 25%, hsl(var(--heroui-default-400)) 25%, hsl(var(--heroui-default-400)) 50%, hsl(var(--heroui-default-200)) 50%, hsl(var(--heroui-default-200)) 75%, hsl(var(--heroui-default-400)) 75%, hsl(var(--heroui-default-400)))',
                'stripe-gradient-primary': 'linear-gradient(45deg, hsl(var(--heroui-primary-200)) 25%, hsl(var(--heroui-primary)) 25%, hsl(var(--heroui-primary)) 50%, hsl(var(--heroui-primary-200)) 50%, hsl(var(--heroui-primary-200)) 75%, hsl(var(--heroui-primary)) 75%, hsl(var(--heroui-primary)))',
                'stripe-gradient-secondary': 'linear-gradient(45deg, hsl(var(--heroui-secondary-200)) 25%, hsl(var(--heroui-secondary)) 25%, hsl(var(--heroui-secondary)) 50%, hsl(var(--heroui-secondary-200)) 50%, hsl(var(--heroui-secondary-200)) 75%, hsl(var(--heroui-secondary)) 75%, hsl(var(--heroui-secondary)))',
                'stripe-gradient-success': 'linear-gradient(45deg, hsl(var(--heroui-success-200)) 25%, hsl(var(--heroui-success)) 25%, hsl(var(--heroui-success)) 50%, hsl(var(--heroui-success-200)) 50%, hsl(var(--heroui-success-200)) 75%, hsl(var(--heroui-success)) 75%, hsl(var(--heroui-success)))',
                'stripe-gradient-warning': 'linear-gradient(45deg, hsl(var(--heroui-warning-200)) 25%, hsl(var(--heroui-warning)) 25%, hsl(var(--heroui-warning)) 50%, hsl(var(--heroui-warning-200)) 50%, hsl(var(--heroui-warning-200)) 75%, hsl(var(--heroui-warning)) 75%, hsl(var(--heroui-warning)))',
                'stripe-gradient-danger': 'linear-gradient(45deg, hsl(var(--heroui-danger-200)) 25%, hsl(var(--heroui-danger)) 25%, hsl(var(--heroui-danger)) 50%, hsl(var(--heroui-danger-200)) 50%, hsl(var(--heroui-danger-200)) 75%, hsl(var(--heroui-danger)) 75%, hsl(var(--heroui-danger)))',
            },
            colors: {

            /*
             * ECHELLES HEROUI, declarees ICI et non plus laissees au plugin.
             *
             * <p>Ces couleurs etaient generees exclusivement par `heroui()`. Or ce
             * plugin doit partir : Tailwind 4 REFUSE de charger une configuration qui
             * contient un `addUtilities({ ':root': ... })`, et c'est precisement ainsi
             * que `heroui()` injecte ses variables — l'outil officiel de montee s'est
             * arrete dessus mot pour mot. HeroUI v3 le supprime de toute facon :
             * `@heroui/styles` est un paquet CSS, plus un plugin JS.</p>
             *
             * <p>Les valeurs ne sont PAS ecrites ici : chaque entree pointe vers la
             * variable `--heroui-*` correspondante, gelee dans `styles/tailwind.css`
             * depuis le CSS reellement produit. Les deux moities du filet se tiennent
             * donc : les variables portent les valeurs, cette table porte les noms de
             * classe. Retirer l'une sans l'autre casse 721 occurrences de
             * `default-<n>` EN SILENCE.</p>
             *
             * <p>`<alpha-value>` est la syntaxe Tailwind qui rend `text-default-400/50`
             * possible. Sans elle, toutes les opacites sur ces couleurs tomberaient.</p>
             */
            'default': {
                DEFAULT: 'hsl(var(--heroui-default) / <alpha-value>)',
                foreground: 'hsl(var(--heroui-default-foreground) / <alpha-value>)',
                '50': 'hsl(var(--heroui-default-50) / <alpha-value>)',
                '100': 'hsl(var(--heroui-default-100) / <alpha-value>)',
                '200': 'hsl(var(--heroui-default-200) / <alpha-value>)',
                '300': 'hsl(var(--heroui-default-300) / <alpha-value>)',
                '400': 'hsl(var(--heroui-default-400) / <alpha-value>)',
                '500': 'hsl(var(--heroui-default-500) / <alpha-value>)',
                '600': 'hsl(var(--heroui-default-600) / <alpha-value>)',
                '700': 'hsl(var(--heroui-default-700) / <alpha-value>)',
                '800': 'hsl(var(--heroui-default-800) / <alpha-value>)',
                '900': 'hsl(var(--heroui-default-900) / <alpha-value>)',
            },
            'foreground': {
                DEFAULT: 'hsl(var(--heroui-foreground) / <alpha-value>)',
                '50': 'hsl(var(--heroui-foreground-50) / <alpha-value>)',
                '100': 'hsl(var(--heroui-foreground-100) / <alpha-value>)',
                '200': 'hsl(var(--heroui-foreground-200) / <alpha-value>)',
                '300': 'hsl(var(--heroui-foreground-300) / <alpha-value>)',
                '400': 'hsl(var(--heroui-foreground-400) / <alpha-value>)',
                '500': 'hsl(var(--heroui-foreground-500) / <alpha-value>)',
                '600': 'hsl(var(--heroui-foreground-600) / <alpha-value>)',
                '700': 'hsl(var(--heroui-foreground-700) / <alpha-value>)',
                '800': 'hsl(var(--heroui-foreground-800) / <alpha-value>)',
                '900': 'hsl(var(--heroui-foreground-900) / <alpha-value>)',
            },
            'primary': {
                DEFAULT: 'hsl(var(--heroui-primary) / <alpha-value>)',
                foreground: 'hsl(var(--heroui-primary-foreground) / <alpha-value>)',
                '50': 'hsl(var(--heroui-primary-50) / <alpha-value>)',
                '100': 'hsl(var(--heroui-primary-100) / <alpha-value>)',
                '200': 'hsl(var(--heroui-primary-200) / <alpha-value>)',
                '300': 'hsl(var(--heroui-primary-300) / <alpha-value>)',
                '400': 'hsl(var(--heroui-primary-400) / <alpha-value>)',
                '500': 'hsl(var(--heroui-primary-500) / <alpha-value>)',
                '600': 'hsl(var(--heroui-primary-600) / <alpha-value>)',
                '700': 'hsl(var(--heroui-primary-700) / <alpha-value>)',
                '800': 'hsl(var(--heroui-primary-800) / <alpha-value>)',
                '900': 'hsl(var(--heroui-primary-900) / <alpha-value>)',
            },
            'secondary': {
                DEFAULT: 'hsl(var(--heroui-secondary) / <alpha-value>)',
                foreground: 'hsl(var(--heroui-secondary-foreground) / <alpha-value>)',
                '50': 'hsl(var(--heroui-secondary-50) / <alpha-value>)',
                '100': 'hsl(var(--heroui-secondary-100) / <alpha-value>)',
                '200': 'hsl(var(--heroui-secondary-200) / <alpha-value>)',
                '300': 'hsl(var(--heroui-secondary-300) / <alpha-value>)',
                '400': 'hsl(var(--heroui-secondary-400) / <alpha-value>)',
                '500': 'hsl(var(--heroui-secondary-500) / <alpha-value>)',
                '600': 'hsl(var(--heroui-secondary-600) / <alpha-value>)',
                '700': 'hsl(var(--heroui-secondary-700) / <alpha-value>)',
                '800': 'hsl(var(--heroui-secondary-800) / <alpha-value>)',
                '900': 'hsl(var(--heroui-secondary-900) / <alpha-value>)',
            },
            'success': {
                DEFAULT: 'hsl(var(--heroui-success) / <alpha-value>)',
                foreground: 'hsl(var(--heroui-success-foreground) / <alpha-value>)',
                '50': 'hsl(var(--heroui-success-50) / <alpha-value>)',
                '100': 'hsl(var(--heroui-success-100) / <alpha-value>)',
                '200': 'hsl(var(--heroui-success-200) / <alpha-value>)',
                '300': 'hsl(var(--heroui-success-300) / <alpha-value>)',
                '400': 'hsl(var(--heroui-success-400) / <alpha-value>)',
                '500': 'hsl(var(--heroui-success-500) / <alpha-value>)',
                '600': 'hsl(var(--heroui-success-600) / <alpha-value>)',
                '700': 'hsl(var(--heroui-success-700) / <alpha-value>)',
                '800': 'hsl(var(--heroui-success-800) / <alpha-value>)',
                '900': 'hsl(var(--heroui-success-900) / <alpha-value>)',
            },
            'warning': {
                DEFAULT: 'hsl(var(--heroui-warning) / <alpha-value>)',
                foreground: 'hsl(var(--heroui-warning-foreground) / <alpha-value>)',
                '50': 'hsl(var(--heroui-warning-50) / <alpha-value>)',
                '100': 'hsl(var(--heroui-warning-100) / <alpha-value>)',
                '200': 'hsl(var(--heroui-warning-200) / <alpha-value>)',
                '300': 'hsl(var(--heroui-warning-300) / <alpha-value>)',
                '400': 'hsl(var(--heroui-warning-400) / <alpha-value>)',
                '500': 'hsl(var(--heroui-warning-500) / <alpha-value>)',
                '600': 'hsl(var(--heroui-warning-600) / <alpha-value>)',
                '700': 'hsl(var(--heroui-warning-700) / <alpha-value>)',
                '800': 'hsl(var(--heroui-warning-800) / <alpha-value>)',
                '900': 'hsl(var(--heroui-warning-900) / <alpha-value>)',
            },
            'danger': {
                DEFAULT: 'hsl(var(--heroui-danger) / <alpha-value>)',
                foreground: 'hsl(var(--heroui-danger-foreground) / <alpha-value>)',
                '50': 'hsl(var(--heroui-danger-50) / <alpha-value>)',
                '100': 'hsl(var(--heroui-danger-100) / <alpha-value>)',
                '200': 'hsl(var(--heroui-danger-200) / <alpha-value>)',
                '300': 'hsl(var(--heroui-danger-300) / <alpha-value>)',
                '400': 'hsl(var(--heroui-danger-400) / <alpha-value>)',
                '500': 'hsl(var(--heroui-danger-500) / <alpha-value>)',
                '600': 'hsl(var(--heroui-danger-600) / <alpha-value>)',
                '700': 'hsl(var(--heroui-danger-700) / <alpha-value>)',
                '800': 'hsl(var(--heroui-danger-800) / <alpha-value>)',
                '900': 'hsl(var(--heroui-danger-900) / <alpha-value>)',
            },
            'content1': {
                DEFAULT: 'hsl(var(--heroui-content1) / <alpha-value>)',
                foreground: 'hsl(var(--heroui-content1-foreground) / <alpha-value>)',
            },
            'content2': {
                DEFAULT: 'hsl(var(--heroui-content2) / <alpha-value>)',
                foreground: 'hsl(var(--heroui-content2-foreground) / <alpha-value>)',
            },
            'content3': {
                DEFAULT: 'hsl(var(--heroui-content3) / <alpha-value>)',
                foreground: 'hsl(var(--heroui-content3-foreground) / <alpha-value>)',
            },
            'content4': {
                DEFAULT: 'hsl(var(--heroui-content4) / <alpha-value>)',
                foreground: 'hsl(var(--heroui-content4-foreground) / <alpha-value>)',
            },
            'divider': 'hsl(var(--heroui-divider) / <alpha-value>)',
            'focus': 'hsl(var(--heroui-focus) / <alpha-value>)',
            'overlay': 'hsl(var(--heroui-overlay) / <alpha-value>)',
                border: 'hsl(var(--border) / <alpha-value>)',
                input: 'hsl(var(--input) / <alpha-value>)',
                ring: 'hsl(var(--ring) / <alpha-value>)',
                background: 'hsl(var(--background) / <alpha-value>)',
                foreground: {
                // La definition etait une simple chaine, donc `text-foreground-500` et
                // ses voisins n'existaient pas sans le plugin. DEFAULT garde la variable
                // applicative ; les niveaux pointent vers HeroUI.
                DEFAULT: 'hsl(var(--foreground) / <alpha-value>)',
                '50': 'hsl(var(--heroui-foreground-50) / <alpha-value>)',
                '100': 'hsl(var(--heroui-foreground-100) / <alpha-value>)',
                '200': 'hsl(var(--heroui-foreground-200) / <alpha-value>)',
                '300': 'hsl(var(--heroui-foreground-300) / <alpha-value>)',
                '400': 'hsl(var(--heroui-foreground-400) / <alpha-value>)',
                '500': 'hsl(var(--heroui-foreground-500) / <alpha-value>)',
                '600': 'hsl(var(--heroui-foreground-600) / <alpha-value>)',
                '700': 'hsl(var(--heroui-foreground-700) / <alpha-value>)',
                '800': 'hsl(var(--heroui-foreground-800) / <alpha-value>)',
                '900': 'hsl(var(--heroui-foreground-900) / <alpha-value>)',
            },
                primary: {
                    DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
                    foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
                    light: 'hsl(var(--primary) / <alpha-value>)',
                    '50': 'hsl(var(--heroui-primary-50) / <alpha-value>)',
                    '100': 'hsl(var(--heroui-primary-100) / <alpha-value>)',
                    '200': 'hsl(var(--heroui-primary-200) / <alpha-value>)',
                    '300': 'hsl(var(--heroui-primary-300) / <alpha-value>)',
                    '400': 'hsl(var(--heroui-primary-400) / <alpha-value>)',
                    '500': 'hsl(var(--heroui-primary-500) / <alpha-value>)',
                    '600': 'hsl(var(--heroui-primary-600) / <alpha-value>)',
                    '700': 'hsl(var(--heroui-primary-700) / <alpha-value>)',
                    '800': 'hsl(var(--heroui-primary-800) / <alpha-value>)',
                    '900': 'hsl(var(--heroui-primary-900) / <alpha-value>)',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
                    foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
                    light: 'hsl(var(--secondary) / <alpha-value>)',
                    '50': 'hsl(var(--heroui-secondary-50) / <alpha-value>)',
                    '100': 'hsl(var(--heroui-secondary-100) / <alpha-value>)',
                    '200': 'hsl(var(--heroui-secondary-200) / <alpha-value>)',
                    '300': 'hsl(var(--heroui-secondary-300) / <alpha-value>)',
                    '400': 'hsl(var(--heroui-secondary-400) / <alpha-value>)',
                    '500': 'hsl(var(--heroui-secondary-500) / <alpha-value>)',
                    '600': 'hsl(var(--heroui-secondary-600) / <alpha-value>)',
                    '700': 'hsl(var(--heroui-secondary-700) / <alpha-value>)',
                    '800': 'hsl(var(--heroui-secondary-800) / <alpha-value>)',
                    '900': 'hsl(var(--heroui-secondary-900) / <alpha-value>)',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
                    foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
                    light: 'hsl(var(--destructive) / <alpha-value>)',
                },
                info: {
                    DEFAULT: 'hsl(var(--info) / <alpha-value>)',
                    foreground: 'hsl(var(--info-foreground) / <alpha-value>)',
                    light: 'hsl(var(--info) / <alpha-value>)',
                },
                success: {
                    DEFAULT: 'hsl(var(--success) / <alpha-value>)',
                    foreground: 'hsl(var(--success-foreground) / <alpha-value>)',
                    light: 'hsl(var(--success) / <alpha-value>)',
                    '50': 'hsl(var(--heroui-success-50) / <alpha-value>)',
                    '100': 'hsl(var(--heroui-success-100) / <alpha-value>)',
                    '200': 'hsl(var(--heroui-success-200) / <alpha-value>)',
                    '300': 'hsl(var(--heroui-success-300) / <alpha-value>)',
                    '400': 'hsl(var(--heroui-success-400) / <alpha-value>)',
                    '500': 'hsl(var(--heroui-success-500) / <alpha-value>)',
                    '600': 'hsl(var(--heroui-success-600) / <alpha-value>)',
                    '700': 'hsl(var(--heroui-success-700) / <alpha-value>)',
                    '800': 'hsl(var(--heroui-success-800) / <alpha-value>)',
                    '900': 'hsl(var(--heroui-success-900) / <alpha-value>)',
                },
                warning: {
                    DEFAULT: 'hsl(var(--warning) / <alpha-value>)',
                    foreground: 'hsl(var(--warning-foreground) / <alpha-value>)',
                    light: 'hsl(var(--warning) / <alpha-value>)',
                    '50': 'hsl(var(--heroui-warning-50) / <alpha-value>)',
                    '100': 'hsl(var(--heroui-warning-100) / <alpha-value>)',
                    '200': 'hsl(var(--heroui-warning-200) / <alpha-value>)',
                    '300': 'hsl(var(--heroui-warning-300) / <alpha-value>)',
                    '400': 'hsl(var(--heroui-warning-400) / <alpha-value>)',
                    '500': 'hsl(var(--heroui-warning-500) / <alpha-value>)',
                    '600': 'hsl(var(--heroui-warning-600) / <alpha-value>)',
                    '700': 'hsl(var(--heroui-warning-700) / <alpha-value>)',
                    '800': 'hsl(var(--heroui-warning-800) / <alpha-value>)',
                    '900': 'hsl(var(--heroui-warning-900) / <alpha-value>)',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
                    foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
                    foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
                    foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
                },
                card: {
                    DEFAULT: 'hsl(var(--card) / <alpha-value>)',
                    foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
                },
                danger: {
                    DEFAULT: 'hsl(var(--danger) / <alpha-value>)',
                    foreground: 'hsl(var(--danger-foreground) / <alpha-value>)',
                    light: 'hsl(var(--danger) / <alpha-value>)',
                    '50': 'hsl(var(--heroui-danger-50) / <alpha-value>)',
                    '100': 'hsl(var(--heroui-danger-100) / <alpha-value>)',
                    '200': 'hsl(var(--heroui-danger-200) / <alpha-value>)',
                    '300': 'hsl(var(--heroui-danger-300) / <alpha-value>)',
                    '400': 'hsl(var(--heroui-danger-400) / <alpha-value>)',
                    '500': 'hsl(var(--heroui-danger-500) / <alpha-value>)',
                    '600': 'hsl(var(--heroui-danger-600) / <alpha-value>)',
                    '700': 'hsl(var(--heroui-danger-700) / <alpha-value>)',
                    '800': 'hsl(var(--heroui-danger-800) / <alpha-value>)',
                    '900': 'hsl(var(--heroui-danger-900) / <alpha-value>)',
                },
                dark: {
                    DEFAULT: 'hsl(var(--dark) / <alpha-value>)',
                    light: 'hsl(var(--dark-light) / <alpha-value>)',
                    'dark-light': 'rgba(59,63,92,.15)',
                },
                black: {
                    DEFAULT: 'hsl(var(--black) / <alpha-value>)',
                    light: 'hsl(var(--black-light) / <alpha-value>)',
                    'dark-light': 'rgba(14,23,38,.15)',
                },
                /*
                 * LES 288 `text-white` DE L'ERP NE PEIGNAIENT RIEN.
                 *
                 * `hsl(var(--white))` suppose que `--white` est un TRIPLET HSL nu, ce
                 * qu'il etait dans le gabarit d'administration : `0 0% 100%`. Mais
                 * `@heroui/styles` redeclare `--white: oklch(100% 0 0)` APRES nous, a
                 * specificite egale, et gagne donc la cascade. La regle produite devenait
                 * `color: hsl(oklch(100% 0 0) / 1)`, invalide : le navigateur jette la
                 * declaration en silence, et le texte retombe sur la couleur heritee.
                 *
                 * En theme clair cette couleur heritee est presque noire. Le chiffre du
                 * badge de notifications, les libelles des boutons pleins, les en-tetes
                 * de tableau colores : partout ou le texte devait etre blanc SUR une
                 * couleur, il s'affichait sombre sur sombre.
                 *
                 * Le blanc n'a pas besoin d'une variable. On l'ecrit.
                 */
                white: {
                    DEFAULT: 'rgb(255 255 255 / <alpha-value>)',
                    light: 'hsl(var(--white-light) / <alpha-value>)',
                    dark: 'rgba(255,255,255,0.5)',
                },
            },
            borderRadius: {
                small: 'var(--heroui-radius-small)',
                medium: 'var(--heroui-radius-medium)',
                large: 'var(--heroui-radius-large)',
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            fontFamily: {
                nunito: ['var(--font-nunito)'],
            },
            spacing: {
                4.5: '18px',
            },
            boxShadow: {
                small: '0px 0px 5px 0px rgb(0 0 0 / 0.02), 0px 2px 10px 0px rgb(0 0 0 / 0.06), 0px 0px 1px 0px rgb(0 0 0 / 0.3)',
                medium: '0px 0px 15px 0px rgb(0 0 0 / 0.03), 0px 2px 30px 0px rgb(0 0 0 / 0.08), 0px 0px 1px 0px rgb(0 0 0 / 0.3)',
                large: '0px 0px 30px 0px rgb(0 0 0 / 0.04), 0px 30px 60px 0px rgb(0 0 0 / 0.12), 0px 0px 1px 0px rgb(0 0 0 / 0.3)',
                '3xl': '0 2px 2px rgb(224 230 237 / 46%), 1px 6px 7px rgb(224 230 237 / 46%)',
            },
            typography: ({ theme }) => ({
                DEFAULT: {
                    css: {
                        '--tw-prose-invert-headings': theme('colors.foreground'),
                        '--tw-prose-invert-links': theme('colors.foreground'),
                        h1: { fontSize: '40px', marginBottom: '0.5rem', marginTop: 0, color: theme('colors.foreground') },
                        h2: { fontSize: '32px', marginBottom: '0.5rem', marginTop: 0, color: theme('colors.foreground') },
                        h3: { fontSize: '28px', marginBottom: '0.5rem', marginTop: 0, color: theme('colors.foreground') },
                        h4: { fontSize: '24px', marginBottom: '0.5rem', marginTop: 0, color: theme('colors.foreground') },
                        h5: { fontSize: '20px', marginBottom: '0.5rem', marginTop: 0, color: theme('colors.foreground') },
                        h6: { fontSize: '16px', marginBottom: '0.5rem', marginTop: 0, color: theme('colors.foreground') },
                        p: { marginBottom: '0.5rem', color: theme('colors.foreground') },
                        li: { margin: 0, color: theme('colors.muted-foreground') },
                        img: { margin: 0 },
                    },
                },
            }),
            keyframes: {
                'spinner-spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
                'drip-expand': { '0%': { opacity: '0.2', transform: 'scale(0)' }, '100%': { opacity: '0', transform: 'scale(2)' } },
                'indeterminate-bar': { '0%': { transform: 'translateX(-50%) scaleX(0.2)' }, '100%': { transform: 'translateX(100%) scaleX(1)' } },
               
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' },
                },
                'border-beam': {
                    '100%': {
                        'offset-distance': '100%',
                    },
                },
                'image-glow': {
                    '0%': {
                        opacity: '0',
                        'animation-timing-function': 'cubic-bezier(0.74, 0.25, 0.76, 1)',
                    },
                    '10%': {
                        opacity: '0.7',
                        'animation-timing-function': 'cubic-bezier(0.12, 0.01, 0.08, 0.99)',
                    },
                    '100%': {
                        opacity: '0.4',
                    },
                },
                'fade-in': {
                    from: { opacity: '0', transform: 'translateY(-10px)' },
                    to: { opacity: '1', transform: 'none' },
                },
                'fade-up': {
                    from: { opacity: '0', transform: 'translateY(20px)' },
                    to: { opacity: '1', transform: 'none' },
                },
                shimmer: {
                    '0%, 90%, 100%': {
                        'background-position': 'calc(-100% - var(--shimmer-width)) 0',
                    },
                    '30%, 60%': {
                        'background-position': 'calc(100% + var(--shimmer-width)) 0',
                    },
                },
                marquee: {
                    from: { transform: 'translateX(0)' },
                    to: { transform: 'translateX(calc(-100% - var(--gap)))' },
                },
                'marquee-vertical': {
                    from: { transform: 'translateY(0)' },
                    to: { transform: 'translateY(calc(-100% - var(--gap)))' },
                },
                ripple: {
                    '0%, 100%': {
                        transform: 'translate(-50%, -50%) scale(1)',
                    },
                    '50%': {
                        transform: 'translate(-50%, -50%) scale(0.9)',
                    },
                },
                'caret-blink': {
                    '0%,70%,100%': { opacity: '1' },
                    '20%,50%': { opacity: '0' },
                },
            },
            animation: {
                'spinner-ease-spin': 'spinner-spin 0.8s ease infinite',
                'spinner-linear-spin': 'spinner-spin 0.8s linear infinite',
                'drip-expand': 'drip-expand 420ms linear',
                'indeterminate-bar': 'indeterminate-bar 1.5s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite normal none running',
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'border-beam': 'border-beam calc(var(--duration)*1s) infinite linear',
                'image-glow': 'image-glow 4100ms 600ms ease-out forwards',
                'fade-in': 'fade-in 1000ms var(--animation-delay, 0ms) ease forwards',
                'fade-up': 'fade-up 1000ms var(--animation-delay, 0ms) ease forwards',
                shimmer: 'shimmer 8s infinite',
                marquee: 'marquee var(--duration) infinite linear',
                'marquee-vertical': 'marquee-vertical var(--duration) linear infinite',
                ripple: 'ripple var(--duration,2s) ease calc(var(--i, 0)*.2s) infinite',
                'caret-blink': 'caret-blink 1.25s ease-out infinite',
            },
        },
    },
    plugins: [
        utilitairesHeroui,
        require('@tailwindcss/forms')({
            strategy: 'class',
        }),
        require('@tailwindcss/typography'),
        rotateX,
        require('tailwind-scrollbar'),
    ],
};
