import React from 'react';
import { redirect } from 'next/navigation';

import ContentAnimation from '@/components/layouts/content-animation';
import Footer from '@/components/layouts/footer';
import Header from '@/components/layouts/header';
import MainContainer from '@/components/layouts/main-container';
import Overlay from '@/components/layouts/overlay';
import ScrollToTop from '@/components/layouts/scroll-to-top';
import Sidebar from '@/components/layouts/sidebar';
import Portals from '@/components/portals';
import { getProfile } from '@/src/actions/users.actions';
import { FormChangePassword } from '@/components/auth/form-change-password';
import { auth } from '@/auth';



export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const profile = await getProfile();
    const session = await auth();
    if (!profile) redirect('/auth');
    console.log("session", session);

    return (
        <>
            {(profile && !profile.changePassword) && <FormChangePassword userName={profile.username} />}
            {/* BEGIN MAIN CONTAINER */}
            <div className="relative">
                <Overlay />
                <ScrollToTop />

                <MainContainer>
                    {/* BEGIN SIDEBAR */}
                    <Sidebar profile={profile} />
                    {/* END SIDEBAR */}
                    <div className="main-content flex min-h-screen flex-col">
                        {/* BEGIN TOP NAVBAR */}
                        <Header profile={profile} />
                        {/* END TOP NAVBAR */}

                        {/* BEGIN CONTENT AREA */}
                        <ContentAnimation>{children}</ContentAnimation>
                        {/* END CONTENT AREA */}

                        {/* BEGIN FOOTER */}
                        <Footer />
                        {/* END FOOTER */}

                        <Portals />
                    </div>
                </MainContainer>
            </div>
        </>
    );
}
