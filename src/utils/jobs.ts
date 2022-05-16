export type Client = {
  name: string;
  website: string;
};

export type Job = {
  client: Client;
  role: string;
  year: number;
};

const notFoundClient: Client = {
  name: "Not found",
  website: "https://google.com",
};

const clients: Client[] = [
  { name: "CIC Bank", website: "https://cic.fr" },
  { name: "Wolfox", website: "https://wolfox.co" },
  { name: "Roadeo", website: "https://roadeo.co" },
  { name: "Schneider Electric", website: "https://se.com" },
  { name: "IronHack", website: "https://ironhack.com" },
  { name: "TaxFix", website: "https://taxfix.de" },
  { name: "WeCheers", website: "https://wecheers.fr" },
];

const getClient = (name: Client["name"]): Client =>
  clients.find((c) => c.name === name) || notFoundClient;

export const jobs: Job[] = [
  { client: getClient("WeCheers"), role: "App Development", year: 2022 },
  { client: getClient("WeCheers"), role: "UX/UI Design", year: 2021 },
  { client: getClient("TaxFix"), role: "UX/UI Design", year: 2021 },
  { client: getClient("IronHack"), role: "Teaching", year: 2021 },
  { client: getClient("Wolfox"), role: "UX/UI Design", year: 2021 },
  {
    client: getClient("Schneider Electric"),
    role: "Web Development",
    year: 2019,
  },
  { client: getClient("Roadeo"), role: "Mobile Development", year: 2019 },
  { client: getClient("Wolfox"), role: "Web Development", year: 2019 },
  { client: getClient("CIC Bank"), role: "Bank Teller", year: 2018 },
];
