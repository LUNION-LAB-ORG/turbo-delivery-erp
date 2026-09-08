'use client';
import { PropsWithChildren, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '@/store';
import { toggleRTL, toggleTheme, toggleMenu, toggleLayout, toggleAnimation, toggleNavbar, toggleSemidark } from '@/store/themeConfigSlice';
import Loading from '@/components/layouts/loading';
import { getTranslation } from '@/i18n';
import { I18nProvider } from '@react-aria/i18n';
import { RouterProvider } from 'react-aria-components';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useRouter } from 'next/navigation';

function App({ children }: PropsWithChildren) {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const dispatch = useDispatch();
    const { initLocale } = getTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    /*
     * Locale des composants React Aria : calendriers, selecteurs de date et de plage.
     *
     * <p>Sans elle, la semaine commence le DIMANCHE et le calendrier apparait decale
     * d'un jour. Il faut un BCP-47 avec sa region : « fr-FR », pas « fr ». On ne touche
     * pas a `themeConfig.locale`, qui est la cle des traductions.</p>
     *
     * <p>Elle passait par le `HeroUIProvider` de la v2, parce que les composants de la v2
     * lisaient le contexte i18n DE CE PROVIDER et non un `I18nProvider` externe. La v2
     * n'existe plus dans ce projet : la v3 se monte sans provider, et ses composants,
     * qui sont ceux de react-aria, lisent l'`I18nProvider` ci-dessous.</p>
     */
    const localeAria =
        ({ fr: 'fr-FR', en: 'en-US' } as Record<string, string>)[themeConfig.locale] ??
        themeConfig.locale;

    useEffect(() => {
        dispatch(toggleTheme(localStorage.getItem('theme') || themeConfig.theme));
        dispatch(toggleMenu(localStorage.getItem('menu') || themeConfig.menu));
        dispatch(toggleLayout(localStorage.getItem('layout') || themeConfig.layout));
        dispatch(toggleRTL(localStorage.getItem('rtlClass') || themeConfig.rtlClass));
        dispatch(toggleAnimation(localStorage.getItem('animation') || themeConfig.animation));
        dispatch(toggleNavbar(localStorage.getItem('navbar') || themeConfig.navbar));
        dispatch(toggleSemidark(localStorage.getItem('semidark') || themeConfig.semidark));
        // locale
        initLocale(themeConfig.locale);

        setIsLoading(false);
    }, [dispatch, initLocale, themeConfig.theme, themeConfig.menu, themeConfig.layout, themeConfig.rtlClass, themeConfig.animation, themeConfig.navbar, themeConfig.locale, themeConfig.semidark]);

    return (
        /*
         * Le `HeroUIProvider` de la v2 portait aussi `navigate` : sans lui, un lien de
         * react-aria fait un rechargement COMPLET de la page au lieu d'une navigation
         * cote client. `RouterProvider` rend ce service a la v3, qui n'a pas de provider
         * a elle.
         */
        <RouterProvider navigate={router.push}>
            <NextThemesProvider attribute="class" defaultTheme={'light'}>
                <I18nProvider locale={localeAria}>
                    <div
                        className={`${(themeConfig.sidebar && 'toggle-sidebar') || ''} ${themeConfig.menu} ${themeConfig.layout} ${themeConfig.rtlClass
                            } main-section relative font-nunito text-sm font-normal antialiased`}
                    >
                        {isLoading ? (
                            <Loading />
                        ) : (
                            <div>
                                {children}
                            </div>
                        )}
                    </div>
                </I18nProvider>
            </NextThemesProvider>
        </RouterProvider>
    );
}

export default App;
