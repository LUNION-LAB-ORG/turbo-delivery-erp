export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Turbo Delivery",
  description: "Turbo Delivery",
  contacts:{
    email:'support@lunion-lab.com',
    tel:'225 07 68 56 66 47'
  },
  navItems: [
    {
      label: "Présentation",
      href: "/",
    },
    {
      label: "Portail",
      href: "/portal",
    },
    {
      label: "Tarifs",
      href: "/pricing",
    },
  ],
  links: {
    sponsor: "https://patreon.com/Lunion_Lab",
  },
};
