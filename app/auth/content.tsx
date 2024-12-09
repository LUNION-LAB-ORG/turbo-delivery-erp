import { FormLogin } from '@/components/auth/form-login';
import Image from 'next/image';
import img from '@/public/assets/images/photos/galaxy.png';
export default function Content() {
    return (
        <div>
            <div className="absolute bg-primary inset-0">
                <Image src={img} placeholder="blur" priority className="h-full w-full object-cover opacity-30" alt="Login background" layout="fill" objectFit="cover" objectPosition="center" />
            </div>

            <div className="relative flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
                <div className="relative w-full max-w-[870px] rounded-md bg-[linear-gradient(45deg,#fff9f9_0%,rgba(255,255,255,0)_25%,#FFFF00_75%,_#fff9f9_100%)] p-2 dark:bg-[linear-gradient(52.22deg,#0E1726_0%,rgba(14,23,38,0)_18.66%,rgba(14,23,38,0)_51.04%,rgba(14,23,38,0)_80.07%,#0E1726_100%)]">
                    <div className="relative flex flex-col justify-center rounded-md bg-white/60 px-6 py-20 backdrop-blur-lg dark:bg-black/50 lg:min-h-[758px]">
                        <div className="mx-auto w-full max-w-[440px]">
                            <div className="mb-10">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">Connexion</h1>
                                <p className="text-base font-bold leading-normal text-black">Entrez votre nom d&apos;utilisateur et votre mot de passe pour vous connecter</p>
                            </div>
                            <FormLogin />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
